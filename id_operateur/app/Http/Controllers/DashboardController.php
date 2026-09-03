<?php

namespace App\Http\Controllers;

use App\Models\Personne;
use App\Models\Taxe;
use App\Models\DeclarationPaiement;
use App\Models\Facture;
use App\Models\Utilisateur;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class DashboardController extends Controller
{
    /**
     * Statistiques globales du dashboard
     */
    public function global(Request $request)
    {
        $stats = [
            'operateurs' => [
                'total' => Personne::count(),
                'actifs' => Personne::where('est_actif', true)->count(),
                'formalises' => Personne::where('est_formalise', true)->count(),
                'nouveaux_mois' => Personne::whereMonth('created_at', now()->month)
                    ->whereYear('created_at', now()->year)
                    ->count(),
            ],
            'finances' => [
                'total_collecte' => DeclarationPaiement::where('statut', 'paye')->sum('montant_total'),
                'en_attente' => DeclarationPaiement::where('statut', 'en_attente')->sum('montant_total'),
                'en_retard' => DeclarationPaiement::where('statut', 'en_retard')->sum('montant_total'),
                'nb_factures' => Facture::count(),
            ],
            'taxes' => [
                'total' => Taxe::count(),
                'actives' => Taxe::where('est_actif', true)->count(),
                'categories' => Taxe::select('categorie')
                    ->selectRaw('count(*) as total')
                    ->groupBy('categorie')
                    ->get(),
            ],
            'utilisateurs' => [
                'total' => Utilisateur::count(),
                'actifs' => Utilisateur::where('est_actif', true)->count(),
                'par_role' => DB::table('utilisateurs_roles')
                    ->join('roles', 'utilisateurs_roles.role_id', '=', 'roles.id')
                    ->select('roles.nom', DB::raw('count(*) as total'))
                    ->groupBy('roles.nom')
                    ->get(),
            ],
            'evolution' => [
                'dernier_mois' => DeclarationPaiement::whereMonth('created_at', now()->month)
                    ->whereYear('created_at', now()->year)
                    ->count(),
                'mois_precedent' => DeclarationPaiement::whereMonth('created_at', now()->subMonth()->month)
                    ->whereYear('created_at', now()->subMonth()->year)
                    ->count(),
            ]
        ];

        return response()->json([
            'success' => true,
            'data' => $stats,
            'message' => 'Statistiques globales récupérées avec succès'
        ]);
    }

    /**
     * Statistiques des opérateurs
     */
    public function operateurs(Request $request)
    {
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
            'evolution_mensuelle' => Personne::selectRaw('DATE_FORMAT(created_at, "%Y-%m") as mois')
                ->selectRaw('count(*) as total')
                ->groupBy('mois')
                ->orderBy('mois', 'desc')
                ->limit(12)
                ->get(),
            'evolution_formalisation' => Personne::selectRaw('DATE_FORMAT(date_formalisation, "%Y-%m") as mois')
                ->selectRaw('count(*) as total')
                ->whereNotNull('date_formalisation')
                ->groupBy('mois')
                ->orderBy('mois', 'desc')
                ->limit(12)
                ->get(),
        ];

        return response()->json([
            'success' => true,
            'data' => $stats
        ]);
    }

    /**
     * Statistiques financières
     */
    public function finances(Request $request)
    {
        // Période
        $debut = $request->get('debut', now()->startOfYear()->toDateString());
        $fin = $request->get('fin', now()->endOfYear()->toDateString());

        $stats = [
            'periode' => [
                'debut' => $debut,
                'fin' => $fin,
            ],
            'collecte' => [
                'total' => DeclarationPaiement::whereBetween('created_at', [$debut, $fin])
                    ->where('statut', 'paye')
                    ->sum('montant_total'),
                'en_attente' => DeclarationPaiement::whereBetween('created_at', [$debut, $fin])
                    ->where('statut', 'en_attente')
                    ->sum('montant_total'),
                'en_retard' => DeclarationPaiement::whereBetween('created_at', [$debut, $fin])
                    ->where('statut', 'en_retard')
                    ->sum('montant_total'),
                'penalites' => DeclarationPaiement::whereBetween('created_at', [$debut, $fin])
                    ->sum('penalites'),
            ],
            'par_mois' => DeclarationPaiement::selectRaw('DATE_FORMAT(created_at, "%Y-%m") as mois')
                ->selectRaw('SUM(montant_total) as montant')
                ->selectRaw('COUNT(*) as total')
                ->whereBetween('created_at', [$debut, $fin])
                ->where('statut', 'paye')
                ->groupBy('mois')
                ->orderBy('mois', 'asc')
                ->get(),
            'par_taxe' => DeclarationPaiement::with('taxe')
                ->select('taxe_id')
                ->selectRaw('SUM(montant_total) as montant')
                ->selectRaw('COUNT(*) as total')
                ->whereBetween('created_at', [$debut, $fin])
                ->where('statut', 'paye')
                ->groupBy('taxe_id')
                ->orderBy('montant', 'desc')
                ->limit(10)
                ->get(),
            'recouvrement' => [
                'taux' => $this->calculerTauxRecouvrement($debut, $fin),
                'objectif' => $request->get('objectif', 1000000),
            ],
            'factures' => [
                'total' => Facture::whereBetween('created_at', [$debut, $fin])->count(),
                'montant_total' => Facture::whereBetween('created_at', [$debut, $fin])->sum('montant_total'),
                'montant_moyen' => Facture::whereBetween('created_at', [$debut, $fin])->avg('montant_total'),
            ],
        ];

        return response()->json([
            'success' => true,
            'data' => $stats
        ]);
    }

    /**
     * Statistiques des taxes
     */
    public function taxes(Request $request)
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
                ->get(['id', 'code', 'nom', 'categorie', 'declarations_paiements_count']),
            'taux_moyen' => Taxe::whereNotNull('taux')->avg('taux'),
            'collecte_par_taxe' => DB::table('declarations_paiements')
                ->join('taxes', 'declarations_paiements.taxe_id', '=', 'taxes.id')
                ->select('taxes.nom', 'taxes.code')
                ->selectRaw('SUM(declarations_paiements.montant_total) as total_collecte')
                ->where('declarations_paiements.statut', 'paye')
                ->groupBy('taxes.id', 'taxes.nom', 'taxes.code')
                ->orderBy('total_collecte', 'desc')
                ->limit(10)
                ->get(),
        ];

        return response()->json([
            'success' => true,
            'data' => $stats
        ]);
    }

    /**
     * Calculer le taux de recouvrement
     */
    private function calculerTauxRecouvrement($debut, $fin)
    {
        $total = DeclarationPaiement::whereBetween('created_at', [$debut, $fin])->sum('montant_total');
        $paye = DeclarationPaiement::whereBetween('created_at', [$debut, $fin])
            ->where('statut', 'paye')
            ->sum('montant_total');

        if ($total > 0) {
            return round(($paye / $total) * 100, 2);
        }
        return 0;
    }

    /**
     * Activités récentes
     */
    public function activites(Request $request)
    {
        $limit = $request->get('limit', 20);

        $activites = [];

        // Dernières déclarations
        $declarations = DeclarationPaiement::with(['personne', 'taxe'])
            ->orderBy('created_at', 'desc')
            ->limit($limit)
            ->get()
            ->map(function ($item) {
                return [
                    'type' => 'declaration',
                    'id' => $item->id,
                    'message' => 'Déclaration de ' . ($item->personne->nom_complet ?? $item->personne->denomination_sociale) . ' pour ' . $item->taxe->nom,
                    'montant' => $item->montant_total,
                    'statut' => $item->statut,
                    'created_at' => $item->created_at,
                ];
            });

        // Dernières personnes
        $personnes = Personne::orderBy('created_at', 'desc')
            ->limit($limit)
            ->get()
            ->map(function ($item) {
                return [
                    'type' => 'personne',
                    'id' => $item->id,
                    'message' => 'Nouvel opérateur : ' . ($item->nom_complet ?? $item->denomination_sociale),
                    'type_operateur' => $item->type,
                    'created_at' => $item->created_at,
                ];
            });

        // Dernières factures
        $factures = Facture::with('declarationPaiement.personne')
            ->orderBy('created_at', 'desc')
            ->limit($limit)
            ->get()
            ->map(function ($item) {
                return [
                    'type' => 'facture',
                    'id' => $item->id,
                    'message' => 'Facture ' . $item->numero_facture . ' - ' . ($item->declarationPaiement->personne->nom_complet ?? 'N/A'),
                    'montant' => $item->montant_total,
                    'statut' => $item->statut,
                    'created_at' => $item->created_at,
                ];
            });

        // Fusionner et trier par date
        $activites = collect($declarations)
            ->concat($personnes)
            ->concat($factures)
            ->sortByDesc('created_at')
            ->take($limit)
            ->values();

        return response()->json([
            'success' => true,
            'data' => $activites,
            'message' => 'Activités récentes récupérées avec succès'
        ]);
    }
}