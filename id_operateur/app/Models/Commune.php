<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Commune extends Model
{
    use HasFactory;

    protected $fillable = [
        'nom',
        'code',
        'id_ville',
        'est_actif'
    ];

    protected $casts = [
        'est_actif' => 'boolean',
    ];

    public function ville()
    {
        return $this->belongsTo(Ville::class, 'id_ville');
    }

    public function quartiers()
    {
        return $this->hasMany(Quartier::class);
    }

    public function scopeActif($query)
    {
        return $query->where('est_actif', true);
    }

    public function getNomCompletAttribute()
    {
        return $this->code . ' - ' . $this->nom;
    }
}
