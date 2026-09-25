<?php

namespace App\Console\Commands;

use App\Models\Customer;
use App\Services\InterestCalculator;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class GenerateBillingData extends Command
{
    protected $signature = 'billing:generate {count=100000 : Quantidade de novas cobranças}';

    protected $description = 'Gera cobranças em lotes de 1000, sem manter a massa completa em memória';

    public function handle(InterestCalculator $calculator): int
    {
        $raw = (string) $this->argument('count');
        if (! ctype_digit($raw) || (int) $raw < 1 || (int) $raw > 10000000) {
            $this->error('Informe uma quantidade entre 1 e 10000000.');

            return self::FAILURE;
        }
        if (! Customer::exists()) {
            Customer::factory()->count(100)->create();
        }
        $ids = Customer::orderBy('id')->limit(1000)->pluck('id')->all();
        $count = (int) $raw;
        $progress = $this->output->createProgressBar($count);
        for ($offset = 0; $offset < $count; $offset += 1000) {
            $batch = [];
            for ($n = 0; $n < min(1000, $count - $offset); $n++) {
                $issued = today()->subDays(random_int(30, 1095));
                $due = $issued->copy()->addDays(random_int(15, 90));
                $amount = (string) random_int(100, 50000);
                $paidAt = random_int(0, 2) === 0 && $due->isPast() ? $due->min(today())->toDateString() : null;
                $batch[] = [
                    'customer_id' => $ids[array_rand($ids)], 'description' => 'Serviço gerado para teste de volume #'.($offset + $n + 1),
                    'original_amount' => $amount, 'monthly_interest_rate' => '2.0000',
                    'issued_at' => $issued->toDateString(), 'due_at' => $due->toDateString(),
                    'paid_at' => $paidAt, 'paid_interest' => $paidAt ? $calculator->calculate($amount, '2', $due->toDateString(), $paidAt) : null,
                    'paid_amount' => $paidAt ? $amount : null, 'created_at' => now(), 'updated_at' => now(),
                ];
            }
            DB::table('charges')->insert($batch);
            $progress->advance(count($batch));
        }
        $progress->finish();
        $this->newLine();

        return self::SUCCESS;
    }
}
