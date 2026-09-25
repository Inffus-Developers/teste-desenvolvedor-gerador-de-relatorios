<?php

namespace App\Services;

use Brick\Math\BigDecimal;
use Brick\Math\RoundingMode;
use Carbon\CarbonImmutable;

final class InterestCalculator
{
    public const DIVISOR = 3000; // Percentual mensal / 100 / 30 dias.

    public function calculate(string $amount, string $rate, string $dueAt, string $asOf): string
    {
        $dueDate = CarbonImmutable::createFromFormat('!Y-m-d', $dueAt, 'UTC');
        $referenceDate = CarbonImmutable::createFromFormat('!Y-m-d', $asOf, 'UTC');
        $days = max(0, (int) $dueDate->diffInDays($referenceDate, false));

        return (string) BigDecimal::of($amount)->multipliedBy($rate)->multipliedBy($days)
            ->dividedBy(self::DIVISOR, 2, RoundingMode::HalfUp);
    }

    public function sql(string $driver): string
    {
        $days = $driver === 'sqlite'
            ? 'MAX(0, CAST(julianday(?) - julianday(charges.due_at) AS INTEGER))'
            : 'GREATEST(0, DATEDIFF(?, charges.due_at))';

        return 'CASE WHEN charges.paid_at IS NOT NULL THEN charges.paid_interest ELSE ROUND(charges.original_amount * charges.monthly_interest_rate * '.$days.' / '.self::DIVISOR.'.0, 2) END';
    }
}
