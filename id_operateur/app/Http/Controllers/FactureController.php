<?php

namespace App\Http\Controllers;

use App\Models\Facture;
use App\Models\DeclarationPaiement;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Storage;

class FactureController extends Controller
{
    /**
     * Liste des factures avec pagination et recherche
     */
    public function index(Request $request)
    {
        $query = Facture::with(['declarationPaiement.personne', 'declarationPaiement.taxe']);

        // Recherche
        if ($request->has('search') && !empty($request->search)) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('numero_facture', 'LIKE', "%{$search}%")
                  ->orWhere('statut', 'LIKE', "%{$search}%")
                  ->orWhereHas('declarationPaiement.personne', function ($pq) use ($search) {
                      $pq->where('nom', 'LIKE', "%{$search}%")
                         ->orWhere('prenom', 'LIKE', "%{$search}%")
                         ->orWhere('denomination_sociale', 'LIKE', "%{$search}%")
                         ->orWhere('email', 'LIKE', "%{$search}%");
                  });
            });
        }

        // Filtres
        if ($request->has('statut') && !empty($request->statut)) {
            $query->where('statut', $request->statut);
        }

        if ($request->has('devise') && !empty($request->devise)) {
            $query->where('devise', $request->devise);
        }

        if ($request->has('declaration_paiement_id') && !empty($request->declaration_paiement_id)) {
            $query->where('declaration_paiement_id', $request->declaration_paiement_id);
        }

        if ($request->has('personne_id') && !empty($request->personne_id)) {
            $query->whereHas('declarationPaiement', function ($q) use ($request) {
                $q->where('personne_id', $request->personne_id);
            });
        }

        // Filtres par date
        if ($request->has('date_debut') && !empty($request->date_debut)) {
            $query->whereDate('date_emission', '>=', $request->date_debut);
        }

        if ($request->has('date_fin') && !empty($request->date_fin)) {
            $query->whereDate('date_emission', '<=', $request->date_fin);
        }

        // Filtres par montant
        if ($request->has('montant_min') && !empty($request->montant_min)) {
            $query->where('montant_total', '>=', $request->montant_min);
        }

        if ($request->has('montant_max') && !empty($request->montant_max)) {
            $query->where('montant_total', '<=', $request->montant_max);
        }

        // Tri
        $sortField = $request->get('sort', 'created_at');
        $sortOrder = $request->get('order', 'desc');
        $allowedSorts = ['id', 'numero_facture', 'date_emission', 'montant_total', 'statut', 'created_at'];
        if (in_array($sortField, $allowedSorts)) {
            $query->orderBy($sortField, $sortOrder);
        }

        // Pagination
        $perPage = $request->get('per_page', 20);
        $perPage = min($perPage, 100);

        $factures = $query->paginate($perPage);

        return response()->json([
            'success' => true,
            'data' => $factures->items(),
            'pagination' => [
                'current_page' => $factures->currentPage(),
                'per_page' => $factures->perPage(),
                'total' => $factures->total(),
                'last_page' => $factures->lastPage(),
                'from' => $factures->firstItem(),
                'to' => $factures->lastItem(),
                'next_page_url' => $factures->nextPageUrl(),
                'prev_page_url' => $factures->previousPageUrl(),
            ],
            'filters' => $request->all()
        ]);
    }

    /**
     * Créer une facture manuelle
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'declaration_paiement_id' => 'required|exists:declarations_paiements,id|unique:factures,declaration_paiement_id',
            'montant_ht' => 'required|numeric|min:0',
            'montant_tva' => 'nullable|numeric|min:0',
            'montant_total' => 'required|numeric|min:0',
            'devise' => 'nullable|in:CDF,USD',
            'statut' => 'nullable|in:emise,payee,annulee',
            'observations' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        $data = $request->all();
        $data['devise'] = $request->devise ?? 'CDF';
        $data['statut'] = $request->statut ?? 'emise';
        $data['date_emission'] = now();

        // Générer le numéro de facture
        $data['numero_facture'] = $this->genererNumeroFacture();

        $facture = Facture::create($data);
        $facture->load(['declarationPaiement.personne', 'declarationPaiement.taxe']);

        return response()->json([
            'success' => true,
            'message' => 'Facture créée avec succès',
            'data' => $facture
        ], 201);
    }

    /**
     * Afficher une facture
     */
    public function show($id)
    {
        $facture = Facture::with([
            'declarationPaiement.personne',
            'declarationPaiement.taxe',
            'declarationPaiement.bienImmobilier',
            'declarationPaiement.vehicule',
            'declarationPaiement.permis'
        ])->find($id);

        if (!$facture) {
            return response()->json([
                'success' => false,
                'message' => 'Facture non trouvée'
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => $facture
        ]);
    }

    /**
     * Mettre à jour une facture
     */
    public function update(Request $request, $id)
    {
        $facture = Facture::find($id);

        if (!$facture) {
            return response()->json([
                'success' => false,
                'message' => 'Facture non trouvée'
            ], 404);
        }

        $validator = Validator::make($request->all(), [
            'montant_ht' => 'sometimes|numeric|min:0',
            'montant_tva' => 'nullable|numeric|min:0',
            'montant_total' => 'sometimes|numeric|min:0',
            'devise' => 'nullable|in:CDF,USD',
            'statut' => 'nullable|in:emise,payee,annulee',
            'observations' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        $facture->update($request->all());

        return response()->json([
            'success' => true,
            'message' => 'Facture mise à jour avec succès',
            'data' => $facture
        ]);
    }

    /**
     * Supprimer une facture
     */
    public function destroy($id)
    {
        $facture = Facture::find($id);

        if (!$facture) {
            return response()->json([
                'success' => false,
                'message' => 'Facture non trouvée'
            ], 404);
        }

        // Supprimer le fichier PDF si existant
        if ($facture->chemin_pdf && Storage::exists($facture->chemin_pdf)) {
            Storage::delete($facture->chemin_pdf);
        }

        $facture->delete();

        return response()->json([
            'success' => true,
            'message' => 'Facture supprimée avec succès'
        ]);
    }

    /**
     * Télécharger la facture en PDF
     */
    public function download($id)
    {
        $facture = Facture::with([
            'declarationPaiement.personne',
            'declarationPaiement.taxe'
        ])->find($id);

        if (!$facture) {
            return response()->json([
                'success' => false,
                'message' => 'Facture non trouvée'
            ], 404);
        }

        // Si le PDF existe déjà, le télécharger
        if ($facture->chemin_pdf && Storage::exists($facture->chemin_pdf)) {
            return Storage::download($facture->chemin_pdf, "facture_{$facture->numero_facture}.pdf");
        }

        // Sinon, générer le PDF
        $pdf = $this->genererPdfFacture($facture);

        return $pdf->download("facture_{$facture->numero_facture}.pdf");
    }

    /**
     * Générer le PDF d'une facture
     */
    private function genererPdfFacture($facture)
    {
        // À implémenter avec DomPDF ou autre
        // return Pdf::loadView('pdf.facture', compact('facture'));
        return response()->json([
            'message' => 'Génération PDF en cours de développement'
        ]);
    }

    /**
     * Statistiques des factures
     */
    public function statistiques(Request $request)
    {
        $query = Facture::query();

        if ($request->has('date_debut')) {
            $query->whereDate('created_at', '>=', $request->date_debut);
        }

        if ($request->has('date_fin')) {
            $query->whereDate('created_at', '<=', $request->date_fin);
        }

        $stats = [
            'total' => $query->count(),
            'total_ht' => $query->sum('montant_ht'),
            'total_tva' => $query->sum('montant_tva'),
            'total_ttc' => $query->sum('montant_total'),
            'moyenne' => $query->avg('montant_total'),
            'par_statut' => (clone $query)->select('statut')
                ->selectRaw('count(*) as total, sum(montant_total) as montant')
                ->groupBy('statut')
                ->get(),
            'par_devise' => (clone $query)->select('devise')
                ->selectRaw('count(*) as total')
                ->groupBy('devise')
                ->get(),
            'evolution' => (clone $query)->selectRaw('DATE_FORMAT(created_at, "%Y-%m") as mois')
                ->selectRaw('count(*) as total, sum(montant_total) as montant')
                ->groupBy('mois')
                ->orderBy('mois', 'asc')
                ->limit(12)
                ->get(),
        ];

        return response()->json([
            'success' => true,
            'data' => $stats
        ]);
    }

    /**
     * Générer un numéro de facture unique
     */
    private function genererNumeroFacture()
    {
        $prefix = 'FAC';
        $annee = date('Y');
        $mois = date('m');
        
        $lastFacture = Facture::orderBy('id', 'desc')->first();
        
        if ($lastFacture && $lastFacture->numero_facture) {
            $parts = explode('-', $lastFacture->numero_facture);
            $lastNumber = isset($parts[3]) ? (int) $parts[3] : 0;
            $sequence = str_pad($lastNumber + 1, 5, '0', STR_PAD_LEFT);
        } else {
            $sequence = '00001';
        }
        
        return $prefix . '-' . $annee . '-' . $mois . '-' . $sequence;
    }

    /**
     * Annuler une facture
     */
    public function annuler($id)
    {
        $facture = Facture::find($id);

        if (!$facture) {
            return response()->json([
                'success' => false,
                'message' => 'Facture non trouvée'
            ], 404);
        }

        if ($facture->statut === 'payee') {
            return response()->json([
                'success' => false,
                'message' => 'Impossible d\'annuler une facture déjà payée'
            ], 422);
        }

        $facture->statut = 'annulee';
        $facture->save();

        return response()->json([
            'success' => true,
            'message' => 'Facture annulée avec succès',
            'data' => $facture
        ]);
    }
}