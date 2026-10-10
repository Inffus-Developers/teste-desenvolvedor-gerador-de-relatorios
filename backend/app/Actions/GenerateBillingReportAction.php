<?php
namespace App\Actions;

use App\Models\Billing;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;

class GenerateBillingReportAction
{
    public function getFilteredQuery(Request $request): Builder
    {
        $query = Billing::with('customer:id,name,document,email');

        if ($status = $request->input('status')) {
            $query->where('status', $status);
        }

        if ($customerId = $request->input('customer_id')) {
            $query->where('customer_id', $customerId);
        }

        if ($startDate = $request->input('start_date')) {
            $query->whereDate('due_date', '>=', $startDate);
        }

        if ($endDate = $request->input('end_date')) {
            $query->whereDate('due_date', '<=', $endDate);
        }

        return $query;
    }

    public function getSummary(Request $request): array
    {
        $baseQuery = Billing::query();

        if ($status = $request->input('status')) {
            $baseQuery->where('status', $status);
        }

        if ($customerId = $request->input('customer_id')) {
            $baseQuery->where('customer_id', $customerId);
        }

        if ($startDate = $request->input('start_date')) {
            $baseQuery->whereDate('due_date', '>=', $startDate);
        }

        if ($endDate = $request->input('end_date')) {
            $baseQuery->whereDate('due_date', '<=', $endDate);
        }

        // Se o usuário filtrou explicitamente por status (ex: filtrou apenas por "canceled"),
        // o total deve refletir o filtro; caso contrário, exclui as canceladas da carteira ativa.
        $summary = $baseQuery->selectRaw("
            COUNT(CASE WHEN status != 'canceled' THEN 1 END) as valid_count,
            COALESCE(SUM(CASE WHEN status != 'canceled' THEN original_amount ELSE 0 END), 0) as valid_total_amount,
            COALESCE(SUM(CASE WHEN status = 'paid' THEN original_amount ELSE 0 END), 0) as paid_amount,
            COALESCE(SUM(CASE WHEN status = 'pending' THEN original_amount ELSE 0 END), 0) as pending_amount,
            COALESCE(SUM(CASE WHEN status = 'overdue' THEN original_amount ELSE 0 END), 0) as overdue_amount,
            COUNT(CASE WHEN status = 'canceled' THEN 1 END) as canceled_count,
            COALESCE(SUM(CASE WHEN status = 'canceled' THEN original_amount ELSE 0 END), 0) as canceled_amount
        ")->first();

        return [
            'total_count' => (int) $summary->valid_count,
            'total_amount' => (float) $summary->valid_total_amount,
            'paid_amount' => (float) $summary->paid_amount,
            'pending_amount' => (float) $summary->pending_amount,
            'overdue_amount' => (float) $summary->overdue_amount,
            'canceled_count' => (int) $summary->canceled_count,
            'canceled_amount' => (float) $summary->canceled_amount,
        ];
    }
}