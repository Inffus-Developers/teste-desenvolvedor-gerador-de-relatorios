<?php

namespace App\Services;

use Carbon\CarbonInterface;

class InterestCalculator
{
    /**
     * Compound monthly interest prorated by overdue days:
     * updated = original * (1 + monthly_rate) ^ (days_overdue / 30)
     */
    public function updatedAmount(
        float $originalAmount,
        float $monthlyInterestRate,
        CarbonInterface $dueDate,
        CarbonInterface $asOf,
    ): float {
        $daysOverdue = max(0, $dueDate->copy()->startOfDay()->diffInDays($asOf->copy()->startOfDay(), false));

        if ($daysOverdue <= 0 || $monthlyInterestRate <= 0) {
            return round($originalAmount, 2);
        }

        return round($originalAmount * ((1 + $monthlyInterestRate) ** ($daysOverdue / 30)), 2);
    }

    public function interestAmount(
        float $originalAmount,
        float $monthlyInterestRate,
        CarbonInterface $dueDate,
        CarbonInterface $asOf,
    ): float {
        return round(
            $this->updatedAmount($originalAmount, $monthlyInterestRate, $dueDate, $asOf) - $originalAmount,
            2,
        );
    }
}
