<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\BillingReportRequest;
use App\Http\Resources\BillingResource;
use App\Services\BillingReportService;
use Illuminate\Http\JsonResponse;
use Symfony\Component\HttpFoundation\Response;

class ReportController extends Controller
{
    public function index(BillingReportRequest $request, BillingReportService $reports): JsonResponse
    {
        $filters = $request->validated();
        $paginator = $reports->paginate($filters);

        return BillingResource::collection($paginator)->additional([
            'totals' => $reports->totals($reports->query($filters)),
            'filters' => $filters,
        ])->response();
    }

    public function csv(BillingReportRequest $request, BillingReportService $reports): Response
    {
        return $reports->csv($request->validated());
    }

    public function pdf(BillingReportRequest $request, BillingReportService $reports): Response
    {
        return $reports->pdf($request->validated());
    }
}
