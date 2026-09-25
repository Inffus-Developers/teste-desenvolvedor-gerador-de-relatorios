<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class CustomerRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    protected function prepareForValidation(): void
    {
        if (is_string($this->document)) {
            $this->merge(['document' => preg_replace('/[.\-\/\s]/', '', $this->document)]);
        }
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'document' => ['required', 'regex:/^(\d{11}|\d{14})$/', Rule::unique('customers')->ignore($this->route('customer'))],
            'email' => ['required', 'email', 'max:255'],
            'active' => ['required', 'boolean'],
        ];
    }
}
