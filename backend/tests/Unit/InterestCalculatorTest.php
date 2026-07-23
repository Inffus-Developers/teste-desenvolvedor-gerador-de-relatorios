<?php

namespace Tests\Unit;

use App\Services\InterestCalculator;
use Carbon\Carbon;
use PHPUnit\Framework\Attributes\DataProvider;
use Tests\TestCase;

class InterestCalculatorTest extends TestCase
{
    private InterestCalculator $calculator;

    protected function setUp(): void
    {
        parent::setUp();
        $this->calculator = new InterestCalculator;
    }

    #[DataProvider('updatedAmountCases')]
    public function test_updated_amount(string $dueDate, string $asOf, float $rate, float $original, float $expected): void
    {
        $amount = $this->calculator->updatedAmount(
            $original,
            $rate,
            Carbon::parse($dueDate),
            Carbon::parse($asOf),
        );

        $this->assertSame($expected, $amount);
    }

    public static function updatedAmountCases(): array
    {
        return [
            'no overdue days' => ['2026-07-22', '2026-07-22', 0.02, 1000.0, 1000.0],
            'future due date' => ['2026-08-01', '2026-07-22', 0.02, 1000.0, 1000.0],
            'zero rate' => ['2026-06-01', '2026-07-22', 0.0, 1000.0, 1000.0],
            '30 days overdue' => ['2026-06-22', '2026-07-22', 0.02, 1000.0, 1020.0],
            '60 days overdue' => ['2026-05-23', '2026-07-22', 0.02, 1000.0, 1040.4],
        ];
    }

    public function test_interest_amount_is_difference_from_original(): void
    {
        $interest = $this->calculator->interestAmount(
            1000.0,
            0.02,
            Carbon::parse('2026-06-22'),
            Carbon::parse('2026-07-22'),
        );

        $this->assertSame(20.0, $interest);
    }
}
