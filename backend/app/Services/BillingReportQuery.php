<?php

namespace App\Services;

use App\Enums\BillingStatus;
use App\Models\Billing;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Facades\DB;

class BillingReportQuery
{
    /** @param array<string, mixed> $filters */
    public function rows(array $filters): Builder
    {
        $today = now()->toDateString();

        return Billing::query()
            ->with('customer:id,name')
            ->when(
                DB::connection()->getDriverName() === 'sqlite',
                fn (Builder $query) => $query
                    ->whereDate($filters['period_basis'], '>=', $filters['date_from'])
                    ->whereDate($filters['period_basis'], '<=', $filters['date_to']),
                fn (Builder $query) => $query->whereBetween($filters['period_basis'], [$filters['date_from'], $filters['date_to']]),
            )
            ->when($filters['customer_id'] ?? null, fn (Builder $query, int $customerId) => $query->where('customer_id', $customerId))
            ->when($filters['status'] ?? null, function (Builder $query, string $status) use ($today) {
                match ($status) {
                    'paid' => $query->where('status', BillingStatus::Paid->value),
                    'overdue' => $query->where('status', BillingStatus::Pending->value)->whereDate('due_date', '<', $today),
                    'pending' => $query->where('status', BillingStatus::Pending->value)->whereDate('due_date', '>=', $today),
                };
            });
    }

    /** @param array<string, mixed> $filters */
    public function orderedRows(array $filters): Builder
    {
        return $this->rows($filters)
            ->orderBy($filters['sort'] ?? 'due_date', $filters['direction'] ?? 'desc')
            ->orderBy('id', 'desc');
    }

    /**
     * @param  array<string, mixed>  $filters
     * @return array{count: int, original_total: float, interest_total: float, updated_total: float, received_total: float, pending_total: float}
     */
    public function totals(array $filters): array
    {
        [$interestExpression, $bindings] = $this->interestExpression();

        $calculatedRows = $this->rows($filters)
            ->withoutEagerLoads()
            ->select(['original_amount', 'paid_amount', 'status'])
            ->selectRaw("{$interestExpression} as calculated_interest", $bindings);

        $totals = DB::query()
            ->fromSub($calculatedRows, 'report_rows')
            ->selectRaw('COUNT(*) as aggregate_count')
            ->selectRaw('COALESCE(SUM(original_amount), 0) as original_total')
            ->selectRaw('COALESCE(SUM(calculated_interest), 0) as interest_total')
            ->selectRaw('COALESCE(SUM(original_amount + calculated_interest), 0) as updated_total')
            ->selectRaw('COALESCE(SUM(CASE WHEN status = ? THEN paid_amount ELSE 0 END), 0) as received_total', [BillingStatus::Paid->value])
            ->selectRaw('COALESCE(SUM(CASE WHEN status != ? THEN original_amount + calculated_interest ELSE 0 END), 0) as pending_total', [BillingStatus::Paid->value])
            ->first();

        return [
            'count' => (int) $totals->aggregate_count,
            'original_total' => round((float) $totals->original_total, 2),
            'interest_total' => round((float) $totals->interest_total, 2),
            'updated_total' => round((float) $totals->updated_total, 2),
            'received_total' => round((float) $totals->received_total, 2),
            'pending_total' => round((float) $totals->pending_total, 2),
        ];
    }

    /** @return array{string, list<string>} */
    private function interestExpression(): array
    {
        $today = now()->toDateString();
        $driver = DB::connection()->getDriverName();
        $daysExpression = $driver === 'sqlite'
            ? 'CAST(julianday(?) - julianday(due_date) AS INTEGER)'
            : 'DATEDIFF(?, due_date)';

        $expression = <<<SQL
            CASE
                WHEN status = 'paid' THEN COALESCE(interest_paid, 0)
                WHEN due_date < ? THEN ROUND(original_amount * (POWER(1 + (monthly_interest_rate / 100.0), ({$daysExpression} / 30.0)) - 1), 2)
                ELSE 0
            END
            SQL;

        return [$expression, [$today, $today]];
    }
}
