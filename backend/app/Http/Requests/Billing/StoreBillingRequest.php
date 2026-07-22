<?php

namespace App\Http\Requests\Billing;

use App\Enums\BillingStatus;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreBillingRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'customer_id' => ['required', 'integer', 'exists:customers,id'],
            'description' => ['required', 'string', 'max:255'],
            'original_amount' => ['required', 'decimal:0,2', 'gt:0', 'max:9999999999999.99'],
            'issue_date' => ['required', 'date'],
            'due_date' => ['required', 'date', 'after_or_equal:issue_date'],
            'monthly_interest_rate' => ['required', 'decimal:0,4', 'min:0', 'max:100'],
            'status' => ['required', Rule::in([BillingStatus::Pending->value])],
        ];
    }
}
