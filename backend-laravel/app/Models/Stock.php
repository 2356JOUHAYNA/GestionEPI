<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Stock extends Model
{
    use HasFactory;

    protected $table = 'stocks';
    // public $timestamps = false; // ← décommente si la table n'a pas created_at / updated_at

    /**
     * Constantes pour les types de mouvement
     */
    public const TYPE_IN  = 'IN';   // Entrée
    public const TYPE_OUT = 'OUT';  // Sortie
    public const TYPE_ADJ = 'ADJ';  // Ajustement

    /** Types autorisés */
    public const TYPES = [
        self::TYPE_IN,
        self::TYPE_OUT,
        self::TYPE_ADJ,
    ];

    /**
     * Champs modifiables en masse
     */
    protected $fillable = [
        'materiel_id',
        'taille_id',
        'type_mouvement', // IN | OUT | ADJ
        'quantite',
        'date_mouvement',
        'motif',
        'reference_type', // ex: 'Affectation', 'Distribution', 'Inventaire'
        'reference_id',
    ];

    protected $casts = [
        'materiel_id'    => 'integer',
        'taille_id'      => 'integer',
        'quantite'       => 'integer',
        'date_mouvement' => 'date', // ou 'datetime'
    ];

    /**
     * Attributs calculés à exposer automatiquement
     */
    protected $appends = [
        'materiel_nom',
        'taille_libelle',
        'signe',
        'quantite_signee',
    ];

    /* =========================================================================
     |  RELATIONS
     |=========================================================================*/
    public function materiel(): BelongsTo
    {
        return $this->belongsTo(Materiel::class, 'materiel_id');
    }

    public function taille(): BelongsTo
    {
        return $this->belongsTo(Taille::class, 'taille_id');
    }

    /* =========================================================================
     |  HELPERS (méthodes) — versions “fonction”
     |=========================================================================*/
    public function materielNom(): ?string
    {
        return optional($this->materiel)->nom ?? null; // adapte le champ si besoin
    }

    public function tailleLibelle(): ?string
    {
        // adapte le champ selon ton modèle Taille (ex: 'libelle' ou 'name')
        return optional($this->taille)->libelle ?? optional($this->taille)->name ?? null;
    }

    public function isIn(): bool
    {
        return $this->type_mouvement === self::TYPE_IN;
    }

    public function isOut(): bool
    {
        return $this->type_mouvement === self::TYPE_OUT;
    }

    public function isAdj(): bool
    {
        return $this->type_mouvement === self::TYPE_ADJ;
    }

    /**
     * +1 pour IN, -1 pour OUT, 0 pour ADJ
     */
    public function signe(): int
    {
        return match ($this->type_mouvement) {
            self::TYPE_IN  =>  1,
            self::TYPE_OUT => -1,
            default        =>  0,
        };
    }

    /**
     * Quantité avec signe (+/-) selon le type
     */
    public function quantiteSignee(): int
    {
        return $this->signe() * (int) $this->quantite;
    }

    /* =========================================================================
     |  ACCESSORS (attributs virtuels) — versions “$stock->materiel_nom”
     |=========================================================================*/
    public function getMaterielNomAttribute(): ?string
    {
        return $this->materielNom();
    }

    public function getTailleLibelleAttribute(): ?string
    {
        return $this->tailleLibelle();
    }

    public function getSigneAttribute(): int
    {
        return $this->signe();
    }

    public function getQuantiteSigneeAttribute(): int
    {
        return $this->quantiteSignee();
    }

    /* =========================================================================
     |  SCOPES
     |=========================================================================*/
    public function scopeForMateriel($query, int $materielId)
    {
        return $query->where('materiel_id', $materielId);
    }

    public function scopeForTaille($query, int $tailleId)
    {
        return $query->where('taille_id', $tailleId);
    }

    public function scopeTypeIn($query)
    {
        return $query->where('type_mouvement', self::TYPE_IN);
    }

    public function scopeTypeOut($query)
    {
        return $query->where('type_mouvement', self::TYPE_OUT);
    }

    public function scopeTypeAdj($query)
    {
        return $query->where('type_mouvement', self::TYPE_ADJ);
    }

    /* =========================================================================
     |  MUTATORS / VALIDATION LÉGÈRE
     |=========================================================================*/
    /**
     * Force uppercase + valide la valeur
     */
    public function setTypeMouvementAttribute($value): void
    {
        $val = strtoupper((string) $value);
        if (!in_array($val, self::TYPES, true)) {
            throw new \InvalidArgumentException("Type de mouvement invalide: {$val}");
        }
        $this->attributes['type_mouvement'] = $val;
    }

    /**
     * (Optionnel) Sécuriser aussi au moment du saving
     */
    protected static function booted(): void
    {
        static::saving(function (self $model) {
            // valide type_mouvement
            if (!in_array($model->type_mouvement, self::TYPES, true)) {
                throw new \InvalidArgumentException("Type de mouvement invalide: {$model->type_mouvement}");
            }

            // Quantité >= 0 (à toi d’autoriser ou non 0)
            if ($model->quantite < 0) {
                throw new \InvalidArgumentException('La quantité ne peut pas être négative.');
            }
        });
    }
}
