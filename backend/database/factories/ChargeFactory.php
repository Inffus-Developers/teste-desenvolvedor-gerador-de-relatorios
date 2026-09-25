<?php

namespace Database\Factories;

use App\Models\Customer;
use Illuminate\Database\Eloquent\Factories\Factory;

class ChargeFactory extends Factory
{
    public function definition(): array
    {
        return [
            'customer_id' => Customer::factory(), 'description' => fake()->sentence(6),
            'original_amount' => fake()->randomFloat(2, 100, 10000), 'monthly_interest_rate' => '2.0000',
            'issued_at' => today()->subDays(60)->toDateString(), 'due_at' => today()->subDays(30)->toDateString(),
        ];
    }
}
