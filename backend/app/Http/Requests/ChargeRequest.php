<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class ChargeRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'customer_id' => ['required', 'integer', Rule::exists('customers', 'id')->where('active', true)],
            'description' => ['required', 'string', 'max:500'],
            'original_amount' => ['required', 'numeric', 'decimal:0,2', 'min:0.01', 'max:99999999.99'],
            'monthly_interest_rate' => ['required', 'numeric', 'decimal:0,4', 'min:0', 'max:100'],
            'issued_at' => ['required', 'date_format:Y-m-d', 'after_or_equal:2000-01-01', 'before_or_equal:today'],
            'due_at' => ['required', 'date_format:Y-m-d', 'after_or_equal:issued_at', 'before_or_equal:2100-12-31'],
        ];
    }
}
