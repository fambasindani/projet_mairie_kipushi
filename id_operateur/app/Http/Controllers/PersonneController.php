<?php

namespace App\Http\Controllers;

use App\Traits\OperateurScope;
use App\Models\Personne;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;

class PersonneController extends Controller
{
    use OperateurScope;

    /**
     * Liste des personnes (opérateurs) avec pagination et recherche
     */
    public function index(Request $request)
    {
        $query = Personne::query();
        $this->scopeOperateur($query, $request, 'id');

        // ============================================================
        // RECHERCHE
        // ============================================================
        if ($request->has('search') && !empty($request->search)) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('nom', 'LIKE', "%{$search}%")
                  ->orWhere('prenom', 'LIKE', "%{$search}%")
                  ->orWhere('denomination_sociale', 'LIKE', "%{$search}%")
                  ->orWhere('email', 'LIKE', "%{$search}%")
                  ->orWhere('telephone', 'LIKE', "%{$search}%")
                  ->orWhere('cni_numero', 'LIKE', "%{$search}%")
                  ->orWhere('adresse', 'LIKE', "%{$search}%");
            });
        }

        // ============================================================
        // FILTRES
        // ============================================================
        
        // Filtre par type (physique/morale)
        if ($request->has('type') && in_array($request->type, ['physique', 'morale'])) {
            $query->where('type', $request->type);
        }

        // Filtre par statut actif
        if ($request->has('est_actif')) {
            $query->where('est_actif', filter_var($request->est_actif, FILTER_VALIDATE_BOOLEAN));
        }

        // Filtre par formalisation
        if ($request->has('est_formalise')) {
            $query->where('est_formalise', filter_var($request->est_formalise, FILTER_VALIDATE_BOOLEAN));
        }

        // Filtre par sexe
        if ($request->has('sexe') && in_array($request->sexe, ['M', 'F'])) {
            $query->where('sexe', $request->sexe);
        }

        // Filtre par commune
        if ($request->has('commune') && !empty($request->commune)) {
            $query->where('commune', 'LIKE', "%{$request->commune}%");
        }

        // Filtre par quartier
        if ($request->has('quartier') && !empty($request->quartier)) {
            $query->where('quartier', 'LIKE', "%{$request->quartier}%");
        }

        // ============================================================
        // FILTRES PAR DATE
        // ============================================================
        
        // Date de création (plage)
        if ($request->has('date_debut') && !empty($request->date_debut)) {
            $query->whereDate('created_at', '>=', $request->date_debut);
        }

        if ($request->has('date_fin') && !empty($request->date_fin)) {
            $query->whereDate('created_at', '<=', $request->date_fin);
        }

        // Date de formalisation (plage)
        if ($request->has('date_formalisation_debut') && !empty($request->date_formalisation_debut)) {
            $query->whereDate('date_formalisation', '>=', $request->date_formalisation_debut);
        }

        if ($request->has('date_formalisation_fin') && !empty($request->date_formalisation_fin)) {
            $query->whereDate('date_formalisation', '<=', $request->date_formalisation_fin);
        }

        // Date de naissance (plage)
        if ($request->has('date_naissance_debut') && !empty($request->date_naissance_debut)) {
            $query->whereDate('date_naissance', '>=', $request->date_naissance_debut);
        }

        if ($request->has('date_naissance_fin') && !empty($request->date_naissance_fin)) {
            $query->whereDate('date_naissance', '<=', $request->date_naissance_fin);
        }

        // ============================================================
        // TRI
        // ============================================================
        $sortField = $request->get('sort', 'created_at');
        $sortOrder = $request->get('order', 'desc');
        
        // Champs autorisés pour le tri
        $allowedSorts = ['id', 'nom', 'prenom', 'email', 'type', 'created_at', 'updated_at', 'est_actif'];
        if (in_array($sortField, $allowedSorts)) {
            $query->orderBy($sortField, $sortOrder);
        }

        // ============================================================
        // PAGINATION (20 par défaut)
        // ============================================================
        $perPage = $request->get('per_page', 20);
        $perPage = min($perPage, 100); // Limite à 100 maximum
        
        $personnes = $query->with(['utilisateur', 'activites'])->paginate($perPage);

        $items = collect($personnes->items())->map(function ($personne) {
            $data = $personne->toArray();
            $data['avatar_url'] = null;
            if (!empty($data['avatar'])) {
                try {
                    if (Storage::disk('public')->exists($data['avatar'])) {
                        $file = Storage::disk('public')->get($data['avatar']);
                        $mime = Storage::disk('public')->mimeType($data['avatar']);
                        $data['avatar_url'] = 'data:' . $mime . ';base64,' . base64_encode($file);
                    }
                } catch (\Exception $e) {
                    $data['avatar_url'] = null;
                }
            }
            return $data;
        });

        // Ajouter les métadonnées de pagination
        return response()->json([
            'success' => true,
            'data' => $items,
            'pagination' => [
                'current_page' => $personnes->currentPage(),
                'per_page' => $personnes->perPage(),
                'total' => $personnes->total(),
                'last_page' => $personnes->lastPage(),
                'from' => $personnes->firstItem(),
                'to' => $personnes->lastItem(),
                'next_page_url' => $personnes->nextPageUrl(),
                'prev_page_url' => $personnes->previousPageUrl(),
            ],
            'filters' => $request->all()
        ]);
    }

    /**
     * Créer une nouvelle personne (opérateur)
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'type' => 'required|in:physique,morale',
            'nom' => 'required_if:type,physique|nullable|string|max:100',
            'prenom' => 'required_if:type,physique|nullable|string|max:100',
            'denomination_sociale' => 'nullable|string|max:255',
            'email' => 'nullable|email|max:100|unique:personnes,email',
            'telephone' => 'nullable|string|max:30',
            'telephone_2' => 'nullable|string|max:30',
            'date_naissance' => 'nullable|date',
            'lieu_naissance' => 'nullable|string|max:100',
            'nationalite' => 'nullable|string|max:100',
            'sexe' => 'nullable|in:M,F',
            'cni_numero' => 'nullable|string|max:50',
            'adresse' => 'nullable|string',
            'commune' => 'nullable|string|max:100',
            'quartier' => 'nullable|string|max:100',
            'ville' => 'nullable|string|max:100',
            'province' => 'nullable|string|max:100',
            'forme_juridique' => 'nullable|string|max:100',
            'est_actif' => 'nullable|boolean',
            'est_formalise' => 'nullable|boolean',
            'activites' => 'nullable|array',
            'activites.*' => 'exists:activites_economiques,id',
            'id_quartier' => 'nullable|exists:quartiers,id',
            'id_province' => 'nullable|exists:provinces,id',
            'id_ville' => 'nullable|exists:villes,id',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        // Préparer les données
        $data = $request->only([
            'type', 'nom', 'prenom', 'date_naissance', 'lieu_naissance',
            'nationalite', 'sexe', 'cni_numero', 'denomination_sociale',
            'forme_juridique', 'date_creation', 'adresse', 'quartier',
            'commune', 'ville', 'province', 'telephone', 'telephone_2',
            'email', 'site_web', 'est_actif', 'est_formalise',
            'date_formalisation', 'latitude', 'longitude', 'avatar',
            'id_quartier', 'id_province', 'id_ville'
        ]);

        // Valeurs par défaut
        $data['est_actif'] = $request->est_actif ?? true;
        $data['est_formalise'] = $request->est_formalise ?? false;

        // Créer la personne
        $personne = Personne::create($data);

        // Associer les activités
        if ($request->has('activites') && is_array($request->activites)) {
            $personne->activites()->attach($request->activites);
        }

        $personne->load(['utilisateur', 'activites']);

        return response()->json([
            'success' => true,
            'message' => 'Opérateur créé avec succès',
            'data' => $personne
        ], 201);
    }

    /**
     * Afficher une personne
     */
    public function show($id)
    {
        $personne = Personne::with([
            'utilisateur',
            'utilisateur.roles',
            'identifiantsOfficiels',
            'activites',
            'biensImmobiliers',
            'vehicules',
            'permisAutorisations',
            'documents',
            'notifications'
        ])->find($id);

        if (!$personne) {
            return response()->json([
                'success' => false,
                'message' => 'Opérateur non trouvé'
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => $personne
        ]);
    }

    /**
     * Mettre à jour une personne
     */
    public function update(Request $request, $id)
    {
        $personne = Personne::find($id);

        if (!$personne) {
            return response()->json([
                'success' => false,
                'message' => 'Opérateur non trouvé'
            ], 404);
        }

        $validator = Validator::make($request->all(), [
            'type' => 'nullable|in:physique,morale',
            'nom' => 'nullable|string|max:100',
            'prenom' => 'nullable|string|max:100',
            'denomination_sociale' => 'nullable|string|max:255',
            'email' => 'nullable|email|max:100|unique:personnes,email,' . $id,
            'telephone' => 'nullable|string|max:30',
            'telephone_2' => 'nullable|string|max:30',
            'date_naissance' => 'nullable|date',
            'lieu_naissance' => 'nullable|string|max:100',
            'nationalite' => 'nullable|string|max:100',
            'sexe' => 'nullable|in:M,F',
            'cni_numero' => 'nullable|string|max:50',
            'adresse' => 'nullable|string',
            'commune' => 'nullable|string|max:100',
            'quartier' => 'nullable|string|max:100',
            'ville' => 'nullable|string|max:100',
            'province' => 'nullable|string|max:100',
            'forme_juridique' => 'nullable|string|max:100',
            'est_actif' => 'nullable|boolean',
            'est_formalise' => 'nullable|boolean',
            'activites' => 'nullable|array',
            'activites.*' => 'exists:activites_economiques,id',
            'id_quartier' => 'nullable|exists:quartiers,id',
            'id_province' => 'nullable|exists:provinces,id',
            'id_ville' => 'nullable|exists:villes,id',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        // Mettre à jour les données
        $data = $request->only([
            'type', 'nom', 'prenom', 'date_naissance', 'lieu_naissance',
            'nationalite', 'sexe', 'cni_numero', 'denomination_sociale',
            'forme_juridique', 'date_creation', 'adresse', 'quartier',
            'commune', 'ville', 'province', 'telephone', 'telephone_2',
            'email', 'site_web', 'est_actif', 'est_formalise',
            'date_formalisation', 'latitude', 'longitude', 'avatar',
            'id_quartier', 'id_province', 'id_ville'
        ]);

        // Si formalisation, mettre à jour la date
        if ($request->has('est_formalise') && $request->est_formalise && !$personne->est_formalise) {
            $data['date_formalisation'] = now();
        }

        $personne->update($data);

        // Mettre à jour les activités
        if ($request->has('activites')) {
            $personne->activites()->sync($request->activites);
        }

        $personne->load(['utilisateur', 'activites']);

        return response()->json([
            'success' => true,
            'message' => 'Opérateur mis à jour avec succès',
            'data' => $personne
        ]);
    }

    /**
     * Supprimer une personne
     */
    public function destroy($id)
    {
        $personne = Personne::with('utilisateur')->find($id);

        if (!$personne) {
            return response()->json([
                'success' => false,
                'message' => 'Opérateur non trouvé'
            ], 404);
        }

        // Empêcher la suppression si l'opérateur a un utilisateur actif
        if ($personne->utilisateur && $personne->utilisateur->est_actif) {
            return response()->json([
                'success' => false,
                'message' => 'Impossible de supprimer un opérateur avec un compte utilisateur actif'
            ], 403);
        }

        $personne->delete();

        return response()->json([
            'success' => true,
            'message' => 'Opérateur supprimé avec succès'
        ]);
    }

    /**
     * Formaliser un opérateur
     */
    public function formaliser($id)
    {
        $personne = Personne::find($id);

        if (!$personne) {
            return response()->json([
                'success' => false,
                'message' => 'Opérateur non trouvé'
            ], 404);
        }

        $personne->update([
            'est_formalise' => true,
            'date_formalisation' => now()
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Opérateur formalisé avec succès',
            'data' => $personne
        ]);
    }

    /**
     * Activer/Désactiver un opérateur
     */
    public function toggleActivation($id)
    {
        $personne = Personne::find($id);

        if (!$personne) {
            return response()->json([
                'success' => false,
                'message' => 'Opérateur non trouvé'
            ], 404);
        }

        $personne->est_actif = !$personne->est_actif;
        $personne->save();

        return response()->json([
            'success' => true,
            'message' => $personne->est_actif ? 'Opérateur activé' : 'Opérateur désactivé',
            'data' => $personne
        ]);
    }

    /**
     * Statistiques des opérateurs
     */
    public function statistiques(Request $request)
    {
        try {
            $stats = [
                'total' => Personne::count(),
                'actifs' => Personne::where('est_actif', true)->count(),
                'inactifs' => Personne::where('est_actif', false)->count(),
                'formalises' => Personne::where('est_formalise', true)->count(),
                'non_formalises' => Personne::where('est_formalise', false)->count(),
                'physiques' => Personne::where('type', 'physique')->count(),
                'morales' => Personne::where('type', 'morale')->count(),
                'par_sexe' => [
                    'M' => Personne::where('sexe', 'M')->count(),
                    'F' => Personne::where('sexe', 'F')->count(),
                    'Non_renseigne' => Personne::whereNull('sexe')->count(),
                ],
                'par_commune' => Personne::select('commune')
                    ->selectRaw('count(*) as total')
                    ->whereNotNull('commune')
                    ->where('commune', '!=', '')
                    ->groupBy('commune')
                    ->orderBy('total', 'desc')
                    ->limit(10)
                    ->get(),
                'par_type' => [
                    'physique' => Personne::where('type', 'physique')->count(),
                    'morale' => Personne::where('type', 'morale')->count(),
                ],
                'nouveaux_mois' => Personne::selectRaw('DATE_FORMAT(created_at, "%Y-%m") as mois')
                    ->selectRaw('count(*) as total')
                    ->groupBy('mois')
                    ->orderBy('mois', 'desc')
                    ->limit(12)
                    ->get(),
                'formalisation_mois' => Personne::selectRaw('DATE_FORMAT(date_formalisation, "%Y-%m") as mois')
                    ->selectRaw('count(*) as total')
                    ->whereNotNull('date_formalisation')
                    ->groupBy('mois')
                    ->orderBy('mois', 'desc')
                    ->limit(12)
                    ->get(),
            ];

            return response()->json([
                'success' => true,
                'data' => $stats,
                'message' => 'Statistiques récupérées avec succès'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la récupération des statistiques',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    
}