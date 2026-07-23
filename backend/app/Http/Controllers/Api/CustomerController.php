<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\CustomerRequest;
use App\Http\Resources\CustomerResource;
use App\Models\Customer;
use Illuminate\Http\Request;

class CustomerController extends Controller
{
    public function index(Request $request)
    {
        $validated = $request->validate([
            'search' => ['nullable', 'string'],
            'status' => ['nullable', 'in:active,inactive'],
            'sort_by' => ['nullable', 'in:id,name,document,email,status,created_at'],
            'sort_dir' => ['nullable', 'in:asc,desc'],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:100'],
        ]);
        $query = Customer::query();
        if (! empty($validated['search'])) {
            $search = $validated['search'];
            $query->where(fn ($query) => $query->where('name', 'like', "%{$search}%")->orWhere('document', 'like', "%{$search}%")->orWhere('email', 'like', "%{$search}%"));
        }
        $query->when($validated['status'] ?? null, fn ($query, $status) => $query->where('status', $status));

        return CustomerResource::collection($query->orderBy($validated['sort_by'] ?? 'name', $validated['sort_dir'] ?? 'asc')->paginate($validated['per_page'] ?? 15));
    }

    public function store(CustomerRequest $request)
    {
        return CustomerResource::make(Customer::create($request->validated()))->response()->setStatusCode(201);
    }

    public function show(Customer $customer): CustomerResource { return CustomerResource::make($customer); }

    public function update(CustomerRequest $request, Customer $customer): CustomerResource
    {
        $customer->update($request->validated());
        return CustomerResource::make($customer->refresh());
    }

    public function destroy(Customer $customer)
    {
        $customer->delete();
        return response()->noContent();
    }
}
