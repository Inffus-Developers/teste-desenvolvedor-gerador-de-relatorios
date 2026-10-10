<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <title>Relatório de Faturamento</title>
    <style>
        @page {
            margin: 25px 25px 30px 25px;
        }
        body {
            font-family: Helvetica, Arial, sans-serif;
            color: #1e293b;
            font-size: 10px;
            margin: 0;
            padding: 0;
        }
        .header {
            background-color: #3e5954;
            color: #dff6e4;
            padding: 12px 16px;
            margin-bottom: 12px;
        }
        .header h1 {
            margin: 0;
            font-size: 16px;
            font-weight: bold;
        }
        .header p {
            margin: 3px 0 0 0;
            font-size: 9px;
            opacity: 0.85;
        }
        
        /* Grid de Resumo com tabelas (muito mais leve para o DomPDF que inline-block) */
        .summary-table {
            width: 100%;
            border-collapse: separate;
            border-spacing: 6px 0;
            margin-bottom: 12px;
        }
        .summary-box {
            background-color: #f8fafc;
            border: 1px solid #cbd5e1;
            padding: 8px;
            text-align: center;
        }
        .summary-box.primary {
            background-color: #3e5954;
            color: #dff6e4;
            border: 1px solid #3e5954;
        }
        .summary-title {
            font-size: 8px;
            text-transform: uppercase;
            font-weight: bold;
            margin-bottom: 2px;
        }
        .summary-value {
            font-size: 11px;
            font-weight: bold;
        }

        /* Tabela Principal */
        .report-table {
            width: 100%;
            border-collapse: collapse;
        }
        .report-table th {
            background-color: #f1f5f9;
            color: #3e5954;
            font-weight: bold;
            text-align: left;
            padding: 6px 8px;
            font-size: 9px;
            text-transform: uppercase;
            border-bottom: 1px solid #94a3b8;
        }
        .report-table td {
            padding: 5px 8px;
            border-bottom: 1px solid #e2e8f0;
            font-size: 9px;
        }
        .text-red {
            color: #b91c1c;
            font-weight: bold;
        }
        .text-center {
            text-align: center;
        }
        .badge {
            font-size: 8px;
            font-weight: bold;
            text-transform: uppercase;
            padding: 2px 4px;
        }
        .badge-paid { color: #15803d; }
        .badge-pending { color: #b45309; }
        .badge-overdue { color: #b91c1c; }
        .badge-canceled { color: #64748b; }
    </style>
</head>
<body>

    <div class="header">
        <h1>TDGR - Relatório de Faturamento</h1>
        <p>Gerado em {{ $generatedAt }}</p>
    </div>

    <!-- Cards de Resumo em Tabela Rápida -->
    <table class="summary-table">
        <tr>
            <td class="summary-box primary" width="20%">
                <div class="summary-title" style="color: #dff6e4;">Volume Total ({{ $summary['total_count'] ?? 0 }})</div>
                <div class="summary-value">R$ {{ number_format($summary['total_amount'] ?? 0, 2, ',', '.') }}</div>
            </td>
            <td class="summary-box" width="20%">
                <div class="summary-title" style="color: #15803d;">Recebido (Pago)</div>
                <div class="summary-value" style="color: #15803d;">R$ {{ number_format($summary['paid_amount'] ?? 0, 2, ',', '.') }}</div>
            </td>
            <td class="summary-box" width="20%">
                <div class="summary-title" style="color: #b45309;">A Vencer (Pendente)</div>
                <div class="summary-value" style="color: #b45309;">R$ {{ number_format($summary['pending_amount'] ?? 0, 2, ',', '.') }}</div>
            </td>
            <td class="summary-box" width="20%">
                <div class="summary-title" style="color: #b91c1c;">Inadimplência</div>
                <div class="summary-value" style="color: #b91c1c;">R$ {{ number_format($summary['overdue_amount'] ?? 0, 2, ',', '.') }}</div>
            </td>
            <td class="summary-box" width="20%">
                <div class="summary-title" style="color: #475569;">Canceladas</div>
                <div class="summary-value" style="color: #475569;">R$ {{ number_format($summary['canceled_amount'] ?? 0, 2, ',', '.') }}</div>
            </td>
        </tr>
    </table>

    <!-- Tabela de Itens -->
    <table class="report-table">
        <thead>
            <tr>
                <th width="24%">Cliente</th>
                <th width="32%">Descrição</th>
                <th width="12%">Valor Original</th>
                <th width="12%">Valor c/ Juros</th>
                <th width="10%">Vencimento</th>
                <th width="10%" class="text-center">Status</th>
            </tr>
        </thead>
        <tbody>
            @forelse($rows as $row)
                <tr>
                    <td><strong>{{ $row['customer_name'] }}</strong></td>
                    <td>{{ $row['description'] }}</td>
                    <td>R$ {{ number_format($row['original_amount'], 2, ',', '.') }}</td>
                    <td>
                        @if($row['has_interest'])
                            <span class="text-red">R$ {{ number_format($row['final_amount'], 2, ',', '.') }}</span>
                        @else
                            R$ {{ number_format($row['original_amount'], 2, ',', '.') }}
                        @endif
                    </td>
                    <td>{{ $row['due_date'] }}</td>
                    <td class="text-center">
                        <span class="badge badge-{{ $row['status'] }}">
                            @switch($row['status'])
                                @case('paid') Pago @break
                                @case('pending') Pendente @break
                                @case('overdue') Vencido @break
                                @case('canceled') Cancelado @break
                                @default {{ $row['status'] }}
                            @endswitch
                        </span>
                    </td>
                </tr>
            @empty
                <tr>
                    <td colspan="6" class="text-center" style="padding: 16px;">Nenhum registro encontrado.</td>
                </tr>
            @endforelse
        </tbody>
    </table>

</body>
</html>