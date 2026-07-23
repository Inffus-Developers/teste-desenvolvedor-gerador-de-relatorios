<?php

namespace App\Services;

use App\Models\Billing;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\HttpFoundation\Response;

class BillingReportService
{
    private const SORTABLE_COLUMNS = ['id', 'original_amount', 'issue_date', 'due_date', 'payment_date', 'status', 'created_at'];

    public function query(array $filters): Builder
    {
        $dateField = $filters['date_field'] ?? 'issue_date';
        $query = Billing::query()->with('customer');

        if (! empty($filters['date_from'])) {
            $query->whereDate($dateField, '>=', $filters['date_from']);
        }
        if (! empty($filters['date_to'])) {
            $query->whereDate($dateField, '<=', $filters['date_to']);
        }
        if (! empty($filters['customer_id'])) {
            $query->where('customer_id', $filters['customer_id']);
        }
        if (! empty($filters['status'])) {
            $this->applyStatus($query, $filters['status']);
        }

        return $query;
    }

    public function paginate(array $filters)
    {
        $sortBy = in_array($filters['sort_by'] ?? '', self::SORTABLE_COLUMNS, true) ? $filters['sort_by'] : 'due_date';
        $sortDir = ($filters['sort_dir'] ?? 'asc') === 'desc' ? 'desc' : 'asc';

        return $this->query($filters)->orderBy($sortBy, $sortDir)->paginate(min((int) ($filters['per_page'] ?? 15), 100));
    }

    public function totals(Builder $query): array
    {
        return app(BillingReportTotals::class)->aggregate($query);
    }

    public function csv(array $filters): Response
    {
        return app(BillingCsvExporter::class)->download($filters);
    }

    public function pdf(array $filters): Response
    {
        // DomPDF renders a complete HTML document in memory; reports are capped to bound memory usage.
        $rows = $this->query($filters)->orderBy('id')->limit(2000)->get();
        $isTruncated = $this->query($filters)->count() > 2000;

        return Pdf::loadView('reports.billing-pdf', [
            'rows' => $rows,
            'filters' => $filters,
            'totals' => $this->totals($this->query($filters)),
            'isTruncated' => $isTruncated,
        ])->setPaper('a4', 'landscape')->download('billing-report-'.now()->format('YmdHis').'.pdf')
            ->header('X-Report-Row-Limit', '2000');
    }

    public function pdfToDisk(array $filters, string $path): int
    {
        $totalCount = $this->query($filters)->count();
        $rows = $this->query($filters)->orderBy('id')->limit(2000)->get();
        $isTruncated = $totalCount > 2000;

        Storage::disk('local')->makeDirectory(dirname($path));

        $pdf = Pdf::loadView('reports.billing-pdf', [
            'rows' => $rows,
            'filters' => $filters,
            'totals' => $this->totals($this->query($filters)),
            'isTruncated' => $isTruncated,
        ])->setPaper('a4', 'landscape')->output();

        Storage::disk('local')->put($path, $pdf);

        return $rows->count();
    }

    private function applyStatus(Builder $query, string $status): void
    {
        match ($status) {
            'paid' => $query->where(fn (Builder $query) => $query->where('status', 'paid')->orWhereNotNull('payment_date')),
            'cancelled' => $query->where('status', 'cancelled'),
            'overdue' => $query->whereNotNull('due_date')->whereDate('due_date', '<', today())->whereNull('payment_date')->whereNotIn('status', ['paid', 'cancelled']),
            'pending' => $query->whereDate('due_date', '>=', today())->whereNull('payment_date')->whereNotIn('status', ['paid', 'cancelled']),
        };
    }
}
