<?php

namespace Database\Seeders;

use App\Models\Customer;
use Illuminate\Database\Seeder;

class CustomerSeeder extends Seeder
{
    public function run(): void
    {
        $target = (int) env('CUSTOMER_SEED_COUNT', 100);
        $missing = max(0, $target - Customer::query()->count());

        if ($missing > 0) {
            Customer::factory($missing)->create();
        }
    }
}
