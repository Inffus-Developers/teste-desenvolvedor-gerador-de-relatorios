<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\ChargeController;
use App\Http\Controllers\ClientController;
use Illuminate\Support\Facades\Auth;

// Rota pública: Login
Route::post('/login', function (Request $request) {
    $credentials = $request->validate([
        'email' => 'required|email',
        'password' => 'required',
    ]);

    if (Auth::attempt($credentials)) {
        $user = Auth::user();
        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'token' => $token,
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
            ],
        ]);
    }

    return response()->json(['message' => 'Credenciais inválidas.'], 401);
});

// Rotas protegidas por Sanctum
Route::middleware('auth:sanctum')->group(function () {

    // Retorna o usuário autenticado
    Route::get('/user', function (Request $request) {
        return response()->json($request->user());
    });

    // Logout: revoga apenas o token atual
    Route::post('/logout', function (Request $request) {
        $request->user()->currentAccessToken()->delete();
        return response()->json(['message' => 'Logout realizado com sucesso.']);
    });

    Route::apiResource('charges', ChargeController::class);
    Route::apiResource('clients', ClientController::class);
    Route::get('report/charges', [ChargeController::class, 'report']);
});
