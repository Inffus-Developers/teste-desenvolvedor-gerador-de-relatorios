<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class BillingRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'customer_id' => ['required', 'exists:customers,id'],
            'description' => ['required', 'string', 'max:200'],
            'original_amount' => ['required', 'numeric', 'min:0.01'],
            'issue_date' => ['required', 'date'],
            'due_date' => ['required', 'date', 'after_or_equal:issue_date'],
            'payment_date' => ['nullable', 'date', 'after_or_equal:issue_date'],
            'interest_rate' => ['required', 'numeric', 'min:0', 'max:100'],
            'status' => ['required', 'in:pending,paid,overdue,canceled'],
        ];
    }

    public function messages(): array
    {
        return [
            'customer_id.required' => 'O cliente é obrigatório.',
            'customer_id.exists' => 'O cliente selecionado não existe na base de dados.',
            'description.required' => 'A descrição da cobrança é obrigatória.',
            'original_amount.required' => 'O valor original é obrigatório.',
            'original_amount.min' => 'O valor deve ser maior que zero.',
            'issue_date.required' => 'A data de emissão é obrigatória.',
            'due_date.required' => 'A data de vencimento é obrigatória.',
            'due_date.after_or_equal' => 'A data de vencimento não pode ser anterior à data de emissão.',
            'payment_date.after_or_equal' => 'A data de pagamento não pode ser anterior à emissão.',
            'interest_rate.required' => 'A taxa de juros mensal é obrigatória.',
            'status.required' => 'O status é obrigatório.',
            'status.in' => 'Status inválido.',
        ];
    }
}