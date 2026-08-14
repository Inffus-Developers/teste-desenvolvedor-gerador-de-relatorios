<?php

namespace App\Http\Controllers;

use App\Models\Charge;
use App\Services\SimplePdfReport;
use Carbon\Carbon;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Response;
use Illuminate\Validation\Rule;

class ChargeController extends Controller
{
    public function index(Request $request)
    {
        $query = Charge::query();
        if ($request->filled('status')) $query->where('status', $request->status);
        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(fn (Builder $q) => $q->where('client_name', 'like', "%{$search}%")->orWhere('description', 'like', "%{$search}%"));
        }
        return response()->json($query->orderByDesc('due_date')->paginate($this->perPage($request)));
    }

    public function store(Request $request)
    {
        $data = $this->validateCharge($request);
        if ($data['status'] === 'paga' && empty($data['payment_date'])) $data['payment_date'] = now()->toDateString();
        return response()->json(Charge::create($data), 201);
    }

    public function show(Charge $charge) { return response()->json($charge); }

    public function update(Request $request, Charge $charge)
    {
        $data = $this->validateCharge($request, true);
        if (($data['status'] ?? null) === 'paga' && empty($data['payment_date']) && empty($charge->payment_date)) $data['payment_date'] = now()->toDateString();
        $charge->update($data);
        return response()->json($charge->fresh());
    }

    public function pay(Request $request, Charge $charge)
    {
        $data = $request->validate(['payment_date' => ['nullable', 'date'], 'paid_amount' => ['nullable', 'numeric', 'min:0'], 'paid_interest' => ['nullable', 'numeric', 'min:0']]);
        $data['payment_date'] = $data['payment_date'] ?? Carbon::now()->toDateString();
        $data['paid_amount'] = $data['paid_amount'] ?? $charge->final_amount;
        $data['paid_interest'] = $data['paid_interest'] ?? max($charge->final_amount - $charge->original_amount, 0);
        $data['status'] = 'paga';
        $charge->update($data);
        return response()->json($charge->fresh());
    }

    public function destroy(Charge $charge) { $charge->delete(); return response()->noContent(); }

    public function report(Request $request)
    {
        $filters = $this->validateReportFilters($request);
        $query = $this->reportQuery($filters);
        $items = (clone $query)->orderBy($filters['sort'] ?? $filters['period'], $filters['order'] ?? 'desc')->orderBy('id')->paginate($this->perPage($request));
        return response()->json(['data' => $items->items(), 'pagination' => ['current_page' => $items->currentPage(), 'last_page' => $items->lastPage(), 'per_page' => $items->perPage(), 'total' => $items->total()], 'totals' => $this->reportTotals($query)]);
    }

    public function export(Request $request, string $format)
    {
        $filters = $this->validateReportFilters($request);
        $query = $this->reportQuery($filters)->orderBy('id');
        $filename = 'relatorio-faturamento-' . now()->format('Y-m-d');
        if ($format === 'csv') {
            return Response::streamDownload(function () use ($query, $filters) {
                $output = fopen('php://output', 'w'); fwrite($output, "\xEF\xBB\xBF");
                fputcsv($output, ['Período', $filters['period'], 'Início', $filters['start_date'] ?? '-', 'Fim', $filters['end_date'] ?? '-'], ';');
                fputcsv($output, ['Cliente', 'Descrição', 'Emissão', 'Vencimento', 'Pagamento', 'Status', 'Valor original', 'Juros', 'Valor atualizado', 'Valor pago'], ';');
                foreach ($query->cursor() as $charge) fputcsv($output, $this->exportRow($charge), ';');
                fputcsv($output, [], ';'); fputcsv($output, ['Totalizadores'], ';');
                foreach ($this->reportTotals($this->reportQuery($filters)) as $key => $value) fputcsv($output, [$key, $value], ';');
                fclose($output);
            }, "{$filename}.csv", ['Content-Type' => 'text/csv; charset=UTF-8']);
        }
        $pdf = app(SimplePdfReport::class)->render($query->cursor(), $this->reportTotals($this->reportQuery($filters)), $filters);
        return response($pdf, 200, ['Content-Type' => 'application/pdf', 'Content-Disposition' => "attachment; filename=\"{$filename}.pdf\""]);
    }

    private function validateCharge(Request $request, bool $partial = false): array
    {
        $required = $partial ? 'sometimes|required' : 'required';
        return $request->validate(['client_name' => [$required, 'string', 'max:255'], 'description' => [$required, 'string'], 'original_amount' => [$required, 'numeric', 'min:0.01'], 'issue_date' => [$required, 'date'], 'due_date' => [$required, 'date', 'after_or_equal:issue_date'], 'payment_date' => ['nullable', 'date', 'after_or_equal:issue_date'], 'status' => [$required, Rule::in(['pendente', 'paga', 'atrasada', 'cancelada'])], 'interest_rate' => [$required, 'numeric', 'min:0', 'max:100'], 'paid_amount' => ['nullable', 'numeric', 'min:0'], 'paid_interest' => ['nullable', 'numeric', 'min:0']]);
    }

    private function validateReportFilters(Request $request): array
    {
        return $request->validate(['start_date' => ['nullable', 'date'], 'end_date' => ['nullable', 'date', 'after_or_equal:start_date'], 'client' => ['nullable', 'string', 'max:255'], 'status' => ['nullable', Rule::in(['pendente', 'paga', 'atrasada', 'cancelada'])], 'period' => ['nullable', Rule::in(['issue_date', 'due_date', 'payment_date'])], 'sort' => ['nullable', Rule::in(['client_name', 'description', 'issue_date', 'due_date', 'payment_date', 'status', 'original_amount'])], 'order' => ['nullable', Rule::in(['asc', 'desc'])]]) + ['period' => 'issue_date'];
    }

    private function reportQuery(array $filters): Builder
    {
        $query = Charge::query(); $period = $filters['period'];
        if (!empty($filters['status'])) $query->where('status', $filters['status']);
        if (!empty($filters['client'])) $query->where('client_name', 'like', "%{$filters['client']}%");
        if (!empty($filters['start_date'])) $query->where($period, '>=', $filters['start_date']);
        if (!empty($filters['end_date'])) $query->where($period, '<=', $filters['end_date']);
        return $query;
    }

    private function reportTotals(Builder $query): array
    {
        $totals = ['count' => 0, 'total_original' => 0.0, 'total_interest' => 0.0, 'total_updated' => 0.0, 'total_received' => 0.0, 'total_pending' => 0.0];
        foreach ($query->cursor() as $charge) { $totals['count']++; $totals['total_original'] += (float) $charge->original_amount; $totals['total_interest'] += $charge->interest_amount; $totals['total_updated'] += $charge->final_amount; $totals['total_received'] += (float) ($charge->paid_amount ?? 0); $totals['total_pending'] += $charge->status === 'paga' ? 0 : $charge->final_amount; }
        return array_map(fn ($value) => is_float($value) ? round($value, 2) : $value, $totals);
    }

    private function exportRow(Charge $charge): array { return [$charge->client_name, $charge->description, $charge->issue_date?->format('Y-m-d'), $charge->due_date?->format('Y-m-d'), $charge->payment_date?->format('Y-m-d'), $charge->status, $charge->original_amount, $charge->interest_amount, $charge->final_amount, $charge->paid_amount ?? 0]; }
    private function perPage(Request $request): int { return min(100, max(1, (int) $request->input('per_page', 15))); }
}
