<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Quartier extends Model
{
    use HasFactory;

    protected $fillable = [
        'commune_id',
        'nom',
        'code',
        'est_actif'
    ];

    protected $casts = [
        'est_actif' => 'boolean',
    ];

    public function commune()
    {
        return $this->belongsTo(Commune::class);
    }

    public function scopeActif($query)
    {
        return $query->where('est_actif', true);
    }

    public function scopeParCommune($query, $communeId)
    {
        return $query->where('commune_id', $communeId);
    }
}