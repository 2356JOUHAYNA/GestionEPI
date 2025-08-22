<?php
// app/Http/Controllers/Api/ReplenishController.php
namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ReplenishController extends Controller
{
    public function index(Request $req)
    {
        $months = (int)($req->query('months', 2));  // ex 2 mois
        $safety = (int)($req->query('safety', 5));  // stock de sécurité par taille

        $start = now()->startOfMonth();
        $end   = now()->startOfMonth()->copy()->addMonths($months - 1);

        // Demande prévue sur la fenêtre [start..end]
        $demande = DB::table('previsions_stock')
            ->select('materiel_id','taille_id', DB::raw('SUM(qte_prevue) AS demande_window'))
            ->whereBetween('periode', [$start->toDateString(), $end->toDateString()])
            ->groupBy('materiel_id','taille_id');

        // Stock actuel par (materiel, taille)
        $stock = DB::table('tailles')
            ->select('tailles.materiel_id', 'tailles.id AS taille_id')
            ->selectRaw('
                (COALESCE(tailles.quantite, 0) + COALESCE((
                    SELECT SUM(
                        CASE
                            WHEN type_mouvement = \'IN\'  THEN quantite
                            WHEN type_mouvement = \'OUT\' THEN -quantite
                            WHEN type_mouvement = \'ADJ\' THEN quantite
                            ELSE 0
                        END
                    )
                    FROM stocks s
                    WHERE s.materiel_id = tailles.materiel_id
                      AND s.taille_id   = tailles.id
                ), 0)) AS stock_actuel
            ');

        $rows = DB::query()->fromSub($demande, 'd')
            ->joinSub($stock, 'st', function($j){
                $j->on('d.materiel_id','=','st.materiel_id')
                  ->on(DB::raw('COALESCE(d.taille_id, -1)'), '=', DB::raw('COALESCE(st.taille_id, -1)'));
            })
            ->leftJoin('materiels','materiels.id','=','d.materiel_id')
            ->leftJoin('tailles','tailles.id','=','d.taille_id')
            ->select(
                'd.materiel_id',
                'd.taille_id',
                'materiels.nom as materiel',
                'tailles.nom as taille',
                'st.stock_actuel',
                'd.demande_window'
            )
            ->selectRaw('GREATEST(0, d.demande_window + ? - st.stock_actuel) AS qty_to_order', [$safety])
            ->orderByDesc('qty_to_order')
            ->get();

        return response()->json($rows);
    }
}
