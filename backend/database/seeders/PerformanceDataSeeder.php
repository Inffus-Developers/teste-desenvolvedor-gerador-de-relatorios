<?php

namespace Database\Seeders;

use App\Services\PerformanceDataGenerator;
use Illuminate\Database\Seeder;

class PerformanceDataSeeder extends Seeder
{
    public function run(): void
    {
        app(PerformanceDataGenerator::class)->generate(
            config('performance.customers'),
            config('performance.billings'),
            config('performance.chunk_size'),
        );
    }
}
