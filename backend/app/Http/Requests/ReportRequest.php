<?php

namespace App\Http\Requests;

use App\Rules\ValidCursor;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class ReportRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $sort = is_string($this->input('sort')) ? $this->input('sort') : 'due_at';

        return [
            'start_date' => ['nullable', 'date_format:Y-m-d', 'required_with:end_date'],
            'end_date' => ['nullable', 'date_format:Y-m-d', 'required_with:start_date', 'after_or_equal:start_date'],
            'date_field' => ['nullable', Rule::in(['issued_at', 'due_at', 'paid_at'])],
            'customer_id' => ['nullable', 'integer', 'exists:customers,id'],
            'status' => ['nullable', Rule::in(['pending', 'overdue', 'paid'])],
            'sort' => ['nullable', Rule::in(['id', 'issued_at', 'due_at', 'original_amount'])],
            'direction' => ['nullable', Rule::in(['asc', 'desc'])],
            'per_page' => ['nullable', 'integer', 'between:1,100'],
            'cursor' => ['nullable', 'string', 'max:2048', new ValidCursor(['charges.'.$sort, 'charges.id'])],
            'format' => ['sometimes', 'required', Rule::in(['csv', 'pdf'])],
        ];
    }

    public function filters(): array
    {
        return array_filter($this->safe()->except(['cursor', 'per_page', 'format']), fn ($value) => $value !== null && $value !== '');
    }
}
