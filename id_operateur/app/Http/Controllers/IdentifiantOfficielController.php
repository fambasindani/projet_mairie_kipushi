<?php

namespace App\Http\Controllers;

use App\Models\IdentifiantOfficiel;
use App\Models\Personne;
use Illuminate\Http\Request;
use App\Traits\OperateurScope;
use Illuminate\Support\Facades\Validator;

class IdentifiantOfficielController extends Controller
{
    use OperateurScope;
    /**
     * Liste des identifiants officiels
     */
    public function index(Request $request)
    {
        $query = IdentifiantOfficiel::with('personne');
        $this->scopeOperateur($query, $request);

        if ($request->has('personne_id') && !empty($request->personne_id)) {
            $query->where('personne_id', $request->personne_id);
        }

        if ($request->has('type_identifiant') && !empty($request->type_identifiant)) {
            $query->where('type_identifiant', $request->type_identifiant);
        }

        if ($request->has('est_actif')) {
            $query->where('est_actif', filter_var($request->est_actif, FILTER_VALIDATE_BOOLEAN));
        }

        if ($request->has('search') && !empty($request->search)) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('valeur', 'LIKE', "%{$search}%")
                  ->orWhereHas('personne', function ($pq) use ($search) {
                      $pq->where('nom', 'LIKE', "%{$search}%")
                         ->orWhere('prenom', 'LIKE', "%{$search}%")
                         ->orWhere('denomination_sociale', 'LIKE', "%{$search}%");
                  });
            });
        }

        $perPage = $request->get('per_page', 20);
        $identifiants = $query->orderBy('created_at', 'desc')->paginate($perPage);

        return response()->json([
            'success' => true,
            'data' => $identifiants->items(),
            'pagination' => [
                'current_page' => $identifiants->currentPage(),
                'per_page' => $identifiants->perPage(),
                'total' => $identifiants->total(),
                'last_page' => $identifiants->lastPage(),
            ]
        ]);
    }

    /**
     * Créer un identifiant officiel
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'personne_id' => 'required|exists:personnes,id',
            'type_identifiant' => 'required|in:RCCM,IDNAT,NUMERO_IMPOT,NIF,CNSS,ONEM,PASSEPORT,PERMIS_CONDURE',
            'valeur' => 'required|string|max:50|unique:identifiants_officiels,valeur',
            'province_delivrance' => 'nullable|string|max:100',
            'date_delivrance' => 'nullable|date',
            'date_expiration' => 'nullable|date|after:date_delivrance',
            'est_actif' => 'boolean',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        $data = $request->all();
        $data['est_actif'] = $request->est_actif ?? true;

        $identifiant = IdentifiantOfficiel::create($data);
        $identifiant->load('personne');

        return response()->json([
            'success' => true,
            'message' => 'Identifiant créé avec succès',
            'data' => $identifiant
        ], 201);
    }

    /**
     * Afficher un identifiant
     */
    public function show($id)
    {
        $identifiant = IdentifiantOfficiel::with('personne')->find($id);

        if (!$identifiant) {
            return response()->json([
                'success' => false,
                'message' => 'Identifiant non trouvé'
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => $identifiant
        ]);
    }

    /**
     * Mettre à jour un identifiant
     */
    public function update(Request $request, $id)
    {
        $identifiant = IdentifiantOfficiel::find($id);

        if (!$identifiant) {
            return response()->json([
                'success' => false,
                'message' => 'Identifiant non trouvé'
            ], 404);
        }

        $validator = Validator::make($request->all(), [
            'personne_id' => 'sometimes|exists:personnes,id',
            'type_identifiant' => 'sometimes|in:RCCM,IDNAT,NUMERO_IMPOT,NIF,CNSS,ONEM,PASSEPORT,PERMIS_CONDURE',
            'valeur' => 'sometimes|string|max:50|unique:identifiants_officiels,valeur,' . $id,
            'province_delivrance' => 'nullable|string|max:100',
            'date_delivrance' => 'nullable|date',
            'date_expiration' => 'nullable|date|after:date_delivrance',
            'est_actif' => 'boolean',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        $identifiant->update($request->all());
        $identifiant->load('personne');

        return response()->json([
            'success' => true,
            'message' => 'Identifiant mis à jour avec succès',
            'data' => $identifiant
        ]);
    }

    /**
     * Supprimer un identifiant
     */
    public function destroy($id)
    {
        $identifiant = IdentifiantOfficiel::find($id);

        if (!$identifiant) {
            return response()->json([
                'success' => false,
                'message' => 'Identifiant non trouvé'
            ], 404);
        }

        $identifiant->delete();

        return response()->json([
            'success' => true,
            'message' => 'Identifiant supprimé avec succès'
        ]);
    }

    /**
     * Types d'identifiants disponibles
     */
    public function types()
    {
        $types = [
            'RCCM' => 'Registre de Commerce',
            'IDNAT' => 'Carte Nationale d\'Identité',
            'NUMERO_IMPOT' => 'Numéro d\'Impôt',
            'NIF' => 'NIF',
            'CNSS' => 'CNSS',
            'ONEM' => 'ONEM',
            'PASSEPORT' => 'Passeport',
            'PERMIS_CONDURE' => 'Permis de Conduire',
        ];

        return response()->json([
            'success' => true,
            'data' => $types
        ]);
    }
}