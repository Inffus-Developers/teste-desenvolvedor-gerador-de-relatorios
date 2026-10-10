<?php

use App\Http\Controllers\Api\AuthController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\CustomerController;
use App\Http\Controllers\Api\BillingController;
use App\Http\Controllers\Api\ReportController;

// Rotas públicas
Route::post('/login', [AuthController::class, 'login']);

// Rotas protegidas por autenticação Sanctum
Route::middleware('auth:sanctum')->group(function () {
    Route::get('/me', [AuthController::class, 'me']);
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::apiResource('billings', BillingController::class);

    Route::get('customers/active-options', [CustomerController::class, 'activeOptions']);
    Route::apiResource('customers', CustomerController::class);

    Route::get('reports/billings', [ReportController::class, 'index']);
    Route::get('reports/billings/export-csv', [ReportController::class, 'exportCsv']);
    Route::get('reports/billings/export-pdf', [ReportController::class, 'exportPdf']);

});