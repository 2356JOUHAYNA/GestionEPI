<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Services\StockService;

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
    }
}
