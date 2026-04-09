<?php

use App\Http\Controllers\AuthController;
use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return "Backend de Lockes Funcionando";
});

// Rutas de Google (Se abren en el navegador, van en web.php)
Route::get('/auth/google', [AuthController::class, 'redirectToGoogle']);
Route::get('/auth/google/callback', [AuthController::class, 'handleGoogleCallback']);

// Ruta de prueba
Route::get('/test', function () {
    return "El servidor lee las rutas correctamente";
});