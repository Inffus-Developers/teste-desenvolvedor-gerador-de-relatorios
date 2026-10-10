<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\Customer;
use App\Models\Billing;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $this->command->info('Criando usuário estático para acesso...');

        // Cria o usuário de testes para você usar no login do Frontend
        User::factory()->create([
            'name' => 'Administrador',
            'email' => 'admin@teste.com',
            'password' => Hash::make('password'), // a senha será 'password'
        ]);

        $this->command->info('Iniciando a geração de clientes e cobranças (isso pode levar alguns segundos)...');

        // Cria 500 clientes, e para cada cliente, gera entre 10 e 30 cobranças
        Customer::factory(500)->create()->each(function ($customer) {
            Billing::factory(random_int(10, 30))->create([
                'customer_id' => $customer->id
            ]);
        });

        $totalCustomers = Customer::count();
        $totalBillings = Billing::count();
        
        $this->command->info("Banco populado com sucesso!");
        $this->command->info("Total de Clientes: {$totalCustomers}");
        $this->command->info("Total de Cobranças: {$totalBillings}");
        $this->command->info("---");
        $this->command->info("Login: admin@teste.com");
        $this->command->info("Senha: password");
    }
}
