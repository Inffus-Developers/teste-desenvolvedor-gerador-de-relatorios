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

    public function rules(): array
    {
        $customerId = $this->route('customer') ? $this->route('customer')->id : null;

        return [
            'name' => ['required', 'string', 'max:100'],
            'document' => [
                'required',
                'string',
                'max:20',
                Rule::unique('customers', 'document')->ignore($customerId),
            ],
            'email' => [
                'required',
                'email',
                'max:100',
                Rule::unique('customers', 'email')->ignore($customerId),
            ],
            'status' => ['required', 'in:active,inactive'],
        ];
    }

    public function messages(): array
    {
        return [
            'name.required' => 'O nome do cliente é obrigatório.',
            'document.required' => 'O documento (CPF/CNPJ) é obrigatório.',
            'document.unique' => 'Este documento já está cadastrado para outro cliente.',
            'email.required' => 'O e-mail é obrigatório.',
            'email.email' => 'Informe um formato de e-mail válido.',
            'email.unique' => 'Este e-mail já está cadastrado para outro cliente.',
            'status.required' => 'O status é obrigatório.',
            'status.in' => 'O status selecionado é inválido.',
        ];
    }
}