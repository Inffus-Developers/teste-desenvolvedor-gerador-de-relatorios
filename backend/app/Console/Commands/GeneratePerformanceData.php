<?php

namespace App\Console\Commands;

use App\Services\PerformanceDataGenerator;
use Illuminate\Console\Command;

class GeneratePerformanceData extends Command
{
    protected $signature = 'app:generate-performance-data
        {--customers= : Quantidade de clientes}
        {--billings= : Quantidade de cobranças}
        {--chunk= : Registros processados por bloco}
        {--force : Executar sem confirmação em produção}';

    protected $description = 'Gera clientes e cobranças em lotes para testes de volume';

    public function handle(PerformanceDataGenerator $generator): int
    {
        if ($this->laravel->isProduction() && ! $this->option('force') && ! $this->confirm('Gerar dados de teste no ambiente de produção?')) {
            return self::FAILURE;
        }

        $customers = $this->integerOption('customers', config('performance.customers'));
        $billings = $this->integerOption('billings', config('performance.billings'), allowZero: true);
        $chunk = $this->integerOption('chunk', config('performance.chunk_size'));

        if ($customers === null || $billings === null || $chunk === null) {
            return self::INVALID;
        }

        $this->info("Gerando {$customers} clientes e {$billings} cobranças em blocos de {$chunk}...");

        $bar = $this->output->createProgressBar($customers + $billings);
        $processed = 0;
        $bar->start();

        $result = $generator->generate(
            $customers,
            $billings,
            $chunk,
            function (int $generatedCustomers, int $generatedBillings) use ($bar, &$processed) {
                $current = $generatedCustomers + $generatedBillings;
                $bar->advance($current - $processed);
                $processed = $current;
            },
        );

        $bar->finish();

        $this->newLine();
        $this->info("Concluído: {$result['customers']} clientes e {$result['billings']} cobranças criados.");

        return self::SUCCESS;
    }

    private function integerOption(string $name, int $default, bool $allowZero = false): ?int
    {
        $value = $this->option($name);
        $value = $value === null ? $default : filter_var($value, FILTER_VALIDATE_INT);
        $minimum = $allowZero ? 0 : 1;

        if ($value === false || $value < $minimum) {
            $this->error("--{$name} deve ser um número inteiro maior ou igual a {$minimum}.");

            return null;
        }

        return $value;
    }
}
