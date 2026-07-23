<?php

namespace App\Console\Commands;

use Database\Seeders\BillingSeeder;
use Database\Seeders\CustomerSeeder;
use Illuminate\Console\Command;

class SeedReportDataCommand extends Command
{
    protected $signature = 'reports:seed-data
                            {--customers=100 : Target number of customers}
                            {--billings=500 : Target number of billings}';

    protected $description = 'Seed customers and billings for report and performance testing';

    public function handle(): int
    {
        putenv('CUSTOMER_SEED_COUNT='.$this->option('customers'));
        putenv('BILLING_SEED_COUNT='.$this->option('billings'));

        $this->call(CustomerSeeder::class);
        $this->call(BillingSeeder::class);

        $this->info('Report seed data ready.');

        return self::SUCCESS;
    }
}
