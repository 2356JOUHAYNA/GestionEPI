<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Taille extends Model
{
    use HasFactory;

    protected $fillable = ['materiel_id', 'libelle'];

    /**
     * Relation inverse avec le matériel.
     */
    public function materiel()
    {
        return $this->belongsTo(Materiel::class, 'materiel_id');
    }

    /**
     * Relation avec les détails d'affectation (facultatif mais utile si tu veux).
     */
    public function detailsAffectations()
    {
        return $this->hasMany(DetailAffectation::class, 'taille_id');
    }
}
