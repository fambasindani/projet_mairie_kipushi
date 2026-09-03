<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PermisAutorisation extends Model
{
    use HasFactory;

    protected $fillable = [
        'personne_id', 'type_permis', 'numero', 'date_delivrance',
        'date_expiration', 'est_valide', 'est_renouvele', 'document_scan'
    ];

    protected $casts = [
        'date_delivrance' => 'date',
        'date_expiration' => 'date',
        'est_valide' => 'boolean',
        'est_renouvele' => 'boolean',
    ];

    public function personne()
    {
        return $this->belongsTo(Personne::class);
    }

    public function declarationsPaiements()
    {
        return $this->hasMany(DeclarationPaiement::class, 'permis_id');
    }

    public function scopeValide($query)
    {
        return $query->where('est_valide', true)
                     ->where(function ($q) {
                         $q->whereNull('date_expiration')
                           ->orWhere('date_expiration', '>=', now());
                     });
    }

    public function scopeExpire($query)
    {
        return $query->where('date_expiration', '<', now());
    }

    public function getTypePermisLabelAttribute()
    {
        $labels = [
            'patente' => 'Patente',
            'construire' => 'Permis de construire',
            'occupation_sol' => 'Occupation du sol',
            'etalage' => 'Étalage',
            'exploitation' => 'Exploitation',
            'transport' => 'Transport',
            'autre' => 'Autre',
        ];
        return $labels[$this->type_permis] ?? $this->type_permis;
    }

    public function estExpire()
    {
        return $this->date_expiration && $this->date_expiration < now();
    }

    public function joursAvantExpiration()
    {
        if (!$this->date_expiration) {
            return null;
        }
        return now()->diffInDays($this->date_expiration, false);
    }
}