<?php

namespace App\Http\Controllers;

use App\Models\Quartier;
use App\Models\Commune;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class QuartierController extends Controller
{
    /**
     * Liste des quartiers avec pagination et recherche
     */
    public function index(Request $request)
    {
        $query = Quartier::with('commune');

        // Recherche
        if ($request->has('search') && !empty($request->search)) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('nom', 'LIKE', "%{$search}%")
                  ->orWhere('code', 'LIKE', "%{$search}%")
                  ->orWhereHas('commune', function ($cq) use ($search) {
                      $cq->where('nom', 'LIKE', "%{$search}%")
                         ->orWhere('code', 'LIKE', "%{$search}%");
                  });
            });
        }

        // Filtre par commune
        if ($request->has('commune_id') && !empty($request->commune_id)) {
            $query->where('commune_id', $request->commune_id);
        }

        // Filtre par statut actif
        if ($request->has('est_actif')) {
            $query->where('est_actif', filter_var($request->est_actif, FILTER_VALIDATE_BOOLEAN));
        }

        // Tri
        $sortField = $request->get('sort', 'nom');
        $sortOrder = $request->get('order', 'asc');
        $allowedSorts = ['id', 'nom', 'code', 'est_actif', 'created_at'];
        if (in_array($sortField, $allowedSorts)) {
            $query->orderBy($sortField, $sortOrder);
        }

        // Pagination
        $perPage = $request->get('per_page', 20);
        $perPage = min($perPage, 100);

        $quartiers = $query->paginate($perPage);

        return response()->json([
            'success' => true,
            'data' => $quartiers->items(),
            'pagination' => [
                'current_page' => $quartiers->currentPage(),
                'per_page' => $quartiers->perPage(),
                'total' => $quartiers->total(),
                'last_page' => $quartiers->lastPage(),
                'from' => $quartiers->firstItem(),
                'to' => $quartiers->lastItem(),
                'next_page_url' => $quartiers->nextPageUrl(),
                'prev_page_url' => $quartiers->previousPageUrl(),
            ],
            'filters' => $request->all()
        ]);
    }

    /**
     * Créer un nouveau quartier
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'commune_id' => 'required|exists:communes,id',
            'nom' => 'required|string|max:100',
            'code' => 'required|string|max:10|unique:quartiers,code',
            'est_actif' => 'boolean',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        // Vérifier que la commune existe et est active
        $commune = Commune::find($request->commune_id);
        if (!$commune || !$commune->est_actif) {
            return response()->json([
                'success' => false,
                'message' => 'La commune spécifiée n\'existe pas ou est inactive'
            ], 422);
        }

        $data = $request->all();
        $data['est_actif'] = $request->est_actif ?? true;

        $quartier = Quartier::create($data);
        $quartier->load('commune');

        return response()->json([
            'success' => true,
            'message' => 'Quartier créé avec succès',
            'data' => $quartier
        ], 201);
    }

    /**
     * Afficher un quartier
     */
    public function show($id)
    {
        $quartier = Quartier::with('commune.ville')->find($id);

        if (!$quartier) {
            return response()->json([
                'success' => false,
                'message' => 'Quartier non trouvé'
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => $quartier
        ]);
    }

    /**
     * Mettre à jour un quartier
     */
    public function update(Request $request, $id)
    {
        $quartier = Quartier::find($id);

        if (!$quartier) {
            return response()->json([
                'success' => false,
                'message' => 'Quartier non trouvé'
            ], 404);
        }

        $validator = Validator::make($request->all(), [
            'commune_id' => 'sometimes|exists:communes,id',
            'nom' => 'sometimes|string|max:100',
            'code' => 'sometimes|string|max:10|unique:quartiers,code,' . $id,
            'est_actif' => 'boolean',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        // Si la commune est modifiée, vérifier qu'elle existe et est active
        if ($request->has('commune_id')) {
            $commune = Commune::find($request->commune_id);
            if (!$commune || !$commune->est_actif) {
                return response()->json([
                    'success' => false,
                    'message' => 'La commune spécifiée n\'existe pas ou est inactive'
                ], 422);
            }
        }

        $quartier->update($request->all());
        $quartier->load('commune');

        return response()->json([
            'success' => true,
            'message' => 'Quartier mis à jour avec succès',
            'data' => $quartier
        ]);
    }

    /**
     * Supprimer un quartier
     */
    public function destroy($id)
    {
        $quartier = Quartier::find($id);

        if (!$quartier) {
            return response()->json([
                'success' => false,
                'message' => 'Quartier non trouvé'
            ], 404);
        }

        // Vérifier si le quartier est utilisé (optionnel)
        // Exemple : vérifier si des personnes sont associées à ce quartier
        $personnesCount = \App\Models\Personne::where('quartier', $quartier->nom)->count();
        if ($personnesCount > 0) {
            return response()->json([
                'success' => false,
                'message' => 'Impossible de supprimer ce quartier car il est utilisé par ' . $personnesCount . ' personne(s)',
            ], 403);
        }

        $quartier->delete();

        return response()->json([
            'success' => true,
            'message' => 'Quartier supprimé avec succès'
        ]);
    }

    /**
     * Activer/Désactiver un quartier
     */
    public function toggleActivation($id)
    {
        $quartier = Quartier::find($id);

        if (!$quartier) {
            return response()->json([
                'success' => false,
                'message' => 'Quartier non trouvé'
            ], 404);
        }

        $quartier->est_actif = !$quartier->est_actif;
        $quartier->save();

        return response()->json([
            'success' => true,
            'message' => $quartier->est_actif ? 'Quartier activé avec succès' : 'Quartier désactivé avec succès',
            'data' => $quartier
        ]);
    }

    /**
     * Obtenir les quartiers d'une commune spécifique
     */
    public function parCommune($communeId)
    {
        $commune = Commune::find($communeId);

        if (!$commune) {
            return response()->json([
                'success' => false,
                'message' => 'Commune non trouvée'
            ], 404);
        }

        $quartiers = $commune->quartiers()
            ->where('est_actif', true)
            ->orderBy('nom')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $quartiers,
            'commune' => $commune
        ]);
    }

    /**
     * Statistiques des quartiers
     */
    public function statistiques()
    {
        $stats = [
            'total' => Quartier::count(),
            'actifs' => Quartier::where('est_actif', true)->count(),
            'inactifs' => Quartier::where('est_actif', false)->count(),
            'par_commune' => Quartier::select('commune_id')
                ->with('commune')
                ->selectRaw('count(*) as total')
                ->groupBy('commune_id')
                ->orderBy('total', 'desc')
                ->limit(10)
                ->get()
                ->map(function ($item) {
                    return [
                        'commune' => $item->commune->nom ?? 'N/A',
                        'commune_code' => $item->commune->code ?? 'N/A',
                        'total' => $item->total
                    ];
                }),
        ];

        return response()->json([
            'success' => true,
            'data' => $stats
        ]);
    }
}