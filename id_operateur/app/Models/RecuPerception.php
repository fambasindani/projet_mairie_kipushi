<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class RecuPerception extends Model
{
    use HasFactory;

    protected $table = 'recus_perception';

    protected $fillable = [
        'taxe_id',
        'personne_id',
        'percepteur_id',
        'valide',
        'type_perception',
        'numero',
        'date_emission',
        'heure_emission',
        'categorie_vehicule',
        'plaque_immatriculation',
        'montant',
        'trajet',
        'chauffeur_nom',
        'conducteur_nom',
        'Numero_Piece',
        'designation',
        'poids',
        'observations',
    ];

    protected $casts = [
        'date_emission' => 'date',
        'montant' => 'decimal:2',
        'poids' => 'decimal:2',
        'valide' => 'boolean',
    ];

    // Relations
    public function taxe() { return $this->belongsTo(Taxe::class); }
    public function personne() { return $this->belongsTo(Personne::class); }
    public function percepteur() { return $this->belongsTo(Utilisateur::class, 'percepteur_id'); }

    // Types de perception
    public const TYPES = [
        'peage_urbain' => 'Péage urbain',
        'pont_bascule' => 'Pont bascule',
        'etalage' => 'Étalage',
        'chargement' => 'Chargement',
        'dechargement' => 'Déchargement',
        'autre' => 'Autre',
    ];

    // Générer le prochain numéro de série
    public static function prochainNumero(string $type = 'PEA'): string
    {
        $prefixe = strtoupper($type);
        $dernier = self::where('numero', 'like', "{$prefixe}/%")
            ->orderBy('id', 'desc')
            ->first();

        $numero = $dernier ? intval(substr($dernier->numero, strlen($prefixe) + 1)) + 1 : 1;
        return $prefixe . '/' . str_pad($numero, 3, '0', STR_PAD_LEFT);
    }

    public function getTrajetLabelAttribute(): string
    {
        $labels = [
            'aller' => 'Aller',
            'retour' => 'Retour',
            'aller_retour' => 'Aller/Retour',
        ];
        return $labels[$this->trajet] ?? $this->trajet;
    }

    public function getTypePerceptionLabelAttribute(): string
    {
        return self::TYPES[$this->type_perception] ?? $this->type_perception;
    }
}
