<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Role extends Model
{
    use HasFactory;

    protected $fillable = [
        'nom',
        'description'
    ];

    public function utilisateurs()
    {
        return $this->belongsToMany(Utilisateur::class, 'utilisateurs_roles')
                    ->withTimestamps();
    }

    public function permissions()
    {
        return $this->belongsToMany(Permission::class, 'roles_permissions')
                    ->withTimestamps();
    }

    public function hasPermission($permissionName)
    {
        return $this->permissions()->where('nom', $permissionName)->exists();
    }

    public function givePermission($permissionName)
    {
        $permission = Permission::where('nom', $permissionName)->first();
        if ($permission && !$this->hasPermission($permissionName)) {
            $this->permissions()->attach($permission);
        }
        return $this;
    }

    public function revokePermission($permissionName)
    {
        $permission = Permission::where('nom', $permissionName)->first();
        if ($permission) {
            $this->permissions()->detach($permission);
        }
        return $this;
    }

    public function syncPermissions($permissions)
    {
        $permissionIds = Permission::whereIn('nom', $permissions)->pluck('id')->toArray();
        $this->permissions()->sync($permissionIds);
        return $this;
    }
}