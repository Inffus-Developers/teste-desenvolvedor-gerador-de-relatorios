<?php

namespace Database\Factories;

use App\Models\customer;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<customer>
 */
class CustomerFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'name' => fake()->name(),
            // Gera um documento numérico de 11 a 14 dígitos (simulando CPF/CNPJ)
            'document' => fake()->unique()->numerify(fake()->randomElement(['###########', '##############'])),
            'email' => fake()->unique()->safeEmail(),
            // 80% de chance de ser ativo
            'status' => fake()->boolean(80) ? 'active' : 'inactive',
        ];
    }
}
