<?php

namespace Tests\Feature\Customer;

use App\Enums\CustomerStatus;
use App\Models\Customer;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class CustomerApiTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        Sanctum::actingAs(User::factory()->create());
    }

    public function test_unauthenticated_user_cannot_access_customers(): void
    {
        $this->app['auth']->forgetGuards();

        $this->getJson('/api/customers')->assertUnauthorized();
        $this->postJson('/api/customers', [])->assertUnauthorized();
    }

    public function test_user_can_create_customer(): void
    {
        $payload = [
            'name' => 'Empresa Exemplo',
            'document' => '12345678000190',
            'email' => 'financeiro@empresa.test',
            'status' => CustomerStatus::Active->value,
        ];

        $this->postJson('/api/customers', $payload)
            ->assertCreated()
            ->assertJsonPath('data.name', $payload['name'])
            ->assertJsonPath('data.status', CustomerStatus::Active->value);

        $this->assertDatabaseHas('customers', $payload);
    }

    public function test_customer_data_is_validated(): void
    {
        $customer = Customer::factory()->create();

        $this->postJson('/api/customers', [
            'name' => '',
            'document' => $customer->document,
            'email' => $customer->email,
            'status' => 'blocked',
        ])->assertUnprocessable()
            ->assertJsonValidationErrors(['name', 'document', 'email', 'status']);
    }

    public function test_user_can_update_customer(): void
    {
        $customer = Customer::factory()->create([
            'status' => CustomerStatus::Active,
        ]);

        $payload = [
            'name' => 'Nome Atualizado',
            'document' => $customer->document,
            'email' => 'atualizado@empresa.test',
            'status' => CustomerStatus::Inactive->value,
        ];

        $this->putJson("/api/customers/{$customer->id}", $payload)
            ->assertOk()
            ->assertJsonPath('data.name', $payload['name'])
            ->assertJsonPath('data.status', CustomerStatus::Inactive->value);

        $this->assertDatabaseHas('customers', $payload);
    }

    public function test_user_can_view_customer(): void
    {
        $customer = Customer::factory()->create();

        $this->getJson("/api/customers/{$customer->id}")
            ->assertOk()
            ->assertJsonPath('data.id', $customer->id)
            ->assertJsonPath('data.email', $customer->email);
    }

    public function test_customers_are_filtered_sorted_and_paginated_in_database(): void
    {
        Customer::factory()->create(['name' => 'Zulu Comércio', 'status' => CustomerStatus::Active]);
        Customer::factory()->create(['name' => 'Alfa Comércio', 'status' => CustomerStatus::Active]);
        Customer::factory()->create(['name' => 'Cliente Inativo', 'status' => CustomerStatus::Inactive]);

        $response = $this->getJson('/api/customers?search=Comércio&status=active&sort=name&direction=asc&per_page=1');

        $response
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.name', 'Alfa Comércio')
            ->assertJsonPath('meta.total', 2)
            ->assertJsonPath('meta.per_page', 1)
            ->assertJsonPath('meta.last_page', 2);
    }
}
