<?php

namespace App\Http\Controllers;

use App\Models\Taxe;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class TaxeController extends Controller
{
    /**
     * Liste des taxes avec pagination et recherche
     */
    public function index(Request $request)
    {
        $query = Taxe::query();

        // Recherche
        if ($request->has('search') && !empty($request->search)) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('nom', 'LIKE', "%{$search}%")
                  ->orWhere('code', 'LIKE', "%{$search}%")
                  ->orWhere('description', 'LIKE', "%{$search}%")
                  ->orWhere('categorie', 'LIKE', "%{$search}%");
            });
        }

        // Filtres
        if ($request->has('categorie') && !empty($request->categorie)) {
            $query->where('categorie', $request->categorie);
        }

        if ($request->has('periodicite') && !empty($request->periodicite)) {
            $query->where('periodicite', $request->periodicite);
        }

        if ($request->has('unite') && !empty($request->unite)) {
            $query->where('unite', $request->unite);
        }

        if ($request->has('est_actif')) {
            $query->where('est_actif', filter_var($request->est_actif, FILTER_VALIDATE_BOOLEAN));
        }

        if ($request->has('est_locale')) {
            $query->where('est_locale', filter_var($request->est_locale, FILTER_VALIDATE_BOOLEAN));
        }

        // Dates
        if ($request->has('date_debut') && !empty($request->date_debut)) {
            $query->whereDate('created_at', '>=', $request->date_debut);
        }

        if ($request->has('date_fin') && !empty($request->date_fin)) {
            $query->whereDate('created_at', '<=', $request->date_fin);
        }

        // Tri
        $sortField = $request->get('sort', 'created_at');
        $sortOrder = $request->get('order', 'desc');
        
        $allowedSorts = ['id', 'code', 'nom', 'categorie', 'taux', 'periodicite', 'est_actif', 'created_at'];
        if (in_array($sortField, $allowedSorts)) {
            $query->orderBy($sortField, $sortOrder);
        }

        // Pagination
        $perPage = $request->get('per_page', 20);
        $perPage = min($perPage, 100);

        $taxes = $query->withCount('declarationsPaiements')->paginate($perPage);

        // Décoder le bareme pour chaque taxe
        foreach ($taxes as $taxe) {
            if ($taxe->bareme && is_string($taxe->bareme)) {
                $taxe->bareme = json_decode($taxe->bareme, true);
            }
        }

        return response()->json([
            'success' => true,
            'data' => $taxes->items(),
            'pagination' => [
                'current_page' => $taxes->currentPage(),
                'per_page' => $taxes->perPage(),
                'total' => $taxes->total(),
                'last_page' => $taxes->lastPage(),
                'from' => $taxes->firstItem(),
                'to' => $taxes->lastItem(),
                'next_page_url' => $taxes->nextPageUrl(),
                'prev_page_url' => $taxes->previousPageUrl(),
            ],
            'filters' => $request->all()
        ]);
    }

    /**
     * Créer une nouvelle taxe - CORRIGÉ
     */
    public function store(Request $request)
    {
        // Valider sans le bareme pour éviter l'erreur
        $validator = Validator::make($request->all(), [
            'code' => 'required|string|max:20|unique:taxes,code',
            'nom' => 'required|string|max:255',
            'categorie' => 'required|in:patente,foncier,revenus_locatifs,personnel_minimum,vehicule,permis_construire,etalage,peage_urbain,pont_bascule,chargement,dechargement,autre',
            'description' => 'nullable|string',
            'taux' => 'nullable|numeric|min:0',
            'unite' => 'required|in:pourcentage,montant_fixe,par_unite',
            'periodicite' => 'required|in:journaliere,hebdomadaire,mensuelle,trimestrielle,semestrielle,annuelle,evenementielle',
            'est_actif' => 'boolean',
            'est_locale' => 'boolean',
        ]);

        // Ajouter la validation du bareme séparément si présent
        if ($request->has('bareme') && is_string($request->bareme)) {
            $validator = Validator::make($request->all(), [
                'bareme' => 'nullable|json',
            ]);
            
            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'errors' => $validator->errors()
                ], 422);
            }
        }

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        $data = $request->all();
        $data['est_actif'] = $request->est_actif ?? true;
        $data['est_locale'] = $request->est_locale ?? true;

        // ============================================================
        // GESTION DU BAREME : Accepter OBJET ou STRING JSON
        // ============================================================
        if ($request->has('bareme')) {
            $bareme = $request->input('bareme');
            
            // Si c'est un tableau (objet), le convertir en JSON string
            if (is_array($bareme)) {
                $data['bareme'] = json_encode($bareme);
            }
            // Si c'est une chaîne, vérifier que c'est du JSON valide
            elseif (is_string($bareme)) {
                $bareme = trim($bareme);
                json_decode($bareme);
                if (json_last_error() === JSON_ERROR_NONE) {
                    $data['bareme'] = $bareme;
                } else {
                    return response()->json([
                        'success' => false,
                        'errors' => [
                            'bareme' => ['Le bareme doit être un JSON valide. Format attendu: {"categories": {...}}']
                        ]
                    ], 422);
                }
            }
        }

        $taxe = Taxe::create($data);

        // Décoder le bareme pour la réponse
        if ($taxe->bareme && is_string($taxe->bareme)) {
            $taxe->bareme = json_decode($taxe->bareme, true);
        }

        return response()->json([
            'success' => true,
            'message' => 'Taxe créée avec succès',
            'data' => $taxe
        ], 201);
    }

    /**
     * Afficher une taxe
     */
    public function show($id)
    {
        $taxe = Taxe::withCount('declarationsPaiements')
                    ->with('declarationsPaiements')
                    ->find($id);

        if (!$taxe) {
            return response()->json([
                'success' => false,
                'message' => 'Taxe non trouvée'
            ], 404);
        }

        // Décoder le bareme
        if ($taxe->bareme && is_string($taxe->bareme)) {
            $taxe->bareme = json_decode($taxe->bareme, true);
        }

        return response()->json([
            'success' => true,
            'data' => $taxe
        ]);
    }

    /**
     * Mettre à jour une taxe - CORRIGÉ
     */
    public function update(Request $request, $id)
    {
        $taxe = Taxe::find($id);

        if (!$taxe) {
            return response()->json([
                'success' => false,
                'message' => 'Taxe non trouvée'
            ], 404);
        }

        // Valider sans le bareme pour éviter l'erreur
        $validator = Validator::make($request->all(), [
            'code' => 'sometimes|string|max:20|unique:taxes,code,' . $id,
            'nom' => 'sometimes|string|max:255',
            'categorie' => 'sometimes|in:patente,foncier,revenus_locatifs,personnel_minimum,vehicule,permis_construire,etalage,peage_urbain,pont_bascule,chargement,dechargement,autre',
            'description' => 'nullable|string',
            'taux' => 'nullable|numeric|min:0',
            'unite' => 'sometimes|in:pourcentage,montant_fixe,par_unite',
            'periodicite' => 'sometimes|in:journaliere,hebdomadaire,mensuelle,trimestrielle,semestrielle,annuelle,evenementielle',
            'est_actif' => 'boolean',
            'est_locale' => 'boolean',
        ]);

        // Ajouter la validation du bareme séparément si présent
        if ($request->has('bareme') && is_string($request->bareme)) {
            $validator = Validator::make($request->all(), [
                'bareme' => 'nullable|json',
            ]);
            
            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'errors' => $validator->errors()
                ], 422);
            }
        }

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        $data = $request->all();

        // Gérer le bareme
        if ($request->has('bareme')) {
            $bareme = $request->input('bareme');
            
            if (is_array($bareme)) {
                $data['bareme'] = json_encode($bareme);
            } elseif (is_string($bareme)) {
                $bareme = trim($bareme);
                json_decode($bareme);
                if (json_last_error() === JSON_ERROR_NONE) {
                    $data['bareme'] = $bareme;
                } else {
                    return response()->json([
                        'success' => false,
                        'errors' => [
                            'bareme' => ['Le bareme doit être un JSON valide']
                        ]
                    ], 422);
                }
            }
        }

        $taxe->update($data);

        // Décoder le bareme pour la réponse
        if ($taxe->bareme && is_string($taxe->bareme)) {
            $taxe->bareme = json_decode($taxe->bareme, true);
        }

        return response()->json([
            'success' => true,
            'message' => 'Taxe mise à jour avec succès',
            'data' => $taxe
        ]);
    }

    /**
     * Supprimer une taxe
     */
    public function destroy($id)
    {
        $taxe = Taxe::withCount('declarationsPaiements')->find($id);

        if (!$taxe) {
            return response()->json([
                'success' => false,
                'message' => 'Taxe non trouvée'
            ], 404);
        }

        if ($taxe->declarations_paiements_count > 0) {
            return response()->json([
                'success' => false,
                'message' => 'Impossible de supprimer cette taxe car elle est utilisée dans ' . $taxe->declarations_paiements_count . ' déclaration(s)',
                'declarations_count' => $taxe->declarations_paiements_count
            ], 403);
        }

        $taxe->delete();

        return response()->json([
            'success' => true,
            'message' => 'Taxe supprimée avec succès'
        ]);
    }

    /**
     * Activer/Désactiver une taxe
     */
    public function toggleActivation($id)
    {
        $taxe = Taxe::find($id);

        if (!$taxe) {
            return response()->json([
                'success' => false,
                'message' => 'Taxe non trouvée'
            ], 404);
        }

        $taxe->est_actif = !$taxe->est_actif;
        $taxe->save();

        return response()->json([
            'success' => true,
            'message' => $taxe->est_actif ? 'Taxe activée avec succès' : 'Taxe désactivée avec succès',
            'data' => $taxe
        ]);
    }

    /**
     * Obtenir les catégories disponibles
     */
    public function categories()
    {
        $categories = [
            'patente' => 'Patente',
            'foncier' => 'Foncier',
            'revenus_locatifs' => 'Revenus locatifs',
            'personnel_minimum' => 'Personnel minimum',
            'vehicule' => 'Véhicule',
            'permis_construire' => 'Permis de construire',
            'etalage' => 'Étalage',
            'autre' => 'Autre',
        ];

        return response()->json([
            'success' => true,
            'data' => $categories
        ]);
    }

    /**
     * Obtenir les périodicités disponibles
     */
    public function periodicites()
    {
        $periodicites = [
            'mensuelle' => 'Mensuelle',
            'trimestrielle' => 'Trimestrielle',
            'semestrielle' => 'Semestrielle',
            'annuelle' => 'Annuelle',
            'evenementielle' => 'Événementielle',
        ];

        return response()->json([
            'success' => true,
            'data' => $periodicites
        ]);
    }

    /**
     * Obtenir les unités disponibles
     */
    public function unites()
    {
        $unites = [
            'pourcentage' => 'Pourcentage (%)',
            'montant_fixe' => 'Montant fixe',
            'par_unite' => 'Par unité',
        ];

        return response()->json([
            'success' => true,
            'data' => $unites
        ]);
    }

    /**
     * Statistiques des taxes
     */
    public function statistiques()
    {
        $stats = [
            'total' => Taxe::count(),
            'actives' => Taxe::where('est_actif', true)->count(),
            'inactives' => Taxe::where('est_actif', false)->count(),
            'locales' => Taxe::where('est_locale', true)->count(),
            'nationales' => Taxe::where('est_locale', false)->count(),
            'par_categorie' => Taxe::select('categorie')
                ->selectRaw('count(*) as total')
                ->groupBy('categorie')
                ->orderBy('total', 'desc')
                ->get(),
            'par_periodicite' => Taxe::select('periodicite')
                ->selectRaw('count(*) as total')
                ->groupBy('periodicite')
                ->orderBy('total', 'desc')
                ->get(),
            'par_unite' => Taxe::select('unite')
                ->selectRaw('count(*) as total')
                ->groupBy('unite')
                ->orderBy('total', 'desc')
                ->get(),
            'plus_utilisees' => Taxe::withCount('declarationsPaiements')
                ->having('declarations_paiements_count', '>', 0)
                ->orderBy('declarations_paiements_count', 'desc')
                ->limit(10)
                ->get(['id', 'code', 'nom', 'categorie']),
            'taux_moyen' => Taxe::whereNotNull('taux')->avg('taux'),
        ];

        return response()->json([
            'success' => true,
            'data' => $stats
        ]);
    }
}