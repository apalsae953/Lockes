<?php

namespace App\Http\Controllers;

use App\Models\Run;
use Illuminate\Http\Request;

use Illuminate\Support\Facades\Auth;

class RunController extends Controller
{
    public function index()
    {
        // Solo seleccionamos lo necesario de la BD para no cargar blobs pesados (team, custom_bosses, etc.)
        // Seguimos trayendo encounters solo para calcular el conteo en servidor
        $runs = Auth::user()->runs()
            ->select('id', 'user_id', 'name', 'game_id', 'game_name', 'vidas_max', 'vidas_actuales', 'encounters', 'created_at')
            ->latest()
            ->get();
        
        $optimized = $runs->map(function ($run) {
            $runData = $run->toArray();
            // Calculamos el conteo en el servidor para evitar enviar todo el JSON de encounters al cliente
            $runData['captures_count'] = collect($run->encounters ?? [])->where('pokemon', '!=', '')->count();
            
            // Eliminamos encounters antes de enviar al cliente para reducir el tamaño de la respuesta JSON
            unset($runData['encounters']);
            
            return $runData;
        });

        return response()->json($optimized);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string',
            'game_id' => 'required|string',
            'game_name' => 'required|string',
            'vidas_max' => 'nullable|integer',
            'vidas_actuales' => 'nullable|integer',
            'extra_rules' => 'nullable|array',
            'encounters' => 'nullable|array',
            'team' => 'nullable|array',
            'custom_bosses' => 'nullable|array',
            'defeated_bosses' => 'nullable|array',
        ]);

        $run = Auth::user()->runs()->create($validated);

        return response()->json($run, 201);
    }

    public function show(Run $run)
    {
        if ($run->user_id !== Auth::id()) {
            return response()->json(['message' => 'No autorizado'], 403);
        }
        return response()->json($run);
    }

    public function update(Request $request, Run $run)
    {
        if ($run->user_id !== Auth::id()) {
            return response()->json(['message' => 'No autorizado'], 403);
        }

        $validated = $request->validate([
            'name' => 'sometimes|string',
            'vidas_actuales' => 'sometimes|nullable|integer',
            'encounters' => 'sometimes|array',
            'team' => 'sometimes|array',
            'custom_bosses' => 'sometimes|array',
            'defeated_bosses' => 'sometimes|array',
        ]);

        $run->update($validated);

        return response()->json($run);
    }

    public function destroy(Run $run)
    {
        if ($run->user_id !== Auth::id()) {
            return response()->json(['message' => 'No autorizado'], 403);
        }

        $run->delete();

        return response()->json(['message' => 'Partida eliminada']);
    }
}

