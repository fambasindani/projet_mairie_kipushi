<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Facture extends Model
{
    use HasFactory;

    protected $fillable = [
        'declaration_paiement_id', 'numero_facture', 'date_emission',
        'montant_ht', 'montant_tva', 'montant_total', 'devise',
        'chemin_pdf', 'statut', 'observations'
    ];

    protected $casts = [
        'date_emission' => 'datetime',
        'montant_ht' => 'decimal:2',
        'montant_tva' => 'decimal:2',
        'montant_total' => 'decimal:2',
    ];

    // ============================================================
    // RELATIONS
    // ============================================================
    
    public function declarationPaiement()
    {
        return $this->belongsTo(DeclarationPaiement::class);
    }

    // ============================================================
    // SCOPES
    // ============================================================
    
    public function scopeEmise($query)
    {
        return $query->where('statut', 'emise');
    }

    public function scopePayee($query)
    {
        return $query->where('statut', 'payee');
    }

    public function scopeAnnulee($query)
    {
        return $query->where('statut', 'annulee');
    }

    // ============================================================
    // MÉTHODES UTILITAIRES
    // ============================================================
    
    public function getStatutLabelAttribute()
    {
        $labels = [
            'emise' => 'Émise',
            'payee' => 'Payée',
            'annulee' => 'Annulée',
        ];
        return $labels[$this->statut] ?? $this->statut;
    }

    public function getTvaTauxAttribute()
    {
        if ($this->montant_ht > 0) {
            return ($this->montant_tva / $this->montant_ht) * 100;
        }
        return 0;
    }

    public function getMontantEnLettresAttribute()
    {
        // À implémenter : convertir le montant en lettres
        return $this->montant_total . ' Francs Congolais';
    }
}