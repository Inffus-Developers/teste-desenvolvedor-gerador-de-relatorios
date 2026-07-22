<?php

namespace App\Http\Resources;

use App\Services\BillingInterestCalculator;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class BillingResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $calculation = app(BillingInterestCalculator::class)->calculate($this->resource);

        return [
            'id' => $this->id,
            'customer' => [
                'id' => $this->customer->id,
                'name' => $this->customer->name,
            ],
            'description' => $this->description,
            'original_amount' => $this->original_amount,
            'issue_date' => $this->issue_date->toDateString(),
            'due_date' => $this->due_date->toDateString(),
            'payment_date' => $this->payment_date?->toDateString(),
            'monthly_interest_rate' => $this->monthly_interest_rate,
            'status' => $calculation['display_status'],
            'stored_status' => $this->status->value,
            'days_overdue' => $calculation['days_overdue'],
            'interest_amount' => number_format($calculation['interest_amount'], 2, '.', ''),
            'updated_amount' => number_format($calculation['updated_amount'], 2, '.', ''),
            'paid_amount' => $this->paid_amount,
            'interest_paid' => $this->interest_paid,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
