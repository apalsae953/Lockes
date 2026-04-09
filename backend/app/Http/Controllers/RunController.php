<?php

namespace App\Http\Controllers;

use App\Models\Run;
use Illuminate\Http\Request;

use Illuminate\Support\Facades\Auth;

class RunController extends Controller
{
    public function index()
    {
        return response()->json(Auth::user()->runs()->latest()->get());
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

