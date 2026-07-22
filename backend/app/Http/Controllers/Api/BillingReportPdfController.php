<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Report\BillingReportRequest;
use App\Models\Customer;
use App\Services\BillingInterestCalculator;
use App\Services\BillingReportQuery;
use Dompdf\Dompdf;
use Dompdf\Options;
use Illuminate\Http\Response;
use Illuminate\Validation\ValidationException;

class BillingReportPdfController extends Controller
{
    public function __invoke(
        BillingReportRequest $request,
        BillingReportQuery $report,
        BillingInterestCalculator $calculator,
    ): Response {
        $filters = $request->validated();
        $totals = $report->totals($filters);
        $maxRows = config('reports.pdf_max_rows');

        if ($totals['count'] > $maxRows) {
            throw ValidationException::withMessages([
                'export' => ["O PDF aceita até {$maxRows} registros. Use CSV para volumes maiores."],
            ]);
        }

        $rows = $report->orderedRows($filters)->get()->map(function ($billing) use ($calculator) {
            return [
                'billing' => $billing,
                'calculation' => $calculator->calculate($billing),
            ];
        });

        $html = view('reports.billing-pdf', [
            'filters' => $filters,
            'customerName' => isset($filters['customer_id'])
                ? Customer::query()->whereKey($filters['customer_id'])->value('name')
                : 'Todos',
            'totals' => $totals,
            'rows' => $rows,
            'generatedAt' => now(),
        ])->render();

        $options = new Options;
        $options->set('defaultFont', 'DejaVu Sans');
        $options->set('isRemoteEnabled', false);
        $dompdf = new Dompdf($options);
        $dompdf->loadHtml($html, 'UTF-8');
        $dompdf->setPaper('A4', 'landscape');
        $dompdf->render();

        $filename = "faturamento-{$filters['date_from']}-a-{$filters['date_to']}.pdf";

        return response($dompdf->output(), 200, [
            'Content-Type' => 'application/pdf',
            'Content-Disposition' => "attachment; filename=\"{$filename}\"",
        ]);
    }
}
