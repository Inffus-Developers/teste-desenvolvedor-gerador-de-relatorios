<?php

namespace App\DTOs;

readonly class BillingCalculationResult
{
    public function __construct(
        public float $originalAmount,
        public float $interestAmount,
        public float $finalAmount,
        public int $daysOverdue,
        public float $dailyInterestRatePercent,
        public bool $isOverdue
    ) {}

    public function toArray(): array
    {
        return [
            'original_amount' => $this->originalAmount,
            'interest_amount' => $this->interestAmount,
            'final_amount' => $this->finalAmount,
            'days_overdue' => $this->daysOverdue,
            'daily_interest_rate_percent' => $this->dailyInterestRatePercent,
            'is_overdue' => $this->isOverdue,
        ];
    }
}