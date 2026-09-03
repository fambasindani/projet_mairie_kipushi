<?php

namespace App\Http\Controllers;

use App\Models\Personne;
use App\Models\DeclarationPaiement;
use App\Models\Taxe;
use App\Models\Facture;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\DB;

class RapportPersonnaliseController extends Controller
{
    /**
     * Générer un rapport personnalisé
     */
    public function generer(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'type' => 'required|in:operateurs,paiements,taxes,factures,global',
            'periode_debut' => 'nullable|date',
            'periode_fin' => 'nullable|date|after_or_equal:periode_debut',
            'group_by' => 'nullable|in:jour,mois,annee,categorie,type,statut',
            'filtres' => 'nullable|array',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        $type = $request->type;
        $periodeDebut = $request->periode_debut;
        $periodeFin = $request->periode_fin;
        $groupBy = $request->group_by ?? 'mois';
        $filtres = $request->filtres ?? [];

        switch ($type) {
            case 'operateurs':
                $data = $this->rapportOperateurs($periodeDebut, $periodeFin, $filtres);
                break;
            case 'paiements':
                $data = $this->rapportPaiements($periodeDebut, $periodeFin, $groupBy, $filtres);
                break;
            case 'taxes':
                $data = $this->rapportTaxes($periodeDebut, $periodeFin, $filtres);
                break;
            case 'factures':
                $data = $this->rapportFactures($periodeDebut, $periodeFin, $filtres);
                break;
            case 'global':
                $data = $this->rapportGlobal($periodeDebut, $periodeFin);
                break;
            default:
                return response()->json([
                    'success' => false,
                    'message' => 'Type de rapport invalide'
                ], 422);
        }

        return response()->json([
            'success' => true,
            'data' => $data,
            'type' => $type,
            'periode' => [
                'debut' => $periodeDebut,
                'fin' => $periodeFin
            ],
            'generated_at' => now()
        ]);
    }

    /**
     * Rapport des opérateurs
     */
    private function rapportOperateurs($debut, $fin, $filtres)
    {
        $query = Personne::query();

        if ($debut) {
            $query->whereDate('created_at', '>=', $debut);
        }
        if ($fin) {
            $query->whereDate('created_at', '<=', $fin);
        }

        if (isset($filtres['type'])) {
            $query->where('type', $filtres['type']);
        }

        if (isset($filtres['est_actif'])) {
            $query->where('est_actif', filter_var($filtres['est_actif'], FILTER_VALIDATE_BOOLEAN));
        }

        if (isset($filtres['est_formalise'])) {
            $query->where('est_formalise', filter_var($filtres['est_formalise'], FILTER_VALIDATE_BOOLEAN));
        }

        if (isset($filtres['commune'])) {
            $query->where('commune', $filtres['commune']);
        }

        $total = $query->count();

        return [
            'total' => $total,
            'actifs' => (clone $query)->where('est_actif', true)->count(),
            'inactifs' => (clone $query)->where('est_actif', false)->count(),
            'formalises' => (clone $query)->where('est_formalise', true)->count(),
            'non_formalises' => (clone $query)->where('est_formalise', false)->count(),
            'physiques' => (clone $query)->where('type', 'physique')->count(),
            'morales' => (clone $query)->where('type', 'morale')->count(),
            'par_commune' => (clone $query)->select('commune')
                ->selectRaw('count(*) as total')
                ->whereNotNull('commune')
                ->groupBy('commune')
                ->orderBy('total', 'desc')
                ->limit(10)
                ->get(),
            'evolution' => (clone $query)->selectRaw('DATE_FORMAT(created_at, "%Y-%m") as mois')
                ->selectRaw('count(*) as total')
                ->groupBy('mois')
                ->orderBy('mois', 'asc')
                ->limit(12)
                ->get(),
        ];
    }

    /**
     * Rapport des paiements
     */
    private function rapportPaiements($debut, $fin, $groupBy, $filtres)
    {
        $query = DeclarationPaiement::query();

        if ($debut) {
            $query->whereDate('created_at', '>=', $debut);
        }
        if ($fin) {
            $query->whereDate('created_at', '<=', $fin);
        }

        if (isset($filtres['statut'])) {
            $query->where('statut', $filtres['statut']);
        }

        if (isset($filtres['exercice'])) {
            $query->where('exercice', $filtres['exercice']);
        }

        if (isset($filtres['personne_id'])) {
            $query->where('personne_id', $filtres['personne_id']);
        }

        if (isset($filtres['taxe_id'])) {
            $query->where('taxe_id', $filtres['taxe_id']);
        }

        $totalMontant = (clone $query)->sum('montant_total');
        $totalPaye = (clone $query)->where('statut', 'paye')->sum('montant_total');
        $totalAttente = (clone $query)->where('statut', 'en_attente')->sum('montant_total');
        $totalRetard = (clone $query)->where('statut', 'en_retard')->sum('montant_total');

        $groupByField = $groupBy === 'mois' ? 'DATE_FORMAT(created_at, "%Y-%m")' : 
                       ($groupBy === 'jour' ? 'DATE(created_at)' : 
                       ($groupBy === 'annee' ? 'YEAR(created_at)' : 'DATE_FORMAT(created_at, "%Y-%m")'));

        return [
            'total' => $query->count(),
            'montant_total' => $totalMontant,
            'montant_paye' => $totalPaye,
            'montant_en_attente' => $totalAttente,
            'montant_en_retard' => $totalRetard,
            'taux_recouvrement' => $totalMontant > 0 ? round(($totalPaye / $totalMontant) * 100, 2) : 0,
            'par_statut' => (clone $query)->select('statut')
                ->selectRaw('count(*) as total, sum(montant_total) as montant')
                ->groupBy('statut')
                ->get(),
            'par_taxe' => (clone $query)->with('taxe')
                ->select('taxe_id')
                ->selectRaw('count(*) as total, sum(montant_total) as montant')
                ->groupBy('taxe_id')
                ->orderBy('montant', 'desc')
                ->limit(10)
                ->get(),
            'evolution' => (clone $query)->selectRaw("{$groupByField} as periode")
                ->selectRaw('count(*) as total, sum(montant_total) as montant')
                ->groupBy('periode')
                ->orderBy('periode', 'asc')
                ->get(),
        ];
    }

    /**
     * Rapport des taxes
     */
    private function rapportTaxes($debut, $fin, $filtres)
    {
        $query = Taxe::query();

        if (isset($filtres['categorie'])) {
            $query->where('categorie', $filtres['categorie']);
        }

        if (isset($filtres['est_actif'])) {
            $query->where('est_actif', filter_var($filtres['est_actif'], FILTER_VALIDATE_BOOLEAN));
        }

        return [
            'total' => $query->count(),
            'actives' => (clone $query)->where('est_actif', true)->count(),
            'inactives' => (clone $query)->where('est_actif', false)->count(),
            'par_categorie' => (clone $query)->select('categorie')
                ->selectRaw('count(*) as total')
                ->groupBy('categorie')
                ->orderBy('total', 'desc')
                ->get(),
            'par_periodicite' => (clone $query)->select('periodicite')
                ->selectRaw('count(*) as total')
                ->groupBy('periodicite')
                ->orderBy('total', 'desc')
                ->get(),
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
    }

    /**
     * Rapport des factures
     */
    private function rapportFactures($debut, $fin, $filtres)
    {
        $query = Facture::query();

        if ($debut) {
            $query->whereDate('created_at', '>=', $debut);
        }
        if ($fin) {
            $query->whereDate('created_at', '<=', $fin);
        }

        if (isset($filtres['statut'])) {
            $query->where('statut', $filtres['statut']);
        }

        return [
            'total' => $query->count(),
            'montant_total' => $query->sum('montant_total'),
            'montant_ht' => $query->sum('montant_ht'),
            'montant_tva' => $query->sum('montant_tva'),
            'montant_moyen' => $query->avg('montant_total'),
            'par_statut' => (clone $query)->select('statut')
                ->selectRaw('count(*) as total, sum(montant_total) as montant')
                ->groupBy('statut')
                ->get(),
            'evolution' => (clone $query)->selectRaw('DATE_FORMAT(created_at, "%Y-%m") as mois')
                ->selectRaw('count(*) as total, sum(montant_total) as montant')
                ->groupBy('mois')
                ->orderBy('mois', 'asc')
                ->limit(12)
                ->get(),
        ];
    }

    /**
     * Rapport global
     */
    private function rapportGlobal($debut, $fin)
    {
        return [
            'operateurs' => $this->rapportOperateurs($debut, $fin, []),
            'paiements' => $this->rapportPaiements($debut, $fin, 'mois', []),
            'taxes' => $this->rapportTaxes($debut, $fin, []),
            'factures' => $this->rapportFactures($debut, $fin, []),
            'resume' => [
                'total_operateurs' => Personne::count(),
                'total_collecte' => DeclarationPaiement::where('statut', 'paye')->sum('montant_total'),
                'total_factures' => Facture::count(),
                'taux_recouvrement_global' => $this->calculerTauxRecouvrementGlobal(),
            ]
        ];
    }

    /**
     * Calculer le taux de recouvrement global
     */
    private function calculerTauxRecouvrementGlobal()
    {
        $total = DeclarationPaiement::sum('montant_total');
        $paye = DeclarationPaiement::where('statut', 'paye')->sum('montant_total');
        return $total > 0 ? round(($paye / $total) * 100, 2) : 0;
    }
}