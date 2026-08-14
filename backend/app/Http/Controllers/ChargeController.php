<?php

namespace App\Http\Controllers;

use App\Models\Charge;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class ChargeController extends Controller
{
    public function index(Request $request)
    {
        $query = Charge::query();

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('client_name', 'like', "%{$search}%")
                    ->orWhere('description', 'like', "%{$search}%");
            });
        }

        $perPage = (int) $request->input('per_page', 15);

        return response()->json($query->orderByDesc('due_date')->paginate($perPage));
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'client_name' => 'required|string|max:255',
            'description' => 'required|string',
            'original_amount' => 'required|numeric|min:0.01',
            'issue_date' => 'required|date',
            'due_date' => ['required', 'date', 'after_or_equal:issue_date'],
            'payment_date' => 'nullable|date|after_or_equal:issue_date',
            'status' => ['required', Rule::in(['pendente', 'paga', 'atrasada', 'cancelada'])],
            'interest_rate' => 'required|numeric|min:0|max:100',
            'paid_amount' => 'nullable|numeric|min:0',
            'paid_interest' => 'nullable|numeric|min:0',
        ]);

        if (($data['status'] ?? 'pendente') === 'paga' && empty($data['payment_date'])) {
            $data['payment_date'] = now()->toDateString();
        }

        $charge = Charge::create($data);

        return response()->json($charge, 201);
    }

    public function show(Charge $charge)
    {
        return response()->json($charge->loadMissing('client'));
    }

    public function update(Request $request, Charge $charge)
    {
        $data = $request->validate([
            'client_name' => 'sometimes|required|string|max:255',
            'description' => 'sometimes|required|string',
            'original_amount' => 'sometimes|required|numeric|min:0.01',
            'issue_date' => 'sometimes|required|date',
            'due_date' => ['sometimes', 'required', 'date', 'after_or_equal:issue_date'],
            'payment_date' => 'nullable|date|after_or_equal:issue_date',
            'status' => ['sometimes', 'required', Rule::in(['pendente', 'paga', 'atrasada', 'cancelada'])],
            'interest_rate' => 'sometimes|required|numeric|min:0|max:100',
            'paid_amount' => 'nullable|numeric|min:0',
            'paid_interest' => 'nullable|numeric|min:0',
        ]);

        if (isset($data['status']) && $data['status'] === 'paga' && empty($data['payment_date']) && empty($charge->payment_date)) {
            $data['payment_date'] = now()->toDateString();
        }

        $charge->update($data);

        return response()->json($charge);
    }

    public function pay(Request $request, Charge $charge)
    {
        $data = $request->validate([
            'payment_date' => 'nullable|date',
            'paid_amount' => 'nullable|numeric|min:0',
            'paid_interest' => 'nullable|numeric|min:0',
        ]);

        $data['payment_date'] = $data['payment_date'] ?? Carbon::now()->toDateString();
        $data['paid_amount'] = $data['paid_amount'] ?? $charge->final_amount;
        $data['paid_interest'] = $data['paid_interest'] ?? max($charge->final_amount - $charge->original_amount, 0);
        $data['status'] = 'paga';

        $charge->update($data);

        return response()->json($charge);
    }

    public function destroy(Charge $charge)
    {
        $charge->delete();

        return response()->json(null, 204);
    }

    public function report(Request $request)
    {
        $charges = Charge::query();

        if ($request->filled('status')) {
            $charges->where('status', $request->status);
        }

        if ($request->filled('client')) {
            $charges->where('client_name', 'like', "%{$request->client}%");
        }

        $period = $request->input('period', 'issue_date');
        $allowedPeriods = ['issue_date', 'due_date', 'payment_date'];

        if (! in_array($period, $allowedPeriods, true)) {
            $period = 'issue_date';
        }

        if ($request->filled('start_date')) {
            $charges->whereDate($period, '>=', $request->start_date);
        }

        if ($request->filled('end_date')) {
            $charges->whereDate($period, '<=', $request->end_date);
        }

        $page = $request->input('page', 1);
        $perPage = $request->input('per_page', 15);
        $items = $charges->orderByDesc($period)->paginate($perPage, ['*'], 'page', $page);

        $totals = [
            'count' => (int) $items->total(),
            'total_original' => (float) (float) $items->sum('original_amount'),
            'total_interest' => (float) $items->sum(function ($charge) {
                return (float) ($charge->interest_amount ?? 0);
            }),
            'total_updated' => (float) $items->sum(function ($charge) {
                return (float) ($charge->final_amount ?? $charge->original_amount);
            }),
            'total_received' => (float) $items->sum('paid_amount'),
            'total_pending' => (float) $items->sum(function ($charge) {
                return $charge->status === 'paga' ? 0 : (float) ($charge->final_amount ?? $charge->original_amount);
            }),
        ];

        return response()->json([
            'data' => $items->items(),
            'pagination' => [
                'current_page' => $items->currentPage(),
                'last_page' => $items->lastPage(),
                'per_page' => $items->perPage(),
                'total' => $items->total(),
            ],
            'totals' => $totals,
        ]);
    }
}
