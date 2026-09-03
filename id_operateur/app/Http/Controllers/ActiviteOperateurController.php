<?php

namespace App\Http\Controllers;

use App\Models\Personne;
use App\Models\ActiviteEconomique;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\DB;

class ActiviteOperateurController extends Controller
{
    /**
     * Assigner des activités à un opérateur
     */
    public function assigner(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'personne_id' => 'required|exists:personnes,id',
            'activites' => 'required|array',
            'activites.*.id' => 'required|exists:activites_economiques,id',
            'activites.*.est_principale' => 'boolean',
            'activites.*.date_debut' => 'nullable|date',
            'activites.*.date_fin' => 'nullable|date|after:activites.*.date_debut',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        $personne = Personne::find($request->personne_id);
        if (!$personne) {
            return response()->json([
                'success' => false,
                'message' => 'Opérateur non trouvé'
            ], 404);
        }

        $syncData = [];
        foreach ($request->activites as $activite) {
            $syncData[$activite['id']] = [
                'est_principale' => $activite['est_principale'] ?? false,
                'date_debut' => $activite['date_debut'] ?? now(),
                'date_fin' => $activite['date_fin'] ?? null,
            ];
        }

        $personne->activites()->sync($syncData);

        $personne->load('activites');

        return response()->json([
            'success' => true,
            'message' => 'Activités assignées avec succès',
            'data' => $personne
        ]);
    }

    /**
     * Obtenir les activités d'un opérateur
     */
    public function getActivites($personneId)
    {
        $personne = Personne::with('activites')->find($personneId);

        if (!$personne) {
            return response()->json([
                'success' => false,
                'message' => 'Opérateur non trouvé'
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => $personne->activites
        ]);
    }

    /**
     * Supprimer une activité d'un opérateur
     */
    public function supprimer($personneId, $activiteId)
    {
        $personne = Personne::find($personneId);

        if (!$personne) {
            return response()->json([
                'success' => false,
                'message' => 'Opérateur non trouvé'
            ], 404);
        }

        $personne->activites()->detach($activiteId);

        return response()->json([
            'success' => true,
            'message' => 'Activité retirée avec succès'
        ]);
    }
}