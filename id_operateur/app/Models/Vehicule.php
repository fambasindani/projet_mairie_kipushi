<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Vehicule extends Model
{
    use HasFactory;

    protected $fillable = [
        'proprietaire_id', 'plaque_immatriculation', 'marque',
        'modele', 'annee_fabrication', 'couleur', 'type_vehicule',
        'nombre_places', 'poids', 'est_actif'
    ];

    protected $casts = [
        'est_actif' => 'boolean',
        'annee_fabrication' => 'integer',
        'poids' => 'decimal:2',
    ];

    public function proprietaire()
    {
        return $this->belongsTo(Personne::class, 'proprietaire_id');
    }

    public function declarationsPaiements()
    {
        return $this->hasMany(DeclarationPaiement::class);
    }

    public function scopeActif($query)
    {
        return $query->where('est_actif', true);
    }

    public function getTypeVehiculeLabelAttribute()
    {
        $labels = [
            'voiture' => 'Voiture',
            'moto' => 'Moto',
            'poids_lourd' => 'Poids lourd',
            'bus' => 'Bus',
            'minibus' => 'Minibus',
            'taxi' => 'Taxi',
            'autre' => 'Autre',
        ];
        return $labels[$this->type_vehicule] ?? $this->type_vehicule;
    }
}