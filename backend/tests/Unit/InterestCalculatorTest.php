<?php

namespace Tests\Unit;

use App\Services\InterestCalculator;
use App\Support\Amount;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\TestCase;

class InterestCalculatorTest extends TestCase
{
    public function test_large_totals_keep_exact_cents_in_pdf_formatting(): void
    {
        $this->assertSame('99.999.999.999.999.999,99', Amount::format('99999999999999999.99'));
    }

    public static function examples(): array
    {
        return [
            ['1000.00', '2.0000', '2026-08-01', '2026-08-31', '20.00'],
            ['1000.00', '2.0000', '2026-08-01', '2026-08-16', '10.00'],
            ['1000.00', '2.0000', '2026-08-01', '2026-08-01', '0.00'],
            ['1000.00', '2.0000', '2026-08-10', '2026-08-01', '0.00'],
            ['0.15', '100.0000', '2026-08-01', '2026-08-02', '0.01'],
            ['99999999.99', '100.0000', '2000-01-01', '2026-09-21', '32533333330.08'],
        ];
    }

    #[DataProvider('examples')]
    public function test_simple_interest_is_exact_and_rounded_per_charge(string $amount, string $rate, string $due, string $asOf, string $expected): void
    {
        $this->assertSame($expected, (new InterestCalculator)->calculate($amount, $rate, $due, $asOf));
    }
}
