<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class LogAudit extends Model
{
    use HasFactory;

    protected $table = 'logs_audit';

    protected $fillable = [
        'utilisateur_id',
        'action',
        'table_cible',
        'enregistrement_id',
        'anciennes_valeurs',
        'nouvelles_valeurs',
        'adresse_ip',
        'user_agent'
    ];

    protected $casts = [
        'anciennes_valeurs' => 'array',
        'nouvelles_valeurs' => 'array',
    ];

    // ============================================================
    // RELATIONS
    // ============================================================
    
    public function utilisateur()
    {
        return $this->belongsTo(Utilisateur::class);
    }

    // ============================================================
    // SCOPES
    // ============================================================
    
    public function scopeParAction($query, $action)
    {
        return $query->where('action', $action);
    }

    public function scopeParTable($query, $table)
    {
        return $query->where('table_cible', $table);
    }

    public function scopeParUtilisateur($query, $utilisateurId)
    {
        return $query->where('utilisateur_id', $utilisateurId);
    }

    public function scopeParDate($query, $debut, $fin)
    {
        return $query->whereBetween('created_at', [$debut, $fin]);
    }

    // ============================================================
    // ACCESSORS
    // ============================================================
    
    public function getActionLabelAttribute()
    {
        $labels = [
            'create' => 'Création',
            'read' => 'Lecture',
            'update' => 'Modification',
            'delete' => 'Suppression',
            'login' => 'Connexion',
            'logout' => 'Déconnexion',
        ];
        return $labels[$this->action] ?? $this->action;
    }

    public function getActionCouleurAttribute()
    {
        $couleurs = [
            'create' => 'success',
            'read' => 'info',
            'update' => 'warning',
            'delete' => 'danger',
            'login' => 'primary',
            'logout' => 'secondary',
        ];
        return $couleurs[$this->action] ?? 'secondary';
    }

    // ============================================================
    // MÉTHODES UTILITAIRES
    // ============================================================
    
    public static function log($utilisateurId, $action, $table, $recordId, $old = null, $new = null)
    {
        return self::create([
            'utilisateur_id' => $utilisateurId,
            'action' => $action,
            'table_cible' => $table,
            'enregistrement_id' => $recordId,
            'anciennes_valeurs' => $old,
            'nouvelles_valeurs' => $new,
            'adresse_ip' => request()->ip(),
            'user_agent' => request()->userAgent(),
        ]);
    }
}