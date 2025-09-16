<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Services\StockService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class StockController extends Controller
{
    protected $stockService;

    public function __construct(StockService $stockService)
    {
        $this->stockService = $stockService;
    }

    // GET /api/epi/stocks
    public function stocks()
    {
        return response()->json($this->stockService->getStocksActuels());
    }

    // GET /api/epi/previsions?materiel_id=..&taille_id=..&months=6
    public function previsions(Request $request)
    {
        return response()->json(
            $this->stockService->getPrevisions(
                $request->get('materiel_id'),
                $request->get('taille_id'),
                $request->get('months', 6)
            )
        );
    }

    // GET /api/epi/reco-appro?months=2&safety=5
    public function recommandations(Request $request)
{
    try {
        return response()->json(
            $this->stockService->getRecommandations(
                $request->get('months', 2),
                $request->get('safety', 5)
            )
        );
    } catch (\Throwable $e) {
        \Log::error('reco-appro failed', ['err' => $e->getMessage()]);
        // On renvoie un JSON propre pour que le front affiche son fallback
        return response()->json(['error' => true, 'message' => $e->getMessage()], 200);
    }
}


    // optionnel: historique d’un matériel
    public function history($materiel)
    {
        // implémente si besoin
        return response()->json(['ok' => true, 'materiel' => (int)$materiel]);
        // retourne: [{id, nom, stock_actuel}]
        $materiels = Materiel::select('id','nom')->get()
            ->map(function($m){
                $stock = app(StockService::class)->currentFor($m->id);
                return ['id'=>$m->id,'nom'=>$m->nom,'stock'=>$stock];
            });
        return response()->json($materiels);
    }

    // Historique d’un matériel
   
   public function history($materielId)
{
    $rows = DB::table('stocks as s')
        ->leftJoin('tailles as t', 't.id', '=', 's.taille_id')
        ->where('s.materiel_id', $materielId)
        ->orderByDesc('s.date_mouvement')
        ->select(
            's.date_mouvement',
            's.type_mouvement',
            's.quantite',
            's.motif',
            's.taille_id',
            DB::raw('t.nom as taille_nom')
        )
        ->get();

    return response()->json($rows);
}
    // Enregistrer un mouvement (entrée / sortie / ajustement)
    public function store(Request $request)
    {
        $data = $request->validate([
            'materiel_id'    => 'required|exists:materiels,id',
            'type_mouvement' => 'required|in:IN,OUT,ADJ',
            'quantite'       => 'required|integer|min:1',
            'date_mouvement' => 'required|date',
            'motif'          => 'nullable|string|max:255',
            'reference_type' => 'nullable|string',
            'reference_id'   => 'nullable|integer',
        ]);

        $row = $this->service->move($data);
        return response()->json(['message'=>'Mouvement enregistré','data'=>$row], 201);
    }

    
}
