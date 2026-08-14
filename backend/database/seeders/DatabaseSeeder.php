<?php

namespace Database\Seeders;

use App\Models\Charge;
use App\Models\User;
use App\Models\Client;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

use Database\Seeders\AdminUserSeeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $this->call(AdminUserSeeder::class);

        User::firstOrCreate(
            ['email' => 'test@example.com'],
            ['name' => 'Test User', 'password' => bcrypt('password')]
        );

        if (Client::count() === 0) {
            Client::factory()->count(50)->create();
        }

        if (Charge::count() === 0) {
            Charge::factory()->count(40)->create();
        }
    }
}
