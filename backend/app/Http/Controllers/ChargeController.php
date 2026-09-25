<?php

namespace App\Http\Controllers;

use App\Http\Requests\ChargeRequest;
use App\Http\Requests\ReportRequest;
use App\Models\Charge;
use App\Services\BillingReport;
use App\Services\InterestCalculator;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ChargeController extends Controller
{
    public function __construct(private BillingReport $report) {}

    public function index(ReportRequest $request): JsonResponse
    {
        $query = $this->report->query($request->filters(), today()->toDateString());

        return response()->json($this->report->order($query, $request->filters())->cursorPaginate($request->integer('per_page', 20)));
    }

    public function store(ChargeRequest $request): JsonResponse
    {
        return $this->show(Charge::create($request->validated()))->setStatusCode(201);
    }

    public function show(Charge $charge): JsonResponse
    {
        return response()->json($this->report->query([], today()->toDateString())->where('charges.id', $charge->id)->first());
    }

    public function update(ChargeRequest $request, Charge $charge): JsonResponse
    {
        DB::transaction(function () use ($request, $charge) {
            $locked = Charge::lockForUpdate()->findOrFail($charge->id);
            abort_if($locked->paid_at !== null, 409, 'Uma cobrança paga não pode ser editada.');
            $locked->update($request->validated());
        });

        return $this->show($charge);
    }

    public function pay(Request $request, Charge $charge, InterestCalculator $calculator): JsonResponse
    {
        $data = $request->validate([
            'paid_at' => ['required', 'date_format:Y-m-d', 'before_or_equal:today'],
            'paid_amount' => ['required', 'numeric', 'decimal:0,2', 'min:0.01', 'max:999999999999.99'],
        ]);
        DB::transaction(function () use ($charge, $data, $calculator) {
            $locked = Charge::lockForUpdate()->findOrFail($charge->id);
            abort_if($locked->paid_at !== null, 409, 'Esta cobrança já foi paga.');
            abort_if($data['paid_at'] < $locked->issued_at, 422, 'O pagamento não pode ser anterior à emissão.');
            $locked->forceFill([
                ...$data,
                'paid_interest' => $calculator->calculate($locked->original_amount, $locked->monthly_interest_rate, $locked->due_at, $data['paid_at']),
            ])->save();
        });

        return $this->show($charge);
    }
}
