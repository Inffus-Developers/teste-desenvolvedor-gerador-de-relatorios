<?php

namespace Tests\Feature;

use App\Models\Billing;
use App\Models\Customer;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class BillingCrudApiTest extends TestCase
{
    use RefreshDatabase;

    protected function tearDown(): void
    {
        Carbon::setTestNow();
        parent::tearDown();
    }

    public function test_unauthenticated_users_cannot_manage_billings(): void
    {
        $billing = Billing::factory()->for(Customer::factory())->create();

        $this->getJson('/api/billings')->assertUnauthorized();
        $this->postJson('/api/billings', [])->assertUnauthorized();
        $this->getJson("/api/billings/{$billing->id}")->assertUnauthorized();
        $this->putJson("/api/billings/{$billing->id}", [])->assertUnauthorized();
        $this->deleteJson("/api/billings/{$billing->id}")->assertUnauthorized();
    }

    public function test_authenticated_user_can_create_and_show_billing(): void
    {
        Carbon::setTestNow('2026-07-22');
        $user = User::factory()->create();
        $customer = Customer::factory()->create();

        $response = $this->actingAs($user, 'sanctum')->postJson('/api/billings', [
            'customer_id' => $customer->id,
            'description' => 'Monthly subscription',
            'original_amount' => 250.50,
            'issue_date' => '2026-07-01',
            'due_date' => '2026-07-31',
            'monthly_interest_rate' => 0.015,
        ]);

        $response->assertCreated()
            ->assertJsonPath('data.description', 'Monthly subscription')
            ->assertJsonPath('data.original_amount', '250.50')
            ->assertJsonPath('data.customer.id', $customer->id);

        $this->actingAs($user, 'sanctum')
            ->getJson("/api/billings/{$response->json('data.id')}")
            ->assertOk()
            ->assertJsonPath('data.description', 'Monthly subscription');
    }

    public function test_authenticated_user_can_update_open_billing(): void
    {
        Carbon::setTestNow('2026-07-22');
        $user = User::factory()->create();
        $billing = Billing::factory()->for(Customer::factory())->create([
            'description' => 'Old description',
            'due_date' => '2026-08-01',
        ]);

        $this->actingAs($user, 'sanctum')
            ->putJson("/api/billings/{$billing->id}", [
                'customer_id' => $billing->customer_id,
                'description' => 'Updated description',
                'original_amount' => 500,
                'issue_date' => $billing->issue_date->toDateString(),
                'due_date' => $billing->due_date->toDateString(),
                'monthly_interest_rate' => 0.02,
            ])
            ->assertOk()
            ->assertJsonPath('data.description', 'Updated description')
            ->assertJsonPath('data.original_amount', '500.00');
    }

    public function test_paid_billing_cannot_be_edited(): void
    {
        Carbon::setTestNow('2026-07-22');
        $user = User::factory()->create();
        $billing = Billing::factory()->for(Customer::factory())->create([
            'status' => 'paid',
            'payment_date' => '2026-07-01',
            'paid_amount' => 100,
            'interest_amount_at_payment' => 0,
        ]);

        $this->actingAs($user, 'sanctum')
            ->putJson("/api/billings/{$billing->id}", [
                'customer_id' => $billing->customer_id,
                'description' => 'Should fail',
                'original_amount' => 100,
                'issue_date' => $billing->issue_date->toDateString(),
                'due_date' => $billing->due_date->toDateString(),
                'monthly_interest_rate' => 0,
            ])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['billing']);
    }

    public function test_cancelled_billing_cannot_be_paid(): void
    {
        Carbon::setTestNow('2026-07-22');
        $user = User::factory()->create();
        $billing = Billing::factory()->for(Customer::factory())->create(['status' => 'cancelled']);

        $this->actingAs($user, 'sanctum')
            ->postJson("/api/billings/{$billing->id}/pay", ['payment_date' => '2026-07-22'])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['billing']);
    }

    public function test_billing_validation_rejects_invalid_dates(): void
    {
        $user = User::factory()->create();
        $customer = Customer::factory()->create();

        $this->actingAs($user, 'sanctum')
            ->postJson('/api/billings', [
                'customer_id' => $customer->id,
                'description' => 'Invalid dates',
                'original_amount' => 100,
                'issue_date' => '2026-07-10',
                'due_date' => '2026-07-01',
                'monthly_interest_rate' => 0.01,
            ])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['due_date']);
    }

    public function test_authenticated_user_can_delete_billing(): void
    {
        $user = User::factory()->create();
        $billing = Billing::factory()->for(Customer::factory())->create();

        $this->actingAs($user, 'sanctum')
            ->deleteJson("/api/billings/{$billing->id}")
            ->assertNoContent();

        $this->assertDatabaseMissing('billings', ['id' => $billing->id]);
    }
}
