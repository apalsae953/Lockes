<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\RunController;

Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);

Route::middleware(['auth:sanctum'])->group(function () {
    Route::get('/me', [AuthController::class, 'me']);
    Route::put('/profile', [AuthController::class, 'updateProfile']);
    Route::post('/logout', [AuthController::class, 'logout']);
});

Route::apiResource('runs', RunController::class)->middleware('auth:sanctum');
