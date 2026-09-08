<?php

namespace App\Services;

use App\Models\DeclarationPaiement;
use App\Models\Parametre;
use Carbon\Carbon;

class PenaliteService
{
    /**
     * Calculer les pénalités pour une déclaration
     */
    public function calculerPenalites(DeclarationPaiement $declaration): array
    {
        if ($declaration->statut === 'paye' || $declaration->statut === 'annule' || $declaration->statut === 'exonere') {
            return [
                'jours_retard' => 0,
                'majoration_retard' => 0,
                'interet_retard' => 0,
                'total_penalites' => 0,
                'montant_total_avec_penalites' => $declaration->montant_total,
            ];
        }

        $dateLimite = $declaration->date_limite_paiement;
        $dateReferenece = $declaration->date_paiement ?? now();
        $dateReferenece = Carbon::parse($dateReferenece);

        if (!$dateLimite || !$dateReferenece->isAfter($dateLimite)) {
            return [
                'jours_retard' => 0,
                'majoration_retard' => 0,
                'interet_retard' => 0,
                'total_penalites' => 0,
                'montant_total_avec_penalites' => $declaration->montant_total,
            ];
        }

        $joursRetard = (int) $dateLimite->diffInDays($dateReferenece);

        // Charger la configuration : d'abord la taxe, sinon les paramètres globaux
        $taxe = $declaration->taxe;
        $tauxMajoration = $taxe->taux_majoration_retard ?? (float) Parametre::getValue('taux_majoration_retard', '25');
        $tauxInteretMensuel = $taxe->taux_interet_mensuel ?? (float) Parametre::getValue('taux_interet_mensuel', '2');
        $delaiGrace = $taxe->delai_grace_jours ?? (int) Parametre::getValue('delai_grace_jours', '0');
        $tauxApresMiseEnDemeure = $taxe->taux_majoration_apres_mise_en_demeure ?? (float) Parametre::getValue('taux_majoration_apres_mise_en_demeure', '100');

        // Appliquer le délai de grâce
        $joursEffectifs = max(0, $joursRetard - $delaiGrace);

        if ($joursEffectifs <= 0) {
            return [
                'jours_retard' => $joursRetard,
                'majoration_retard' => 0,
                'interet_retard' => 0,
                'total_penalites' => 0,
                'montant_total_avec_penalites' => $declaration->montant_total,
            ];
        }

        // Calculer la majoration de retard
        $montantBase = $declaration->montant_taxe;
        $majoration = $montantBase * ($tauxMajoration / 100);

        // Si une mise en demeure a été envoyée et passée en force
        if ($declaration->mise_en_demeure_envoyee && $declaration->date_mise_en_demeure) {
            $dateMD = Carbon::parse($declaration->date_mise_en_demeure);
            $delaiMD = Parametre::getValue('delai_mise_en_demeure_jours', '15');
            $dateEcheanceMD = $dateMD->addDays((int) $delaiMD);

            if ($dateReferenece->isAfter($dateEcheanceMD)) {
                // Pénalités majorées après mise en demeure
                $majoration = $montantBase * ($tauxApresMiseEnDemeure / 100);
            }
        }

        // Calculer l'intérêt de retard mensuel
        $moisRetard = (int) ceil($joursEffectifs / 30);
        $interet = $montantBase * ($tauxInteretMensuel / 100) * $moisRetard;

        $totalPenalites = $majoration + $interet;
        $montantTotal = $declaration->montant_base + $declaration->montant_taxe + $totalPenalites;

        return [
            'jours_retard' => $joursRetard,
            'majoration_retard' => round($majoration, 2),
            'interet_retard' => round($interet, 2),
            'total_penalites' => round($totalPenalites, 2),
            'montant_total_avec_penalites' => round($montantTotal, 2),
        ];
    }

    /**
     * Appliquer les pénalités calculées à une déclaration
     */
    public function appliquerPenalites(DeclarationPaiement $declaration): DeclarationPaiement
    {
        $penalites = $this->calculerPenalites($declaration);

        $declaration->update([
            'nombre_jours_retard' => $penalites['jours_retard'],
            'majoration_retard' => $penalites['majoration_retard'],
            'interet_retard' => $penalites['interet_retard'],
            'penalites' => $penalites['total_penalites'],
            'montant_total' => $penalites['montant_total_avec_penalites'],
            'date_dernier_calcul_penalites' => now()->toDateString(),
            'statut' => $penalites['jours_retard'] > 0 ? 'en_retard' : $declaration->statut,
        ]);

        return $declaration->fresh(['personne', 'taxe', 'facture']);
    }

    /**
     * Mettre à jour automatiquement toutes les déclarations en retard
     */
    public function mettreAJourToutesEnRetard(): int
    {
        $declarations = DeclarationPaiement::whereNull('date_paiement')
            ->where('date_limite_paiement', '<', now())
            ->whereNotIn('statut', ['paye', 'annule', 'exonere'])
            ->get();

        $count = 0;
        foreach ($declarations as $declaration) {
            $this->appliquerPenalites($declaration);
            $count++;
        }

        return $count;
    }

    /**
     * Envoyer une mise en demeure pour une déclaration
     */
    public function envoyerMiseEnDemeure(DeclarationPaiement $declaration, string $motif = null): \App\Models\MiseEnDemeure
    {
        $delaiMD = (int) Parametre::getValue('delai_mise_en_demeure_jours', '15');
        $montantRestant = $declaration->montant_base + $declaration->montant_taxe + $declaration->penalites;

        $miseEnDemeure = \App\Models\MiseEnDemeure::create([
            'declaration_paiement_id' => $declaration->id,
            'date_emission' => now()->toDateString(),
            'date_echeance' => now()->addDays($delaiMD)->toDateString(),
            'montant_restant' => $montantRestant,
            'motif' => $motif ?? 'Mise en demeure pour non-paiement de la taxe',
            'statut' => 'en_cours',
        ]);

        $declaration->update([
            'mise_en_demeure_envoyee' => true,
            'date_mise_en_demeure' => now()->toDateString(),
        ]);

        // Créer une notification pour l'opérateur
        $personneId = $declaration->personne_id;
        $taxeNom = $declaration->taxe->nom ?? 'Taxe inconnue';
        $dateEcheance = now()->addDays($delaiMD)->locale('fr')->isoFormat('DD MMMM YYYY');
        $montantFormate = number_format($montantRestant, 0, ',', '.');

        \App\Models\Notification::creerNotification(
            $personneId,
            'mise_en_demeure',
            'Mise en demeure - ' . $taxeNom,
            "Vous avez reçu une mise en demeure pour la déclaration #{$declaration->id} " .
            "concernant la taxe \"{$taxeNom}\". " .
            "Montant dû : {$montantFormate} CDF. " .
            "Vous devez régulariser votre situation avant le {$dateEcheance}. " .
            "Passé ce délai, des pénalités majorées seront appliquées.",
            '/declarations/' . $declaration->id
        );

        return $miseEnDemeure;
    }

    /**
     * Vérifier si une mise en demeure est passée en force
     */
    public function verifierMiseEnDemeurePasseeEnForce(\App\Models\MiseEnDemeure $miseEnDemeure): bool
    {
        if ($miseEnDemeure->estPasseeEnForce()) {
            return false;
        }

        if (now()->isAfter($miseEnDemeure->date_echeance)) {
            $miseEnDemeure->update(['statut' => 'passee_en_force']);
            
            // Recalculer les pénalités avec le taux majoré
            $declaration = $miseEnDemeure->declarationPaiement;
            $this->appliquerPenalites($declaration);
            
            return true;
        }

        return false;
    }
}
