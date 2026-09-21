<?php

namespace Tests\Feature;

use App\Jobs\GenerateReport;
use App\Models\Charge;
use App\Models\Customer;
use App\Models\ReportExport;
use App\Models\User;
use App\Services\BillingReport;
use App\Services\InterestCalculator;
use App\Services\ReportWriter;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Queue;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;
use ZipArchive;

class BillingTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->travelTo(now()->setDate(2026, 9, 21)->startOfDay());
    }

    private function login(): User
    {
        $user = User::factory()->create();
        $this->actingAs($user);

        return $user;
    }

    public function test_every_business_endpoint_requires_authentication(): void
    {
        foreach (['/api/reports/billing', '/api/exports', '/api/exports/missing/download', '/api/customers', '/api/charges', '/api/user'] as $url) {
            $this->getJson($url)->assertUnauthorized();
        }
        $this->postJson('/api/exports', ['format' => 'pdf'])->assertUnauthorized();
        $this->postJson('/api/exports', ['format' => 'csv'])->assertUnauthorized();
        $this->get('/api/exports/missing/download')->assertUnauthorized();
    }

    public function test_login_logout_and_wrong_password(): void
    {
        User::factory()->create(['email' => 'test@example.com', 'password' => 'secret-password']);
        $this->postJson('/api/login', ['email' => 'test@example.com', 'password' => 'wrong'])->assertUnprocessable();
        $this->postJson('/api/login', ['email' => 'test@example.com', 'password' => 'secret-password'])->assertOk()->assertJsonPath('user.email', 'test@example.com');
        $this->getJson('/api/user')->assertOk();
        $this->postJson('/api/logout')->assertOk();
        $this->assertGuest('web');
    }

    public function test_customer_validation_unique_document_and_updates(): void
    {
        $this->login();
        $data = ['name' => 'Aurora', 'email' => 'financeiro@example.com', 'document' => '12.345.678/0001-90', 'active' => true];
        $id = $this->postJson('/api/customers', $data)->assertCreated()->assertJsonPath('document', '12345678000190')->json('id');
        $this->postJson('/api/customers', $data)->assertUnprocessable();
        $this->putJson('/api/customers/'.$id, [...$data, 'name' => 'Aurora Studio'])->assertOk();
        $this->getJson('/api/customers/'.$id)->assertJsonPath('name', 'Aurora Studio');
        $this->getJson('/api/customers?search=Aur')->assertJsonCount(1, 'data');
    }

    public function test_charge_creation_validation_and_editing(): void
    {
        $this->login();
        $customer = Customer::factory()->create();
        $data = ['customer_id' => $customer->id, 'description' => 'Projeto', 'original_amount' => '1000.00', 'monthly_interest_rate' => '2.0000', 'issued_at' => '2026-08-01', 'due_at' => '2026-08-22'];
        $id = $this->postJson('/api/charges', $data)->assertCreated()->json('id');
        $this->assertEquals(20, $this->getJson('/api/charges/'.$id)->json('interest'));
        $this->putJson('/api/charges/'.$id, [...$data, 'original_amount' => '2000.00'])->assertOk();
        $this->assertEquals(40, $this->getJson('/api/charges/'.$id)->json('interest'));
        $this->postJson('/api/charges', [...$data, 'due_at' => '2026-07-01'])->assertUnprocessable();
        $this->postJson('/api/charges', [...$data, 'original_amount' => '1.001'])->assertUnprocessable();
        $customer->update(['active' => false]);
        $this->postJson('/api/charges', $data)->assertUnprocessable();
    }

    public function test_payment_freezes_interest_and_cannot_be_repeated_or_edited(): void
    {
        $this->login();
        $charge = Charge::factory()->create(['original_amount' => 1000, 'issued_at' => '2026-08-01', 'due_at' => '2026-08-22']);
        $this->postJson("/api/charges/$charge->id/payment", ['paid_at' => '2026-09-06', 'paid_amount' => '990.00'])->assertOk()->assertJsonPath('status', 'paid');
        $this->assertDatabaseHas('charges', ['id' => $charge->id, 'paid_interest' => '10.00', 'paid_amount' => '990.00', 'paid_at' => '2026-09-06']);
        $this->travel(60)->days();
        $result = $this->getJson("/api/charges/$charge->id")->assertOk();
        $this->assertEquals(10, $result->json('interest'));
        $this->assertEquals(1010, $result->json('updated_amount'));
        $this->postJson("/api/charges/$charge->id/payment", ['paid_at' => '2026-09-06', 'paid_amount' => '1010.00'])->assertConflict();
        $this->putJson('/api/charges/'.$charge->id, $charge->only(['customer_id', 'description', 'original_amount', 'monthly_interest_rate', 'issued_at', 'due_at']))->assertConflict();
    }

    public function test_payment_rejects_future_or_pre_issue_dates(): void
    {
        $this->login();
        $charge = Charge::factory()->create(['issued_at' => '2026-08-01']);
        foreach (['2026-07-31', '2026-09-22'] as $date) {
            $this->postJson("/api/charges/$charge->id/payment", ['paid_at' => $date, 'paid_amount' => 100])->assertUnprocessable();
        }
    }

    public function test_report_totals_cover_all_pages_and_filters_are_inclusive(): void
    {
        $this->login();
        $customer = Customer::factory()->create();
        $base = ['customer_id' => $customer->id, 'original_amount' => 1000, 'issued_at' => '2026-08-01', 'due_at' => '2026-08-22'];
        Charge::factory()->create($base);
        Charge::factory()->create([...$base, 'due_at' => '2026-10-01']);
        $paid = Charge::factory()->create($base);
        $paid->forceFill(['paid_at' => '2026-09-06', 'paid_interest' => 10, 'paid_amount' => 990])->save();
        $response = $this->getJson('/api/reports/billing?per_page=1')->assertOk()->assertJsonCount(1, 'rows.data');
        $totals = $response->json('totals');
        $this->assertEquals(['count' => 3, 'original_amount' => 3000, 'interest' => 30, 'updated_amount' => 3030, 'received_amount' => 990, 'pending_amount' => 2020], $totals);
        $this->getJson('/api/reports/billing?status=overdue')->assertJsonPath('totals.count', 1);
        $this->getJson('/api/reports/billing?status=pending')->assertJsonPath('totals.count', 1);
        $this->getJson('/api/reports/billing?date_field=paid_at&start_date=2026-09-06&end_date=2026-09-06')->assertJsonPath('totals.count', 1);
        $this->getJson('/api/reports/billing?date_field=issued_at&start_date=2026-08-01&end_date=2026-08-01&customer_id='.$customer->id)->assertJsonPath('totals.count', 3);
        $this->getJson('/api/reports/billing?date_field=due_at&start_date=2026-08-22&end_date=2026-08-22')->assertJsonPath('totals.count', 2);
        $other = Customer::factory()->create();
        $this->getJson('/api/reports/billing?customer_id='.$other->id)->assertJsonPath('totals.count', 0);
    }

    public function test_cursor_ordering_has_no_duplicates_with_equal_sort_values(): void
    {
        $this->login();
        Charge::factory()->count(5)->create(['due_at' => '2026-09-01']);
        $ids = [];
        $cursor = null;
        do {
            $page = $this->getJson('/api/charges?sort=due_at&direction=desc&per_page=2'.($cursor ? '&cursor='.urlencode($cursor) : ''))->assertOk()->json();
            array_push($ids, ...array_column($page['data'], 'id'));
            $cursor = $page['next_cursor'];
        } while ($cursor);
        $this->assertCount(5, array_unique($ids));
        $this->assertSame(Charge::orderByDesc('id')->pluck('id')->all(), $ids);
    }

    public function test_report_rejects_invalid_filters_and_sort_columns(): void
    {
        $this->login();
        foreach (['sort[]=due_at', 'sort=description', 'date_field=created_at', 'per_page=100000', 'status=anything', 'start_date=2026-09-30&end_date=2026-09-01', 'start_date=2026-09-01'] as $query) {
            $this->getJson('/api/reports/billing?'.$query)->assertUnprocessable();
        }
        foreach (['invalid', base64_encode('{"_pointsToNextItems":true}')] as $cursor) {
            $this->getJson('/api/reports/billing?cursor='.urlencode($cursor))->assertUnprocessable();
            $this->getJson('/api/customers?cursor='.urlencode($cursor))->assertUnprocessable();
        }
    }

    public function test_sql_and_php_interest_agree_at_rounding_boundaries(): void
    {
        $calculator = app(InterestCalculator::class);
        foreach ([['0.15', '100.0000'], ['1234.56', '1.2345'], ['99999999.99', '99.9999']] as [$amount, $rate]) {
            $charge = Charge::factory()->create(['original_amount' => $amount, 'monthly_interest_rate' => $rate, 'due_at' => '2026-09-20']);
            $row = app(BillingReport::class)->query([], '2026-09-21')->where('charges.id', $charge->id)->first();
            $this->assertEquals($calculator->calculate($amount, $rate, '2026-09-20', '2026-09-21'), $row->interest);
        }
    }

    private function export(string $format, array $filters = []): ReportExport
    {
        Queue::fake();
        Storage::fake('local');
        $id = $this->postJson('/api/exports', ['format' => $format, ...$filters])->assertAccepted()->json('id');
        Queue::assertPushed(GenerateReport::class);
        (new GenerateReport($id))->handle(app(BillingReport::class), app(ReportWriter::class));

        return ReportExport::findOrFail($id);
    }

    public function test_csv_contains_filtered_rows_metadata_totals_and_escapes_formulas(): void
    {
        $this->login();
        $charge = Charge::factory()->create(['description' => '=HYPERLINK("malicious")']);
        Charge::factory()->create(['description' => 'OUTSIDE FILTER']);
        $export = $this->export('csv', ['customer_id' => $charge->customer_id, 'start_date' => '2026-01-01', 'end_date' => '2026-12-31']);
        $csv = Storage::disk('local')->get($export->path);
        $this->assertStringContainsString("'=HYPERLINK", $csv);
        $this->assertStringContainsString('2026-01-01', $csv);
        $this->assertStringContainsString('Pendente', $csv);
        $this->assertStringNotContainsString('OUTSIDE FILTER', $csv);
        $this->assertSame(1, $export->processed_rows);
        $this->assertDatabaseCount('report_export_rows', 0);
        $this->get('/api/exports/'.$export->id.'/download')->assertOk()->assertDownload();
        $this->actingAs(User::factory()->create())->getJson('/api/exports/'.$export->id.'/download')->assertNotFound();
    }

    public function test_pdf_export_is_a_real_pdf_and_obeys_filter(): void
    {
        $this->login();
        Charge::factory()->count(2)->create();
        $export = $this->export('pdf', ['status' => 'pending']);
        $this->assertSame('completed', $export->status);
        $this->assertEquals(0, $export->totals['count']);
        $this->assertStringStartsWith('%PDF-', Storage::disk('local')->get($export->path));
        $this->get('/api/exports/'.$export->id.'/download')->assertOk()->assertHeader('content-type', 'application/pdf');
    }

    public function test_large_pdf_is_split_into_bounded_parts(): void
    {
        $this->login();
        config(['billing.pdf_rows_per_part' => 2]);
        Charge::factory()->count(5)->create();
        $export = $this->export('pdf');
        $this->assertSame(5, $export->processed_rows);
        $zip = new ZipArchive;
        $this->assertTrue($zip->open(Storage::disk('local')->path($export->path)));
        $this->assertSame(3, $zip->numFiles);
        for ($i = 0; $i < 3; $i++) {
            $this->assertStringStartsWith('%PDF-', $zip->getFromIndex($i));
        }
        $zip->close();
    }

    public function test_expired_exports_are_unavailable_and_pruned(): void
    {
        $this->login();
        $export = $this->export('csv');
        $this->travel(2)->days();
        $this->getJson('/api/exports/'.$export->id.'/download')->assertGone();
        $this->artisan('reports:prune')->assertSuccessful();
        Storage::disk('local')->assertMissing($export->path);
        $this->assertDatabaseMissing('report_exports', ['id' => $export->id]);
    }

    public function test_export_queue_has_per_user_limit_and_required_format(): void
    {
        $this->login();
        Queue::fake();
        $this->postJson('/api/exports', [])->assertUnprocessable();
        $this->postJson('/api/exports', ['format' => 'csv'])->assertAccepted();
        $this->postJson('/api/exports', ['format' => 'pdf'])->assertAccepted();
        $this->postJson('/api/exports', ['format' => 'csv'])->assertStatus(429);
    }

    public function test_list_query_count_does_not_grow_with_customers(): void
    {
        $this->login();
        Charge::factory()->count(20)->create();
        DB::enableQueryLog();
        $this->getJson('/api/reports/billing?per_page=20')->assertOk();
        $queries = collect(DB::getQueryLog())->filter(fn ($q) => str_contains($q['query'], 'charges'));
        $this->assertCount(2, $queries);
        DB::disableQueryLog();
    }
}
