<!doctype html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <style>
        @page { margin: 48px 34px 42px; }
        * { box-sizing: border-box; }
        body { margin: 0; color: #1d2939; font-family: "DejaVu Sans", sans-serif; font-size: 8px; }
        .footer { position: fixed; right: 0; bottom: -26px; left: 0; color: #667085; text-align: center; }
        .footer .page:after { content: counter(page); }
        .eyebrow { margin: 0 0 4px; color: #087f8c; font-size: 8px; font-weight: bold; letter-spacing: 1px; text-transform: uppercase; }
        h1 { margin: 0 0 5px; color: #101828; font-size: 22px; }
        .subtitle { margin: 0; color: #667085; font-size: 9px; }
        .header { margin-bottom: 14px; border-bottom: 2px solid #087f8c; padding-bottom: 12px; }
        .filters { width: 100%; margin: 10px 0 12px; border-collapse: separate; border-spacing: 6px 0; }
        .filters td { width: 20%; border: 1px solid #e4e7ec; border-radius: 4px; padding: 6px; background: #f9fafb; }
        .label { display: block; margin-bottom: 2px; color: #667085; font-size: 6px; font-weight: bold; text-transform: uppercase; }
        .totals { width: 100%; margin-bottom: 14px; border-collapse: separate; border-spacing: 5px 0; }
        .totals td { border-radius: 4px; padding: 7px; background: #edf8f8; text-align: center; }
        .totals strong { display: block; margin-top: 2px; color: #101828; font-size: 10px; }
        .data { width: 100%; border-collapse: collapse; table-layout: fixed; }
        .data th { border-bottom: 2px solid #087f8c; padding: 6px 4px; color: #344054; background: #f2f4f7; font-size: 6px; text-align: left; text-transform: uppercase; }
        .data td { border-bottom: 1px solid #eaecf0; padding: 5px 4px; vertical-align: top; overflow-wrap: break-word; }
        .data tr:nth-child(even) td { background: #fcfcfd; }
        .number { text-align: right; white-space: nowrap; }
        .status { font-weight: bold; }
        .empty { padding: 30px; color: #667085; text-align: center; }
    </style>
</head>
<body>
    <div class="footer">Relatório de faturamento - Página <span class="page"></span></div>
    <header class="header">
        <p class="eyebrow">Sistema de faturamento</p>
        <h1>Relatório de faturamento</h1>
        <p class="subtitle">Gerado em {{ $generatedAt->format('d/m/Y H:i') }}</p>
    </header>

    <table class="filters"><tr>
        <td><span class="label">Período</span>{{ \Carbon\Carbon::parse($filters['date_from'])->format('d/m/Y') }} a {{ \Carbon\Carbon::parse($filters['date_to'])->format('d/m/Y') }}</td>
        <td><span class="label">Base</span>{{ ['issue_date' => 'Emissão', 'due_date' => 'Vencimento', 'payment_date' => 'Pagamento'][$filters['period_basis']] }}</td>
        <td><span class="label">Cliente</span>{{ $customerName }}</td>
        <td><span class="label">Status</span>{{ $filters['status'] ?? 'Todos' }}</td>
        <td><span class="label">Registros</span>{{ number_format($totals['count'], 0, ',', '.') }}</td>
    </tr></table>

    <table class="totals"><tr>
        <td><span class="label">Valor original</span><strong>R$ {{ number_format($totals['original_total'], 2, ',', '.') }}</strong></td>
        <td><span class="label">Juros</span><strong>R$ {{ number_format($totals['interest_total'], 2, ',', '.') }}</strong></td>
        <td><span class="label">Valor atualizado</span><strong>R$ {{ number_format($totals['updated_total'], 2, ',', '.') }}</strong></td>
        <td><span class="label">Recebido</span><strong>R$ {{ number_format($totals['received_total'], 2, ',', '.') }}</strong></td>
        <td><span class="label">Pendente</span><strong>R$ {{ number_format($totals['pending_total'], 2, ',', '.') }}</strong></td>
    </tr></table>

    <table class="data">
        <thead><tr><th style="width:13%">Cliente</th><th style="width:17%">Descrição</th><th style="width:8%">Emissão</th><th style="width:8%">Vencimento</th><th style="width:8%">Status</th><th style="width:11%" class="number">Original</th><th style="width:11%" class="number">Juros</th><th style="width:12%" class="number">Atualizado</th><th style="width:12%" class="number">Pago</th></tr></thead>
        <tbody>
        @forelse ($rows as $row)
            @php($billing = $row['billing'])
            @php($calculation = $row['calculation'])
            <tr>
                <td>{{ $billing->customer->name }}</td><td>{{ $billing->description }}</td>
                <td>{{ $billing->issue_date->format('d/m/Y') }}</td><td>{{ $billing->due_date->format('d/m/Y') }}</td>
                <td class="status">{{ ['pending' => 'Pendente', 'overdue' => 'Vencida', 'paid' => 'Paga'][$calculation['display_status']] }}</td>
                <td class="number">R$ {{ number_format((float) $billing->original_amount, 2, ',', '.') }}</td>
                <td class="number">R$ {{ number_format($calculation['interest_amount'], 2, ',', '.') }}</td>
                <td class="number">R$ {{ number_format($calculation['updated_amount'], 2, ',', '.') }}</td>
                <td class="number">R$ {{ number_format((float) ($billing->paid_amount ?? 0), 2, ',', '.') }}</td>
            </tr>
        @empty
            <tr><td colspan="9" class="empty">Nenhuma cobrança encontrada para os filtros selecionados.</td></tr>
        @endforelse
        </tbody>
    </table>
</body>
</html>
