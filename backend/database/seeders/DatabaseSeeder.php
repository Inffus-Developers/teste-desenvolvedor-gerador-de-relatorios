<?php

namespace Database\Seeders;

use App\Models\Charge;
use App\Models\Customer;
use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        User::firstOrCreate(['email' => config('billing.demo_email')], [
            'name' => 'Matheus', 'password' => config('billing.demo_password'),
        ]);
        if (Customer::exists()) {
            return;
        }
        $names = ['Aurora Studio', 'Horizonte Tecnologia', 'Casa Botânica', 'Norte Arquitetura', 'Maré Comunicação', 'Ateliê Forma', 'Café Origem', 'Vértice Consultoria'];
        foreach ($names as $i => $name) {
            $customer = Customer::create([
                'name' => $name, 'document' => str_pad((string) (10000000000000 + $i), 14, '0', STR_PAD_LEFT),
                'email' => 'financeiro'.($i + 1).'@example.com', 'active' => true,
            ]);
            for ($n = 0; $n < 5; $n++) {
                $due = today()->startOfMonth()->addDays($i * 3 + $n - 5);
                $charge = Charge::create([
                    'customer_id' => $customer->id, 'description' => ['Consultoria mensal', 'Desenvolvimento de projeto', 'Licença de software', 'Manutenção e suporte', 'Serviços de design'][$n],
                    'original_amount' => 850 + $i * 430 + $n * 125, 'monthly_interest_rate' => 2,
                    'issued_at' => today()->subDays(60)->toDateString(), 'due_at' => $due->toDateString(),
                ]);
                if (($i + $n) % 3 === 0 && $due->lessThanOrEqualTo(today())) {
                    $charge->forceFill(['paid_at' => $due->toDateString(), 'paid_interest' => 0, 'paid_amount' => $charge->original_amount])->save();
                }
            }
        }
    }
}
