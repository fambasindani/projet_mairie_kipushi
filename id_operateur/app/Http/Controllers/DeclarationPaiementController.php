<?php

namespace App\Http\Controllers;

use App\Traits\OperateurScope;
use App\Models\DeclarationPaiement;
use App\Models\Personne;
use App\Models\Taxe;
use App\Models\Facture;
use App\Models\Parametre;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\DB;

class DeclarationPaiementController extends Controller
{
    use OperateurScope;

    /**
     * Liste des déclarations avec pagination et recherche
     */
    public function index(Request $request)
    {
        $query = DeclarationPaiement::with(['personne', 'taxe', 'facture']);
        $this->scopeOperateur($query, $request);

        // Recherche
        if ($request->has('search') && !empty($request->search)) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('reference_paiement', 'LIKE', "%{$search}%")
                  ->orWhere('statut', 'LIKE', "%{$search}%")
                  ->orWhereHas('personne', function ($pq) use ($search) {
                      $pq->where('nom', 'LIKE', "%{$search}%")
                         ->orWhere('prenom', 'LIKE', "%{$search}%")
                         ->orWhere('denomination_sociale', 'LIKE', "%{$search}%")
                         ->orWhere('email', 'LIKE', "%{$search}%");
                  })
                  ->orWhereHas('taxe', function ($tq) use ($search) {
                      $tq->where('nom', 'LIKE', "%{$search}%")
                         ->orWhere('code', 'LIKE', "%{$search}%");
                  });
            });
        }

        // Filtres
        if ($request->has('statut') && !empty($request->statut)) {
            $query->where('statut', $request->statut);
        }

        if ($request->has('exercice') && !empty($request->exercice)) {
            $query->where('exercice', $request->exercice);
        }

        if ($request->has('personne_id') && !empty($request->personne_id)) {
            $query->where('personne_id', $request->personne_id);
        }

        if ($request->has('taxe_id') && !empty($request->taxe_id)) {
            $query->where('taxe_id', $request->taxe_id);
        }

        if ($request->has('est_paye')) {
            $query->whereNotNull('date_paiement');
        }

        // Filtres par date
        if ($request->has('periode_debut') && !empty($request->periode_debut)) {
            $query->whereDate('periode_debut', '>=', $request->periode_debut);
        }

        if ($request->has('periode_fin') && !empty($request->periode_fin)) {
            $query->whereDate('periode_fin', '<=', $request->periode_fin);
        }

        if ($request->has('date_limite_debut') && !empty($request->date_limite_debut)) {
            $query->whereDate('date_limite_paiement', '>=', $request->date_limite_debut);
        }

        if ($request->has('date_limite_fin') && !empty($request->date_limite_fin)) {
            $query->whereDate('date_limite_paiement', '<=', $request->date_limite_fin);
        }

        if ($request->has('date_paiement_debut') && !empty($request->date_paiement_debut)) {
            $query->whereDate('date_paiement', '>=', $request->date_paiement_debut);
        }

        if ($request->has('date_paiement_fin') && !empty($request->date_paiement_fin)) {
            $query->whereDate('date_paiement', '<=', $request->date_paiement_fin);
        }

        // Filtres par montant
        if ($request->has('montant_min')) {
            $query->where('montant_total', '>=', $request->montant_min);
        }

        if ($request->has('montant_max')) {
            $query->where('montant_total', '<=', $request->montant_max);
        }

        // Tri
        $sortField = $request->get('sort', 'created_at');
        $sortOrder = $request->get('order', 'desc');
        $allowedSorts = ['id', 'montant_total', 'date_limite_paiement', 'date_paiement', 'created_at'];
        if (in_array($sortField, $allowedSorts)) {
            $query->orderBy($sortField, $sortOrder);
        }

        // Pagination
        $perPage = $request->get('per_page', 20);
        $perPage = min($perPage, 100);

        $declarations = $query->paginate($perPage);

        return response()->json([
            'success' => true,
            'data' => $declarations->items(),
            'pagination' => [
                'current_page' => $declarations->currentPage(),
                'per_page' => $declarations->perPage(),
                'total' => $declarations->total(),
                'last_page' => $declarations->lastPage(),
                'from' => $declarations->firstItem(),
                'to' => $declarations->lastItem(),
                'next_page_url' => $declarations->nextPageUrl(),
                'prev_page_url' => $declarations->previousPageUrl(),
            ],
            'filters' => $request->all()
        ]);
    }

    /**
     * Créer une déclaration de paiement
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'personne_id' => 'required|exists:personnes,id',
            'taxe_id' => 'required|exists:taxes,id',
            'exercice' => 'required|integer|min:2000|max:' . (date('Y') + 1),
            'periode_debut' => 'required|date',
            'periode_fin' => 'required|date|after_or_equal:periode_debut',
            'montant_base' => 'required|numeric|min:0',
            'montant_taxe' => 'required|numeric|min:0',
            'date_limite_paiement' => 'required|date|after_or_equal:today',
            'observations' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        // Calculer le montant total
        $penalites = 0;
        $montantTotal = $request->montant_base + $request->montant_taxe + $penalites;

        $declaration = DeclarationPaiement::create([
            'personne_id' => $request->personne_id,
            'taxe_id' => $request->taxe_id,
            'bien_immobilier_id' => $request->bien_immobilier_id ?? null,
            'vehicule_id' => $request->vehicule_id ?? null,
            'permis_id' => $request->permis_id ?? null,
            'exercice' => $request->exercice,
            'periode_debut' => $request->periode_debut,
            'periode_fin' => $request->periode_fin,
            'montant_base' => $request->montant_base,
            'montant_taxe' => $request->montant_taxe,
            'penalites' => $penalites,
            'montant_total' => $montantTotal,
            'date_limite_paiement' => $request->date_limite_paiement,
            'statut' => 'en_attente',
            'observations' => $request->observations,
        ]);

        $declaration->load(['personne', 'taxe']);

        return response()->json([
            'success' => true,
            'message' => 'Déclaration créée avec succès',
            'data' => $declaration
        ], 201);
    }

    /**
     * Afficher une déclaration
     */
    public function show($id)
    {
        $declaration = DeclarationPaiement::with([
            'personne',
            'taxe',
            'bienImmobilier',
            'vehicule',
            'permis',
            'facture'
        ])->find($id);

        if (!$declaration) {
            return response()->json([
                'success' => false,
                'message' => 'Déclaration non trouvée'
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => $declaration
        ]);
    }

    /**
     * Modifier une déclaration (seulement si statut = en_attente)
     */
    public function update(Request $request, $id)
    {
        $declaration = DeclarationPaiement::find($id);

        if (!$declaration) {
            return response()->json(['success' => false, 'message' => 'Déclaration non trouvée'], 404);
        }

        if ($declaration->statut !== 'en_attente') {
            return response()->json(['success' => false, 'message' => 'Seules les déclarations en attente peuvent être modifiées'], 422);
        }

        $validator = Validator::make($request->all(), [
            'taxe_id' => 'sometimes|exists:taxes,id',
            'exercice' => 'sometimes|integer|min:2000|max:' . (date('Y') + 1),
            'periode_debut' => 'sometimes|date',
            'periode_fin' => 'sometimes|date|after_or_equal:periode_debut',
            'montant_base' => 'sometimes|numeric|min:0',
            'montant_taxe' => 'sometimes|numeric|min:0',
            'date_limite_paiement' => 'sometimes|date',
            'observations' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json(['success' => false, 'errors' => $validator->errors()], 422);
        }

        $data = $request->only([
            'taxe_id', 'exercice', 'periode_debut', 'periode_fin',
            'montant_base', 'montant_taxe', 'date_limite_paiement', 'observations'
        ]);

        $declaration->update($data);

        if (isset($data['montant_base']) || isset($data['montant_taxe'])) {
            $declaration->montant_total = $declaration->montant_base + $declaration->montant_taxe + $declaration->penalites;
            $declaration->save();
        }

        $declaration->load(['personne', 'taxe']);

        return response()->json([
            'success' => true,
            'message' => 'Déclaration modifiée avec succès',
            'data' => $declaration
        ]);
    }

    /**
     * Supprimer une déclaration (seulement si statut = en_attente)
     */
    public function destroy($id)
    {
        $declaration = DeclarationPaiement::find($id);

        if (!$declaration) {
            return response()->json(['success' => false, 'message' => 'Déclaration non trouvée'], 404);
        }

        if ($declaration->statut !== 'en_attente') {
            return response()->json(['success' => false, 'message' => 'Seules les déclarations en attente peuvent être supprimées'], 422);
        }

        $declaration->delete();

        return response()->json([
            'success' => true,
            'message' => 'Déclaration supprimée avec succès'
        ]);
    }

    /**
     * Valider un paiement
     */
    public function validerPaiement(Request $request, $id)
    {
        $declaration = DeclarationPaiement::find($id);

        if (!$declaration) {
            return response()->json([
                'success' => false,
                'message' => 'Déclaration non trouvée'
            ], 404);
        }

        if ($declaration->statut === 'paye') {
            return response()->json([
                'success' => false,
                'message' => 'Cette déclaration est déjà payée'
            ], 422);
        }

        $validator = Validator::make($request->all(), [
            'reference_paiement' => 'nullable|string|max:100',
            'justificatif' => 'nullable|string|max:255',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        $referencePaiement = $request->reference_paiement ?? ('PAY-' . strtoupper(uniqid()));

        // Vérifier si en retard
        $statut = 'paye';
        if ($declaration->date_limite_paiement < now()) {
            $statut = 'en_retard';
        }

        $declaration->update([
            'statut' => $statut,
            'date_paiement' => now(),
            'reference_paiement' => $referencePaiement,
            'justificatif' => $request->justificatif,
        ]);

        // Générer automatiquement une facture
        $facture = $this->genererFacture($declaration);

        $declaration->load(['personne', 'taxe', 'facture']);

        return response()->json([
            'success' => true,
            'message' => 'Paiement validé avec succès',
            'data' => $declaration,
            'facture' => $facture
        ]);
    }

    /**
     * Générer une facture
     */
    private function genererFacture($declaration)
    {
        // Vérifier si une facture existe déjà
        if ($declaration->facture) {
            return $declaration->facture;
        }

        try {
            // Récupérer le taux de TVA
            $tvaTaux = Parametre::where('cle', 'tva_taux')->first();
            $tvaTaux = $tvaTaux ? (float) $tvaTaux->valeur : 16;

            $montantHT = $declaration->montant_total;
            $montantTVA = $montantHT * ($tvaTaux / 100);
            $montantTotal = $montantHT + $montantTVA;

            // Générer le numéro de facture
            $numeroFacture = $this->genererNumeroFacture();

            $facture = Facture::create([
                'declaration_paiement_id' => $declaration->id,
                'numero_facture' => $numeroFacture,
                'date_emission' => now(),
                'montant_ht' => $montantHT,
                'montant_tva' => $montantTVA,
                'montant_total' => $montantTotal,
                'devise' => 'CDF',
                'statut' => 'payee',
            ]);

            return $facture;

        } catch (\Exception $e) {
            // Log l'erreur mais ne bloque pas le paiement
            \Log::error('Erreur lors de la génération de la facture: ' . $e->getMessage());
            return null;
        }
    }

    /**
     * Générer un numéro de facture unique
     */
    private function genererNumeroFacture()
    {
        $prefix = 'FAC';
        $annee = date('Y');
        $mois = date('m');
        
        // Récupérer le dernier numéro séquentiel
        $lastFacture = Facture::orderBy('id', 'desc')->first();
        
        if ($lastFacture && $lastFacture->numero_facture) {
            // Extraire le numéro séquentiel
            $parts = explode('-', $lastFacture->numero_facture);
            $lastNumber = isset($parts[3]) ? (int) $parts[3] : 0;
            $sequence = str_pad($lastNumber + 1, 5, '0', STR_PAD_LEFT);
        } else {
            $sequence = '00001';
        }
        
        return $prefix . '-' . $annee . '-' . $mois . '-' . $sequence;
    }

    /**
     * Statistiques des paiements
     */
    public function statistiques(Request $request)
    {
        $query = DeclarationPaiement::query();
        $this->scopeOperateur($query, $request);

        $stats = [
            'total' => (clone $query)->count(),
            'en_attente' => (clone $query)->where('statut', 'en_attente')->count(),
            'paye' => (clone $query)->where('statut', 'paye')->count(),
            'en_retard' => (clone $query)->where('statut', 'en_retard')->count(),
            'conteste' => (clone $query)->where('statut', 'conteste')->count(),
            'annule' => (clone $query)->where('statut', 'annule')->count(),
            'exonere' => (clone $query)->where('statut', 'exonere')->count(),
            'montant_total' => (clone $query)->sum('montant_total'),
            'montant_paye' => (clone $query)->where('statut', 'paye')->sum('montant_total'),
            'montant_en_attente' => (clone $query)->where('statut', 'en_attente')->sum('montant_total'),
            'montant_penalites' => (clone $query)->sum('penalites'),
            'par_mois' => (clone $query)->selectRaw('DATE_FORMAT(created_at, "%Y-%m") as mois')
                ->selectRaw('count(*) as total, sum(montant_total) as montant')
                ->groupBy('mois')
                ->orderBy('mois', 'desc')
                ->limit(12)
                ->get(),
            'par_taxe' => (clone $query)->with('taxe')
                ->select('taxe_id')
                ->selectRaw('count(*) as total, sum(montant_total) as montant')
                ->groupBy('taxe_id')
                ->orderBy('montant', 'desc')
                ->limit(10)
                ->get(),
            'par_statut' => (clone $query)->select('statut')
                ->selectRaw('count(*) as total, sum(montant_total) as montant')
                ->groupBy('statut')
                ->get(),
        ];

        return response()->json([
            'success' => true,
            'data' => $stats
        ]);
    }

    /**
     * Annuler une déclaration
     */
    public function annuler($id)
    {
        $declaration = DeclarationPaiement::find($id);

        if (!$declaration) {
            return response()->json([
                'success' => false,
                'message' => 'Déclaration non trouvée'
            ], 404);
        }

        if ($declaration->statut === 'paye') {
            return response()->json([
                'success' => false,
                'message' => 'Impossible d\'annuler une déclaration déjà payée'
            ], 422);
        }

        $declaration->update([
            'statut' => 'annule'
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Déclaration annulée avec succès',
            'data' => $declaration
        ]);
    }

    /**
     * Exonérer une déclaration
     */
    public function exonerer($id)
    {
        $declaration = DeclarationPaiement::find($id);

        if (!$declaration) {
            return response()->json([
                'success' => false,
                'message' => 'Déclaration non trouvée'
            ], 404);
        }

        if ($declaration->statut === 'paye') {
            return response()->json([
                'success' => false,
                'message' => 'Impossible d\'exonérer une déclaration déjà payée'
            ], 422);
        }

        $declaration->update([
            'statut' => 'exonere',
            'montant_total' => 0,
            'montant_taxe' => 0,
            'penalites' => 0,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Déclaration exonérée avec succès',
            'data' => $declaration
        ]);
    }

    /**
     * Exporter les déclarations en CSV
     */
    public function export(Request $request)
    {
        $query = DeclarationPaiement::with(['personne', 'taxe']);

        // Appliquer les mêmes filtres que l'index
        if ($request->has('statut') && !empty($request->statut)) {
            $query->where('statut', $request->statut);
        }

        if ($request->has('exercice') && !empty($request->exercice)) {
            $query->where('exercice', $request->exercice);
        }

        if ($request->has('date_debut') && !empty($request->date_debut)) {
            $query->whereDate('created_at', '>=', $request->date_debut);
        }

        if ($request->has('date_fin') && !empty($request->date_fin)) {
            $query->whereDate('created_at', '<=', $request->date_fin);
        }

        $declarations = $query->orderBy('created_at', 'desc')->get();

        $headers = [
            'Content-Type' => 'text/csv',
            'Content-Disposition' => 'attachment; filename="declarations_' . date('Y-m-d') . '.csv"',
        ];

        $callback = function() use ($declarations) {
            $file = fopen('php://output', 'w');
            
            // En-têtes CSV
            fputcsv($file, [
                'ID', 
                'Opérateur', 
                'Taxe', 
                'Exercice', 
                'Montant Base', 
                'Montant Taxe', 
                'Pénalités', 
                'Montant Total',
                'Statut',
                'Date Limite',
                'Date Paiement',
                'Référence',
                'Créé le'
            ]);

            foreach ($declarations as $d) {
                fputcsv($file, [
                    $d->id,
                    $d->personne->nom_complet ?? $d->personne->denomination_sociale ?? 'N/A',
                    $d->taxe->nom ?? 'N/A',
                    $d->exercice,
                    number_format($d->montant_base, 2, ',', ' '),
                    number_format($d->montant_taxe, 2, ',', ' '),
                    number_format($d->penalites, 2, ',', ' '),
                    number_format($d->montant_total, 2, ',', ' '),
                    $d->getStatutLabelAttribute(),
                    $d->date_limite_paiement ? $d->date_limite_paiement->format('d/m/Y') : 'N/A',
                    $d->date_paiement ? $d->date_paiement->format('d/m/Y') : 'N/A',
                    $d->reference_paiement ?? 'N/A',
                    $d->created_at ? $d->created_at->format('d/m/Y H:i') : 'N/A'
                ]);
            }

            fclose($file);
        };

        return response()->stream($callback, 200, $headers);
    }
}