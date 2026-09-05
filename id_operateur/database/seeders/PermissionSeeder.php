<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class PermissionSeeder extends Seeder
{
    public function run(): void
    {
        $permissions = [
            ['nom' => 'operateur:create', 'ressource' => 'operateur', 'action' => 'create', 'description' => 'Créer un nouvel opérateur'],
            ['nom' => 'operateur:read', 'ressource' => 'operateur', 'action' => 'read', 'description' => 'Consulter la liste et les détails des opérateurs'],
            ['nom' => 'operateur:update', 'ressource' => 'operateur', 'action' => 'update', 'description' => 'Modifier les informations d\'un opérateur'],
            ['nom' => 'operateur:delete', 'ressource' => 'operateur', 'action' => 'delete', 'description' => 'Supprimer un opérateur'],
            ['nom' => 'operateur:validate', 'ressource' => 'operateur', 'action' => 'validate', 'description' => 'Valider un opérateur (formalisation)'],
            ['nom' => 'taxe:create', 'ressource' => 'taxe', 'action' => 'create', 'description' => 'Créer une nouvelle taxe'],
            ['nom' => 'taxe:read', 'ressource' => 'taxe', 'action' => 'read', 'description' => 'Consulter la liste des taxes'],
            ['nom' => 'taxe:update', 'ressource' => 'taxe', 'action' => 'update', 'description' => 'Modifier une taxe'],
            ['nom' => 'taxe:delete', 'ressource' => 'taxe', 'action' => 'delete', 'description' => 'Supprimer une taxe'],
            ['nom' => 'paiement:create', 'ressource' => 'paiement', 'action' => 'create', 'description' => 'Créer une déclaration de paiement'],
            ['nom' => 'paiement:read', 'ressource' => 'paiement', 'action' => 'read', 'description' => 'Consulter les paiements'],
            ['nom' => 'paiement:update', 'ressource' => 'paiement', 'action' => 'update', 'description' => 'Modifier une déclaration de paiement'],
            ['nom' => 'paiement:validate', 'ressource' => 'paiement', 'action' => 'validate', 'description' => 'Valider un paiement'],
            ['nom' => 'paiement:delete', 'ressource' => 'paiement', 'action' => 'delete', 'description' => 'Supprimer un paiement'],
            ['nom' => 'facture:create', 'ressource' => 'facture', 'action' => 'create', 'description' => 'Générer une facture'],
            ['nom' => 'facture:read', 'ressource' => 'facture', 'action' => 'read', 'description' => 'Consulter les factures'],
            ['nom' => 'facture:update', 'ressource' => 'facture', 'action' => 'update', 'description' => 'Modifier une facture'],
            ['nom' => 'facture:delete', 'ressource' => 'facture', 'action' => 'delete', 'description' => 'Supprimer une facture'],
            ['nom' => 'permis:create', 'ressource' => 'permis', 'action' => 'create', 'description' => 'Délivrer un permis'],
            ['nom' => 'permis:read', 'ressource' => 'permis', 'action' => 'read', 'description' => 'Consulter les permis'],
            ['nom' => 'permis:update', 'ressource' => 'permis', 'action' => 'update', 'description' => 'Modifier un permis'],
            ['nom' => 'permis:delete', 'ressource' => 'permis', 'action' => 'delete', 'description' => 'Supprimer un permis'],
            ['nom' => 'utilisateur:create', 'ressource' => 'utilisateur', 'action' => 'create', 'description' => 'Créer un utilisateur'],
            ['nom' => 'utilisateur:read', 'ressource' => 'utilisateur', 'action' => 'read', 'description' => 'Consulter les utilisateurs'],
            ['nom' => 'utilisateur:update', 'ressource' => 'utilisateur', 'action' => 'update', 'description' => 'Modifier un utilisateur'],
            ['nom' => 'utilisateur:delete', 'ressource' => 'utilisateur', 'action' => 'delete', 'description' => 'Supprimer un utilisateur'],
            ['nom' => 'role:create', 'ressource' => 'role', 'action' => 'create', 'description' => 'Créer un rôle'],
            ['nom' => 'role:read', 'ressource' => 'role', 'action' => 'read', 'description' => 'Consulter les rôles'],
            ['nom' => 'role:update', 'ressource' => 'role', 'action' => 'update', 'description' => 'Modifier un rôle'],
            ['nom' => 'role:delete', 'ressource' => 'role', 'action' => 'delete', 'description' => 'Supprimer un rôle'],
            ['nom' => 'permission:create', 'ressource' => 'permission', 'action' => 'create', 'description' => 'Créer une permission'],
            ['nom' => 'permission:read', 'ressource' => 'permission', 'action' => 'read', 'description' => 'Consulter les permissions'],
            ['nom' => 'permission:update', 'ressource' => 'permission', 'action' => 'update', 'description' => 'Modifier une permission'],
            ['nom' => 'permission:delete', 'ressource' => 'permission', 'action' => 'delete', 'description' => 'Supprimer une permission'],
            ['nom' => 'statistique:read', 'ressource' => 'statistique', 'action' => 'read', 'description' => 'Consulter les statistiques et rapports'],
            ['nom' => 'audit:read', 'ressource' => 'audit', 'action' => 'read', 'description' => 'Consulter les logs et historiques'],
            ['nom' => 'dashboard:read', 'ressource' => 'dashboard', 'action' => 'read', 'description' => 'Consulter le tableau de bord'],
            ['nom' => 'notification:read', 'ressource' => 'notification', 'action' => 'read', 'description' => 'Consulter les notifications'],
            ['nom' => 'notification:update', 'ressource' => 'notification', 'action' => 'update', 'description' => 'Marquer les notifications comme lues'],
            ['nom' => 'document:create', 'ressource' => 'document', 'action' => 'create', 'description' => 'Uploader un document'],
            ['nom' => 'document:read', 'ressource' => 'document', 'action' => 'read', 'description' => 'Consulter les documents'],
            ['nom' => 'document:delete', 'ressource' => 'document', 'action' => 'delete', 'description' => 'Supprimer un document'],
            ['nom' => 'identifiant:create', 'ressource' => 'identifiant', 'action' => 'create', 'description' => 'Créer un identifiant officiel'],
            ['nom' => 'identifiant:read', 'ressource' => 'identifiant', 'action' => 'read', 'description' => 'Consulter les identifiants officiels'],
            ['nom' => 'identifiant:update', 'ressource' => 'identifiant', 'action' => 'update', 'description' => 'Modifier un identifiant officiel'],
            ['nom' => 'identifiant:delete', 'ressource' => 'identifiant', 'action' => 'delete', 'description' => 'Supprimer un identifiant officiel'],
            ['nom' => 'rapport:read', 'ressource' => 'rapport', 'action' => 'read', 'description' => 'Consulter les rapports'],
            ['nom' => 'parametre:read', 'ressource' => 'parametre', 'action' => 'read', 'description' => 'Consulter les paramètres'],
            ['nom' => 'parametre:update', 'ressource' => 'parametre', 'action' => 'update', 'description' => 'Modifier les paramètres'],
        ];

        foreach ($permissions as $permission) {
            DB::table('permissions')->updateOrInsert(
                ['nom' => $permission['nom']],
                array_merge($permission, ['created_at' => now(), 'updated_at' => now()])
            );
        }
    }
}
