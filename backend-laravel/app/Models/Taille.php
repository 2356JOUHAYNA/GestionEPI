<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
// use Illuminate\Database\Eloquent\Relations\BelongsTo;
// use Illuminate\Database\Eloquent\Relations\HasMany;

class Taille extends Model
{
    use HasFactory;

    /**
     * ─────────────────────────────────────────────────────────────
     * 🟣 CODE DE TA COPINE (inchangé)
     * ─────────────────────────────────────────────────────────────
     */
    // (laisse comme elle l’avait)
    protected $fillable = ['materiel_id', 'libelle'];

    public function materiel() /* : BelongsTo */
    {
        return $this->belongsTo(Materiel::class, 'materiel_id');
    }

    public function detailsAffectations() /* : HasMany */
    {
        return $this->hasMany(DetailAffectation::class, 'taille_id');
    }

    /**
     * ─────────────────────────────────────────────────────────────
     * 🟢 TES AJOUTS (sans casser son code)
     * ─────────────────────────────────────────────────────────────
     */

    // Autoriser aussi 'nom' et 'quantite' en mass assignment
    public function getFillable()
    {
        return array_unique(array_merge(parent::getFillable(), ['nom', 'quantite']));
    }

    protected $casts = [
        'materiel_id' => 'integer',
        'quantite'    => 'integer',
    ];

    // Lire 'nom' ; si absent, retomber sur 'libelle' (compat lecture)
    public function getNomAttribute()
    {
        return $this->attributes['nom'] ?? ($this->attributes['libelle'] ?? null);
    }

    // Écrire UNIQUEMENT sur 'nom' (⚠️ ne plus toucher à 'libelle' car la colonne n'existe pas)
    public function setNomAttribute($value): void
    {
        $value = is_numeric($value) ? (string) $value : mb_strtoupper(trim((string) $value));
        $this->attributes['nom'] = $value;
    }

    // Quantité facultative si absente
    public function getQuantiteAttribute()
    {
        return $this->attributes['quantite'] ?? 0;
    }
}
