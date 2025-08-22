<?php
// app/Http/Controllers/Api/ForecastController.php
namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ForecastController extends Controller
{
    public function index(Request $req)
    {
        $materielId = $req->query('materiel_id');
        $tailleId   = $req->query('taille_id');
        $months     = (int)($req->query('months', 6));

        $start = now()->startOfMonth();
        $end   = now()->startOfMonth()->copy()->addMonths($months - 1);

        $q = DB::table('previsions_stock')
            ->whereBetween('periode', [$start->toDateString(), $end->toDateString()]);

        if ($materielId) $q->where('materiel_id', (int)$materielId);
        // respecte NULL si fourni
        if ($req->has('taille_id')) $q->where('taille_id', $tailleId);

        return response()->json(
            $q->orderBy('materiel_id')->orderBy('taille_id')->orderBy('periode')->get()
        );
    }
}
