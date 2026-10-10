<?php

namespace Tests\Unit;

use App\Actions\CalculateBillingInterestAction;
use App\Models\Billing;
use Carbon\Carbon;
use PHPUnit\Framework\TestCase;

class CalculateBillingInterestActionTest extends TestCase
{
    private CalculateBillingInterestAction $action;

    protected function setUp(): void
    {
        parent::setUp();
        $this->action = new CalculateBillingInterestAction();
    }

    public function test_it_returns_zero_interest_when_billing_is_not_overdue(): void
    {
        $billing = new Billing([
            'original_amount' => 1000.00,
            'interest_rate' => 3.00, // 3% ao mês
            'due_date' => '2026-10-20',
            'payment_date' => null,
        ]);

        $referenceDate = Carbon::parse('2026-10-15'); // 5 dias antes do vencimento
        $result = $this->action->execute($billing, $referenceDate);

        $this->assertFalse($result->isOverdue);
        $this->assertEquals(0, $result->daysOverdue);
        $this->assertEquals(0.00, $result->interestAmount);
        $this->assertEquals(1000.00, $result->finalAmount);
    }

    public function test_it_calculates_compound_interest_accurately_for_overdue_days(): void
    {
        $billing = new Billing([
            'original_amount' => 1000.00,
            'interest_rate' => 3.00, // 3% a.m.
            'due_date' => '2026-10-01',
            'payment_date' => null,
        ]);

        // Exatamente 30 dias de atraso (deve render exatamente os 3% ao final de 30 dias)
        $referenceDate = Carbon::parse('2026-10-31');
        $result = $this->action->execute($billing, $referenceDate);

        $this->assertTrue($result->isOverdue);
        $this->assertEquals(30, $result->daysOverdue);
        
        // 1000 * (1 + 0.03) = 1030.00
        $this->assertEquals(30.00, $result->interestAmount);
        $this->assertEquals(1030.00, $result->finalAmount);
    }

    public function test_it_freezes_interest_calculation_on_payment_date(): void
    {
        $billing = new Billing([
            'original_amount' => 500.00,
            'interest_rate' => 5.00,
            'due_date' => '2026-09-01',
            'payment_date' => '2026-09-11', // Pago com 10 dias de atraso
        ]);

        // Data de hoje muito posterior (outubro), mas o cálculo deve parar em 11 de setembro
        $result = $this->action->execute($billing);

        $this->assertTrue($result->isOverdue);
        $this->assertEquals(10, $result->daysOverdue);
        $this->assertGreaterThan(0, $result->interestAmount);
        $this->assertEquals(
            round(500.00 + $result->interestAmount, 2),
            $result->finalAmount
        );
    }
}