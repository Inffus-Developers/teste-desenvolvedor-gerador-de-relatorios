<?php

namespace App\Http\Controllers;

use App\Http\Requests\CustomerRequest;
use App\Models\Customer;
use App\Rules\ValidCursor;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class CustomerController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $sortColumn = is_string($request->input('sort')) ? $request->input('sort') : 'name';
        $filters = $request->validate([
            'search' => ['nullable', 'string', 'max:100'], 'active' => ['nullable', 'boolean'],
            'sort' => ['nullable', Rule::in(['id', 'name', 'document'])],
            'direction' => ['nullable', Rule::in(['asc', 'desc'])],
            'per_page' => ['nullable', 'integer', 'between:1,100'], 'cursor' => ['nullable', 'string', 'max:2048', new ValidCursor([$sortColumn, 'id'])],
        ]);
        $query = Customer::query();
        if (! empty($filters['search'])) {
            $prefix = addcslashes($filters['search'], '%_\\').'%';
            $query->where(fn ($q) => $q->where('name', 'like', $prefix)->orWhere('document', 'like', $prefix));
        }
        if (isset($filters['active'])) {
            $query->where('active', $filters['active']);
        }
        $sort = $filters['sort'] ?? 'name';
        $direction = $filters['direction'] ?? 'asc';
        $query->orderBy($sort, $direction);
        if ($sort !== 'id') {
            $query->orderBy('id', $direction);
        }

        return response()->json($query->cursorPaginate($filters['per_page'] ?? 20));
    }

    public function store(CustomerRequest $request): JsonResponse
    {
        return response()->json(Customer::create($request->validated()), 201);
    }

    public function show(Customer $customer): JsonResponse
    {
        return response()->json($customer);
    }

    public function update(CustomerRequest $request, Customer $customer): JsonResponse
    {
        $customer->update($request->validated());

        return response()->json($customer);
    }
}
