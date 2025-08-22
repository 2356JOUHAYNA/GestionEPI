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

    public function stocks()
    {
        return response()->json($this->stockService->getStocksActuels());
    }

    public function previsions(Request $request)
    {
        return response()->json(
            $this->stockService->getPrevisions(
                $request->materiel_id,
                $request->taille_id,
                $request->get('months', 6)
            )
        );
    }

    public function recommandations(Request $request)
    {
        return response()->json(
            $this->stockService->getRecommandations(
                $request->get('months', 2),
                $request->get('safety', 5)
            )
        );
    }
}
