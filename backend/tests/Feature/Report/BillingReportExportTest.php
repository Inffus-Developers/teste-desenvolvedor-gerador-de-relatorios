<?php

namespace Tests\Feature\Report;

use App\Enums\BillingStatus;
use App\Models\Billing;
use App\Models\Customer;
use App\Models\User;
use Carbon\CarbonImmutable;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class BillingReportExportTest extends TestCase
{
    use RefreshDatabase;

    private Customer $customer;

    protected function setUp(): void
    {
        parent::setUp();

        CarbonImmutable::setTestNow('2026-02-14 12:00:00');
        Sanctum::actingAs(User::factory()->create());
        $this->customer = Customer::factory()->create(['name' => 'Cliente Exportação']);
        $this->createScenario();
    }

    protected function tearDown(): void
    {
        CarbonImmutable::setTestNow();
        parent::tearDown();
    }

    public function test_unauthenticated_user_cannot_export_csv_or_pdf(): void
    {
        $this->app['auth']->forgetGuards();

        $this->getJson('/api/reports/billings/export/csv?'.$this->query())->assertUnauthorized();
        $this->getJson('/api/reports/billings/export/pdf?'.$this->query())->assertUnauthorized();
    }

    public function test_csv_contains_period_filters_totals_and_filtered_rows(): void
    {
        $response = $this->get('/api/reports/billings/export/csv?'.$this->query([
            'customer_id' => $this->customer->id,
            'status' => 'paid',
        ]));

        $response->assertOk()
            ->assertHeader('content-type', 'text/csv; charset=UTF-8')
            ->assertDownload('faturamento-2026-01-01-a-2026-02-28.csv');

        $content = $response->streamedContent();
        $this->assertStringStartsWith("\xEF\xBB\xBF", $content);
        $this->assertStringContainsString('Período;2026-01-01;2026-02-28', $content);
        $this->assertStringContainsString("Cliente;{$this->customer->id}", $content);
        $this->assertStringContainsString('Cobrança paga', $content);
        $this->assertStringNotContainsString('Cobrança vencida', $content);
        $this->assertStringContainsString('Quantidade;"Valor original total";"Total de juros"', $content);
    }

    public function test_pdf_contains_valid_signature_and_download_headers(): void
    {
        $response = $this->get('/api/reports/billings/export/pdf?'.$this->query());

        $response->assertOk()
            ->assertHeader('content-type', 'application/pdf')
            ->assertDownload('faturamento-2026-01-01-a-2026-02-28.pdf');

        $content = $response->getContent();
        $this->assertStringStartsWith('%PDF-', $content);
        $this->assertGreaterThan(5000, strlen($content));
    }

    public function test_pdf_rejects_result_above_configured_limit_and_suggests_csv(): void
    {
        config()->set('reports.pdf_max_rows', 1);

        $this->getJson('/api/reports/billings/export/pdf?'.$this->query())
            ->assertUnprocessable()
            ->assertJsonValidationErrors('export')
            ->assertJsonPath('errors.export.0', 'O PDF aceita até 1 registros. Use CSV para volumes maiores.');
    }

    /** @param array<string, mixed> $overrides */
    private function query(array $overrides = []): string
    {
        return http_build_query(array_merge([
            'date_from' => '2026-01-01',
            'date_to' => '2026-02-28',
            'period_basis' => 'issue_date',
            'sort' => 'due_date',
            'direction' => 'asc',
        ], $overrides));
    }

    private function createScenario(): void
    {
        Billing::factory()->create([
            'customer_id' => $this->customer->id,
            'description' => 'Cobrança paga',
            'original_amount' => 100,
            'issue_date' => '2026-01-05',
            'due_date' => '2026-01-10',
            'payment_date' => '2026-01-20',
            'status' => BillingStatus::Paid,
            'paid_amount' => 110,
            'interest_paid' => 10,
        ]);

        Billing::factory()->create([
            'customer_id' => $this->customer->id,
            'description' => 'Cobrança vencida',
            'original_amount' => 1000,
            'issue_date' => '2026-01-01',
            'due_date' => '2026-01-15',
            'monthly_interest_rate' => 3,
            'status' => BillingStatus::Pending,
        ]);
    }
}
