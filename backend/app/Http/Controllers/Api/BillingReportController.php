<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Report\BillingReportRequest;
use App\Http\Resources\BillingResource;
use App\Services\BillingReportQuery;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class BillingReportController extends Controller
{
    public function __invoke(BillingReportRequest $request, BillingReportQuery $report): AnonymousResourceCollection
    {
        $filters = $request->validated();
        $rows = $report->rows($filters)
            ->orderBy($filters['sort'] ?? 'due_date', $filters['direction'] ?? 'desc')
            ->orderBy('id', 'desc')
            ->paginate($filters['per_page'] ?? 25)
            ->withQueryString();

        return BillingResource::collection($rows)->additional([
            'totals' => $report->totals($filters),
            'filters' => [
                'date_from' => $filters['date_from'],
                'date_to' => $filters['date_to'],
                'period_basis' => $filters['period_basis'],
                'customer_id' => isset($filters['customer_id']) ? (int) $filters['customer_id'] : null,
                'status' => $filters['status'] ?? null,
            ],
        ]);
    }
}
