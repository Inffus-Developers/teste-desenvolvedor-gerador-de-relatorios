<?php

namespace App\Console\Commands;

use App\Models\Charge;
use App\Models\Client;
use Illuminate\Console\Command;

class GenerateReportDatasetCommand extends Command
{
    protected $signature = 'report:generate {count=50000 : Quantidade de cobranças para simular}';

    protected $description = 'Gera um volume significativo de dados para testes de relatório e performance';

    public function handle(): int
    {
        $count = max(1, (int) $this->argument('count'));

        $this->info("Gerando {$count} clientes e cobranças...");

        Client::query()->delete();
        Charge::query()->delete();

        $clients = Client::factory()->count((int) max(1, $count / 10))->create();

        $bar = $this->output->createProgressBar($count);
        $bar->start();

        for ($i = 0; $i < $count; $i++) {
            $client = $clients->random();
            $issueDate = now()->subDays(rand(1, 365));
            $daysLate = rand(0, 120);
            $dueDate = $issueDate->copy()->addDays(rand(5, 45));
            $status = fake()->randomElement(['pendente', 'paga', 'atrasada', 'cancelada']);

            Charge::factory()->create([
                'client_name' => $client->name,
                'description' => 'Cobrança gerada para teste de performance ' . ($i + 1),
                'original_amount' => fake()->randomFloat(2, 100, 50000),
                'issue_date' => $issueDate->toDateString(),
                'due_date' => $dueDate->toDateString(),
                'payment_date' => $status === 'paga' ? now()->subDays(rand(0, 30))->toDateString() : null,
                'status' => $status,
                'interest_rate' => fake()->randomFloat(2, 0.5, 12),
                'paid_amount' => $status === 'paga' ? fake()->randomFloat(2, 100, 50000) : null,
                'paid_interest' => $status === 'paga' ? fake()->randomFloat(2, 0, 1500) : null,
            ]);

            $bar->advance();
        }

        $bar->finish();
        $this->newLine();
        $this->info('Dataset gerado com sucesso.');

        return self::SUCCESS;
    }
}
