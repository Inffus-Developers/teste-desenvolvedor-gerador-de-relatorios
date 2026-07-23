<?php

namespace Database\Factories;

use App\Models\Customer;
use Illuminate\Database\Eloquent\Factories\Factory;

class BillingFactory extends Factory
{
    public function definition(): array
    {
        $issueDate = fake()->dateTimeBetween('-6 months', 'now');

        return [
            'customer_id' => Customer::factory(),
            'description' => fake()->sentence(4),
            'original_amount' => fake()->randomFloat(2, 50, 10000),
            'issue_date' => $issueDate,
            'due_date' => (clone $issueDate)->modify('+30 days'),
            'payment_date' => null,
            'monthly_interest_rate' => fake()->randomFloat(4, 0, 0.05),
            'status' => 'pending',
            'paid_amount' => null,
            'interest_amount_at_payment' => null,
        ];
    }
}
