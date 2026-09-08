<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class DeclarationPaiement extends Model
{
    use HasFactory;

    // ⚠️ IMPORTANT : Spécifier le nom exact de la table
    protected $table = 'declarations_paiements';

    protected $fillable = [
        'personne_id', 
        'taxe_id', 
        'bien_immobilier_id', 
        'vehicule_id',
        'permis_id', 
        'exercice', 
        'periode_debut', 
        'periode_fin',
        'montant_base', 
        'montant_taxe', 
        'penalites', 
        'montant_total',
        'date_limite_paiement', 
        'date_paiement', 
        'statut',
        'reference_paiement', 
        'justificatif', 
        'observations',
        'date_dernier_calcul_penalites',
        'nombre_jours_retard',
        'majoration_retard',
        'interet_retard',
        'mise_en_demeure_envoyee',
        'date_mise_en_demeure',
    ];

    protected $casts = [
        'exercice' => 'integer',
        'periode_debut' => 'date',
        'periode_fin' => 'date',
        'date_limite_paiement' => 'date',
        'date_paiement' => 'date',
        'montant_base' => 'decimal:2',
        'montant_taxe' => 'decimal:2',
        'penalites' => 'decimal:2',
        'montant_total' => 'decimal:2',
        'date_dernier_calcul_penalites' => 'date',
        'nombre_jours_retard' => 'integer',
        'majoration_retard' => 'decimal:2',
        'interet_retard' => 'decimal:2',
        'mise_en_demeure_envoyee' => 'boolean',
        'date_mise_en_demeure' => 'date',
    ];

    // ============================================================
    // RELATIONS
    // ============================================================
    
    public function personne()
    {
        return $this->belongsTo(Personne::class);
    }

    public function taxe()
    {
        return $this->belongsTo(Taxe::class);
    }

    public function bienImmobilier()
    {
        return $this->belongsTo(BienImmobilier::class);
    }

    public function vehicule()
    {
        return $this->belongsTo(Vehicule::class);
    }

    public function permis()
    {
        return $this->belongsTo(PermisAutorisation::class, 'permis_id');
    }

    public function facture()
    {
        return $this->hasOne(Facture::class);
    }

    public function misesEnDemeure()
    {
        return $this->hasMany(MiseEnDemeure::class, 'declaration_paiement_id');
    }

    // ============================================================
    // SCOPES
    // ============================================================
    
    public function scopeEnAttente($query)
    {
        return $query->where('statut', 'en_attente');
    }

    public function scopePaye($query)
    {
        return $query->where('statut', 'paye');
    }

    public function scopeEnRetard($query)
    {
        return $query->where('statut', 'en_retard');
    }

    public function scopeParExercice($query, $exercice)
    {
        return $query->where('exercice', $exercice);
    }

    public function scopeParStatut($query, $statut)
    {
        return $query->where('statut', $statut);
    }

    public function scopeNonPaye($query)
    {
        return $query->whereNull('date_paiement');
    }

    public function scopeEchu($query)
    {
        return $query->where('date_limite_paiement', '<', now())
                     ->whereNull('date_paiement');
    }

    // ============================================================
    // MÉTHODES UTILITAIRES
    // ============================================================
    
    public function estPaye()
    {
        return $this->statut === 'paye';
    }

    public function estEnRetard()
    {
        return $this->statut === 'en_retard';
    }

    public function estAnnule()
    {
        return $this->statut === 'annule';
    }

    public function calculerPenalites($taux = 10)
    {
        if ($this->date_paiement && $this->date_limite_paiement < $this->date_paiement) {
            $joursRetard = $this->date_limite_paiement->diffInDays($this->date_paiement);
            return ($this->montant_total * $taux / 100) * ($joursRetard / 30);
        }
        return 0;
    }

    public function getStatutLabelAttribute()
    {
        $labels = [
            'en_attente' => 'En attente',
            'paye' => 'Payé',
            'en_retard' => 'En retard',
            'conteste' => 'Contesté',
            'annule' => 'Annulé',
            'exonere' => 'Exonéré',
        ];
        return $labels[$this->statut] ?? $this->statut;
    }

    public function getStatutCouleurAttribute()
    {
        $couleurs = [
            'en_attente' => 'warning',
            'paye' => 'success',
            'en_retard' => 'danger',
            'conteste' => 'info',
            'annule' => 'secondary',
            'exonere' => 'primary',
        ];
        return $couleurs[$this->statut] ?? 'secondary';
    }
}