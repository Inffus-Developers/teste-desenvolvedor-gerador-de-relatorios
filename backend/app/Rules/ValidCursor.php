<?php

namespace App\Rules;

use Closure;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Support\Facades\Validator;

final class ValidCursor implements ValidationRule
{
    public function __construct(private array $columns) {}

    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        $decoded = is_string($value) ? json_decode(base64_decode(strtr($value, '-_', '+/')), true) : null;
        if (! is_array($decoded) || ! is_bool($decoded['_pointsToNextItems'] ?? null)) {
            $fail('Cursor de paginação inválido. Recarregue a listagem.');

            return;
        }
        foreach (array_unique($this->columns) as $column) {
            $field = str_contains($column, '.') ? explode('.', $column)[1] : $column;
            $rules = match ($field) {
                'id' => ['required', 'integer', 'min:1'],
                'issued_at', 'due_at' => ['required', 'date_format:Y-m-d'],
                'original_amount' => ['required', 'numeric', 'min:0', 'max:99999999.99'],
                default => ['required', 'string', 'max:255'],
            };
            if (Validator::make(['value' => $decoded[$column] ?? null], ['value' => $rules])->fails()) {
                $fail('Cursor incompatível com a ordenação selecionada. Recarregue a listagem.');

                return;
            }
        }
    }
}
