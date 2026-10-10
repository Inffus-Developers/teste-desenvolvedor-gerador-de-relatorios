<?php

namespace App\Http\Controllers\Api;

use App\Actions\CalculateBillingInterestAction;
use App\Actions\ExportBillingReportCsvAction;
use App\Actions\ExportBillingReportPdfAction;
use App\Actions\GenerateBillingReportAction;
use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;

class ReportController extends Controller
{
    public function __construct(
        private readonly GenerateBillingReportAction $reportAction,
        private readonly CalculateBillingInterestAction $calculateInterestAction,
        private readonly ExportBillingReportCsvAction $exportCsvAction,
        private readonly ExportBillingReportPdfAction $exportPdfAction
    ) {}

    public function index(Request $request): JsonResponse
    {
        $query = $this->reportAction->getFilteredQuery($request);
        $summary = $this->reportAction->getSummary($request);

        $perPage = (int) $request->input('per_page', 15);
        $paginated = $query->latest('due_date')->paginate($perPage);

        // Anexa os juros compostos calculados em tempo real
        $paginated->getCollection()->transform(function ($billing) {
            $billing->calculation = $this->calculateInterestAction->execute($billing)->toArray();
            return $billing;
        });

        return response()->json([
            'summary' => $summary,
            'report' => $paginated,
        ]);
    }

    public function exportCsv(Request $request): StreamedResponse
    {
        $query = $this->reportAction->getFilteredQuery($request);
        return $this->exportCsvAction->execute($query);
    }

    public function exportPdf(Request $request): Response
    {
        $query = $this->reportAction->getFilteredQuery($request);
        $summary = $this->reportAction->getSummary($request);

        return $this->exportPdfAction->execute($query, $summary);
    }
}