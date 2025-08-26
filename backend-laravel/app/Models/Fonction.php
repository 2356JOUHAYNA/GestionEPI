<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Fonction extends Model
{
    protected $table = 'fonctions';
    public $timestamps = false; // la table n'a pas de created_at/updated_at
    protected $fillable = ['nom_fonction', 'description', 'active'];
}
