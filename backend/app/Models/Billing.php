<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Billing extends Model
{
    use HasFactory;

    protected $fillable = [
        'customer_id',
        'description',
        'original_amount',
        'issue_date',
        'due_date',
        'payment_date',
        'interest_rate',
        'status',
    ];

    // Aproveitamos para já criar o relacionamento: uma cobrança pertence a um cliente
    public function customer()
    {
        return $this->belongsTo(Customer::class);
    }
}
