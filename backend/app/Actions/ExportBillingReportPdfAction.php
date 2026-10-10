<?php

namespace App\Actions;

use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Database\Eloquent\Builder;
use Symfony\Component\HttpFoundation\Response;

class ExportBillingReportPdfAction
{
    public function __construct(
        private readonly CalculateBillingInterestAction $calculateInterestAction
    ) {}

    public function execute(Builder $query, array $summary): Response
    {
        set_time_limit(180);
        ini_set('memory_limit', '512M');

        $billings = $query
            ->with(['customer:id,name,document'])
            ->select([
                'id',
                'customer_id',
                'description',
                'original_amount',
                'interest_rate',
                'issue_date',
                'due_date',
                'payment_date',
                'status',
            ])
            ->latest('due_date')
            ->limit(1500) // Teto de segurança para PDF síncrono
            ->get();

        $rows = [];
        $now = now();

        foreach ($billings as $billing) {
            $calc = $this->calculateInterestAction->execute($billing);
            $calcArray = is_array($calc) 
                ? $calc 
                : (method_exists($calc, 'toArray') ? $calc->toArray() : (array) $calc);

            $rows[] = [
                'customer_name'   => $billing->customer->name ?? '—',
                'customer_doc'    => $billing->customer->document ?? '',
                'description'     => $billing->description,
                'original_amount' => (float) $billing->original_amount,
                'final_amount'    => (float) ($calcArray['final_amount'] ?? $billing->original_amount),
                'has_interest'    => ($calcArray['is_overdue'] ?? false) && (($calcArray['interest_amount'] ?? 0) > 0),
                'due_date'        => $billing->due_date ? date('d/m/Y', strtotime($billing->due_date)) : '—',
                'status'          => $billing->status,
            ];
        }

        unset($billings);

        Pdf::setOptions([
            'isRemoteEnabled'      => false,
            'isHtml5ParserEnabled' => false, // O parser legado é até 3x mais rápido para tabelas simples
            'isPhpEnabled'          => false,
            'defaultFont'          => 'Helvetica',
            'dpi'                  => 96,
        ]);

        $pdf = Pdf::loadView('reports.billing-pdf', [
            'rows'        => $rows,
            'summary'     => $summary,
            'generatedAt' => $now->format('d/m/Y H:i'),
        ])->setPaper('a4', 'landscape');

        $filename = 'relatorio-faturamento-' . $now->format('Y-m-d') . '.pdf';

        return $pdf->download($filename);
    }
}