<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;
use Illuminate\Auth\Notifications\ResetPassword;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    public function boot(): void
    {
        if (config('app.env') === 'production' || str_contains(config('app.url'), 'onrender.com')) {
            \URL::forceScheme('https');
        }

        // Forzamos la configuración de cookies para que funcione en Render + Vercel
        if (isset($_SERVER['HTTP_X_FORWARDED_PROTO']) && $_SERVER['HTTP_X_FORWARDED_PROTO'] === 'https') {
            config([
                'session.secure' => true,
                'session.same_site' => 'none',
            ]);
        }

        // Recuperación de contraseña deshabilitada temporalmente
        // ResetPassword::createUrlUsing(function ($user, string $token) {
        //     return env('FRONTEND_URL', 'http://localhost:5173') . '/reset-password?token=' . $token . '&email=' . $user->email;
        // });
    }
}
