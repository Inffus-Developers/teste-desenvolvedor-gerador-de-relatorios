<?php

namespace App\Http\Controllers;

use App\Http\Requests\ReportRequest;
use App\Services\BillingReport;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

class ReportController extends Controller
{
    public function __invoke(ReportRequest $request, BillingReport $report): JsonResponse
    {
        $asOf = today()->toDateString();
        $filters = $request->filters();

        // MySQL REPEATABLE READ: linhas e totais veem o mesmo snapshot da requisição.
        return DB::transaction(function () use ($request, $report, $asOf, $filters) {
            $query = $report->query($filters, $asOf);
            $totals = $report->totals(clone $query);
            $page = $report->order($query, $filters)->cursorPaginate($request->integer('per_page', 20));

            return response()->json(['rows' => $page, 'totals' => $totals, 'as_of' => $asOf]);
        });
    }
}
