<?php

namespace App\Http\Controllers;

use App\Models\ActiviteEconomique;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class ActiviteEconomiqueController extends Controller
{
    /**
     * Liste des activités économiques avec pagination et recherche
     * 
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function index(Request $request)
    {
        $query = ActiviteEconomique::query();

        // ============================================================
        // RECHERCHE
        // ============================================================
        if ($request->has('search') && !empty($request->search)) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('nom', 'LIKE', "%{$search}%")
                  ->orWhere('code', 'LIKE', "%{$search}%")
                  ->orWhere('secteur', 'LIKE', "%{$search}%")
                  ->orWhere('description', 'LIKE', "%{$search}%");
            });
        }

        // ============================================================
        // FILTRES
        // ============================================================
        
        // Filtre par secteur
        if ($request->has('secteur') && !empty($request->secteur)) {
            $query->where('secteur', $request->secteur);
        }

        // Filtre par statut actif
        if ($request->has('est_actif')) {
            $query->where('est_actif', filter_var($request->est_actif, FILTER_VALIDATE_BOOLEAN));
        }

        // ============================================================
        // TRI
        // ============================================================
        $sortField = $request->get('sort', 'nom');
        $sortOrder = $request->get('order', 'asc');
        
        $allowedSorts = ['id', 'code', 'nom', 'secteur', 'est_actif', 'created_at'];
        if (in_array($sortField, $allowedSorts)) {
            $query->orderBy($sortField, $sortOrder);
        }

        // ============================================================
        // PAGINATION (20 par défaut)
        // ============================================================
        $perPage = $request->get('per_page', 20);
        $perPage = min($perPage, 100); // Limite à 100 maximum

        $activites = $query->withCount('personnes')->paginate($perPage);

        return response()->json([
            'success' => true,
            'data' => $activites->items(),
            'pagination' => [
                'current_page' => $activites->currentPage(),
                'per_page' => $activites->perPage(),
                'total' => $activites->total(),
                'last_page' => $activites->lastPage(),
                'from' => $activites->firstItem(),
                'to' => $activites->lastItem(),
                'next_page_url' => $activites->nextPageUrl(),
                'prev_page_url' => $activites->previousPageUrl(),
            ],
            'filters' => $request->all()
        ]);
    }

    /**
     * Créer une nouvelle activité économique
     * 
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'code' => 'required|string|max:20|unique:activites_economiques,code',
            'nom' => 'required|string|max:255',
            'secteur' => 'nullable|string|max:100',
            'description' => 'nullable|string',
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

        $activite = ActiviteEconomique::create($data);

        return response()->json([
            'success' => true,
            'message' => 'Activité économique créée avec succès',
            'data' => $activite
        ], 201);
    }

    /**
     * Afficher une activité économique
     * 
     * @param int $id
     * @return \Illuminate\Http\JsonResponse
     */
    public function show($id)
    {
        $activite = ActiviteEconomique::with([
            'personnes' => function ($query) {
                $query->where('est_actif', true)
                      ->limit(10);
            }
        ])->withCount('personnes')->find($id);

        if (!$activite) {
            return response()->json([
                'success' => false,
                'message' => 'Activité économique non trouvée'
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => $activite
        ]);
    }

    /**
     * Mettre à jour une activité économique
     * 
     * @param Request $request
     * @param int $id
     * @return \Illuminate\Http\JsonResponse
     */
    public function update(Request $request, $id)
    {
        $activite = ActiviteEconomique::find($id);

        if (!$activite) {
            return response()->json([
                'success' => false,
                'message' => 'Activité économique non trouvée'
            ], 404);
        }

        $validator = Validator::make($request->all(), [
            'code' => 'sometimes|string|max:20|unique:activites_economiques,code,' . $id,
            'nom' => 'sometimes|string|max:255',
            'secteur' => 'nullable|string|max:100',
            'description' => 'nullable|string',
            'est_actif' => 'boolean',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        $activite->update($request->all());

        return response()->json([
            'success' => true,
            'message' => 'Activité économique mise à jour avec succès',
            'data' => $activite
        ]);
    }

    /**
     * Supprimer une activité économique
     * 
     * @param int $id
     * @return \Illuminate\Http\JsonResponse
     */
    public function destroy($id)
    {
        $activite = ActiviteEconomique::withCount('personnes')->find($id);

        if (!$activite) {
            return response()->json([
                'success' => false,
                'message' => 'Activité économique non trouvée'
            ], 404);
        }

        // Vérifier si l'activité est utilisée par des opérateurs
        if ($activite->personnes_count > 0) {
            return response()->json([
                'success' => false,
                'message' => 'Impossible de supprimer cette activité car elle est utilisée par ' . $activite->personnes_count . ' opérateur(s)',
                'personnes_count' => $activite->personnes_count
            ], 403);
        }

        $activite->delete();

        return response()->json([
            'success' => true,
            'message' => 'Activité économique supprimée avec succès'
        ]);
    }

    /**
     * Activer/Désactiver une activité
     * 
     * @param int $id
     * @return \Illuminate\Http\JsonResponse
     */
    public function toggleActivation($id)
    {
        $activite = ActiviteEconomique::find($id);

        if (!$activite) {
            return response()->json([
                'success' => false,
                'message' => 'Activité économique non trouvée'
            ], 404);
        }

        $activite->est_actif = !$activite->est_actif;
        $activite->save();

        return response()->json([
            'success' => true,
            'message' => $activite->est_actif ? 'Activité activée avec succès' : 'Activité désactivée avec succès',
            'data' => $activite
        ]);
    }

    /**
     * Liste des secteurs disponibles
     * 
     * @return \Illuminate\Http\JsonResponse
     */
    public function secteurs()
    {
        $secteurs = ActiviteEconomique::where('est_actif', true)
            ->select('secteur')
            ->distinct()
            ->whereNotNull('secteur')
            ->orderBy('secteur')
            ->pluck('secteur');

        return response()->json([
            'success' => true,
            'data' => $secteurs
        ]);
    }

    /**
     * Statistiques des activités
     * 
     * @return \Illuminate\Http\JsonResponse
     */
    public function statistiques()
    {
        $stats = [
            'total' => ActiviteEconomique::count(),
            'actives' => ActiviteEconomique::where('est_actif', true)->count(),
            'inactives' => ActiviteEconomique::where('est_actif', false)->count(),
            'par_secteur' => ActiviteEconomique::select('secteur')
                ->selectRaw('count(*) as total')
                ->whereNotNull('secteur')
                ->groupBy('secteur')
                ->orderBy('total', 'desc')
                ->get(),
            'top_activites' => ActiviteEconomique::withCount('personnes')
                ->having('personnes_count', '>', 0)
                ->orderBy('personnes_count', 'desc')
                ->limit(10)
                ->get(['id', 'code', 'nom', 'secteur'])
        ];

        return response()->json([
            'success' => true,
            'data' => $stats
        ]);
    }
}