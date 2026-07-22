<?php

namespace Database\Factories;

use App\Enums\BillingStatus;
use App\Models\Billing;
use App\Models\Customer;
use Illuminate\Database\Eloquent\Factories\Factory;

/** @extends Factory<Billing> */
class BillingFactory extends Factory
{
    public function definition(): array
    {
        $issueDate = fake()->dateTimeBetween('-1 year', 'now');
        $dueDate = (clone $issueDate)->modify('+'.fake()->numberBetween(5, 45).' days');

        return [
            'customer_id' => Customer::factory(),
            'description' => fake()->sentence(4),
            'original_amount' => fake()->randomFloat(2, 50, 50000),
            'issue_date' => $issueDate,
            'due_date' => $dueDate,
            'payment_date' => null,
            'monthly_interest_rate' => fake()->randomFloat(4, 0, 5),
            'status' => BillingStatus::Pending,
            'paid_amount' => null,
            'interest_paid' => null,
        ];
    }

    public function paid(): static
    {
        return $this->state(function (array $attributes) {
            $paymentDate = fake()->dateTimeBetween($attributes['issue_date'], 'now');

            return [
                'status' => BillingStatus::Paid,
                'payment_date' => $paymentDate,
                'paid_amount' => $attributes['original_amount'],
                'interest_paid' => 0,
            ];
        });
    }
}
