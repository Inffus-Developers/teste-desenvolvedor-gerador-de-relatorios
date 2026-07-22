<?php

namespace App\Models;

use App\Enums\CustomerStatus;
use Database\Factories\CustomerFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Customer extends Model
{
    /** @use HasFactory<CustomerFactory> */
    use HasFactory;

    protected $fillable = [
        'name',
        'document',
        'email',
        'status',
    ];

    protected function casts(): array
    {
        return [
            'status' => CustomerStatus::class,
        ];
    }

    public function billings(): HasMany
    {
        return $this->hasMany(Billing::class);
    }
}
