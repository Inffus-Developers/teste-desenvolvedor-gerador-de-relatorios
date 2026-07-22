<?php

namespace App\Http\Requests\Customer;

use App\Enums\CustomerStatus;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreCustomerRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'document' => ['required', 'string', 'max:32', 'unique:customers,document'],
            'email' => ['required', 'email', 'max:255', 'unique:customers,email'],
            'status' => ['required', Rule::enum(CustomerStatus::class)],
        ];
    }
}
