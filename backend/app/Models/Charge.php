<?php

namespace App\Models;

use Carbon\Carbon;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Charge extends Model
{
    use HasFactory;

    protected $fillable = [
        'client_name',
        'description',
        'original_amount',
        'issue_date',
        'due_date',
        'payment_date',
        'status',
        'interest_rate',
        'paid_amount',
        'paid_interest',
    ];

    protected $casts = [
        'issue_date' => 'date',
        'due_date' => 'date',
        'payment_date' => 'date',
        'original_amount' => 'decimal:2',
        'interest_rate' => 'decimal:2',
        'paid_amount' => 'decimal:2',
        'paid_interest' => 'decimal:2',
    ];

    protected $appends = ['final_amount', 'interest_amount'];

    public function getInterestAmountAttribute(): float
    {
        if (! $this->due_date || in_array($this->status, ['paga', 'cancelada'], true)) {
            return 0.0;
        }

        $dueDate = Carbon::parse($this->due_date);
        $now = Carbon::now();

        if ($now->lessThanOrEqualTo($dueDate)) {
            return 0.0;
        }

        $daysLate = max(0, $dueDate->diffInDays($now));
        $monthlyRate = (float) $this->interest_rate / 100;
        $factor = pow(1 + $monthlyRate, $daysLate / 30);

        return round((float) $this->original_amount * ($factor - 1), 2);
    }

    public function getFinalAmountAttribute(): float
    {
        if ($this->status === 'paga' || $this->status === 'cancelada' || ! $this->due_date) {
            return (float) $this->original_amount;
        }

        return round((float) $this->original_amount + $this->interest_amount, 2);
    }
}
