<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ActiviteEconomique extends Model
{
    use HasFactory;

    protected $table = 'activites_economiques';

    protected $fillable = [
        'code',
        'nom',
        'secteur',
        'description',
        'est_actif'
    ];

    protected $casts = [
        'est_actif' => 'boolean',
    ];

    // ============================================================
    // RELATIONS
    // ============================================================
    
    /**
     * Les personnes (opérateurs) qui ont cette activité
     * Spécification explicite des clés
     */
    public function personnes()
    {
        return $this->belongsToMany(
            Personne::class,               // Modèle lié
            'personne_activites',          // Table pivot
            'activite_id',                 // Clé étrangère du modèle courant dans la pivot
            'personne_id'                  // Clé étrangère du modèle lié dans la pivot
        )
        ->withPivot('est_principale', 'date_debut', 'date_fin')
        ->withTimestamps();
    }

    // ============================================================
    // SCOPES
    // ============================================================
    
    public function scopeActif($query)
    {
        return $query->where('est_actif', true);
    }

    public function scopeParSecteur($query, $secteur)
    {
        return $query->where('secteur', $secteur);
    }

    public function scopeRecherche($query, $search)
    {
        return $query->where('nom', 'LIKE', "%{$search}%")
                     ->orWhere('code', 'LIKE', "%{$search}%")
                     ->orWhere('secteur', 'LIKE', "%{$search}%");
    }

    // ============================================================
    // MÉTHODES UTILITAIRES
    // ============================================================
    
    public function getLibelleCompletAttribute()
    {
        return $this->code . ' - ' . $this->nom;
    }

    public function getNombreOperateursAttribute()
    {
        return $this->personnes()->count();
    }
}