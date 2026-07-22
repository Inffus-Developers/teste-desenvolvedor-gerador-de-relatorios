<?php

namespace Database\Seeders;

use App\Models\Billing;
use App\Models\Customer;
use Illuminate\Database\Seeder;

class BillingSeeder extends Seeder
{
    public function run(): void
    {
        $customerIds = Customer::query()->pluck('id');
        if ($customerIds->isEmpty()) {
            return;
        }

        $target = (int) env('BILLING_SEED_COUNT', 500);
        $missing = max(0, $target - Billing::query()->count());

        if ($missing === 0) {
            return;
        }

        Billing::factory($missing)
            ->state(fn () => ['customer_id' => $customerIds->random()])
            ->create();
    }
}
