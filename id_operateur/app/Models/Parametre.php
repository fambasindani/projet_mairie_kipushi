<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Parametre extends Model
{
    use HasFactory;

    protected $table = 'parametres';

    protected $fillable = [
        'cle',
        'valeur',
        'description',
        'est_modifiable'
    ];

    protected $casts = [
        'est_modifiable' => 'boolean',
    ];

    // ============================================================
    // SCOPES
    // ============================================================
    
    public function scopeModifiable($query)
    {
        return $query->where('est_modifiable', true);
    }

    // ============================================================
    // MÉTHODES UTILITAIRES
    // ============================================================
    
    public static function getValue($cle, $default = null)
    {
        $parametre = self::where('cle', $cle)->first();
        return $parametre ? $parametre->valeur : $default;
    }

    public static function getBoolean($cle, $default = false)
    {
        $value = self::getValue($cle);
        if ($value === null) {
            return $default;
        }
        return filter_var($value, FILTER_VALIDATE_BOOLEAN);
    }

    public static function getNumber($cle, $default = 0)
    {
        $value = self::getValue($cle);
        if ($value === null) {
            return $default;
        }
        return (float) $value;
    }

    public static function getArray($cle, $default = [])
    {
        $value = self::getValue($cle);
        if ($value === null) {
            return $default;
        }
        return json_decode($value, true) ?? $default;
    }

    public static function getInt($cle, $default = 0)
    {
        $value = self::getValue($cle);
        if ($value === null) {
            return $default;
        }
        return (int) $value;
    }
}