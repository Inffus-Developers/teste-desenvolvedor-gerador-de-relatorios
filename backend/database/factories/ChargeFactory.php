<?php

namespace Database\Factories;

use App\Models\Charge;
use App\Models\Client;
use Illuminate\Database\Eloquent\Factories\Factory;

class ChargeFactory extends Factory
{
    protected $model = Charge::class;

    public function definition(): array
    {
        $issueDate = $this->faker->dateTimeBetween('-90 days', 'now');
        $dueDate = (clone $issueDate)->modify('+15 days');
        $status = $this->faker->randomElement(['pendente', 'paga', 'atrasada']);
        $originalAmount = $this->faker->randomFloat(2, 150, 5000);
        $interestRate = $this->faker->randomFloat(2, 0.5, 5);
        $maxPaymentDate = min($dueDate, new \DateTime('now'));

        $paidDate = $status === 'paga'
            ? $this->faker->dateTimeBetween($issueDate, $maxPaymentDate)
            : null;

        return [
            'client_name' => Client::query()->inRandomOrder()->value('name') ?? $this->faker->company(),
            'description' => $this->faker->sentence(5),
            'original_amount' => $originalAmount,
            'issue_date' => $issueDate->format('Y-m-d'),
            'due_date' => $dueDate->format('Y-m-d'),
            'payment_date' => $paidDate ? $paidDate->format('Y-m-d') : null,
            'status' => $status,
            'interest_rate' => $interestRate,
            'paid_amount' => $status === 'paga' ? $originalAmount + $this->faker->randomFloat(2, 0, 200) : null,
            'paid_interest' => $status === 'paga' ? $this->faker->randomFloat(2, 0, 200) : null,
        ];
    }
}
