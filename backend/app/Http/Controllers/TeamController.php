<?php

namespace App\Http\Controllers;

use App\Models\Team;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class TeamController extends Controller
{
    /**
     * Devuelve todos los equipos del usuario autenticado.
     */
    public function index()
    {
        $teams = Auth::user()->teams()->latest()->get();
        return response()->json($teams);
    }

    /**
     * Crea un nuevo equipo.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:40',
            'pokemon' => 'nullable|array',
        ]);

        $team = Auth::user()->teams()->create($validated);

        return response()->json($team, 201);
    }

    /**
     * Actualiza un equipo existente.
     */
    public function update(Request $request, Team $team)
    {
        if ($team->user_id !== Auth::id()) {
            return response()->json(['message' => 'No autorizado'], 403);
        }

        $validated = $request->validate([
            'name' => 'sometimes|string|max:40',
            'pokemon' => 'sometimes|nullable|array',
        ]);

        $team->update($validated);

        return response()->json($team);
    }

    /**
     * Elimina un equipo.
     */
    public function destroy(Team $team)
    {
        if ($team->user_id !== Auth::id()) {
            return response()->json(['message' => 'No autorizado'], 403);
        }

        $team->delete();

        return response()->json(['message' => 'Equipo eliminado']);
    }

    /**
     * Sincronización masiva: recibe un array de equipos desde localStorage
     * y los guarda en el servidor (solo si el usuario no tiene equipos aún).
     */
    public function sync(Request $request)
    {
        $request->validate([
            'teams' => 'required|array',
            'teams.*.name' => 'required|string|max:40',
            'teams.*.pokemon' => 'nullable|array',
        ]);

        $user = Auth::user();

        // Solo sincronizar si el usuario no tiene equipos en el servidor todavía
        if ($user->teams()->count() > 0) {
            // Ya tiene equipos en el servidor, devolver los del servidor
            return response()->json([
                'message' => 'Ya existen equipos en el servidor',
                'teams' => $user->teams()->latest()->get(),
            ]);
        }

        $created = [];
        foreach ($request->teams as $teamData) {
            $created[] = $user->teams()->create([
                'name' => $teamData['name'],
                'pokemon' => $teamData['pokemon'] ?? [null, null, null, null, null, null],
            ]);
        }

        return response()->json([
            'message' => 'Equipos sincronizados correctamente',
            'teams' => $created,
        ], 201);
    }
}
