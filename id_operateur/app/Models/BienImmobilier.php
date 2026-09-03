<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Models\Quartier;

class BienImmobilier extends Model
{
    use HasFactory;
      protected $table = 'biens_immobiliers';

    protected $fillable = [
        'proprietaire_id', 'adresse', 'quartier', 'commune', 'id_quartier',
        'parcelle_id', 'type_bien', 'superficie', 'valeur_locative',
        'valeur_venale', 'classement', 'est_actif'
    ];

    protected $casts = [
        'est_actif' => 'boolean',
        'superficie' => 'decimal:2',
        'valeur_locative' => 'decimal:2',
        'valeur_venale' => 'decimal:2',
    ];

    public function proprietaire()
    {
        return $this->belongsTo(Personne::class, 'proprietaire_id');
    }

    public function quartier()
    {
        return $this->belongsTo(Quartier::class, 'id_quartier');
    }

    public function declarationsPaiements()
    {
        return $this->hasMany(DeclarationPaiement::class);
    }

    public function scopeActif($query)
    {
        return $query->where('est_actif', true);
    }

    public function getTypeBienLabelAttribute()
    {
        $labels = [
            'terrain' => 'Terrain',
            'maison' => 'Maison',
            'appartement' => 'Appartement',
            'immeuble' => 'Immeuble',
            'local_commercial' => 'Local commercial',
            'entrepot' => 'Entrepôt',
            'autre' => 'Autre',
        ];
        return $labels[$this->type_bien] ?? $this->type_bien;
    }

    public function getClassementLabelAttribute()
    {
        $labels = [
            1 => '1er rang',
            2 => '2e rang',
            3 => '3e rang',
            4 => '4e rang',
        ];
        return $labels[$this->classement] ?? $this->classement;
    }
}