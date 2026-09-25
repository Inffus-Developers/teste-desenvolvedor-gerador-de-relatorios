<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;

class CustomerFactory extends Factory
{
    public function definition(): array
    {
        return ['name' => fake()->company(), 'document' => fake()->unique()->numerify('###########'), 'email' => fake()->safeEmail(), 'active' => true];
    }
}
