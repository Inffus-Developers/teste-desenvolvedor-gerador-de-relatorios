<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\BillingController;
use App\Http\Controllers\Api\CustomerController;
use App\Http\Controllers\Api\ReportController;
use Illuminate\Support\Facades\Route;

Route::post('login', [AuthController::class, 'login'])->middleware('throttle:5,1');

Route::middleware('auth:sanctum')->group(function (): void {
    Route::post('logout', [AuthController::class, 'logout']);
    Route::get('me', [AuthController::class, 'me']);
    Route::apiResource('customers', CustomerController::class);
    Route::post('billings/{billing}/pay', [BillingController::class, 'pay']);
    Route::apiResource('billings', BillingController::class);
    Route::get('reports/billing', [ReportController::class, 'index']);
    Route::get('reports/billing/export/csv', [ReportController::class, 'csv']);
    Route::get('reports/billing/export/pdf', [ReportController::class, 'pdf']);
});
