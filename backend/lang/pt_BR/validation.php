<?php

return [
    'required' => 'O campo :attribute é obrigatório.',
    'required_with' => 'Informe :attribute para completar o período.',
    'email' => 'Informe um e-mail válido.',
    'unique' => 'Este :attribute já está cadastrado.',
    'exists' => 'O valor selecionado em :attribute é inválido ou está inativo.',
    'date_format' => 'O campo :attribute deve ser uma data válida.',
    'after_or_equal' => 'O campo :attribute deve ser igual ou posterior a :date.',
    'before_or_equal' => 'O campo :attribute deve ser igual ou anterior a :date.',
    'numeric' => 'O campo :attribute deve ser um número.',
    'integer' => 'O campo :attribute deve ser um número inteiro.',
    'decimal' => 'Confira a quantidade de casas decimais de :attribute.',
    'in' => 'O valor selecionado em :attribute é inválido.',
    'boolean' => 'O campo :attribute deve ser verdadeiro ou falso.',
    'regex' => 'O campo :attribute está em formato inválido.',
    'string' => 'O campo :attribute deve ser um texto.',
    'min' => ['numeric' => 'O campo :attribute deve ser no mínimo :min.', 'string' => 'O campo :attribute deve ter no mínimo :min caracteres.'],
    'max' => ['numeric' => 'O campo :attribute deve ser no máximo :max.', 'string' => 'O campo :attribute deve ter no máximo :max caracteres.'],
    'between' => ['numeric' => 'O campo :attribute deve estar entre :min e :max.'],
    'attributes' => ['name' => 'nome', 'document' => 'documento', 'email' => 'e-mail', 'active' => 'status', 'customer_id' => 'cliente', 'description' => 'descrição', 'original_amount' => 'valor original', 'monthly_interest_rate' => 'taxa de juros', 'issued_at' => 'emissão', 'due_at' => 'vencimento', 'paid_at' => 'pagamento', 'paid_amount' => 'valor pago', 'start_date' => 'data inicial', 'end_date' => 'data final', 'per_page' => 'quantidade por página'],
];
