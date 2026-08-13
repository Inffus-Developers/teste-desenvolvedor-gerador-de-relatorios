<?php

namespace App\Models;

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
    ];

    protected $appends = ['final_amount'];

    public function getFinalAmountAttribute()
    {
        if ($this->status === 'paga' || $this->status === 'cancelada' || !$this->due_date) {
            return $this->original_amount;
        }

        $dueDate = \Carbon\Carbon::parse($this->due_date);
        $now = \Carbon\Carbon::now();

        if ($now->lessThanOrEqualTo($dueDate)) {
            return $this->original_amount;
        }

        $daysLate = $now->diffInDays($dueDate);
        $interest = ($this->interest_rate / 100) * $this->original_amount * $daysLate;

        return $this->original_amount + $interest;
    }
}
