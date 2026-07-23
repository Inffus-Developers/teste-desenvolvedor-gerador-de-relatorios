<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AuthApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_login_works_from_browser_origin_without_csrf_token(): void
    {
        $user = User::factory()->create([
            'email' => 'admin@inffus.test',
            'password' => 'password',
        ]);

        $this->postJson('/api/login', [
            'email' => $user->email,
            'password' => 'password',
        ], [
            'Origin' => 'http://localhost:3000',
        ])
            ->assertOk()
            ->assertJsonStructure(['token', 'user' => ['id', 'name', 'email']]);
    }

    public function test_authenticated_logout_works_from_browser_origin(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user, 'sanctum')
            ->postJson('/api/logout', [], [
                'Origin' => 'http://localhost:3000',
            ])
            ->assertOk();
    }
}
