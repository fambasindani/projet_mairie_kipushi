<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Notification extends Model
{
    use HasFactory;

    protected $table = 'notifications';

    protected $fillable = [
        'personne_id',
        'type_notification',
        'sujet',
        'message',
        'est_lue',
        'date_envoi',
        'date_lecture',
        'lien_action'
    ];

    protected $casts = [
        'est_lue' => 'boolean',
        'date_envoi' => 'datetime',
        'date_lecture' => 'datetime',
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
    
    public function scopeNonLues($query)
    {
        return $query->where('est_lue', false);
    }

    public function scopeLues($query)
    {
        return $query->where('est_lue', true);
    }

    public function scopeParType($query, $type)
    {
        return $query->where('type_notification', $type);
    }

    public function scopeParPersonne($query, $personneId)
    {
        return $query->where('personne_id', $personneId);
    }

    // ============================================================
    // ACCESSORS
    // ============================================================
    
    public function getTypeNotificationLabelAttribute()
    {
        $labels = [
            'paiement_echu' => 'Paiement échu',
            'renouvellement_permis' => 'Renouvellement de permis',
            'controle_prochain' => 'Contrôle à venir',
            'mise_en_demeure' => 'Mise en demeure',
            'information' => 'Information',
        ];
        return $labels[$this->type_notification] ?? $this->type_notification;
    }

    public function getEstLueLabelAttribute()
    {
        return $this->est_lue ? 'Lu' : 'Non lu';
    }

    // ============================================================
    // MÉTHODES UTILITAIRES
    // ============================================================
    
    public function marquerCommeLue()
    {
        $this->est_lue = true;
        $this->date_lecture = now();
        $this->save();
        return $this;
    }

    public function marquerCommeNonLue()
    {
        $this->est_lue = false;
        $this->date_lecture = null;
        $this->save();
        return $this;
    }

    public static function creerNotification($personneId, $type, $sujet, $message, $lienAction = null)
    {
        return self::create([
            'personne_id' => $personneId,
            'type_notification' => $type,
            'sujet' => $sujet,
            'message' => $message,
            'lien_action' => $lienAction,
            'date_envoi' => now(),
            'est_lue' => false,
        ]);
    }
}