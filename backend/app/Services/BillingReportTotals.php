<?php

namespace App\Services;

use Carbon\CarbonInterface;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Facades\DB;

class BillingReportTotals
{
    public function aggregate(Builder $query, ?CarbonInterface $asOf = null): array
    {
        $asOfDate = ($asOf ?? now())->copy()->startOfDay()->toDateString();
        $driver = $query->getConnection()->getDriverName();

        $daysOverdue = $this->daysOverdueSql($driver, $asOfDate);
        $updatedAmount = $this->updatedAmountSql($driver, $daysOverdue);
        $interestAmount = $this->interestAmountSql($updatedAmount);
        $isPaid = "(payment_date IS NOT NULL OR status = 'paid')";
        $isOpen = "(payment_date IS NULL AND status NOT IN ('paid', 'cancelled'))";

        $row = DB::query()
            ->fromSub($query->clone()->select('billings.*'), 'report_billings')
            ->selectRaw('COUNT(*) as count')
            ->selectRaw('SUM(CAST(original_amount AS REAL)) as original_total')
            ->selectRaw("SUM({$interestAmount}) as interest_total")
            ->selectRaw("SUM({$updatedAmount}) as updated_total")
            ->selectRaw("SUM(CASE WHEN {$isPaid} THEN {$updatedAmount} ELSE 0 END) as received_total")
            ->selectRaw("SUM(CASE WHEN {$isOpen} THEN {$updatedAmount} ELSE 0 END) as pending_total")
            ->first();

        return [
            'count' => (int) ($row->count ?? 0),
            'original_total' => number_format((float) ($row->original_total ?? 0), 2, '.', ''),
            'interest_total' => number_format((float) ($row->interest_total ?? 0), 2, '.', ''),
            'updated_total' => number_format((float) ($row->updated_total ?? 0), 2, '.', ''),
            'received_total' => number_format((float) ($row->received_total ?? 0), 2, '.', ''),
            'pending_total' => number_format((float) ($row->pending_total ?? 0), 2, '.', ''),
        ];
    }

    private function daysOverdueSql(string $driver, string $asOfDate): string
    {
        if ($driver === 'sqlite') {
            return "MAX(0, CAST((julianday(date('{$asOfDate}')) - julianday(date(due_date))) AS INTEGER))";
        }

        return "GREATEST(0, DATEDIFF(DATE('{$asOfDate}'), DATE(due_date)))";
    }

    private function updatedAmountSql(string $driver, string $daysOverdue): string
    {
        $original = 'CAST(original_amount AS REAL)';
        $rate = 'CAST(monthly_interest_rate AS REAL)';
        $compound = $driver === 'sqlite'
            ? "ROUND({$original} * POWER(1 + {$rate}, CAST({$daysOverdue} AS REAL) / 30.0), 2)"
            : "ROUND({$original} * POW(1 + {$rate}, {$daysOverdue} / 30), 2)";

        return "CASE
            WHEN payment_date IS NOT NULL OR status = 'paid' THEN CAST(paid_amount AS REAL)
            WHEN {$daysOverdue} <= 0 OR {$rate} <= 0 THEN {$original}
            ELSE {$compound}
        END";
    }

    private function interestAmountSql(string $updatedAmount): string
    {
        $original = 'CAST(original_amount AS REAL)';

        return "CASE
            WHEN payment_date IS NOT NULL OR status = 'paid' THEN CAST(COALESCE(interest_amount_at_payment, 0) AS REAL)
            ELSE ROUND({$updatedAmount} - {$original}, 2)
        END";
    }
}
