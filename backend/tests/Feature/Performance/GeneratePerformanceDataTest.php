<?php

namespace Tests\Feature\Performance;

use App\Enums\BillingStatus;
use App\Models\Billing;
use App\Models\Customer;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Schema;
use Tests\TestCase;

class GeneratePerformanceDataTest extends TestCase
{
    use RefreshDatabase;

    public function test_command_generates_customers_and_billings_in_configurable_chunks(): void
    {
        $this->artisan('app:generate-performance-data', [
            '--customers' => 5,
            '--billings' => 12,
            '--chunk' => 4,
        ])->assertSuccessful();

        $this->assertDatabaseCount('customers', 5);
        $this->assertDatabaseCount('billings', 12);
        $this->assertSame(3, Billing::query()->where('status', BillingStatus::Paid->value)->count());
        $this->assertSame(9, Billing::query()->where('status', BillingStatus::Pending->value)->count());
        $this->assertSame(12, Billing::query()->whereIn('customer_id', Customer::query()->select('id'))->count());
        $this->assertDatabaseMissing('billings', [
            'status' => BillingStatus::Paid->value,
            'payment_date' => null,
        ]);
    }

    public function test_command_rejects_invalid_quantities(): void
    {
        $this->artisan('app:generate-performance-data', [
            '--customers' => 0,
            '--billings' => -1,
            '--chunk' => 0,
        ])->assertExitCode(2);

        $this->assertDatabaseCount('customers', 0);
        $this->assertDatabaseCount('billings', 0);
    }

    public function test_billings_have_indexes_for_every_report_period_basis(): void
    {
        $indexes = collect(Schema::getIndexes('billings'))->pluck('columns');

        $this->assertTrue($indexes->contains(['issue_date']));
        $this->assertTrue($indexes->contains(['due_date']));
        $this->assertTrue($indexes->contains(['payment_date']));
    }
}
