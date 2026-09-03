<?php

namespace App\Http\Controllers;

use App\Traits\OperateurScope;
use App\Models\BienImmobilier;
use App\Models\Personne;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class BienImmobilierController extends Controller
{
    use OperateurScope;

    /**
     * Liste des biens immobiliers avec pagination et recherche
     */
    public function index(Request $request)
    {
        $query = BienImmobilier::with('proprietaire');
        $this->scopeOperateur($query, $request, 'proprietaire_id');

        // Recherche
        if ($request->has('search') && !empty($request->search)) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('adresse', 'LIKE', "%{$search}%")
                  ->orWhere('quartier', 'LIKE', "%{$search}%")
                  ->orWhere('commune', 'LIKE', "%{$search}%")
                  ->orWhere('parcelle_id', 'LIKE', "%{$search}%")
                  ->orWhere('type_bien', 'LIKE', "%{$search}%")
                  ->orWhereHas('proprietaire', function ($pq) use ($search) {
                      $pq->where('nom', 'LIKE', "%{$search}%")
                         ->orWhere('prenom', 'LIKE', "%{$search}%")
                         ->orWhere('denomination_sociale', 'LIKE', "%{$search}%")
                         ->orWhere('email', 'LIKE', "%{$search}%");
                  });
            });
        }

        // Filtres
        if ($request->has('proprietaire_id') && !empty($request->proprietaire_id)) {
            $query->where('proprietaire_id', $request->proprietaire_id);
        }

        if ($request->has('type_bien') && !empty($request->type_bien)) {
            $query->where('type_bien', $request->type_bien);
        }

        if ($request->has('commune') && !empty($request->commune)) {
            $query->where('commune', 'LIKE', "%{$request->commune}%");
        }

        if ($request->has('quartier') && !empty($request->quartier)) {
            $query->where('quartier', 'LIKE', "%{$request->quartier}%");
        }

        if ($request->has('est_actif')) {
            $query->where('est_actif', filter_var($request->est_actif, FILTER_VALIDATE_BOOLEAN));
        }

        // Filtres par valeur locative
        if ($request->has('valeur_locative_min') && !empty($request->valeur_locative_min)) {
            $query->where('valeur_locative', '>=', $request->valeur_locative_min);
        }

        if ($request->has('valeur_locative_max') && !empty($request->valeur_locative_max)) {
            $query->where('valeur_locative', '<=', $request->valeur_locative_max);
        }

        // Filtres par valeur vénale
        if ($request->has('valeur_venale_min') && !empty($request->valeur_venale_min)) {
            $query->where('valeur_venale', '>=', $request->valeur_venale_min);
        }

        if ($request->has('valeur_venale_max') && !empty($request->valeur_venale_max)) {
            $query->where('valeur_venale', '<=', $request->valeur_venale_max);
        }

        // Filtres par superficie
        if ($request->has('superficie_min') && !empty($request->superficie_min)) {
            $query->where('superficie', '>=', $request->superficie_min);
        }

        if ($request->has('superficie_max') && !empty($request->superficie_max)) {
            $query->where('superficie', '<=', $request->superficie_max);
        }

        // Filtre par classement
        if ($request->has('classement') && in_array($request->classement, [1, 2, 3, 4])) {
            $query->where('classement', $request->classement);
        }

        // Tri
        $sortField = $request->get('sort', 'created_at');
        $sortOrder = $request->get('order', 'desc');
        $allowedSorts = ['id', 'type_bien', 'superficie', 'valeur_locative', 'valeur_venale', 'commune', 'created_at'];
        if (in_array($sortField, $allowedSorts)) {
            $query->orderBy($sortField, $sortOrder);
        }

        // Pagination
        $perPage = $request->get('per_page', 20);
        $perPage = min($perPage, 100);

        $biens = $query->paginate($perPage);

        return response()->json([
            'success' => true,
            'data' => $biens->items(),
            'pagination' => [
                'current_page' => $biens->currentPage(),
                'per_page' => $biens->perPage(),
                'total' => $biens->total(),
                'last_page' => $biens->lastPage(),
                'from' => $biens->firstItem(),
                'to' => $biens->lastItem(),
                'next_page_url' => $biens->nextPageUrl(),
                'prev_page_url' => $biens->previousPageUrl(),
            ],
            'filters' => $request->all()
        ]);
    }

    /**
     * Créer un bien immobilier
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'proprietaire_id' => 'required|exists:personnes,id',
            'adresse' => 'required|string|max:255',
            'quartier' => 'nullable|string|max:100',
            'commune' => 'nullable|string|max:100',
            'id_quartier' => 'nullable|exists:quartiers,id',
            'parcelle_id' => 'nullable|string|max:50',
            'type_bien' => 'required|in:terrain,maison,appartement,immeuble,local_commercial,entrepot,autre',
            'superficie' => 'nullable|numeric|min:0',
            'valeur_locative' => 'nullable|numeric|min:0',
            'valeur_venale' => 'nullable|numeric|min:0',
            'classement' => 'nullable|integer|in:1,2,3,4',
            'est_actif' => 'boolean',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        // Vérifier que le propriétaire existe
        $proprietaire = Personne::find($request->proprietaire_id);
        if (!$proprietaire) {
            return response()->json([
                'success' => false,
                'message' => 'Propriétaire non trouvé'
            ], 404);
        }

        $data = $request->all();
        $data['est_actif'] = $request->est_actif ?? true;

        $bien = BienImmobilier::create($data);
        $bien->load('proprietaire');

        return response()->json([
            'success' => true,
            'message' => 'Bien immobilier créé avec succès',
            'data' => $bien
        ], 201);
    }

    /**
     * Afficher un bien immobilier
     */
    public function show($id)
    {
        $bien = BienImmobilier::with(['proprietaire', 'quartier', 'declarationsPaiements'])->find($id);

        if (!$bien) {
            return response()->json([
                'success' => false,
                'message' => 'Bien immobilier non trouvé'
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => $bien
        ]);
    }

    /**
     * Mettre à jour un bien immobilier
     */
    public function update(Request $request, $id)
    {
        $bien = BienImmobilier::find($id);

        if (!$bien) {
            return response()->json([
                'success' => false,
                'message' => 'Bien immobilier non trouvé'
            ], 404);
        }

        $validator = Validator::make($request->all(), [
            'proprietaire_id' => 'sometimes|exists:personnes,id',
            'adresse' => 'sometimes|string|max:255',
            'quartier' => 'nullable|string|max:100',
            'commune' => 'nullable|string|max:100',
            'id_quartier' => 'nullable|exists:quartiers,id',
            'parcelle_id' => 'nullable|string|max:50',
            'type_bien' => 'sometimes|in:terrain,maison,appartement,immeuble,local_commercial,entrepot,autre',
            'superficie' => 'nullable|numeric|min:0',
            'valeur_locative' => 'nullable|numeric|min:0',
            'valeur_venale' => 'nullable|numeric|min:0',
            'classement' => 'nullable|integer|in:1,2,3,4',
            'est_actif' => 'boolean',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        $bien->update($request->all());
        $bien->load('proprietaire');

        return response()->json([
            'success' => true,
            'message' => 'Bien immobilier mis à jour avec succès',
            'data' => $bien
        ]);
    }

    /**
     * Supprimer un bien immobilier
     */
    public function destroy($id)
    {
        $bien = BienImmobilier::withCount('declarationsPaiements')->find($id);

        if (!$bien) {
            return response()->json([
                'success' => false,
                'message' => 'Bien immobilier non trouvé'
            ], 404);
        }

        // Vérifier si le bien est utilisé dans des déclarations
        if ($bien->declarations_paiements_count > 0) {
            return response()->json([
                'success' => false,
                'message' => 'Impossible de supprimer ce bien car il est utilisé dans ' . $bien->declarations_paiements_count . ' déclaration(s)',
                'declarations_count' => $bien->declarations_paiements_count
            ], 403);
        }

        $bien->delete();

        return response()->json([
            'success' => true,
            'message' => 'Bien immobilier supprimé avec succès'
        ]);
    }

    /**
     * Activer/Désactiver un bien immobilier
     */
    public function toggleActivation($id)
    {
        $bien = BienImmobilier::find($id);

        if (!$bien) {
            return response()->json([
                'success' => false,
                'message' => 'Bien immobilier non trouvé'
            ], 404);
        }

        $bien->est_actif = !$bien->est_actif;
        $bien->save();

        return response()->json([
            'success' => true,
            'message' => $bien->est_actif ? 'Bien immobilier activé avec succès' : 'Bien immobilier désactivé avec succès',
            'data' => $bien
        ]);
    }

    /**
     * Types de biens immobiliers disponibles
     */
    public function types()
    {
        $types = [
            'terrain' => 'Terrain',
            'maison' => 'Maison',
            'appartement' => 'Appartement',
            'immeuble' => 'Immeuble',
            'local_commercial' => 'Local commercial',
            'entrepot' => 'Entrepôt',
            'autre' => 'Autre',
        ];

        return response()->json([
            'success' => true,
            'data' => $types
        ]);
    }

    /**
     * Statistiques des biens immobiliers
     */
    public function statistiques(Request $request)
    {
        $query = BienImmobilier::query();
        $this->scopeOperateur($query, $request, 'proprietaire_id');

        $stats = [
            'total' => (clone $query)->count(),
            'actifs' => (clone $query)->where('est_actif', true)->count(),
            'inactifs' => (clone $query)->where('est_actif', false)->count(),
            'par_type' => (clone $query)->select('type_bien')
                ->selectRaw('count(*) as total')
                ->groupBy('type_bien')
                ->orderBy('total', 'desc')
                ->get()
                ->map(function ($item) {
                    return [
                        'type' => $item->type_bien_label,
                        'total' => $item->total
                    ];
                }),
            'par_commune' => (clone $query)->select('commune')
                ->selectRaw('count(*) as total')
                ->whereNotNull('commune')
                ->where('commune', '!=', '')
                ->groupBy('commune')
                ->orderBy('total', 'desc')
                ->limit(10)
                ->get(),
            'par_proprietaire' => (clone $query)->select('proprietaire_id')
                ->with('proprietaire')
                ->selectRaw('count(*) as total')
                ->groupBy('proprietaire_id')
                ->orderBy('total', 'desc')
                ->limit(10)
                ->get()
                ->map(function ($item) {
                    return [
                        'proprietaire' => $item->proprietaire->nom_complet ?? $item->proprietaire->denomination_sociale ?? 'N/A',
                        'total' => $item->total
                    ];
                }),
            'superficie_totale' => (clone $query)->sum('superficie'),
            'superficie_moyenne' => (clone $query)->avg('superficie'),
            'valeur_locative_totale' => (clone $query)->sum('valeur_locative'),
            'valeur_locative_moyenne' => (clone $query)->avg('valeur_locative'),
            'valeur_venale_totale' => (clone $query)->sum('valeur_venale'),
            'valeur_venale_moyenne' => (clone $query)->avg('valeur_venale'),
            'par_classement' => (clone $query)->select('classement')
                ->selectRaw('count(*) as total')
                ->whereNotNull('classement')
                ->groupBy('classement')
                ->orderBy('classement')
                ->get()
                ->map(function ($item) {
                    $labels = [
                        1 => '1er rang',
                        2 => '2e rang',
                        3 => '3e rang',
                        4 => '4e rang',
                    ];
                    return [
                        'classement' => $labels[$item->classement] ?? $item->classement,
                        'total' => $item->total
                    ];
                }),
        ];

        return response()->json([
            'success' => true,
            'data' => $stats
        ]);
    }

    /**
     * Exporter les biens immobiliers en CSV
     */
    public function export(Request $request)
    {
        $query = BienImmobilier::with('proprietaire');

        if ($request->has('type_bien')) {
            $query->where('type_bien', $request->type_bien);
        }

        if ($request->has('commune')) {
            $query->where('commune', 'LIKE', "%{$request->commune}%");
        }

        if ($request->has('est_actif')) {
            $query->where('est_actif', filter_var($request->est_actif, FILTER_VALIDATE_BOOLEAN));
        }

        $biens = $query->orderBy('created_at', 'desc')->get();

        $headers = [
            'Content-Type' => 'text/csv',
            'Content-Disposition' => 'attachment; filename="biens_immobiliers_' . date('Y-m-d') . '.csv"',
        ];

        $callback = function() use ($biens) {
            $file = fopen('php://output', 'w');
            
            fputcsv($file, [
                'ID',
                'Propriétaire',
                'Adresse',
                'Quartier',
                'Commune',
                'Parcelle',
                'Type',
                'Superficie (m²)',
                'Valeur Locative (FC)',
                'Valeur Vénale (FC)',
                'Classement',
                'Statut',
                'Créé le'
            ]);

            foreach ($biens as $b) {
                fputcsv($file, [
                    $b->id,
                    $b->proprietaire->nom_complet ?? $b->proprietaire->denomination_sociale ?? 'N/A',
                    $b->adresse,
                    $b->quartier ?? 'N/A',
                    $b->commune ?? 'N/A',
                    $b->parcelle_id ?? 'N/A',
                    $b->type_bien_label,
                    $b->superficie ?? 'N/A',
                    $b->valeur_locative ? number_format($b->valeur_locative, 0, ',', ' ') : 'N/A',
                    $b->valeur_venale ? number_format($b->valeur_venale, 0, ',', ' ') : 'N/A',
                    $b->classement_label ?? 'N/A',
                    $b->est_actif ? 'Actif' : 'Inactif',
                    $b->created_at ? $b->created_at->format('d/m/Y H:i') : 'N/A'
                ]);
            }

            fclose($file);
        };

        return response()->stream($callback, 200, $headers);
    }

    /**
     * Obtenir les biens d'un propriétaire spécifique
     */
    public function parProprietaire($proprietaireId)
    {
        $proprietaire = Personne::find($proprietaireId);

        if (!$proprietaire) {
            return response()->json([
                'success' => false,
                'message' => 'Propriétaire non trouvé'
            ], 404);
        }

        $biens = $proprietaire->biensImmobiliers()
            ->where('est_actif', true)
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $biens,
            'proprietaire' => $proprietaire
        ]);
    }

    /**
     * Obtenir les biens par type
     */
    public function parType($type)
    {
        $validTypes = ['terrain', 'maison', 'appartement', 'immeuble', 'local_commercial', 'entrepot', 'autre'];
        
        if (!in_array($type, $validTypes)) {
            return response()->json([
                'success' => false,
                'message' => 'Type de bien invalide. Types valides: ' . implode(', ', $validTypes)
            ], 422);
        }

        $biens = BienImmobilier::with('proprietaire')
            ->where('type_bien', $type)
            ->where('est_actif', true)
            ->orderBy('valeur_locative', 'desc')
            ->get();

        return response()->json([
            'success' => true,
            'type' => $biens->first()?->type_bien_label ?? $type,
            'total' => $biens->count(),
            'data' => $biens
        ]);
    }
}