<?php

namespace App\Services;

use App\Models\Billing;
use App\Models\Customer;
use Illuminate\Support\Facades\DB;
use InvalidArgumentException;

class PerformanceDataGenerator
{
    /**
     * @param  callable(int, int): void|null  $progress
     * @return array{customers: int, billings: int}
     */
    public function generate(int $customerCount, int $billingCount, int $chunkSize, ?callable $progress = null): array
    {
        if ($customerCount < 1 || $billingCount < 0 || $chunkSize < 1) {
            throw new InvalidArgumentException('As quantidades de clientes e blocos devem ser positivas; cobranças podem ser zero.');
        }

        $customerIds = [];
        $generatedCustomers = 0;
        $generatedBillings = 0;

        while ($generatedCustomers < $customerCount) {
            $currentChunk = min($chunkSize, $customerCount - $generatedCustomers);
            $customers = Customer::factory()->count($currentChunk)->make();
            $documents = $customers->pluck('document')->all();
            $timestamp = now();

            DB::table('customers')->insert($customers->map(function (Customer $customer) use ($timestamp) {
                return [...$customer->getAttributes(), 'created_at' => $timestamp, 'updated_at' => $timestamp];
            })->all());

            array_push(
                $customerIds,
                ...Customer::query()->whereIn('document', $documents)->pluck('id')->all(),
            );

            $generatedCustomers += $currentChunk;
            if ($progress) {
                $progress($generatedCustomers, $generatedBillings);
            }
        }

        while ($generatedBillings < $billingCount) {
            $currentChunk = min($chunkSize, $billingCount - $generatedBillings);
            $timestamp = now();
            $paidCount = intdiv($currentChunk, 3);
            $customerState = fn () => ['customer_id' => fake()->randomElement($customerIds)];
            $billings = Billing::factory()
                ->count($currentChunk - $paidCount)
                ->state($customerState)
                ->make()
                ->concat(Billing::factory()
                    ->count($paidCount)
                    ->paid()
                    ->state($customerState)
                    ->make())
                ->shuffle();

            DB::table('billings')->insert($billings->map(function (Billing $billing) use ($timestamp) {
                return [...$billing->getAttributes(), 'created_at' => $timestamp, 'updated_at' => $timestamp];
            })->all());

            $generatedBillings += $currentChunk;
            if ($progress) {
                $progress($generatedCustomers, $generatedBillings);
            }
        }

        return ['customers' => $generatedCustomers, 'billings' => $generatedBillings];
    }
}
