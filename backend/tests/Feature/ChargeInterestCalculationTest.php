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
}
