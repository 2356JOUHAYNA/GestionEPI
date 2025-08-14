<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Employe extends Model
{
    protected $table = 'employes'; // nom de ta table
    
    public function manager()
{
    return $this->belongsTo(Manager::class);
}
}
