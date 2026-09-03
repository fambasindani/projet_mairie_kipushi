<?php

namespace App\Http\Controllers;

use App\Traits\OperateurScope;
use App\Models\Vehicule;
use App\Models\Personne;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class VehiculeController extends Controller
{
    use OperateurScope;

    /**
     * Liste des véhicules avec pagination et recherche
     */
    public function index(Request $request)
    {
        $query = Vehicule::with('proprietaire');
        $this->scopeOperateur($query, $request, 'proprietaire_id');

        // Recherche
        if ($request->has('search') && !empty($request->search)) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('plaque_immatriculation', 'LIKE', "%{$search}%")
                  ->orWhere('marque', 'LIKE', "%{$search}%")
                  ->orWhere('modele', 'LIKE', "%{$search}%")
                  ->orWhere('couleur', 'LIKE', "%{$search}%")
                  ->orWhere('type_vehicule', 'LIKE', "%{$search}%")
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

        if ($request->has('type_vehicule') && !empty($request->type_vehicule)) {
            $query->where('type_vehicule', $request->type_vehicule);
        }

        if ($request->has('marque') && !empty($request->marque)) {
            $query->where('marque', 'LIKE', "%{$request->marque}%");
        }

        if ($request->has('est_actif')) {
            $query->where('est_actif', filter_var($request->est_actif, FILTER_VALIDATE_BOOLEAN));
        }

        if ($request->has('annee_min') && !empty($request->annee_min)) {
            $query->where('annee_fabrication', '>=', $request->annee_min);
        }

        if ($request->has('annee_max') && !empty($request->annee_max)) {
            $query->where('annee_fabrication', '<=', $request->annee_max);
        }

        if ($request->has('places_min') && !empty($request->places_min)) {
            $query->where('nombre_places', '>=', $request->places_min);
        }

        // Tri
        $sortField = $request->get('sort', 'created_at');
        $sortOrder = $request->get('order', 'desc');
        $allowedSorts = ['id', 'plaque_immatriculation', 'marque', 'modele', 'annee_fabrication', 'type_vehicule', 'created_at'];
        if (in_array($sortField, $allowedSorts)) {
            $query->orderBy($sortField, $sortOrder);
        }

        // Pagination
        $perPage = $request->get('per_page', 20);
        $perPage = min($perPage, 100);

        $vehicules = $query->paginate($perPage);

        return response()->json([
            'success' => true,
            'data' => $vehicules->items(),
            'pagination' => [
                'current_page' => $vehicules->currentPage(),
                'per_page' => $vehicules->perPage(),
                'total' => $vehicules->total(),
                'last_page' => $vehicules->lastPage(),
                'from' => $vehicules->firstItem(),
                'to' => $vehicules->lastItem(),
                'next_page_url' => $vehicules->nextPageUrl(),
                'prev_page_url' => $vehicules->previousPageUrl(),
            ],
            'filters' => $request->all()
        ]);
    }

    /**
     * Créer un véhicule
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'proprietaire_id' => 'required|exists:personnes,id',
            'plaque_immatriculation' => 'required|string|max:20|unique:vehicules,plaque_immatriculation',
            'marque' => 'nullable|string|max:50',
            'modele' => 'nullable|string|max:50',
            'annee_fabrication' => 'nullable|integer|min:1900|max:' . (date('Y') + 1),
            'couleur' => 'nullable|string|max:30',
            'type_vehicule' => 'required|in:voiture,moto,poids_lourd,bus,minibus,taxi,autre',
            'nombre_places' => 'nullable|integer|min:1|max:100',
            'poids' => 'nullable|numeric|min:0',
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

        $vehicule = Vehicule::create($data);
        $vehicule->load('proprietaire');

        return response()->json([
            'success' => true,
            'message' => 'Véhicule créé avec succès',
            'data' => $vehicule
        ], 201);
    }

    /**
     * Afficher un véhicule
     */
    public function show($id)
    {
        $vehicule = Vehicule::with(['proprietaire', 'declarationsPaiements'])->find($id);

        if (!$vehicule) {
            return response()->json([
                'success' => false,
                'message' => 'Véhicule non trouvé'
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => $vehicule
        ]);
    }

    /**
     * Mettre à jour un véhicule
     */
    public function update(Request $request, $id)
    {
        $vehicule = Vehicule::find($id);

        if (!$vehicule) {
            return response()->json([
                'success' => false,
                'message' => 'Véhicule non trouvé'
            ], 404);
        }

        $validator = Validator::make($request->all(), [
            'proprietaire_id' => 'sometimes|exists:personnes,id',
            'plaque_immatriculation' => 'sometimes|string|max:20|unique:vehicules,plaque_immatriculation,' . $id,
            'marque' => 'nullable|string|max:50',
            'modele' => 'nullable|string|max:50',
            'annee_fabrication' => 'nullable|integer|min:1900|max:' . (date('Y') + 1),
            'couleur' => 'nullable|string|max:30',
            'type_vehicule' => 'sometimes|in:voiture,moto,poids_lourd,bus,minibus,taxi,autre',
            'nombre_places' => 'nullable|integer|min:1|max:100',
            'poids' => 'nullable|numeric|min:0',
            'est_actif' => 'boolean',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        $vehicule->update($request->all());
        $vehicule->load('proprietaire');

        return response()->json([
            'success' => true,
            'message' => 'Véhicule mis à jour avec succès',
            'data' => $vehicule
        ]);
    }

    /**
     * Supprimer un véhicule
     */
    public function destroy($id)
    {
        $vehicule = Vehicule::withCount('declarationsPaiements')->find($id);

        if (!$vehicule) {
            return response()->json([
                'success' => false,
                'message' => 'Véhicule non trouvé'
            ], 404);
        }

        if ($vehicule->declarations_paiements_count > 0) {
            return response()->json([
                'success' => false,
                'message' => 'Impossible de supprimer ce véhicule car il est utilisé dans ' . $vehicule->declarations_paiements_count . ' déclaration(s)',
                'declarations_count' => $vehicule->declarations_paiements_count
            ], 403);
        }

        $vehicule->delete();

        return response()->json([
            'success' => true,
            'message' => 'Véhicule supprimé avec succès'
        ]);
    }

    /**
     * Activer/Désactiver un véhicule
     */
    public function toggleActivation($id)
    {
        $vehicule = Vehicule::find($id);

        if (!$vehicule) {
            return response()->json([
                'success' => false,
                'message' => 'Véhicule non trouvé'
            ], 404);
        }

        $vehicule->est_actif = !$vehicule->est_actif;
        $vehicule->save();

        return response()->json([
            'success' => true,
            'message' => $vehicule->est_actif ? 'Véhicule activé avec succès' : 'Véhicule désactivé avec succès',
            'data' => $vehicule
        ]);
    }

    /**
     * Types de véhicules disponibles
     */
    public function types()
    {
        $types = [
            'voiture' => 'Voiture',
            'moto' => 'Moto',
            'poids_lourd' => 'Poids lourd',
            'bus' => 'Bus',
            'minibus' => 'Minibus',
            'taxi' => 'Taxi',
            'autre' => 'Autre',
        ];

        return response()->json([
            'success' => true,
            'data' => $types
        ]);
    }

    /**
     * Statistiques des véhicules
     */
    public function statistiques(Request $request)
    {
        $query = Vehicule::query();
        $this->scopeOperateur($query, $request, 'proprietaire_id');

        $stats = [
            'total' => (clone $query)->count(),
            'actifs' => (clone $query)->where('est_actif', true)->count(),
            'inactifs' => (clone $query)->where('est_actif', false)->count(),
            'par_type' => (clone $query)->select('type_vehicule')
                ->selectRaw('count(*) as total')
                ->groupBy('type_vehicule')
                ->orderBy('total', 'desc')
                ->get()
                ->map(function ($item) {
                    $labels = [
                        'voiture' => 'Voiture',
                        'moto' => 'Moto',
                        'poids_lourd' => 'Poids lourd',
                        'bus' => 'Bus',
                        'minibus' => 'Minibus',
                        'taxi' => 'Taxi',
                        'autre' => 'Autre',
                    ];
                    return [
                        'type' => $labels[$item->type_vehicule] ?? $item->type_vehicule,
                        'total' => $item->total
                    ];
                }),
            'par_marque' => (clone $query)->select('marque')
                ->selectRaw('count(*) as total')
                ->whereNotNull('marque')
                ->where('marque', '!=', '')
                ->groupBy('marque')
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
            'annee_moyenne' => (clone $query)->avg('annee_fabrication'),
            'poids_moyen' => (clone $query)->avg('poids'),
            'places_total' => (clone $query)->sum('nombre_places'),
            'annees_distribution' => (clone $query)->select('annee_fabrication')
                ->selectRaw('count(*) as total')
                ->whereNotNull('annee_fabrication')
                ->groupBy('annee_fabrication')
                ->orderBy('annee_fabrication', 'desc')
                ->limit(10)
                ->get(),
        ];

        return response()->json([
            'success' => true,
            'data' => $stats
        ]);
    }

    /**
     * Exporter les véhicules en CSV
     */
    public function export(Request $request)
    {
        $query = Vehicule::with('proprietaire');

        // Appliquer les filtres
        if ($request->has('type_vehicule')) {
            $query->where('type_vehicule', $request->type_vehicule);
        }

        if ($request->has('est_actif')) {
            $query->where('est_actif', filter_var($request->est_actif, FILTER_VALIDATE_BOOLEAN));
        }

        $vehicules = $query->orderBy('created_at', 'desc')->get();

        $headers = [
            'Content-Type' => 'text/csv',
            'Content-Disposition' => 'attachment; filename="vehicules_' . date('Y-m-d') . '.csv"',
        ];

        $callback = function() use ($vehicules) {
            $file = fopen('php://output', 'w');
            
            // En-têtes CSV
            fputcsv($file, [
                'ID',
                'Propriétaire',
                'Plaque',
                'Marque',
                'Modèle',
                'Année',
                'Couleur',
                'Type',
                'Places',
                'Poids (kg)',
                'Statut',
                'Créé le'
            ]);

            foreach ($vehicules as $v) {
                fputcsv($file, [
                    $v->id,
                    $v->proprietaire->nom_complet ?? $v->proprietaire->denomination_sociale ?? 'N/A',
                    $v->plaque_immatriculation,
                    $v->marque ?? 'N/A',
                    $v->modele ?? 'N/A',
                    $v->annee_fabrication ?? 'N/A',
                    $v->couleur ?? 'N/A',
                    $v->type_vehicule_label,
                    $v->nombre_places ?? 'N/A',
                    $v->poids ?? 'N/A',
                    $v->est_actif ? 'Actif' : 'Inactif',
                    $v->created_at ? $v->created_at->format('d/m/Y H:i') : 'N/A'
                ]);
            }

            fclose($file);
        };

        return response()->stream($callback, 200, $headers);
    }
}