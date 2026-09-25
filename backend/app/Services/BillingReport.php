<?php

namespace App\Services;

use Illuminate\Database\Query\Builder;
use Illuminate\Support\Facades\DB;

final class BillingReport
{
    public function __construct(private InterestCalculator $interest) {}

    public function query(array $filters, string $asOf): Builder
    {
        $interest = $this->interest->sql(DB::connection()->getDriverName());
        $query = DB::table('charges')->join('customers', 'customers.id', '=', 'charges.customer_id')
            ->select(['charges.id', 'charges.customer_id', 'customers.name as customer_name', 'charges.description',
                'charges.issued_at', 'charges.due_at', 'charges.paid_at', 'charges.original_amount', 'charges.monthly_interest_rate'])
            ->selectRaw("CASE WHEN charges.paid_at IS NOT NULL THEN 'paid' WHEN charges.due_at < ? THEN 'overdue' ELSE 'pending' END as status", [$asOf])
            ->selectRaw("$interest as interest", [$asOf])
            ->selectRaw("charges.original_amount + ($interest) as updated_amount", [$asOf])
            ->selectRaw('COALESCE(charges.paid_amount, 0) as paid_amount');
        if (! empty($filters['start_date'])) {
            $query->whereBetween('charges.'.($filters['date_field'] ?? 'issued_at'), [$filters['start_date'], $filters['end_date']]);
        }
        if (! empty($filters['customer_id'])) {
            $query->where('charges.customer_id', $filters['customer_id']);
        }
        match ($filters['status'] ?? null) {
            'paid' => $query->whereNotNull('charges.paid_at'),
            'pending' => $query->whereNull('charges.paid_at')->where('charges.due_at', '>=', $asOf),
            'overdue' => $query->whereNull('charges.paid_at')->where('charges.due_at', '<', $asOf),
            default => null,
        };

        return $query;
    }

    public function order(Builder $query, array $filters, string $prefix = 'charges.', string $id = 'id'): Builder
    {
        $sort = $filters['sort'] ?? 'due_at';
        $direction = $filters['direction'] ?? 'asc';
        $query->orderBy($prefix.($sort === 'id' ? $id : $sort), $direction);
        if ($sort !== 'id') {
            $query->orderBy($prefix.$id, $direction);
        }

        return $query;
    }

    public function totals(Builder $rows): array
    {
        return (array) DB::query()->fromSub($rows, 'report')->selectRaw(
            "COUNT(*) as count, COALESCE(SUM(original_amount),0) as original_amount,
            COALESCE(SUM(interest),0) as interest, COALESCE(SUM(updated_amount),0) as updated_amount,
            COALESCE(SUM(paid_amount),0) as received_amount,
            COALESCE(SUM(CASE WHEN status != 'paid' THEN updated_amount ELSE 0 END),0) as pending_amount"
        )->first();
    }
}
