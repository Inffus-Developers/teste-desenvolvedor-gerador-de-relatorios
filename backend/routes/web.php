<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\ChargeController;
use App\Http\Controllers\CustomerController;
use App\Http\Controllers\ExportController;
use App\Http\Controllers\ReportController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::get('/', fn () => response()->json(['name' => 'Clara · API de faturamento']));
// API na pilha web: sessão HttpOnly e CSRF em todos os POST/PUT.
Route::prefix('api')->group(function () {
    Route::post('login', [AuthController::class, 'login'])->middleware('throttle:login');
    Route::middleware('auth:sanctum')->group(function () {
        Route::get('user', fn (Request $request) => response()->json(['user' => $request->user()]));
        Route::post('logout', [AuthController::class, 'logout']);
        Route::apiResource('customers', CustomerController::class)->except('destroy');
        Route::apiResource('charges', ChargeController::class)->except('destroy');
        Route::post('charges/{charge}/payment', [ChargeController::class, 'pay']);
        Route::get('reports/billing', ReportController::class);
        Route::get('exports', [ExportController::class, 'index']);
        Route::post('exports', [ExportController::class, 'store'])->middleware('throttle:exports');
        Route::get('exports/{export}/download', [ExportController::class, 'download'])->name('exports.download');
    });
});
