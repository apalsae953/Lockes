<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\RunController;
use App\Http\Controllers\TeamController;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Route;

// Keep-alive: un cron externo llama aquí para que Render no se duerma
// y Supabase no pause la BD por inactividad (hace una consulta real).
Route::get('/health', function () {
    try {
        DB::table('users')->limit(1)->get(['id']);

        return response()->json(['status' => 'ok']);
    } catch (\Throwable $e) {
        report($e);

        return response()->json(['status' => 'db_error'], 503);
    }
});

// Rutas de Formulario (React las busca en /api/...)
Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);
// Recuperación de contraseña deshabilitada temporalmente
// Route::post('/forgot-password', [AuthController::class, 'forgotPassword']);
// Route::post('/reset-password', [AuthController::class, 'resetPassword'])->name('password.reset');

// Rutas protegidas
Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/me', [AuthController::class, 'me']);
    Route::put('/profile', [AuthController::class, 'updateProfile']);
    Route::apiResource('runs', RunController::class);
    Route::post('/teams/sync', [TeamController::class, 'sync']);
    Route::apiResource('teams', TeamController::class)->except(['show']);
});