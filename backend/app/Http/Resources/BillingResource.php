<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class BillingResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'customer_id' => $this->customer_id,
            'customer' => CustomerResource::make($this->whenLoaded('customer')),
            'description' => $this->description,
            'original_amount' => number_format((float) $this->original_amount, 2, '.', ''),
            'interest_amount' => number_format($this->currentInterestAmount(), 2, '.', ''),
            'updated_amount' => number_format($this->currentUpdatedAmount(), 2, '.', ''),
            'issue_date' => $this->issue_date->toDateString(),
            'due_date' => $this->due_date->toDateString(),
            'payment_date' => $this->payment_date?->toDateString(),
            'monthly_interest_rate' => number_format((float) $this->monthly_interest_rate, 6, '.', ''),
            'status' => $this->derivedStatus(),
            'paid_amount' => $this->paid_amount === null ? null : number_format((float) $this->paid_amount, 2, '.', ''),
            'interest_amount_at_payment' => $this->interest_amount_at_payment === null ? null : number_format((float) $this->interest_amount_at_payment, 2, '.', ''),
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
        ];
    }
}
