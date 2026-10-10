<?php

namespace Database\Factories;

use App\Models\Customer;
use App\Models\billing;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<billing>
 */
class BillingFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $issueDate = fake()->dateTimeBetween('-1 year', 'now');
        // Vencimento é sempre entre 7 e 30 dias após a emissão
        $dueDate = (clone $issueDate)->modify('+' . fake()->numberBetween(7, 30) . ' days');
        
        $status = fake()->randomElement(['pending', 'paid', 'overdue', 'canceled']);
        $paymentDate = null;

        // Regras de coerência de negócio
        if ($status === 'paid') {
            // Pagamento ocorre após a emissão
            $paymentDate = fake()->dateTimeBetween($issueDate, 'now');
        } elseif ($status === 'overdue') {
            // Se está atrasada, o vencimento tem que ser obrigatoriamente no passado
            $dueDate = fake()->dateTimeBetween('-6 months', '-1 day');
        } elseif ($status === 'pending') {
            // Se está pendente, o vencimento tem que ser no futuro
            $dueDate = fake()->dateTimeBetween('+1 day', '+2 months');
        }

        return [
            'customer_id' => Customer::factory(), // Cria um cliente caso não seja passado
            'description' => fake()->sentence(3),
            'original_amount' => fake()->randomFloat(2, 50, 5000), // Valores de R$ 50 a R$ 5.000
            'issue_date' => $issueDate,
            'due_date' => $dueDate,
            'payment_date' => $paymentDate,
            'interest_rate' => fake()->randomFloat(2, 1, 5), // Taxa de juros de 1% a 5% ao mês
            'status' => $status,
        ];
    }
}
