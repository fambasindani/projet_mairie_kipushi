<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class RolesPermissionsSeeder extends Seeder
{
    public function run(): void
    {
        // Récupérer les IDs des rôles
        $adminRoleId = DB::table('roles')->where('nom', 'Administrateur')->value('id');
        $agentRecensementRoleId = DB::table('roles')->where('nom', 'Agent_Recensement')->value('id');
        $agentRecouvrementRoleId = DB::table('roles')->where('nom', 'Agent_Recouvrement')->value('id');
        $auditeurRoleId = DB::table('roles')->where('nom', 'Auditeur')->value('id');

        // Toutes les permissions pour l'Administrateur
        $allPermissions = DB::table('permissions')->pluck('id')->toArray();
        foreach ($allPermissions as $permissionId) {
            DB::table('roles_permissions')->insert([
                'role_id' => $adminRoleId,
                'permission_id' => $permissionId,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }

        // Permissions pour Agent_Recensement
        $permissionsRecensement = DB::table('permissions')
            ->whereIn('nom', ['operateur:create', 'operateur:read', 'operateur:update'])
            ->pluck('id')->toArray();
        foreach ($permissionsRecensement as $permissionId) {
            DB::table('roles_permissions')->insert([
                'role_id' => $agentRecensementRoleId,
                'permission_id' => $permissionId,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }

        // Permissions pour Agent_Recouvrement
        $permissionsRecouvrement = DB::table('permissions')
            ->whereIn('nom', ['paiement:create', 'paiement:read', 'paiement:validate', 'facture:create', 'facture:read', 'operateur:read'])
            ->pluck('id')->toArray();
        foreach ($permissionsRecouvrement as $permissionId) {
            DB::table('roles_permissions')->insert([
                'role_id' => $agentRecouvrementRoleId,
                'permission_id' => $permissionId,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }

        // Permissions pour Auditeur
        $permissionsAuditeur = DB::table('permissions')
            ->whereIn('nom', ['operateur:read', 'taxe:read', 'paiement:read', 'facture:read', 'statistique:read', 'audit:read'])
            ->pluck('id')->toArray();
        foreach ($permissionsAuditeur as $permissionId) {
            DB::table('roles_permissions')->insert([
                'role_id' => $auditeurRoleId,
                'permission_id' => $permissionId,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }
    }
}