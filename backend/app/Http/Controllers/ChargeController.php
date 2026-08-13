<?php

namespace App\Http\Controllers;

use App\Models\Charge;
use Illuminate\Http\Request;

class ChargeController extends Controller
{
    public function index(Request $request)
    {
        $query = Charge::query();
        
        if ($request->has('status')) {
            $query->where('status', $request->status);
        }
        
        return response()->json($query->paginate(15));
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'client_name' => 'required|string|max:255',
            'description' => 'required|string',
            'original_amount' => 'required|numeric',
            'issue_date' => 'required|date',
            'due_date' => 'required|date',
            'status' => 'in:pendente,paga,atrasada,cancelada',
            'interest_rate' => 'numeric'
        ]);

        $charge = Charge::create($validated);
        return response()->json($charge, 201);
    }

    public function show(Charge $charge)
    {
        return response()->json($charge);
    }

    public function update(Request $request, Charge $charge)
    {
        $validated = $request->validate([
            'client_name' => 'string|max:255',
            'description' => 'string',
            'original_amount' => 'numeric',
            'issue_date' => 'date',
            'due_date' => 'date',
            'status' => 'in:pendente,paga,atrasada,cancelada',
            'interest_rate' => 'numeric',
            'payment_date' => 'nullable|date'
        ]);

        $charge->update($validated);
        return response()->json($charge);
    }

    public function destroy(Charge $charge)
    {
        $charge->delete();
        return response()->json(null, 204);
    }

    public function report(Request $request)
    {
        // Relatório otimizado usando chunking ou lazy loading
        $charges = Charge::lazy(); // Lazy Collection ideal para lidar com grandes volumes
        
        // Aqui simularíamos o retorno paginado ou processamento massivo.
        // Como é uma resposta HTTP, paginação é necessária para não estourar a memória e o tempo limite:
        return response()->json(Charge::paginate(500));
    }
}
