<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\User;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Laravel\Socialite\Facades\Socialite;
use Illuminate\Support\Str;

class AuthController extends Controller
{
    public function register(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'password' => 'required|string|min:8',
        ]);

        $user = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'password' => Hash::make($request->password),
        ]);

        Auth::login($user);

        return response()->json(['user' => $user], 201);
    }

    public function login(Request $request)
    {
        $credentials = $request->validate([
            'email' => 'required|email',
            'password' => 'required',
        ]);

        if (Auth::attempt($credentials)) {
            $request->session()->regenerate();
            return response()->json(['user' => Auth::user()]);
        }

        return response()->json(['message' => 'Credenciales inválidas'], 401);
    }

    public function logout(Request $request)
    {
        Auth::guard('web')->logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();
        return response()->json(['message' => 'Sesión cerrada']);
    }

    public function me(Request $request)
    {
        return response()->json(['user' => $request->user()]);
    }

    // --- Google OAuth ---
    public function redirectToGoogle()
    {
        \Log::info('Redirecting to Google...');
        return Socialite::driver('google')->redirect();
    }

    public function handleGoogleCallback()
    {
        try {
            $googleUser = Socialite::driver('google')
                ->setHttpClient(new \GuzzleHttp\Client(['verify' => false]))
                ->user();
            
            $user = User::where('email', $googleUser->email)->first();

            if (!$user) {
                $user = User::create([
                    'email' => $googleUser->email,
                    'name' => $googleUser->name,
                    'google_id' => $googleUser->id,
                    'avatar' => $googleUser->avatar,
                    'password' => bcrypt(Str::random(16)),
                ]);
            } else {
                // Si existe, solo actualizamos el avatar o el google_id por seguridad, pero NO el nombre
                $user->update([
                    'google_id' => $googleUser->id,
                    'avatar' => $googleUser->avatar,
                ]);
            }

            Auth::login($user);

            return redirect(env('FRONTEND_URL', 'http://localhost:5173') . '/login-success');
        } catch (\Exception $e) {
            \Log::error('Google Auth Error: ' . $e->getMessage());
            return redirect(env('FRONTEND_URL', 'http://localhost:5173') . '/login?error=auth_failed');
        }
    }

    public function updateProfile(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
        ]);

        $user = $request->user();
        $user->update([
            'name' => $request->name,
        ]);

        return response()->json([
            'user' => $user,
            'message' => 'Perfil actualizado correctamente'
        ]);
    }
}
