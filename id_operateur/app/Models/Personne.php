<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Personne extends Model
{
    use HasFactory;

    protected $fillable = [
        'type', 'nom', 'prenom', 'date_naissance', 'lieu_naissance',
        'nationalite', 'sexe', 'cni_numero', 'denomination_sociale',
        'forme_juridique', 'date_creation', 'adresse', 'quartier',
        'commune', 'ville', 'province', 'telephone', 'telephone_2',
        'email', 'site_web', 'est_actif', 'est_formalise',
        'date_formalisation', 'latitude', 'longitude', 'avatar',
        'id_quartier', 'id_province', 'id_ville'
    ];

    protected $casts = [
        'est_actif' => 'boolean',
        'est_formalise' => 'boolean',
        'date_naissance' => 'date',
        'date_creation' => 'date',
        'date_formalisation' => 'datetime',
        'latitude' => 'decimal:8',
        'longitude' => 'decimal:8',
    ];

    // ============================================================
    // RELATIONS
    // ============================================================
    
    public function utilisateur()
    {
        return $this->hasOne(Utilisateur::class);
    }

    public function quartierRelation()
    {
        return $this->belongsTo(Quartier::class, 'id_quartier');
    }

    public function provinceRelation()
    {
        return $this->belongsTo(Province::class, 'id_province');
    }

    public function villeRelation()
    {
        return $this->belongsTo(Ville::class, 'id_ville');
    }

    public function identifiantsOfficiels()
    {
        return $this->hasMany(IdentifiantOfficiel::class);
    }

    /**
     * Relation avec les activités économiques
     * Spécification explicite des clés pour éviter les erreurs
     */
    public function activites()
    {
        return $this->belongsToMany(
            ActiviteEconomique::class,    // Modèle lié
            'personne_activites',          // Table pivot
            'personne_id',                 // Clé étrangère de la table courante dans la pivot
            'activite_id'                  // Clé étrangère du modèle lié dans la pivot
        )
        ->withPivot('est_principale', 'date_debut', 'date_fin')
        ->withTimestamps();
    }

    public function biensImmobiliers()
    {
        return $this->hasMany(BienImmobilier::class, 'proprietaire_id');
    }

    public function vehicules()
    {
        return $this->hasMany(Vehicule::class, 'proprietaire_id');
    }

    public function permisAutorisations()
    {
        return $this->hasMany(PermisAutorisation::class);
    }

    public function declarationsPaiements()
    {
        return $this->hasMany(DeclarationPaiement::class);
    }

    public function documents()
    {
        return $this->hasMany(Document::class);
    }

    public function notifications()
    {
        return $this->hasMany(Notification::class);
    }

    // ============================================================
    // SCOPES
    // ============================================================
    
    public function scopeActif($query)
    {
        return $query->where('est_actif', true);
    }

    public function scopeFormalise($query)
    {
        return $query->where('est_formalise', true);
    }

    public function scopePhysique($query)
    {
        return $query->where('type', 'physique');
    }

    public function scopeMorale($query)
    {
        return $query->where('type', 'morale');
    }

    // ============================================================
    // MUTATEURS
    // ============================================================
    
    public function getNomCompletAttribute()
    {
        if ($this->type === 'physique') {
            return $this->prenom . ' ' . $this->nom;
        }
        return $this->denomination_sociale;
    }

    public function getAgeAttribute()
    {
        if (!$this->date_naissance) {
            return null;
        }
        return $this->date_naissance->age;
    }

    // ============================================================
    // MÉTHODES UTILITAIRES
    // ============================================================
    
    public function aUnCompteUtilisateur()
    {
        return $this->utilisateur()->exists();
    }

    public function estFormalisable()
    {
        return !$this->est_formalise && $this->est_actif;
    }
}