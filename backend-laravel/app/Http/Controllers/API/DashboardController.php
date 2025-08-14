<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Materiel;
use App\Models\Affectation;
use App\Models\Stock;
use App\Models\Fonction;
use Illuminate\Support\Facades\DB;

class DashboardController extends Controller
{
    public function stats()
    {
        $totalMateriels = Materiel::count();

        $affectationsByFunction = Affectation::select('fonction_id', DB::raw('count(*) as total'))
            ->groupBy('fonction_id')
            ->get();

        $affectationsPerMonth = Affectation::selectRaw('MONTH(created_at) as month, count(*) as total')
            ->groupBy('month')->get();

        $stockDisponible = Stock::where('type_mouvement', 'entree')->sum('quantite') -
                           Stock::where('type_mouvement', 'sortie')->sum('quantite');

        return response()->json([
            'materiels_total' => $totalMateriels,
            'affectations_par_fonction' => $affectationsByFunction,
            'affectations_par_mois' => $affectationsPerMonth,
            'stock_disponible' => $stockDisponible,
        ]);
    }
}

