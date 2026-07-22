<?php

namespace App\Http\Controllers\Api;

use App\Enums\BillingStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\Billing\PayBillingRequest;
use App\Http\Requests\Billing\StoreBillingRequest;
use App\Http\Requests\Billing\UpdateBillingRequest;
use App\Http\Resources\BillingResource;
use App\Models\Billing;
use App\Services\BillingInterestCalculator;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class BillingController extends Controller
{
    private const SORTABLE_COLUMNS = ['issue_date', 'due_date', 'original_amount', 'status', 'created_at'];

    public function index(Request $request): AnonymousResourceCollection
    {
        $validated = $request->validate([
            'search' => ['nullable', 'string', 'max:255'],
            'customer_id' => ['nullable', 'integer', 'exists:customers,id'],
            'status' => ['nullable', 'string', 'in:pending,overdue,paid'],
            'sort' => ['nullable', 'string', 'in:'.implode(',', self::SORTABLE_COLUMNS)],
            'direction' => ['nullable', 'string', 'in:asc,desc'],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:100'],
        ]);

        $search = $validated['search'] ?? null;
        $today = now()->toDateString();

        $billings = Billing::query()
            ->with('customer:id,name')
            ->when($search, fn ($query, string $term) => $query->where('description', 'like', "%{$term}%"))
            ->when($validated['customer_id'] ?? null, fn ($query, int $customerId) => $query->where('customer_id', $customerId))
            ->when($validated['status'] ?? null, function ($query, string $status) use ($today) {
                match ($status) {
                    'paid' => $query->where('status', BillingStatus::Paid->value),
                    'overdue' => $query->where('status', BillingStatus::Pending->value)->whereDate('due_date', '<', $today),
                    'pending' => $query->where('status', BillingStatus::Pending->value)->whereDate('due_date', '>=', $today),
                };
            })
            ->orderBy($validated['sort'] ?? 'due_date', $validated['direction'] ?? 'desc')
            ->orderBy('id', 'desc')
            ->paginate($validated['per_page'] ?? 15)
            ->withQueryString();

        return BillingResource::collection($billings);
    }

    public function store(StoreBillingRequest $request): BillingResource
    {
        $billing = Billing::query()->create($request->validated());

        return new BillingResource($billing->load('customer:id,name'));
    }

    public function show(Billing $billing): BillingResource
    {
        return new BillingResource($billing->load('customer:id,name'));
    }

    public function update(UpdateBillingRequest $request, Billing $billing): BillingResource
    {
        if ($billing->status === BillingStatus::Paid) {
            throw ValidationException::withMessages([
                'billing' => ['Cobranças pagas não podem ser alteradas.'],
            ]);
        }

        $billing->update($request->validated());

        return new BillingResource($billing->refresh()->load('customer:id,name'));
    }

    public function pay(PayBillingRequest $request, Billing $billing, BillingInterestCalculator $calculator): BillingResource
    {
        $paidBilling = DB::transaction(function () use ($request, $billing, $calculator) {
            $lockedBilling = Billing::query()->lockForUpdate()->findOrFail($billing->id);

            if ($lockedBilling->status === BillingStatus::Paid) {
                throw ValidationException::withMessages([
                    'billing' => ['O pagamento desta cobrança já foi registrado.'],
                ]);
            }

            $paymentDate = $request->date('payment_date');

            if ($paymentDate->lessThan($lockedBilling->issue_date)) {
                throw ValidationException::withMessages([
                    'payment_date' => ['A data de pagamento não pode ser anterior à emissão.'],
                ]);
            }

            $calculation = $calculator->calculate($lockedBilling, $paymentDate);
            $lockedBilling->update([
                'payment_date' => $paymentDate,
                'paid_amount' => $request->validated('paid_amount'),
                'interest_paid' => $calculation['interest_amount'],
                'status' => BillingStatus::Paid,
            ]);

            return $lockedBilling->refresh()->load('customer:id,name');
        });

        return new BillingResource($paidBilling);
    }
}
