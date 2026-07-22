<?php

namespace App\Models;

use App\Enums\BillingStatus;
use Database\Factories\BillingFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Billing extends Model
{
    /** @use HasFactory<BillingFactory> */
    use HasFactory;

    protected $fillable = [
        'customer_id',
        'description',
        'original_amount',
        'issue_date',
        'due_date',
        'payment_date',
        'monthly_interest_rate',
        'status',
        'paid_amount',
        'interest_paid',
    ];

    public function customer(): BelongsTo
    {
        return $this->belongsTo(Customer::class);
    }

    protected function casts(): array
    {
        return [
            'original_amount' => 'decimal:2',
            'monthly_interest_rate' => 'decimal:4',
            'paid_amount' => 'decimal:2',
            'interest_paid' => 'decimal:2',
            'issue_date' => 'date',
            'due_date' => 'date',
            'payment_date' => 'date',
            'status' => BillingStatus::class,
        ];
    }
}
