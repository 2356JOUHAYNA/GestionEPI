<?php


namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;


use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use App\Models\Categorie;
use App\Models\Stock;





class Materiel extends Model
{
    use HasFactory;

    protected $fillable = ['nom', 'categorie_id', 'stock_initial'];

    public function tailles()
    {
        return $this->hasMany(Taille::class);
    }
    public function frequences()
{
    return $this->hasMany(FrequenceMateriel::class);
}











    // ➕ Ta relation
    public function categorie(): BelongsTo
    {
        return $this->belongsTo(Categorie::class);
    }

    // ➕ Ta relation
    public function stocks(): HasMany
    {
        return $this->hasMany(Stock::class);
    }
}
