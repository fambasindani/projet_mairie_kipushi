<?php

namespace App\Http\Controllers;

use App\Models\PermisAutorisation;
use App\Models\Personne;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class PermisAutorisationController extends Controller
{
    /**
     * Liste des permis avec pagination et recherche
     */
    public function index(Request $request)
    {
        $query = PermisAutorisation::with('personne');

        // Recherche
        if ($request->has('search') && !empty($request->search)) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('numero', 'LIKE', "%{$search}%")
                  ->orWhere('type_permis', 'LIKE', "%{$search}%")
                  ->orWhereHas('personne', function ($pq) use ($search) {
                      $pq->where('nom', 'LIKE', "%{$search}%")
                         ->orWhere('prenom', 'LIKE', "%{$search}%")
                         ->orWhere('denomination_sociale', 'LIKE', "%{$search}%");
                  });
            });
        }

        // Filtres
        if ($request->has('personne_id') && !empty($request->personne_id)) {
            $query->where('personne_id', $request->personne_id);
        }

        if ($request->has('type_permis') && !empty($request->type_permis)) {
            $query->where('type_permis', $request->type_permis);
        }

        if ($request->has('est_valide')) {
            $query->where('est_valide', filter_var($request->est_valide, FILTER_VALIDATE_BOOLEAN));
        }

        if ($request->has('est_renouvele')) {
            $query->where('est_renouvele', filter_var($request->est_renouvele, FILTER_VALIDATE_BOOLEAN));
        }

        // Filtres par date
        if ($request->has('date_delivrance_debut')) {
            $query->whereDate('date_delivrance', '>=', $request->date_delivrance_debut);
        }

        if ($request->has('date_delivrance_fin')) {
            $query->whereDate('date_delivrance', '<=', $request->date_delivrance_fin);
        }

        if ($request->has('date_expiration_debut')) {
            $query->whereDate('date_expiration', '>=', $request->date_expiration_debut);
        }

        if ($request->has('date_expiration_fin')) {
            $query->whereDate('date_expiration', '<=', $request->date_expiration_fin);
        }

        // Permis expirés
        if ($request->has('expires') && $request->expires === 'true') {
            $query->where('date_expiration', '<', now());
        }

        // Permis valides
        if ($request->has('valides') && $request->valides === 'true') {
            $query->where('est_valide', true)
                  ->where(function ($q) {
                      $q->whereNull('date_expiration')
                        ->orWhere('date_expiration', '>=', now());
                  });
        }

        // Tri
        $sortField = $request->get('sort', 'created_at');
        $sortOrder = $request->get('order', 'desc');
        $allowedSorts = ['id', 'numero', 'type_permis', 'date_delivrance', 'date_expiration', 'created_at'];
        if (in_array($sortField, $allowedSorts)) {
            $query->orderBy($sortField, $sortOrder);
        }

        // Pagination
        $perPage = $request->get('per_page', 20);
        $perPage = min($perPage, 100);

        $permis = $query->paginate($perPage);

        return response()->json([
            'success' => true,
            'data' => $permis->items(),
            'pagination' => [
                'current_page' => $permis->currentPage(),
                'per_page' => $permis->perPage(),
                'total' => $permis->total(),
                'last_page' => $permis->lastPage(),
            ],
            'filters' => $request->all()
        ]);
    }

    /**
     * Créer un permis
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'personne_id' => 'required|exists:personnes,id',
            'type_permis' => 'required|in:patente,construire,occupation_sol,etalage,exploitation,transport,autre',
            'numero' => 'required|string|max:50|unique:permis_autorisations,numero',
            'date_delivrance' => 'required|date',
            'date_expiration' => 'nullable|date|after:date_delivrance',
            'est_valide' => 'boolean',
            'est_renouvele' => 'boolean',
            'document_scan' => 'nullable|string|max:255',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        $data = $request->all();
        $data['est_valide'] = $request->est_valide ?? true;
        $data['est_renouvele'] = $request->est_renouvele ?? false;

        // Si date_expiration est null, le permis est permanent
        // Si date_expiration est passée, est_valide devient false
        if ($data['date_expiration'] && $data['date_expiration'] < now()) {
            $data['est_valide'] = false;
        }

        $permis = PermisAutorisation::create($data);
        $permis->load('personne');

        return response()->json([
            'success' => true,
            'message' => 'Permis créé avec succès',
            'data' => $permis
        ], 201);
    }

    /**
     * Afficher un permis
     */
    public function show($id)
    {
        $permis = PermisAutorisation::with(['personne', 'declarationsPaiements'])->find($id);

        if (!$permis) {
            return response()->json([
                'success' => false,
                'message' => 'Permis non trouvé'
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => $permis
        ]);
    }

    /**
     * Mettre à jour un permis
     */
    public function update(Request $request, $id)
    {
        $permis = PermisAutorisation::find($id);

        if (!$permis) {
            return response()->json([
                'success' => false,
                'message' => 'Permis non trouvé'
            ], 404);
        }

        $validator = Validator::make($request->all(), [
            'personne_id' => 'sometimes|exists:personnes,id',
            'type_permis' => 'sometimes|in:patente,construire,occupation_sol,etalage,exploitation,transport,autre',
            'numero' => 'sometimes|string|max:50|unique:permis_autorisations,numero,' . $id,
            'date_delivrance' => 'sometimes|date',
            'date_expiration' => 'nullable|date|after_or_equal:date_delivrance',
            'est_valide' => 'boolean',
            'est_renouvele' => 'boolean',
            'document_scan' => 'nullable|string|max:255',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        $data = $request->all();

        // Si date_expiration est passée, est_valide devient false
        if (isset($data['date_expiration']) && $data['date_expiration'] < now()) {
            $data['est_valide'] = false;
        }

        $permis->update($data);
        $permis->load('personne');

        return response()->json([
            'success' => true,
            'message' => 'Permis mis à jour avec succès',
            'data' => $permis
        ]);
    }

    /**
     * Supprimer un permis
     */
    public function destroy($id)
    {
        $permis = PermisAutorisation::withCount('declarationsPaiements')->find($id);

        if (!$permis) {
            return response()->json([
                'success' => false,
                'message' => 'Permis non trouvé'
            ], 404);
        }

        if ($permis->declarations_paiements_count > 0) {
            return response()->json([
                'success' => false,
                'message' => 'Impossible de supprimer ce permis car il est utilisé dans ' . $permis->declarations_paiements_count . ' déclaration(s)',
            ], 403);
        }

        $permis->delete();

        return response()->json([
            'success' => true,
            'message' => 'Permis supprimé avec succès'
        ]);
    }

    /**
     * Activer/Désactiver un permis
     */
    public function toggleValidation($id)
    {
        $permis = PermisAutorisation::find($id);

        if (!$permis) {
            return response()->json([
                'success' => false,
                'message' => 'Permis non trouvé'
            ], 404);
        }

        $permis->est_valide = !$permis->est_valide;
        $permis->save();

        return response()->json([
            'success' => true,
            'message' => $permis->est_valide ? 'Permis validé' : 'Permis invalidé',
            'data' => $permis
        ]);
    }

    /**
     * Types de permis disponibles
     */
    public function types()
    {
        $types = [
            'patente' => 'Patente',
            'construire' => 'Permis de construire',
            'occupation_sol' => 'Occupation du sol',
            'etalage' => 'Étalage',
            'exploitation' => 'Exploitation',
            'transport' => 'Transport',
            'autre' => 'Autre',
        ];

        return response()->json([
            'success' => true,
            'data' => $types
        ]);
    }

    /**
     * Statistiques des permis
     */
    public function statistiques()
    {
        $stats = [
            'total' => PermisAutorisation::count(),
            'valides' => PermisAutorisation::where('est_valide', true)->count(),
            'invalides' => PermisAutorisation::where('est_valide', false)->count(),
            'expires' => PermisAutorisation::where('date_expiration', '<', now())->count(),
            'renouveles' => PermisAutorisation::where('est_renouvele', true)->count(),
            'par_type' => PermisAutorisation::select('type_permis')
                ->selectRaw('count(*) as total')
                ->groupBy('type_permis')
                ->orderBy('total', 'desc')
                ->get()
                ->map(function ($item) {
                    $labels = [
                        'patente' => 'Patente',
                        'construire' => 'Permis de construire',
                        'occupation_sol' => 'Occupation du sol',
                        'etalage' => 'Étalage',
                        'exploitation' => 'Exploitation',
                        'transport' => 'Transport',
                        'autre' => 'Autre',
                    ];
                    return [
                        'type' => $labels[$item->type_permis] ?? $item->type_permis,
                        'total' => $item->total
                    ];
                }),
            'expiration_proche' => PermisAutorisation::where('date_expiration', '>=', now())
                ->where('date_expiration', '<=', now()->addDays(30))
                ->count(),
        ];

        return response()->json([
            'success' => true,
            'data' => $stats
        ]);
    }
}