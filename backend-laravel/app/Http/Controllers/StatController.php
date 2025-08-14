<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Stock;
use App\Models\Affectation;
use Illuminate\Support\Facades\DB;

class StatController extends Controller
{
    // ✅ 1. Total de matériels en stock
    public function totalStock()
    {
        $total = Stock::sum('quantite'); // remplace par le vrai champ
        return response()->json(['total' => $total]);
    }

    // ✅ 2. Fréquence d'utilisation des EPI (par mois)
    public function usageFrequency()
    {
        $data = Affectation::selectRaw('MONTH(created_at) as month, COUNT(*) as count')
            ->groupBy('month')
            ->orderBy('month')
            ->get();

        return response()->json($data);
    }

    // ✅ 3. Affectations par fonction
    public function attributionsByRole()
    {
        $data = DB::table('affectations')
            ->join('fonctions', 'affectations.fonction_id', '=', 'fonctions.id')
            ->select('fonctions.nom as fonction', DB::raw('COUNT(*) as total'))
            ->groupBy('fonctions.nom')
            ->get();

        return response()->json($data);
    }
}
