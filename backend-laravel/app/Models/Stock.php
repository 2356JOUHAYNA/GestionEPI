<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
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
    use HasFactory;

    protected $table = 'stocks';

    /**
     * Champs modifiables en masse
     */
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

    /**
     * Constantes pour les types de mouvement
     */
    const TYPE_IN  = 'IN';   // Entrée
    const TYPE_OUT = 'OUT';  // Sortie
    const TYPE_ADJ = 'ADJ';  // Ajustement

    /**
     * Relation avec le matériel
     */
    public function materiel()
    protected $casts = [
        'materiel_id'    => 'integer',
        'taille_id'      => 'integer',
        'quantite'       => 'integer',
        'date_mouvement' => 'date', // mets 'datetime' si ta colonne est DATETIME/TIMESTAMP
    ];

    public function materiel(): BelongsTo
    {
        return $this->belongsTo(Materiel::class, 'materiel_id');
    }

    public function taille(): BelongsTo
    {
        return $this->belongsTo(Taille::class);
    }

    /**
     * Relation avec la taille
     */
    public function taille()
    {
        return $this->belongsTo(Taille::class, 'taille_id');
    }

    /**
     * Scope pratique : filtrer par matériel
     */
    public function scopeForMateriel($query, $materielId)
    {
        return $query->where('materiel_id', $materielId);
    }

    /**
     * Scope pratique : filtrer par taille
     */
    public function scopeForTaille($query, $tailleId)
    {
        return $query->where('taille_id', $tailleId);
    }
}
