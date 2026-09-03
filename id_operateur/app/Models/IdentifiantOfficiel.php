<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class IdentifiantOfficiel extends Model
{
    use HasFactory;

    protected $table = 'identifiants_officiels';

    protected $fillable = [
        'personne_id',
        'type_identifiant',
        'valeur',
        'province_delivrance',
        'date_delivrance',
        'date_expiration',
        'est_actif'
    ];

    protected $casts = [
        'date_delivrance' => 'date',
        'date_expiration' => 'date',
        'est_actif' => 'boolean',
    ];

    // ============================================================
    // RELATIONS
    // ============================================================
    
    /**
     * La personne à qui appartient cet identifiant
     */
    public function personne()
    {
        return $this->belongsTo(Personne::class);
    }

    // ============================================================
    // SCOPES
    // ============================================================
    
    /**
     * Scope pour les identifiants actifs
     */
    public function scopeActif($query)
    {
        return $query->where('est_actif', true);
    }

    /**
     * Scope pour les identifiants par type
     */
    public function scopeParType($query, $type)
    {
        return $query->where('type_identifiant', $type);
    }

    /**
     * Scope pour les identifiants par personne
     */
    public function scopeParPersonne($query, $personneId)
    {
        return $query->where('personne_id', $personneId);
    }

    /**
     * Scope pour les identifiants expirés
     */
    public function scopeExpire($query)
    {
        return $query->where('date_expiration', '<', now())
                     ->whereNotNull('date_expiration');
    }

    /**
     * Scope pour les identifiants valides (non expirés)
     */
    public function scopeValide($query)
    {
        return $query->where('est_actif', true)
                     ->where(function ($q) {
                         $q->whereNull('date_expiration')
                           ->orWhere('date_expiration', '>=', now());
                     });
    }

    /**
     * Scope pour la recherche
     */
    public function scopeRecherche($query, $search)
    {
        return $query->where('valeur', 'LIKE', "%{$search}%")
                     ->orWhere('type_identifiant', 'LIKE', "%{$search}%")
                     ->orWhere('province_delivrance', 'LIKE', "%{$search}%")
                     ->orWhereHas('personne', function ($pq) use ($search) {
                         $pq->where('nom', 'LIKE', "%{$search}%")
                            ->orWhere('prenom', 'LIKE', "%{$search}%")
                            ->orWhere('denomination_sociale', 'LIKE', "%{$search}%")
                            ->orWhere('email', 'LIKE', "%{$search}%");
                     });
    }

    // ============================================================
    // ACCESSORS
    // ============================================================
    
    /**
     * Obtenir le libellé du type d'identifiant
     */
    public function getTypeIdentifiantLabelAttribute()
    {
        $labels = [
            'RCCM' => 'Registre de Commerce',
            'IDNAT' => 'Carte Nationale d\'Identité',
            'NUMERO_IMPOT' => 'Numéro d\'Impôt',
            'NIF' => 'NIF',
            'CNSS' => 'CNSS',
            'ONEM' => 'ONEM',
            'PASSEPORT' => 'Passeport',
            'PERMIS_CONDURE' => 'Permis de Conduire',
        ];
        return $labels[$this->type_identifiant] ?? $this->type_identifiant;
    }

    /**
     * Obtenir le statut de l'identifiant
     */
    public function getStatutAttribute()
    {
        if (!$this->est_actif) {
            return 'inactif';
        }
        if ($this->date_expiration && $this->date_expiration < now()) {
            return 'expire';
        }
        if ($this->date_expiration && $this->date_expiration <= now()->addDays(30)) {
            return 'bientot_expire';
        }
        return 'valide';
    }

    /**
     * Obtenir le libellé du statut
     */
    public function getStatutLabelAttribute()
    {
        $labels = [
            'valide' => 'Valide',
            'bientot_expire' => 'Expire bientôt',
            'expire' => 'Expiré',
            'inactif' => 'Inactif',
        ];
        return $labels[$this->statut] ?? $this->statut;
    }

    /**
     * Obtenir la couleur du statut
     */
    public function getStatutCouleurAttribute()
    {
        $couleurs = [
            'valide' => 'success',
            'bientot_expire' => 'warning',
            'expire' => 'danger',
            'inactif' => 'secondary',
        ];
        return $couleurs[$this->statut] ?? 'secondary';
    }

    /**
     * Obtenir le nombre de jours avant expiration
     */
    public function getJoursAvantExpirationAttribute()
    {
        if (!$this->date_expiration) {
            return null;
        }
        return now()->diffInDays($this->date_expiration, false);
    }

    /**
     * Obtenir le libellé complet de l'identifiant
     */
    public function getLibelleCompletAttribute()
    {
        return $this->type_identifiant_label . ' - ' . $this->valeur;
    }

    // ============================================================
    // MÉTHODES UTILITAIRES
    // ============================================================
    
    /**
     * Vérifier si l'identifiant est actif
     */
    public function estActif()
    {
        return $this->est_actif;
    }

    /**
     * Vérifier si l'identifiant est expiré
     */
    public function estExpire()
    {
        return $this->date_expiration && $this->date_expiration < now();
    }

    /**
     * Vérifier si l'identifiant est valide
     */
    public function estValide()
    {
        return $this->est_actif && !$this->estExpire();
    }

    /**
     * Vérifier si l'identifiant expire bientôt (dans 30 jours)
     */
    public function expireBientot($jours = 30)
    {
        if (!$this->date_expiration) {
            return false;
        }
        return $this->date_expiration >= now() && 
               $this->date_expiration <= now()->addDays($jours);
    }

    /**
     * Activer l'identifiant
     */
    public function activer()
    {
        $this->est_actif = true;
        $this->save();
        return $this;
    }

    /**
     * Désactiver l'identifiant
     */
    public function desactiver()
    {
        $this->est_actif = false;
        $this->save();
        return $this;
    }

    /**
     * Formater la date de délivrance
     */
    public function getDateDelivranceFormattedAttribute()
    {
        return $this->date_delivrance ? $this->date_delivrance->format('d/m/Y') : 'N/A';
    }

    /**
     * Formater la date d'expiration
     */
    public function getDateExpirationFormattedAttribute()
    {
        return $this->date_expiration ? $this->date_expiration->format('d/m/Y') : 'N/A';
    }

    /**
     * Obtenir la province de délivrance (ou N/A)
     */
    public function getProvinceDelivranceFormattedAttribute()
    {
        return $this->province_delivrance ?? 'N/A';
    }
}