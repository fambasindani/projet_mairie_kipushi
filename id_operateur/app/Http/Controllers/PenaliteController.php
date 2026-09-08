<?php

namespace App\Http\Controllers;

use App\Models\DeclarationPaiement;
use App\Models\MiseEnDemeure;
use App\Services\PenaliteService;
use Illuminate\Http\Request;

class PenaliteController extends Controller
{
    protected $penaliteService;

    public function __construct(PenaliteService $penaliteService)
    {
        $this->penaliteService = $penaliteService;
    }

    /**
     * Calculer les pénalités pour une déclaration
     */
    public function calculer($declarationId)
    {
        $declaration = DeclarationPaiement::with(['personne', 'taxe'])->find($declarationId);

        if (!$declaration) {
            return response()->json(['success' => false, 'message' => 'Déclaration non trouvée'], 404);
        }

        $penalites = $this->penaliteService->calculerPenalites($declaration);

        return response()->json([
            'success' => true,
            'data' => $penalites
        ]);
    }

    /**
     * Appliquer les pénalités calculées
     */
    public function appliquer($declarationId)
    {
        $declaration = DeclarationPaiement::find($declarationId);

        if (!$declaration) {
            return response()->json(['success' => false, 'message' => 'Déclaration non trouvée'], 404);
        }

        $declaration = $this->penaliteService->appliquerPenalites($declaration);

        return response()->json([
            'success' => true,
            'message' => 'Pénalités appliquées avec succès',
            'data' => $declaration
        ]);
    }

    /**
     * Mettre à jour toutes les déclarations en retard
     */
    public function mettreAJourToutes()
    {
        $count = $this->penaliteService->mettreAJourToutesEnRetard();

        return response()->json([
            'success' => true,
            'message' => "{$count} déclaration(s) mise(s) à jour",
            'data' => ['count' => $count]
        ]);
    }

    /**
     * Envoyer une mise en demeure
     */
    public function miseEnDemeure(Request $request, $declarationId)
    {
        $declaration = DeclarationPaiement::with(['personne', 'taxe'])->find($declarationId);

        if (!$declaration) {
            return response()->json(['success' => false, 'message' => 'Déclaration non trouvée'], 404);
        }

        if ($declaration->mise_en_demeure_envoyee) {
            return response()->json(['success' => false, 'message' => 'Une mise en demeure a déjà été envoyée pour cette déclaration'], 422);
        }

        $miseEnDemeure = $this->penaliteService->envoyerMiseEnDemeure($declaration, $request->motif);

        return response()->json([
            'success' => true,
            'message' => 'Mise en demeure envoyée avec succès',
            'data' => $miseEnDemeure
        ]);
    }

    /**
     * Lister les mises en demeure
     */
    public function listerMisesEnDemeure(Request $request)
    {
        $query = MiseEnDemeure::with(['declarationPaiement.personne', 'declarationPaiement.taxe']);

        if ($request->has('statut') && !empty($request->statut)) {
            $query->where('statut', $request->statut);
        }

        $perPage = min($request->get('per_page', 20), 100);
        $misesEnDemeure = $query->orderBy('created_at', 'desc')->paginate($perPage);

        return response()->json([
            'success' => true,
            'data' => $misesEnDemeure->items(),
            'pagination' => [
                'current_page' => $misesEnDemeure->currentPage(),
                'per_page' => $misesEnDemeure->perPage(),
                'total' => $misesEnDemeure->total(),
                'last_page' => $misesEnDemeure->lastPage(),
            ]
        ]);
    }

    /**
     * Vérifier et mettre à jour les mises en demeure passées en force
     */
    public function verifierMisesEnDemeure()
    {
        $misesEnDemeure = MiseEnDemeure::where('statut', 'en_cours')->get();
        $count = 0;

        foreach ($misesEnDemeure as $md) {
            if ($this->penaliteService->verifierMiseEnDemeurePasseeEnForce($md)) {
                $count++;
            }
        }

        return response()->json([
            'success' => true,
            'message' => "{$count} mise(s) en demeure passée(s) en force",
            'data' => ['count' => $count]
        ]);
    }
}
