<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Charge extends Model
{
    use HasFactory;

    protected $fillable = ['customer_id', 'description', 'original_amount', 'monthly_interest_rate', 'issued_at', 'due_at'];

    protected function casts(): array
    {
        return ['original_amount' => 'decimal:2', 'monthly_interest_rate' => 'decimal:4', 'paid_amount' => 'decimal:2', 'paid_interest' => 'decimal:2'];
    }

    public function customer(): BelongsTo
    {
        return $this->belongsTo(Customer::class);
    }
}
