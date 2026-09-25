<!doctype html>
<html lang="pt-BR"><head><meta charset="utf-8"><style>
@page { margin: 24px; } body { font-family: 'DejaVu Sans', sans-serif; color: #182c28; font-size: 8px; }
h1 { font-size: 21px; margin-bottom: 4px; } .meta { color: #536a63; margin: 5px 0 14px; }
table { width: 100%; border-collapse: collapse; table-layout: fixed; } th { background: #e8f3ee; text-align: left; padding: 7px 4px; }
td { padding: 6px 4px; border-bottom: 1px solid #e6e9e7; word-wrap: break-word; } tr { page-break-inside: avoid; }
.totals { background: #f3f6f4; padding: 10px; margin: 14px 0; } .number { text-align: right; white-space: nowrap; }
</style></head><body>
<h1>clara. / Relatório de faturamento</h1>
<div class="meta">Parte {{ $part }} · Cálculo em {{ $export->as_of }} · Valores em BRL</div>
<p>Período: {{ $export->filters['start_date'] ?? 'Sem início' }} a {{ $export->filters['end_date'] ?? 'Sem fim' }}.
Base: {{ ['issued_at' => 'Emissão', 'due_at' => 'Vencimento', 'paid_at' => 'Pagamento'][$export->filters['date_field'] ?? 'issued_at'] }} · Cliente: {{ $export->filters['customer_id'] ?? 'Todos' }} · Status: {{ ['paid' => 'Paga', 'pending' => 'Pendente', 'overdue' => 'Vencida'][$export->filters['status'] ?? ''] ?? 'Todos' }}.
Ordem: {{ ['id' => 'Identificador', 'issued_at' => 'Emissão', 'due_at' => 'Vencimento', 'original_amount' => 'Valor original'][$export->filters['sort'] ?? 'due_at'] }} / {{ ($export->filters['direction'] ?? 'asc') === 'asc' ? 'Crescente' : 'Decrescente' }}.</p>
<div class="totals"><strong>Totais globais do relatório (todas as partes)</strong><br>
Quantidade: {{ $export->totals['count'] }} · Original: {{ \App\Support\Amount::format($export->totals['original_amount']) }} ·
Juros: {{ \App\Support\Amount::format($export->totals['interest']) }} · Atualizado: {{ \App\Support\Amount::format($export->totals['updated_amount']) }} ·
Recebido: {{ \App\Support\Amount::format($export->totals['received_amount']) }} · Pendente: {{ \App\Support\Amount::format($export->totals['pending_amount']) }}
</div>
<table><thead><tr><th style="width:28%">Cliente / descrição</th><th style="width:8%">Emissão</th><th style="width:8%">Vencimento</th><th style="width:8%">Pagamento</th><th style="width:7%">Status</th><th style="width:10%">Original</th><th style="width:9%">Juros</th><th style="width:12%">Atualizado</th><th style="width:10%">Pago</th></tr></thead><tbody>
@forelse ($rows as $row)
<tr><td style="width:28%"><strong>{{ $row->customer_name }}</strong><br>#{{ $row->charge_id }} · {{ $row->description }}</td>
<td style="width:8%">{{ $row->issued_at }}</td><td style="width:8%">{{ $row->due_at }}</td><td style="width:8%">{{ $row->paid_at ?? '—' }}</td><td style="width:7%">{{ ['paid' => 'Paga', 'pending' => 'Pendente', 'overdue' => 'Vencida'][$row->status] }}</td>
@foreach (['original_amount' => 10, 'interest' => 9, 'updated_amount' => 12, 'paid_amount' => 10] as $field => $width)<td style="width:{{ $width }}%" class="number">{{ \App\Support\Amount::format($row->$field) }}</td>@endforeach</tr>
@empty<tr><td colspan="9">Nenhuma cobrança encontrada para os filtros selecionados.</td></tr>@endforelse
</tbody></table><p class="meta">Juros simples: valor original × taxa mensal (%) × dias em atraso ÷ 3000. Cobranças pagas mantêm os juros registrados no pagamento.</p>
</body></html>
