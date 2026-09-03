<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Document extends Model
{
    use HasFactory;

    protected $table = 'documents';

    protected $fillable = [
        'personne_id',
        'type_document',
        'numero',
        'fichier',
        'date_expiration',
        'est_valide'
    ];

    protected $casts = [
        'date_expiration' => 'date',
        'est_valide' => 'boolean',
    ];

    // ============================================================
    // RELATIONS
    // ============================================================
    
    public function personne()
    {
        return $this->belongsTo(Personne::class);
    }

    // ============================================================
    // SCOPES
    // ============================================================
    
    public function scopeValide($query)
    {
        return $query->where('est_valide', true);
    }

    public function scopeParType($query, $type)
    {
        return $query->where('type_document', $type);
    }

    public function scopeParPersonne($query, $personneId)
    {
        return $query->where('personne_id', $personneId);
    }

    // ============================================================
    // ACCESSORS
    // ============================================================
    
    public function getTypeDocumentLabelAttribute()
    {
        $labels = [
            'CNI' => 'Carte Nationale d\'Identité',
            'PASSEPORT' => 'Passeport',
            'STATUTS' => 'Statuts',
            'RCCM' => 'Registre de Commerce',
            'PATENTE' => 'Patente',
            'QUITTANCE' => 'Quittance',
            'AVATAR' => 'Photo de profil',
            'AUTRE' => 'Autre',
        ];
        return $labels[$this->type_document] ?? $this->type_document;
    }

    public function getCheminFichierAttribute()
    {
        return storage_path('app/public/' . $this->fichier);
    }

    public function getUrlAttribute()
    {
        return asset('storage/' . $this->fichier);
    }

    // ============================================================
    // MÉTHODES UTILITAIRES
    // ============================================================
    
    public function estValide()
    {
        if (!$this->est_valide) {
            return false;
        }
        if ($this->date_expiration && $this->date_expiration < now()) {
            return false;
        }
        return true;
    }

    public function estExpire()
    {
        return $this->date_expiration && $this->date_expiration < now();
    }
}