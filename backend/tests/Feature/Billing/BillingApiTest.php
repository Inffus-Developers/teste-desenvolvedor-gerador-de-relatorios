<?php

namespace Tests\Feature\Billing;

use App\Enums\BillingStatus;
use App\Models\Billing;
use App\Models\Customer;
use App\Models\User;
use Carbon\CarbonImmutable;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class BillingApiTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        Sanctum::actingAs(User::factory()->create());
    }

    protected function tearDown(): void
    {
        CarbonImmutable::setTestNow();

        parent::tearDown();
    }

    public function test_unauthenticated_user_cannot_access_billings(): void
    {
        $this->app['auth']->forgetGuards();

        $this->getJson('/api/billings')->assertUnauthorized();
        $this->postJson('/api/billings', [])->assertUnauthorized();
    }

    public function test_user_can_create_view_and_update_billing(): void
    {
        CarbonImmutable::setTestNow('2026-01-01');
        $customer = Customer::factory()->create();
        $payload = $this->validPayload($customer);

        $created = $this->postJson('/api/billings', $payload)
            ->assertCreated()
            ->assertJsonPath('data.customer.id', $customer->id)
            ->assertJsonPath('data.status', 'pending')
            ->json('data');

        $this->getJson("/api/billings/{$created['id']}")
            ->assertOk()
            ->assertJsonPath('data.description', $payload['description']);

        $payload['description'] = 'Mensalidade atualizada';

        $this->putJson("/api/billings/{$created['id']}", $payload)
            ->assertOk()
            ->assertJsonPath('data.description', 'Mensalidade atualizada');
    }

    public function test_billing_data_is_validated(): void
    {
        $this->postJson('/api/billings', [
            'customer_id' => 999,
            'description' => '',
            'original_amount' => 0,
            'issue_date' => '2026-02-10',
            'due_date' => '2026-02-01',
            'monthly_interest_rate' => -1,
            'status' => BillingStatus::Paid->value,
        ])->assertUnprocessable()
            ->assertJsonValidationErrors([
                'customer_id',
                'description',
                'original_amount',
                'due_date',
                'monthly_interest_rate',
                'status',
            ]);
    }

    public function test_overdue_billing_uses_compound_interest_in_real_time(): void
    {
        CarbonImmutable::setTestNow('2026-01-31 12:00:00');
        $billing = Billing::factory()->create([
            'original_amount' => 1000,
            'issue_date' => '2025-12-01',
            'due_date' => '2026-01-01',
            'monthly_interest_rate' => 3,
        ]);

        $this->getJson("/api/billings/{$billing->id}")
            ->assertOk()
            ->assertJsonPath('data.status', 'overdue')
            ->assertJsonPath('data.days_overdue', 30)
            ->assertJsonPath('data.interest_amount', '30.00')
            ->assertJsonPath('data.updated_amount', '1030.00');

        $this->assertDatabaseHas('billings', [
            'id' => $billing->id,
            'interest_paid' => null,
        ]);
    }

    public function test_payment_stores_effective_amount_and_interest_at_payment_date(): void
    {
        CarbonImmutable::setTestNow('2026-01-31 12:00:00');
        $billing = Billing::factory()->create([
            'original_amount' => 1000,
            'issue_date' => '2025-12-01',
            'due_date' => '2026-01-01',
            'monthly_interest_rate' => 3,
        ]);

        $this->postJson("/api/billings/{$billing->id}/payment", [
            'payment_date' => '2026-01-31',
            'paid_amount' => 1030,
        ])->assertOk()
            ->assertJsonPath('data.status', 'paid')
            ->assertJsonPath('data.payment_date', '2026-01-31')
            ->assertJsonPath('data.paid_amount', '1030.00')
            ->assertJsonPath('data.interest_paid', '30.00');

        $this->assertDatabaseHas('billings', [
            'id' => $billing->id,
            'status' => BillingStatus::Paid->value,
            'payment_date' => '2026-01-31 00:00:00',
            'paid_amount' => 1030,
            'interest_paid' => 30,
        ]);
    }

    public function test_paid_billing_does_not_accumulate_more_interest(): void
    {
        CarbonImmutable::setTestNow('2026-01-31 12:00:00');
        $billing = Billing::factory()->create([
            'original_amount' => 1000,
            'issue_date' => '2025-12-01',
            'due_date' => '2026-01-01',
            'monthly_interest_rate' => 3,
        ]);

        $this->postJson("/api/billings/{$billing->id}/payment", [
            'payment_date' => '2026-01-31',
            'paid_amount' => 1030,
        ])->assertOk();

        CarbonImmutable::setTestNow('2026-03-31 12:00:00');

        $this->getJson("/api/billings/{$billing->id}")
            ->assertOk()
            ->assertJsonPath('data.days_overdue', 30)
            ->assertJsonPath('data.interest_amount', '30.00')
            ->assertJsonPath('data.updated_amount', '1030.00');
    }

    public function test_payment_cannot_be_registered_twice_or_before_issue_date(): void
    {
        CarbonImmutable::setTestNow('2026-02-01');
        $billing = Billing::factory()->create([
            'issue_date' => '2026-01-10',
            'due_date' => '2026-01-20',
        ]);

        $this->postJson("/api/billings/{$billing->id}/payment", [
            'payment_date' => '2026-01-01',
            'paid_amount' => 100,
        ])->assertUnprocessable()
            ->assertJsonValidationErrors('payment_date');

        $this->postJson("/api/billings/{$billing->id}/payment", [
            'payment_date' => '2026-01-20',
            'paid_amount' => 100,
        ])->assertOk();

        $this->postJson("/api/billings/{$billing->id}/payment", [
            'payment_date' => '2026-01-20',
            'paid_amount' => 100,
        ])->assertUnprocessable()
            ->assertJsonValidationErrors('billing');
    }

    public function test_billings_are_filtered_sorted_and_paginated(): void
    {
        CarbonImmutable::setTestNow('2026-02-01');
        $customer = Customer::factory()->create();
        Billing::factory()->create(['customer_id' => $customer->id, 'description' => 'Plano Bronze', 'due_date' => '2026-01-01']);
        Billing::factory()->create(['customer_id' => $customer->id, 'description' => 'Plano Ouro', 'due_date' => '2026-01-15']);
        Billing::factory()->create(['description' => 'Outro cliente', 'due_date' => '2026-03-01']);

        $this->getJson("/api/billings?customer_id={$customer->id}&status=overdue&sort=due_date&direction=desc&per_page=1")
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.description', 'Plano Ouro')
            ->assertJsonPath('meta.total', 2)
            ->assertJsonPath('meta.last_page', 2);
    }

    private function validPayload(Customer $customer): array
    {
        return [
            'customer_id' => $customer->id,
            'description' => 'Mensalidade de serviço',
            'original_amount' => 500.25,
            'issue_date' => '2026-01-01',
            'due_date' => '2026-01-15',
            'monthly_interest_rate' => 2.5,
            'status' => BillingStatus::Pending->value,
        ];
    }
}
