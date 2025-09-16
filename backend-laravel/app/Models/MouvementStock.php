<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class MouvementStock extends Model
{
    // Table réelle
    protected $table = 'stocks';

    // Active les colonnes created_at / updated_at
    public $timestamps = true;

    // Colonnes autorisées à l’insertion
    protected $fillable = [
        'materiel_id',
        'taille_id',
        'type_mouvement',
        'quantite',
        'date_mouvement',
        'motif',
        'reference_type',
        'reference_id',
    ];

    // Cast automatiques (pratique pour éviter les bugs de type)
    protected $casts = [
        'materiel_id'    => 'integer',
        'taille_id'      => 'integer',
        'quantite'       => 'integer',
        'date_mouvement' => 'date',
    ];

    // Relations
    public function materiel() { return $this->belongsTo(Materiel::class); }
    public function taille()   { return $this->belongsTo(Taille::class);   }
}
