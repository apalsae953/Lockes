<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\RunController;
use Illuminate\Support\Facades\Route;

// Rutas de Formulario (React las busca en /api/...)
Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);

// Rutas protegidas
Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/me', [AuthController::class, 'me']);
    Route::put('/profile', [AuthController::class, 'updateProfile']);
    Route::apiResource('runs', RunController::class);
});