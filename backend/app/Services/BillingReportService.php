<?php

namespace App\Services;

use App\Models\Billing;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Facades\Response as ResponseFacade;
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
        $totals = ['count' => 0, 'original_total' => 0.0, 'interest_total' => 0.0, 'updated_total' => 0.0, 'received_total' => 0.0, 'pending_total' => 0.0];

        $query->clone()->cursor()->each(function (Billing $billing) use (&$totals): void {
            $status = $billing->derivedStatus();
            $updated = $billing->currentUpdatedAmount();
            $interest = $billing->currentInterestAmount();
            $totals['count']++;
            $totals['original_total'] += (float) $billing->original_amount;
            $totals['interest_total'] += $interest;
            $totals['updated_total'] += $updated;
            if ($status === 'paid') {
                $totals['received_total'] += $updated;
            }
            if (in_array($status, ['pending', 'overdue'], true)) {
                $totals['pending_total'] += $updated;
            }
        });

        return array_map(static fn (int|float $value): int|string => is_float($value) ? number_format($value, 2, '.', '') : $value, $totals);
    }

    public function csv(array $filters): Response
    {
        $filename = 'billing-report-'.now()->format('YmdHis').'.csv';
        $totals = $this->totals($this->query($filters));

        return ResponseFacade::streamDownload(function () use ($filters, $totals): void {
            $output = fopen('php://output', 'w');
            fputcsv($output, ['Billing report']);
            fputcsv($output, ['Period from', $filters['date_from'] ?? '']);
            fputcsv($output, ['Period to', $filters['date_to'] ?? '']);
            fputcsv($output, ['Date field', $filters['date_field'] ?? 'issue_date']);
            fputcsv($output, ['Customer ID', $filters['customer_id'] ?? '']);
            fputcsv($output, ['Status', $filters['status'] ?? '']);
            fputcsv($output, []);
            fputcsv($output, ['Totals']);
            fputcsv($output, ['Count', $totals['count']]);
            fputcsv($output, ['Original total', $totals['original_total']]);
            fputcsv($output, ['Interest total', $totals['interest_total']]);
            fputcsv($output, ['Updated total', $totals['updated_total']]);
            fputcsv($output, ['Received total', $totals['received_total']]);
            fputcsv($output, ['Pending total', $totals['pending_total']]);
            fputcsv($output, []);
            fputcsv($output, ['ID', 'Customer', 'Description', 'Status', 'Issue date', 'Due date', 'Payment date', 'Original amount', 'Interest amount', 'Updated amount', 'Paid amount']);

            $this->query($filters)->orderBy('id')->lazyById(500)->each(function (Billing $billing) use ($output): void {
                fputcsv($output, [
                    $billing->id,
                    $billing->customer?->name,
                    $billing->description,
                    $billing->derivedStatus(),
                    $billing->issue_date->toDateString(),
                    $billing->due_date->toDateString(),
                    $billing->payment_date?->toDateString(),
                    number_format((float) $billing->original_amount, 2, '.', ''),
                    number_format($billing->currentInterestAmount(), 2, '.', ''),
                    number_format($billing->currentUpdatedAmount(), 2, '.', ''),
                    $billing->paid_amount === null ? '' : number_format((float) $billing->paid_amount, 2, '.', ''),
                ]);
            });
            fclose($output);
        }, $filename, ['Content-Type' => 'text/csv; charset=UTF-8']);
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
