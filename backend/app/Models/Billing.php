<?php

namespace App\Models;

use App\Services\InterestCalculator;
use Carbon\Carbon;
use Database\Factories\BillingFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Billing extends Model
{
    /** @use HasFactory<BillingFactory> */
    use HasFactory;

    protected $fillable = [
        'customer_id', 'description', 'original_amount', 'issue_date', 'due_date',
        'payment_date', 'monthly_interest_rate', 'status', 'paid_amount',
        'interest_amount_at_payment',
    ];

    protected function casts(): array
    {
        return [
            'original_amount' => 'decimal:2',
            'monthly_interest_rate' => 'decimal:6',
            'paid_amount' => 'decimal:2',
            'interest_amount_at_payment' => 'decimal:2',
            'issue_date' => 'date',
            'due_date' => 'date',
            'payment_date' => 'date',
        ];
    }

    public function customer(): BelongsTo
    {
        return $this->belongsTo(Customer::class);
    }

    public function derivedStatus(?Carbon $asOf = null): string
    {
        if ($this->status === 'paid' || $this->payment_date !== null) {
            return 'paid';
        }

        if ($this->status === 'cancelled') {
            return 'cancelled';
        }

        return $this->due_date->copy()->startOfDay()->lt(($asOf ?? now())->copy()->startOfDay())
            ? 'overdue'
            : 'pending';
    }

    public function currentUpdatedAmount(?Carbon $asOf = null): float
    {
        if ($this->derivedStatus($asOf) === 'paid') {
            return (float) $this->paid_amount;
        }

        return app(InterestCalculator::class)->updatedAmount(
            (float) $this->original_amount,
            (float) $this->monthly_interest_rate,
            $this->due_date,
            $asOf ?? now(),
        );
    }

    public function currentInterestAmount(?Carbon $asOf = null): float
    {
        if ($this->derivedStatus($asOf) === 'paid') {
            return (float) $this->interest_amount_at_payment;
        }

        return round($this->currentUpdatedAmount($asOf) - (float) $this->original_amount, 2);
    }

    public function getInterestAmountAttribute(): float
    {
        return $this->currentInterestAmount();
    }

    public function getUpdatedAmountAttribute(): float
    {
        return $this->currentUpdatedAmount();
    }

    public function getDerivedStatusAttribute(): string
    {
        return $this->derivedStatus();
    }
}
