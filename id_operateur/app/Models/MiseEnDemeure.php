<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class MiseEnDemeure extends Model
{
    use HasFactory;

    protected $table = 'mises_en_demeure';

    protected $fillable = [
        'declaration_paiement_id',
        'date_emission',
        'date_echeance',
        'montant_restant',
        'motif',
        'statut',
    ];

    protected $casts = [
        'date_emission' => 'date',
        'date_echeance' => 'date',
        'montant_restant' => 'decimal:2',
    ];

    public function declarationPaiement()
    {
        return $this->belongsTo(DeclarationPaiement::class);
    }

    public function estHonoree()
    {
        return $this->statut === 'honoree';
    }

    public function estPasseeEnForce()
    {
        return $this->statut === 'passee_en_force';
    }

    public function getStatutLabelAttribute()
    {
        $labels = [
            'en_cours' => 'En cours',
            'honoree' => 'Honorée',
            'passee_en_force' => 'Passée en force',
        ];
        return $labels[$this->statut] ?? $this->statut;
    }
}
