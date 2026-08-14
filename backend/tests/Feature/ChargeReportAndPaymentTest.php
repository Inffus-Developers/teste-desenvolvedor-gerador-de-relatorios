<?php

namespace Tests\Feature;

use App\Models\Charge;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ChargeReportAndPaymentTest extends TestCase
{
    use RefreshDatabase;

    public function test_report_can_filter_by_period_and_status_and_return_totals(): void
    {
        $user = User::factory()->create();
        $issueDate = now()->subDays(60)->toDateString();
        $dueDate = now()->subDays(30)->toDateString();

        Charge::factory()->create([
            'client_name' => 'Cliente A',
            'description' => 'Cobrança A',
            'original_amount' => 1000,
            'issue_date' => $issueDate,
            'due_date' => $dueDate,
            'status' => 'pendente',
            'interest_rate' => 10,
            'payment_date' => null,
        ]);

        Charge::factory()->create([
            'client_name' => 'Cliente B',
            'description' => 'Cobrança B',
            'original_amount' => 2000,
            'issue_date' => now()->subDays(40)->toDateString(),
            'due_date' => now()->subDays(20)->toDateString(),
            'status' => 'paga',
            'interest_rate' => 5,
            'payment_date' => now()->subDays(10)->toDateString(),
            'paid_amount' => 2000,
            'paid_interest' => 0,
        ]);

        $response = $this->actingAs($user, 'sanctum')->getJson('/api/report/charges?start_date=' . now()->subDays(60)->toDateString() . '&end_date=' . now()->toDateString() . '&status=pendente&period=issue_date');

        $response->assertOk();
        $this->assertEquals(1, $response->json('totals.count'));
        $this->assertEquals(1000, $response->json('totals.total_original'));
        $this->assertEqualsWithDelta(100.0, $response->json('totals.total_interest'), 0.01);
    }

    public function test_payment_endpoint_stores_payment_metadata(): void
    {
        $user = User::factory()->create();

        $charge = Charge::factory()->create([
            'client_name' => 'Cliente C',
            'description' => 'Cobrança C',
            'original_amount' => 500,
            'issue_date' => '2026-04-01',
            'due_date' => '2026-04-10',
            'status' => 'pendente',
            'interest_rate' => 10,
            'payment_date' => null,
        ]);

        $response = $this->actingAs($user, 'sanctum')->postJson("/api/charges/{$charge->id}/pay", [
            'payment_date' => '2026-04-12',
            'paid_amount' => 550,
            'paid_interest' => 50,
        ]);

        $response->assertOk();
        $this->assertDatabaseHas('charges', [
            'id' => $charge->id,
            'status' => 'paga',
            'payment_date' => '2026-04-12 00:00:00',
            'paid_amount' => 550,
            'paid_interest' => 50,
        ]);
    }
}
