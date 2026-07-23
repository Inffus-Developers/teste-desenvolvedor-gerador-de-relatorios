<?php

namespace Tests\Feature;

use App\Models\Customer;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CustomerApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_unauthenticated_users_cannot_manage_customers(): void
    {
        $customer = Customer::factory()->create();

        $this->getJson('/api/customers')->assertUnauthorized();
        $this->postJson('/api/customers', [])->assertUnauthorized();
        $this->getJson("/api/customers/{$customer->id}")->assertUnauthorized();
        $this->putJson("/api/customers/{$customer->id}", [])->assertUnauthorized();
        $this->deleteJson("/api/customers/{$customer->id}")->assertUnauthorized();
    }

    public function test_authenticated_user_can_create_and_list_customers(): void
    {
        $user = User::factory()->create();
        $payload = [
            'name' => 'Acme Corp',
            'document' => '12345678901',
            'email' => 'billing@acme.test',
            'status' => 'active',
        ];

        $this->actingAs($user, 'sanctum')
            ->postJson('/api/customers', $payload)
            ->assertCreated()
            ->assertJsonPath('data.name', 'Acme Corp')
            ->assertJsonPath('data.document', '12345678901');

        $this->actingAs($user, 'sanctum')
            ->getJson('/api/customers?search=Acme')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.email', 'billing@acme.test');
    }

    public function test_authenticated_user_can_update_and_delete_customer(): void
    {
        $user = User::factory()->create();
        $customer = Customer::factory()->create(['name' => 'Old Name']);

        $this->actingAs($user, 'sanctum')
            ->putJson("/api/customers/{$customer->id}", [
                'name' => 'New Name',
                'document' => $customer->document,
                'email' => $customer->email,
                'status' => 'inactive',
            ])
            ->assertOk()
            ->assertJsonPath('data.name', 'New Name')
            ->assertJsonPath('data.status', 'inactive');

        $this->actingAs($user, 'sanctum')
            ->deleteJson("/api/customers/{$customer->id}")
            ->assertNoContent();

        $this->assertDatabaseMissing('customers', ['id' => $customer->id]);
    }

    public function test_customer_validation_rejects_duplicate_document_and_invalid_email(): void
    {
        $user = User::factory()->create();
        Customer::factory()->create(['document' => '99988877766']);

        $this->actingAs($user, 'sanctum')
            ->postJson('/api/customers', [
                'name' => 'Duplicate',
                'document' => '99988877766',
                'email' => 'not-an-email',
                'status' => 'active',
            ])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['document', 'email']);
    }
}
