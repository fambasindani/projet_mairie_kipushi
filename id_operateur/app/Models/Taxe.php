<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Taxe extends Model
{
    use HasFactory;

    protected $table = 'taxes';

    protected $fillable = [
        'code',
        'nom',
        'categorie',
        'description',
        'taux',
        'unite',
        'periodicite',
        'bareme',
        'est_actif',
        'est_locale',
        'taux_majoration_retard',
        'taux_interet_mensuel',
        'delai_grace_jours',
        'taux_majoration_apres_mise_en_demeure',
    ];

    protected $casts = [
        'taux' => 'decimal:4',
        'est_actif' => 'boolean',
        'est_locale' => 'boolean',
        'bareme' => 'array',
        'taux_majoration_retard' => 'decimal:2',
        'taux_interet_mensuel' => 'decimal:2',
        'delai_grace_jours' => 'integer',
        'taux_majoration_apres_mise_en_demeure' => 'decimal:2',
    ];

    // ============================================================
    // RELATIONS
    // ============================================================
    
    /**
     * Les déclarations de paiement liées à cette taxe
     */
    public function declarationsPaiements()
    {
        return $this->hasMany(DeclarationPaiement::class);
    }

    // ============================================================
    // SCOPES
    // ============================================================
    
    /**
     * Scope pour les taxes actives
     */
    public function scopeActif($query)
    {
        return $query->where('est_actif', true);
    }

    /**
     * Scope pour les taxes locales
     */
    public function scopeLocale($query)
    {
        return $query->where('est_locale', true);
    }

    /**
     * Scope pour les taxes par catégorie
     */
    public function scopeParCategorie($query, $categorie)
    {
        return $query->where('categorie', $categorie);
    }

    /**
     * Scope pour les taxes par périodicité
     */
    public function scopeParPeriodicite($query, $periodicite)
    {
        return $query->where('periodicite', $periodicite);
    }

    /**
     * Scope pour la recherche
     */
    public function scopeRecherche($query, $search)
    {
        return $query->where('nom', 'LIKE', "%{$search}%")
                     ->orWhere('code', 'LIKE', "%{$search}%")
                     ->orWhere('description', 'LIKE', "%{$search}%")
                     ->orWhere('categorie', 'LIKE', "%{$search}%");
    }

    // ============================================================
    // ACCESSORS & MUTATORS
    // ============================================================
    
    /**
     * Accesseur pour le bareme (retourne un tableau)
     */
    public function getBaremeAttribute($value)
    {
        if (is_null($value)) {
            return null;
        }
        
        // Si c'est déjà un tableau, le retourner
        if (is_array($value)) {
            return $value;
        }
        
        // Sinon, décoder le JSON
        return json_decode($value, true);
    }

    /**
     * Mutateur pour le bareme (convertit en JSON)
     */
    public function setBaremeAttribute($value)
    {
        if (is_null($value)) {
            $this->attributes['bareme'] = null;
        } elseif (is_array($value)) {
            $this->attributes['bareme'] = json_encode($value);
        } elseif (is_string($value)) {
            // Si c'est déjà une chaîne JSON, la garder
            $this->attributes['bareme'] = $value;
        } else {
            $this->attributes['bareme'] = null;
        }
    }

    // ============================================================
    // MÉTHODES UTILITAIRES
    // ============================================================
    
    /**
     * Vérifier si la taxe est active
     */
    public function estActive()
    {
        return $this->est_actif;
    }

    /**
     * Activer la taxe
     */
    public function activer()
    {
        $this->est_actif = true;
        $this->save();
        return $this;
    }

    /**
     * Désactiver la taxe
     */
    public function desactiver()
    {
        $this->est_actif = false;
        $this->save();
        return $this;
    }

    /**
     * Calculer le montant de la taxe
     */
    public function calculerMontant($base, $unite = null)
    {
        if ($this->unite === 'pourcentage') {
            return $base * ($this->taux / 100);
        } elseif ($this->unite === 'montant_fixe') {
            return $this->taux;
        } elseif ($this->unite === 'par_unite' && $unite) {
            return $this->taux * $unite;
        }
        return 0;
    }

    /**
     * Obtenir le bareme par catégorie
     */
    public function getBaremeParCategorie($categorie)
    {
        if (!$this->bareme || !isset($this->bareme['categories'])) {
            return null;
        }
        return $this->bareme['categories'][$categorie] ?? null;
    }

    /**
     * Obtenir le libellé de la catégorie
     */
    public function getCategorieLabelAttribute()
    {
        $labels = [
            'patente' => 'Patente',
            'foncier' => 'Foncier',
            'revenus_locatifs' => 'Revenus locatifs',
            'personnel_minimum' => 'Personnel minimum',
            'vehicule' => 'Véhicule',
            'permis_construire' => 'Permis de construire',
            'etalage' => 'Étalage',
            'peage_urbain' => 'Péage urbain',
            'pont_bascule' => 'Pont bascule',
            'chargement' => 'Chargement',
            'dechargement' => 'Déchargement',
            'autre' => 'Autre',
        ];
        return $labels[$this->categorie] ?? $this->categorie;
    }

    /**
     * Obtenir le libellé de la périodicité
     */
    public function getPeriodiciteLabelAttribute()
    {
        $labels = [
            'mensuelle' => 'Mensuelle',
            'trimestrielle' => 'Trimestrielle',
            'semestrielle' => 'Semestrielle',
            'annuelle' => 'Annuelle',
            'evenementielle' => 'Événementielle',
        ];
        return $labels[$this->periodicite] ?? $this->periodicite;
    }

    /**
     * Obtenir le libellé de l'unité
     */
    public function getUniteLabelAttribute()
    {
        $labels = [
            'pourcentage' => 'Pourcentage (%)',
            'montant_fixe' => 'Montant fixe',
            'par_unite' => 'Par unité',
        ];
        return $labels[$this->unite] ?? $this->unite;
    }

    /**
     * Compter le nombre de déclarations
     */
    public function getNombreDeclarationsAttribute()
    {
        return $this->declarationsPaiements()->count();
    }

    /**
     * Obtenir le montant total collecté
     */
    public function getMontantTotalCollecteAttribute()
    {
        return $this->declarationsPaiements()
                    ->where('statut', 'paye')
                    ->sum('montant_total');
    }
}