<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Stock extends Model
{
    use HasFactory;

    public const IN  = 'IN';
    public const OUT = 'OUT';
    public const ADJ = 'ADJ';

    // ✅ UNE SEULE liste blanche (fillable) qui regroupe tous les champs utiles
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

    protected $casts = [
        'materiel_id'    => 'integer',
        'taille_id'      => 'integer',
        'quantite'       => 'integer',
        'date_mouvement' => 'date', // mets 'datetime' si ta colonne est DATETIME/TIMESTAMP
    ];

    public function materiel(): BelongsTo
    {
        return $this->belongsTo(Materiel::class);
    }

    public function taille(): BelongsTo
    {
        return $this->belongsTo(Taille::class);
    }

    public function scopeForMateriel($q, $materielId)
    {
        return $q->where('materiel_id', $materielId);
    }
}
