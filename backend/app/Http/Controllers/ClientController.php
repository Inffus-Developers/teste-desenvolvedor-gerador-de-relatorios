<?php

namespace App\Http\Controllers;

use App\Models\Client;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class ClientController extends Controller
{
    public function index(Request $request)
    {
        $query = Client::query();

        if ($request->filled('search')) {
            $s = $request->input('search');
            $query->where('name', 'like', "%{$s}%")
                ->orWhere('document', 'like', "%{$s}%")
                ->orWhere('email', 'like', "%{$s}%");
        }

        $perPage = (int) $request->input('per_page', 15);
        return response()->json($query->paginate($perPage));
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'name' => 'required|string|max:255',
            'document' => 'nullable|string|max:255',
            'email' => 'nullable|email|max:255',
            'status' => ['required', Rule::in(['active', 'inactive'])],
        ]);

        $client = Client::create($data);
        return response()->json($client, 201);
    }

    public function show(Client $client)
    {
        return response()->json($client);
    }

    public function update(Request $request, Client $client)
    {
        $data = $request->validate([
            'name' => 'sometimes|required|string|max:255',
            'document' => 'nullable|string|max:255',
            'email' => 'nullable|email|max:255',
            'status' => ['sometimes', Rule::in(['active', 'inactive'])],
        ]);

        $client->update($data);
        return response()->json($client);
    }

    public function destroy(Client $client)
    {
        $client->delete();
        return response()->json(null, 204);
    }
}
