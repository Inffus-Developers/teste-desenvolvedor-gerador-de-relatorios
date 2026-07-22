<!doctype html>
<html lang="pt-BR">
<head>
    <meta charset="utf-8">
    <style>
        body { font-family: DejaVu Sans, sans-serif; font-size: 9px; color: #111; }
        h1 { font-size: 16px; margin-bottom: 8px; }
        table { width: 100%; border-collapse: collapse; margin-top: 10px; }
        th, td { border: 1px solid #ccc; padding: 4px; text-align: left; }
        th { background: #eee; }
        .meta, .totals { margin: 4px 0; }
        .notice { color: #9a3412; }
    </style>
</head>
<body>
    <h1>Relatório de faturamento</h1>
    <p class="meta">Período: {{ $filters['date_from'] ?? 'início' }} até {{ $filters['date_to'] ?? 'fim' }}</p>
    <p class="meta">Campo de data: {{ $filters['date_field'] ?? 'issue_date' }}</p>
    <p class="meta">Cliente: {{ $filters['customer_id'] ?? 'todos' }} | Status: {{ $filters['status'] ?? 'todos' }}</p>
    @if ($isTruncated)
        <p class="notice">Este PDF contém no máximo 2.000 linhas. Use a exportação CSV para o volume completo.</p>
    @endif
    <table>
        <thead>
            <tr>
                <th>Cliente</th>
                <th>Descrição</th>
                <th>Emissão</th>
                <th>Vencimento</th>
                <th>Status</th>
                <th>Original</th>
                <th>Juros</th>
                <th>Atualizado</th>
                <th>Pago</th>
            </tr>
        </thead>
        <tbody>
        @foreach ($rows as $billing)
            <tr>
                <td>{{ $billing->customer?->name }}</td>
                <td>{{ $billing->description }}</td>
                <td>{{ $billing->issue_date->format('Y-m-d') }}</td>
                <td>{{ $billing->due_date->format('Y-m-d') }}</td>
                <td>{{ $billing->derivedStatus() }}</td>
                <td>{{ number_format((float) $billing->original_amount, 2, '.', '') }}</td>
                <td>{{ number_format($billing->currentInterestAmount(), 2, '.', '') }}</td>
                <td>{{ number_format($billing->currentUpdatedAmount(), 2, '.', '') }}</td>
                <td>{{ $billing->paid_amount === null ? '-' : number_format((float) $billing->paid_amount, 2, '.', '') }}</td>
            </tr>
        @endforeach
        </tbody>
    </table>
    <p class="totals">
        Quantidade: {{ $totals['count'] }} |
        Original: {{ $totals['original_total'] }} |
        Juros: {{ $totals['interest_total'] }} |
        Atualizado: {{ $totals['updated_total'] }} |
        Recebido: {{ $totals['received_total'] }} |
        Pendente: {{ $totals['pending_total'] }}
    </p>
</body>
</html>
