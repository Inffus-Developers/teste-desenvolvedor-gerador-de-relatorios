<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class BillingReportRequest extends FormRequest
{
    public function authorize(): bool { return true; }

    public function rules(): array
    {
        return [
            'date_from' => ['nullable', 'date'],
            'date_to' => ['nullable', 'date', 'after_or_equal:date_from'],
            'customer_id' => ['nullable', 'integer', 'exists:customers,id'],
            'status' => ['nullable', Rule::in(['pending', 'overdue', 'paid', 'cancelled'])],
            'date_field' => ['nullable', Rule::in(['issue_date', 'due_date', 'payment_date'])],
            'page' => ['nullable', 'integer', 'min:1'],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:100'],
            'sort_by' => ['nullable', 'string'],
            'sort_dir' => ['nullable', Rule::in(['asc', 'desc'])],
        ];
    }
}
