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
            ['nom' => 'statistique:read', 'ressource' => 'statistique', 'action' => 'read', 'description' => 'Consulter les statistiques et rapports'],
            ['nom' => 'audit:read', 'ressource' => 'audit', 'action' => 'read', 'description' => 'Consulter les logs et historiques'],
       
       // Ajouter ces permissions
[
    'nom' => 'dashboard:read',
    'ressource' => 'dashboard',
    'action' => 'read',
    'description' => 'Consulter le tableau de bord'
],
[
    'nom' => 'statistique:read',
    'ressource' => 'statistique',
    'action' => 'read',
    'description' => 'Consulter les statistiques'
],
       
            ];

        DB::table('permissions')->insert($permissions);
    }
}