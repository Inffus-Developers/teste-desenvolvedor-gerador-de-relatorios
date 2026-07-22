<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Report\BillingReportRequest;
use App\Services\BillingInterestCalculator;
use App\Services\BillingReportQuery;
use Symfony\Component\HttpFoundation\StreamedResponse;

class BillingReportCsvController extends Controller
{
    public function __invoke(
        BillingReportRequest $request,
        BillingReportQuery $report,
        BillingInterestCalculator $calculator,
    ): StreamedResponse {
        $filters = $request->validated();
        $totals = $report->totals($filters);
        $filename = "faturamento-{$filters['date_from']}-a-{$filters['date_to']}.csv";

        return response()->streamDownload(function () use ($filters, $report, $calculator, $totals) {
            $stream = fopen('php://output', 'wb');
            fwrite($stream, "\xEF\xBB\xBF");

            $this->writeRow($stream, ['Relatório de faturamento']);
            $this->writeRow($stream, ['Período', $filters['date_from'], $filters['date_to']]);
            $this->writeRow($stream, ['Base do período', $filters['period_basis']]);
            $this->writeRow($stream, ['Cliente', $filters['customer_id'] ?? 'Todos']);
            $this->writeRow($stream, ['Status', $filters['status'] ?? 'Todos']);
            $this->writeRow($stream, []);
            $this->writeRow($stream, ['Quantidade', 'Valor original total', 'Total de juros', 'Valor atualizado total', 'Total recebido', 'Total pendente']);
            $this->writeRow($stream, [$totals['count'], $totals['original_total'], $totals['interest_total'], $totals['updated_total'], $totals['received_total'], $totals['pending_total']]);
            $this->writeRow($stream, []);
            $this->writeRow($stream, ['Cliente', 'Descrição', 'Emissão', 'Vencimento', 'Pagamento', 'Status', 'Valor original', 'Juros', 'Valor atualizado', 'Valor pago']);

            foreach ($report->orderedRows($filters)->lazy(config('reports.csv_chunk_size')) as $billing) {
                $calculation = $calculator->calculate($billing);
                $this->writeRow($stream, [
                    $billing->customer->name,
                    $billing->description,
                    $billing->issue_date->toDateString(),
                    $billing->due_date->toDateString(),
                    $billing->payment_date?->toDateString(),
                    $calculation['display_status'],
                    $billing->original_amount,
                    number_format($calculation['interest_amount'], 2, '.', ''),
                    number_format($calculation['updated_amount'], 2, '.', ''),
                    $billing->paid_amount,
                ]);
            }

            fclose($stream);
        }, $filename, ['Content-Type' => 'text/csv; charset=UTF-8']);
    }

    /** @param resource $stream */
    private function writeRow($stream, array $fields): void
    {
        fputcsv($stream, $fields, ';', '"', '');
    }
}
