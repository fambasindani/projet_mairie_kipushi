<?php

namespace App\Http\Controllers;

use App\Models\Parametre;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class ParametreController extends Controller
{
    /**
     * Liste des paramètres
     */
    public function index(Request $request)
    {
        $query = Parametre::query();

        if ($request->has('search') && !empty($request->search)) {
            $search = $request->search;
            $query->where('cle', 'LIKE', "%{$search}%")
                  ->orWhere('description', 'LIKE', "%{$search}%");
        }

        if ($request->has('est_modifiable')) {
            $query->where('est_modifiable', filter_var($request->est_modifiable, FILTER_VALIDATE_BOOLEAN));
        }

        $perPage = $request->get('per_page', 20);
        $parametres = $query->orderBy('cle')->paginate($perPage);

        return response()->json([
            'success' => true,
            'data' => $parametres->items(),
            'pagination' => [
                'current_page' => $parametres->currentPage(),
                'per_page' => $parametres->perPage(),
                'total' => $parametres->total(),
                'last_page' => $parametres->lastPage(),
            ]
        ]);
    }

    /**
     * Afficher un paramètre
     */
    public function show($cle)
    {
        $parametre = Parametre::where('cle', $cle)->first();

        if (!$parametre) {
            return response()->json([
                'success' => false,
                'message' => 'Paramètre non trouvé'
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => $parametre
        ]);
    }

    /**
     * Mettre à jour un paramètre
     */
    public function update(Request $request, $cle)
    {
        $parametre = Parametre::where('cle', $cle)->first();

        if (!$parametre) {
            return response()->json([
                'success' => false,
                'message' => 'Paramètre non trouvé'
            ], 404);
        }

        if (!$parametre->est_modifiable) {
            return response()->json([
                'success' => false,
                'message' => 'Ce paramètre n\'est pas modifiable'
            ], 403);
        }

        $validator = Validator::make($request->all(), [
            'valeur' => 'required|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        $parametre->update([
            'valeur' => $request->valeur
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Paramètre mis à jour avec succès',
            'data' => $parametre
        ]);
    }

    /**
     * Mettre à jour plusieurs paramètres
     */
    public function updateMultiple(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'parametres' => 'required|array',
            'parametres.*.cle' => 'required|string|exists:parametres,cle',
            'parametres.*.valeur' => 'required|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        $updated = [];
        $errors = [];

        foreach ($request->parametres as $param) {
            $parametre = Parametre::where('cle', $param['cle'])->first();

            if (!$parametre->est_modifiable) {
                $errors[] = "Le paramètre '{$param['cle']}' n'est pas modifiable";
                continue;
            }

            $parametre->update(['valeur' => $param['valeur']]);
            $updated[] = $parametre;
        }

        return response()->json([
            'success' => true,
            'message' => count($updated) . ' paramètre(s) mis à jour',
            'updated' => $updated,
            'errors' => $errors
        ]);
    }
}