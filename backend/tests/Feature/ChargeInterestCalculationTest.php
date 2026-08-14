<?php

namespace Tests\Feature;

use App\Models\Charge;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ChargeInterestCalculationTest extends TestCase
{
    use RefreshDatabase;

    public function test_it_calculates_compound_interest_for_overdue_charges(): void
    {
        $updatedAmount = Charge::calculateUpdatedAmount(1000, 12, 30);

        $this->assertSame(1120.0, round($updatedAmount, 2));
    }

    public function test_paid_charge_uses_the_interest_saved_at_payment_time(): void
    {
        $charge = Charge::factory()->create([
            'original_amount' => 1000,
            'due_date' => now()->subDays(60)->toDateString(),
            'status' => 'paga',
            'paid_amount' => 1050,
            'paid_interest' => 50,
            'interest_rate' => 10,
        ]);

        $this->assertSame(50.0, $charge->interest_amount);
        $this->assertSame(1050.0, $charge->final_amount);
    }
}
