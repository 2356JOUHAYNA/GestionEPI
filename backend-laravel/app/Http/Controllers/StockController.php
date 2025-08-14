<?php
// app/Http/Controllers/StockController.php
namespace App\Http\Controllers;

use App\Models\Materiel;
use App\Models\Stock;
use App\Services\StockService;
use Illuminate\Http\Request;

class StockController extends Controller
{
    public function __construct(private StockService $service) {}

    // Stock courant pour tous les matériels
    public function index()
    {
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
        $rows = Stock::with('materiel:id,nom')
            ->forMateriel($materielId)
            ->orderByDesc('date_mouvement')
            ->orderByDesc('id')
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
