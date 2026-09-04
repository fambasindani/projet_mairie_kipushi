<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class RolesPermissionsSeeder extends Seeder
{
    public function run(): void
    {
        $adminRoleId = DB::table('roles')->where('nom', 'Administrateur')->value('id');
        $agentMairieRoleId = DB::table('roles')->where('nom', 'Agent_Mairie')->value('id');
        $agentRecensementRoleId = DB::table('roles')->where('nom', 'Agent_Recensement')->value('id');
        $agentRecouvrementRoleId = DB::table('roles')->where('nom', 'Agent_Recouvrement')->value('id');
        $operateurRoleId = DB::table('roles')->where('nom', 'Operateur')->value('id');
        $auditeurRoleId = DB::table('roles')->where('nom', 'Auditeur')->value('id');

        $allPermissions = DB::table('permissions')->pluck('id')->toArray();

        $rolePermissions = [
            $adminRoleId => $allPermissions,

            $agentMairieRoleId => $this->getPermissions([
                'operateur:create', 'operateur:read', 'operateur:update', 'operateur:validate',
                'taxe:create', 'taxe:read', 'taxe:update',
                'paiement:create', 'paiement:read', 'paiement:validate',
                'facture:create', 'facture:read', 'facture:update',
                'permis:create', 'permis:read', 'permis:update',
                'utilisateur:read',
                'notification:read', 'notification:update',
                'document:read',
                'statistique:read', 'dashboard:read',
            ]),

            $agentRecensementRoleId => $this->getPermissions([
                'operateur:create', 'operateur:read', 'operateur:update',
                'utilisateur:read',
                'document:create', 'document:read',
                'notification:read',
            ]),

            $agentRecouvrementRoleId => $this->getPermissions([
                'paiement:create', 'paiement:read', 'paiement:validate',
                'facture:create', 'facture:read',
                'operateur:read',
                'notification:read',
                'statistique:read',
            ]),

            $operateurRoleId => $this->getPermissions([
                'operateur:read', 'operateur:update',
                'taxe:read',
                'paiement:read',
                'facture:read',
                'permis:read',
                'statistique:read',
                'notification:read', 'notification:update',
                'document:create', 'document:read', 'document:delete',
                'identifiant:read',
                'rapport:read',
            ]),

            $auditeurRoleId => $this->getPermissions([
                'operateur:read', 'taxe:read', 'paiement:read', 'facture:read',
                'statistique:read', 'audit:read', 'dashboard:read',
                'notification:read',
            ]),
        ];

        foreach ($rolePermissions as $roleId => $permissionIds) {
            if (!$roleId) continue;
            foreach ($permissionIds as $permissionId) {
                DB::table('roles_permissions')->updateOrInsert(
                    ['role_id' => $roleId, 'permission_id' => $permissionId],
                    ['created_at' => now(), 'updated_at' => now()]
                );
            }
        }
    }

    private function getPermissions(array $names): array
    {
        return DB::table('permissions')
            ->whereIn('nom', $names)
            ->pluck('id')
            ->toArray();
    }
}
