<?php

namespace App\Services;

use App\Enums\BillingStatus;
use App\Models\Billing;
use Carbon\CarbonImmutable;
use Carbon\CarbonInterface;

class BillingInterestCalculator
{
    /** @return array{days_overdue: int, interest_amount: float, updated_amount: float, display_status: string} */
    public function calculate(Billing $billing, ?CarbonInterface $asOf = null): array
    {
        $originalAmount = (float) $billing->original_amount;

        if ($billing->status === BillingStatus::Paid) {
            $interest = (float) ($billing->interest_paid ?? 0);

            return [
                'days_overdue' => $this->daysOverdue($billing, $billing->payment_date),
                'interest_amount' => round($interest, 2),
                'updated_amount' => round($originalAmount + $interest, 2),
                'display_status' => BillingStatus::Paid->value,
            ];
        }

        $calculationDate = CarbonImmutable::instance($asOf ?? now())->startOfDay();
        $daysOverdue = $this->daysOverdue($billing, $calculationDate);

        if ($daysOverdue === 0 || (float) $billing->monthly_interest_rate === 0.0) {
            return [
                'days_overdue' => $daysOverdue,
                'interest_amount' => 0.0,
                'updated_amount' => round($originalAmount, 2),
                'display_status' => $daysOverdue > 0 ? 'overdue' : BillingStatus::Pending->value,
            ];
        }

        $monthlyRate = (float) $billing->monthly_interest_rate / 100;
        $updatedAmount = $originalAmount * ((1 + $monthlyRate) ** ($daysOverdue / 30));
        $updatedAmount = round($updatedAmount, 2);

        return [
            'days_overdue' => $daysOverdue,
            'interest_amount' => round($updatedAmount - $originalAmount, 2),
            'updated_amount' => $updatedAmount,
            'display_status' => 'overdue',
        ];
    }

    private function daysOverdue(Billing $billing, ?CarbonInterface $date): int
    {
        if (! $date || $date->lessThanOrEqualTo($billing->due_date)) {
            return 0;
        }

        return $billing->due_date->diffInDays($date);
    }
}
