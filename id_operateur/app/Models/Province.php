<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Province extends Model
{
    use HasFactory;

    protected $fillable = [
        'nom',
        'code',
        'est_actif'
    ];

    protected $casts = [
        'est_actif' => 'boolean',
    ];

    public function villes()
    {
        return $this->hasMany(Ville::class, 'id_province');
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
