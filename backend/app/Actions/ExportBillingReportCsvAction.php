<?php

namespace App\Actions;

use App\Models\Billing;
use Carbon\Carbon;
use Illuminate\Database\Eloquent\Builder;
use Symfony\Component\HttpFoundation\StreamedResponse;

class ExportBillingReportCsvAction
{
    private const STATUS_TRANSLATIONS = [
        'pending'  => 'Pendente',
        'paid'     => 'Pago',
        'overdue'  => 'Vencido',
        'canceled' => 'Cancelado',
    ];

    public function __construct(
        private readonly CalculateBillingInterestAction $calculateInterestAction
    ) {}

    public function execute(Builder $query): StreamedResponse
    {
        $fileName = 'relatorio_faturamento_' . date('Y-m-d_His') . '.csv';

        $headers = [
            'Content-Type' => 'text/csv; charset=UTF-8',
            'Content-Disposition' => "attachment; filename=\"{$fileName}\"",
            'Pragma' => 'no-cache',
            'Cache-Control' => 'must-revalidate, post-check=0, pre-check=0',
            'Expires' => '0',
        ];

        return response()->stream(function () use ($query) {
            $handle = fopen('php://output', 'w');

            // BOM UTF-8 para o Excel reconhecer acentuação e caracteres em português
            fprintf($handle, chr(0xEF) . chr(0xBB) . chr(0xBF));

            // Cabeçalho amigável
            fputcsv($handle, [
                'ID Cobrança',
                'Cliente',
                'Documento',
                'Descrição',
                'Valor Original (R$)',
                'Juros Mensal (%)',
                'Valor Atualizado (R$)',
                'Dias em Atraso',
                'Data Emissão',
                'Data Vencimento',
                'Data Pagamento',
                'Status',
            ], ';');

            foreach ($query->lazy(500) as $billing) {
                $calc = $this->calculateInterestAction->execute($billing);

                $statusLabel = self::STATUS_TRANSLATIONS[$billing->status] ?? ucfirst($billing->status);

                $issueDate = $billing->issue_date 
                    ? Carbon::parse($billing->issue_date)->format('d/m/Y') 
                    : '—';

                $dueDate = $billing->due_date 
                    ? Carbon::parse($billing->due_date)->format('d/m/Y') 
                    : '—';

                $paymentDate = $billing->payment_date 
                    ? Carbon::parse($billing->payment_date)->format('d/m/Y') 
                    : 'Em aberto';

                fputcsv($handle, [
                    $billing->id,
                    $billing->customer?->name ?? 'N/D',
                    $billing->customer?->document ?? 'N/D',
                    $billing->description,
                    number_format((float) $billing->original_amount, 2, ',', '.'),
                    number_format((float) $billing->interest_rate, 2, ',', '.') . '%',
                    number_format($calc->finalAmount, 2, ',', '.'),
                    $calc->daysOverdue,
                    $issueDate,
                    $dueDate,
                    $paymentDate,
                    $statusLabel,
                ], ';');
            }

            fclose($handle);
        }, 200, $headers);
    }
}