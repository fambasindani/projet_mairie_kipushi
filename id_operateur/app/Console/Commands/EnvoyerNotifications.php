<?php

namespace App\Console\Commands;

use App\Models\DeclarationPaiement;
use App\Models\PermisAutorisation;
use App\Models\Notification;
use App\Models\Personne;
use Illuminate\Console\Command;

class EnvoyerNotifications extends Command
{
    protected $signature = 'notifications:envoyer';
    protected $description = 'Envoyer les notifications automatiques';

    public function handle()
    {
        $this->info('Début de l\'envoi des notifications...');

        // 1. Notifications pour les paiements en retard
        $this->notifierPaiementsEnRetard();

        // 2. Notifications pour les permis qui expirent
        $this->notifierPermisExpiration();

        // 3. Notifications pour les opérateurs non formalisés
        $this->notifierOperateursNonFormalises();

        $this->info('Notifications envoyées avec succès !');
        return Command::SUCCESS;
    }

    /**
     * Notifier les paiements en retard
     */
    private function notifierPaiementsEnRetard()
    {
        $declarations = DeclarationPaiement::where('statut', 'en_retard')
            ->whereNull('date_paiement')
            ->with('personne')
            ->get();

        foreach ($declarations as $declaration) {
            Notification::creerNotification(
                $declaration->personne_id,
                'paiement_echu',
                'Paiement en retard',
                "Votre paiement pour la taxe '{$declaration->taxe->nom}' est en retard depuis le " . $declaration->date_limite_paiement->format('d/m/Y') . ".",
                "/declarations/{$declaration->id}"
            );
        }

        $this->info("✅ {$declarations->count()} notifications de paiement en retard envoyées");
    }

    /**
     * Notifier les permis qui expirent bientôt
     */
    private function notifierPermisExpiration()
    {
        $permis = PermisAutorisation::where('est_valide', true)
            ->where('date_expiration', '>=', now())
            ->where('date_expiration', '<=', now()->addDays(30))
            ->with('personne')
            ->get();

        foreach ($permis as $permisItem) {
            $joursRestants = now()->diffInDays($permisItem->date_expiration);
            Notification::creerNotification(
                $permisItem->personne_id,
                'renouvellement_permis',
                'Permis bientôt expiré',
                "Votre permis '{$permisItem->type_permis_label}' expire dans {$joursRestants} jours (le " . $permisItem->date_expiration->format('d/m/Y') . "). Pensez à le renouveler.",
                "/permis/{$permisItem->id}"
            );
        }

        $this->info("✅ {$permis->count()} notifications de permis expirant envoyées");
    }

    /**
     * Notifier les opérateurs non formalisés
     */
    private function notifierOperateursNonFormalises()
    {
        $operateurs = Personne::where('est_formalise', false)
            ->where('est_actif', true)
            ->where('created_at', '<=', now()->subDays(30))
            ->get();

        foreach ($operateurs as $operateur) {
            Notification::creerNotification(
                $operateur->id,
                'information',
                'Formalisation en attente',
                "Votre dossier est en attente de formalisation depuis plus de 30 jours. Veuillez contacter la mairie pour régulariser votre situation.",
                "/personnes/{$operateur->id}"
            );
        }

        $this->info("✅ {$operateurs->count()} notifications d'opérateurs non formalisés envoyées");
    }
}