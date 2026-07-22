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

class BillingReportTest extends TestCase
{
    use RefreshDatabase;

    private Customer $customer;

    protected function setUp(): void
    {
        parent::setUp();

        CarbonImmutable::setTestNow('2026-02-14 12:00:00');
        Sanctum::actingAs(User::factory()->create());
        $this->customer = Customer::factory()->create(['name' => 'Cliente Relatório']);
        $this->createScenario();
    }

    protected function tearDown(): void
    {
        CarbonImmutable::setTestNow();
        parent::tearDown();
    }

    public function test_unauthenticated_user_cannot_access_report(): void
    {
        $this->app['auth']->forgetGuards();

        $this->getJson('/api/reports/billings?'.$this->query())->assertUnauthorized();
    }

    public function test_report_validates_period_and_basis(): void
    {
        $this->getJson('/api/reports/billings?date_from=2026-02-01&date_to=2026-01-01&period_basis=invalid')
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['date_to', 'period_basis']);
    }

    public function test_report_filters_by_issue_date_customer_and_status(): void
    {
        $response = $this->getJson('/api/reports/billings?'.$this->query([
            'customer_id' => $this->customer->id,
            'status' => 'overdue',
        ]));

        $response
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.description', 'Cobrança vencida')
            ->assertJsonPath('filters.customer_id', $this->customer->id)
            ->assertJsonPath('filters.status', 'overdue');
    }

    public function test_report_can_use_due_date_or_payment_date_as_period(): void
    {
        $this->getJson('/api/reports/billings?'.$this->query([
            'date_from' => '2026-01-10',
            'date_to' => '2026-01-15',
            'period_basis' => 'due_date',
        ]))->assertOk()->assertJsonCount(2, 'data');

        $this->getJson('/api/reports/billings?'.$this->query([
            'date_from' => '2026-01-20',
            'date_to' => '2026-01-20',
            'period_basis' => 'payment_date',
        ]))->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.description', 'Cobrança paga');
    }

    public function test_report_calculates_all_totals_in_database(): void
    {
        $this->getJson('/api/reports/billings?'.$this->query())
            ->assertOk()
            ->assertJsonPath('totals.count', 3)
            ->assertJsonPath('totals.original_total', 1600)
            ->assertJsonPath('totals.interest_total', 40)
            ->assertJsonPath('totals.updated_total', 1640)
            ->assertJsonPath('totals.received_total', 110)
            ->assertJsonPath('totals.pending_total', 1530);
    }

    public function test_report_is_sorted_and_paginated_in_backend(): void
    {
        $this->getJson('/api/reports/billings?'.$this->query([
            'sort' => 'original_amount',
            'direction' => 'desc',
            'per_page' => 1,
        ]))->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.description', 'Cobrança vencida')
            ->assertJsonPath('meta.total', 3)
            ->assertJsonPath('meta.last_page', 3);
    }

    /** @param array<string, mixed> $overrides */
    private function query(array $overrides = []): string
    {
        return http_build_query(array_merge([
            'date_from' => '2026-01-01',
            'date_to' => '2026-02-28',
            'period_basis' => 'issue_date',
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
            'monthly_interest_rate' => 3,
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

        Billing::factory()->create([
            'customer_id' => $this->customer->id,
            'description' => 'Cobrança pendente',
            'original_amount' => 500,
            'issue_date' => '2026-02-01',
            'due_date' => '2026-03-01',
            'monthly_interest_rate' => 3,
            'status' => BillingStatus::Pending,
        ]);

        Billing::factory()->create([
            'description' => 'Fora do período',
            'original_amount' => 999,
            'issue_date' => '2025-12-01',
            'due_date' => '2025-12-15',
        ]);
    }
}
