<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\BillingRequest;
use App\Http\Requests\PaymentRequest;
use App\Http\Resources\BillingResource;
use App\Models\Billing;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class BillingController extends Controller
{
    public function index(Request $request)
    {
        $validated = $request->validate([
            'customer_id' => ['nullable', 'integer', 'exists:customers,id'],
            'status' => ['nullable', 'in:pending,overdue,paid,cancelled'],
            'sort_by' => ['nullable', 'in:id,issue_date,due_date,payment_date,original_amount,status,created_at'],
            'sort_dir' => ['nullable', 'in:asc,desc'],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:100'],
        ]);
        $query = Billing::query()->with('customer');
        $query->when($validated['customer_id'] ?? null, fn ($query, $id) => $query->where('customer_id', $id));
        if (($validated['status'] ?? null) !== null) {
            $status = $validated['status'];
            if ($status === 'paid') $query->where(fn ($q) => $q->where('status', 'paid')->orWhereNotNull('payment_date'));
            elseif ($status === 'cancelled') $query->where('status', 'cancelled');
            elseif ($status === 'overdue') $query->whereDate('due_date', '<', today())->whereNull('payment_date')->whereNotIn('status', ['paid', 'cancelled']);
            else $query->whereDate('due_date', '>=', today())->whereNull('payment_date')->whereNotIn('status', ['paid', 'cancelled']);
        }

        return BillingResource::collection($query->orderBy($validated['sort_by'] ?? 'due_date', $validated['sort_dir'] ?? 'asc')->paginate($validated['per_page'] ?? 15));
    }

    public function store(BillingRequest $request)
    {
        return BillingResource::make(Billing::create($request->validated())->load('customer'))->response()->setStatusCode(201);
    }

    public function show(Billing $billing): BillingResource { return BillingResource::make($billing->load('customer')); }

    public function update(BillingRequest $request, Billing $billing): BillingResource
    {
        if ($billing->derivedStatus() === 'paid') {
            throw ValidationException::withMessages(['billing' => 'Paid billings cannot be edited.']);
        }
        $billing->update($request->validated());
        return BillingResource::make($billing->refresh()->load('customer'));
    }

    public function destroy(Billing $billing)
    {
        $billing->delete();
        return response()->noContent();
    }

    public function pay(PaymentRequest $request, Billing $billing): BillingResource
    {
        if (in_array($billing->derivedStatus(), ['paid', 'cancelled'], true)) {
            throw ValidationException::withMessages(['billing' => 'Only pending or overdue billings can be paid.']);
        }
        $paymentDate = $request->date('payment_date') ?? today();
        $updatedAmount = $billing->currentUpdatedAmount($paymentDate);
        $billing->update([
            'payment_date' => $paymentDate,
            'paid_amount' => $updatedAmount,
            'interest_amount_at_payment' => round($updatedAmount - (float) $billing->original_amount, 2),
            'status' => 'paid',
        ]);

        return BillingResource::make($billing->refresh()->load('customer'));
    }
}
