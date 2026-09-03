<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Ville extends Model
{
    use HasFactory;

    protected $fillable = [
        'nom',
        'code',
        'id_province',
        'est_actif'
    ];

    protected $casts = [
        'est_actif' => 'boolean',
    ];

    public function province()
    {
        return $this->belongsTo(Province::class, 'id_province');
    }

    public function communes()
    {
        return $this->hasMany(Commune::class, 'id_ville');
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
