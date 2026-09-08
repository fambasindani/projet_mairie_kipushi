<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Support\Facades\Hash;
use Laravel\Sanctum\HasApiTokens;

class Utilisateur extends Authenticatable
{
    use HasApiTokens, HasFactory;

    protected $table = 'utilisateurs';

    protected $fillable = [
        'personne_id',
        'nom_utilisateur',
        'mot_de_passe_hash',
        'email',
        'est_actif',
        'est_verrouille',
        'tentatives_connexion',
        'derniere_connexion',
        'date_expiration_mot_de_passe',
        'statut_inscription',
        'motif_rejet',
        'date_inscription',
    ];

    protected $hidden = [
        'mot_de_passe_hash'
    ];

    protected $casts = [
        'est_actif' => 'boolean',
        'est_verrouille' => 'boolean',
        'derniere_connexion' => 'datetime',
        'date_expiration_mot_de_passe' => 'date',
        'date_inscription' => 'date',
    ];

    // Relations
    public function personne()
    {
        return $this->belongsTo(Personne::class);
    }

    public function roles()
    {
        return $this->belongsToMany(Role::class, 'utilisateurs_roles')
                    ->withTimestamps();
    }

    public function logsAudit()
    {
        return $this->hasMany(LogAudit::class);
    }

    // Accesseur pour le mot de passe
    public function getMotDePasseHashAttribute($value)
    {
        return $value;
    }

    // Mutateur pour le mot de passe
    public function setMotDePasseHashAttribute($value)
    {
        $this->attributes['mot_de_passe_hash'] = Hash::make($value);
    }

    // Vérifier si l'utilisateur a un rôle
    public function hasRole($roleName)
    {
        return $this->roles()->where('nom', $roleName)->exists();
    }

    // Vérifier si l'utilisateur a une permission
    public function hasPermission($permissionName)
    {
        foreach ($this->roles as $role) {
            if ($role->permissions()->where('nom', $permissionName)->exists()) {
                return true;
            }
        }
        return false;
    }

    // Vérifier si l'utilisateur a une des permissions
    public function hasAnyPermission($permissions)
    {
        foreach ($permissions as $permission) {
            if ($this->hasPermission($permission)) {
                return true;
            }
        }
        return false;
    }

    // Vérifier si l'utilisateur a toutes les permissions
    public function hasAllPermissions($permissions)
    {
        foreach ($permissions as $permission) {
            if (!$this->hasPermission($permission)) {
                return false;
            }
        }
        return true;
    }
}