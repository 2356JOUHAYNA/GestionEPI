<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\DetailAffectation;
use App\Models\Distribution;
use App\Models\Employe;
use App\Models\Stock;
use App\Services\StockService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class DistributionController extends Controller
{
    private StockService $stock;

    public function __construct(StockService $stock)
    {
        $this->stock = $stock; // injection propre
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'employe_id'           => ['required', 'exists:employes,id'],
            'affectation_id'       => ['required', 'exists:affectations,id'],
            'detail_id'            => ['required', 'exists:detail_affectations,id'],
            'quantite'             => ['required', 'integer', 'min:1'],
            'override_materiel_id' => ['nullable', 'exists:materiels,id'],
            'override_taille_id'   => ['nullable', 'exists:tailles,id'],
            'trace_mois'           => ['nullable', 'array', 'size:12'],
            'trace_mois.*'         => ['boolean'],
        ]);

        $result = DB::transaction(function () use ($data) {
            // verrouillage pessimiste
            $detail = DetailAffectation::with(['materiel', 'taille', 'affectation'])
                ->whereKey($data['detail_id'])
                ->lockForUpdate()
                ->firstOrFail();

            if ((int)$detail->affectation_id !== (int)$data['affectation_id']) {
                abort(422, 'Détail non cohérent avec l’affectation.');
            }

            // employé requis (sert au motif)
            $employe = Employe::findOrFail($data['employe_id']);

            // Disponible = affecté – déjà distribué
            $deja = Distribution::where('detail_id', $detail->id)->sum('quantite');
            $disponible = max(0, (int)$detail->quantite - (int)$deja);

            if ((int)$data['quantite'] > $disponible) {
                abort(422, "Quantité demandée ({$data['quantite']}) > disponible ({$disponible}).");
            }

            // overrides (si fournis)
            $materielId = $data['override_materiel_id'] ?? $detail->materiel_id;
            $tailleId   = $data['override_taille_id']   ?? $detail->taille_id;

            // Création distribution
            $dist = Distribution::create([
                'employe_id'        => $data['employe_id'],
                'affectation_id'    => $data['affectation_id'],
                'detail_id'         => $detail->id,
                'materiel_id'       => $materielId,
                'taille_id'         => $tailleId,
                'quantite'          => (int)$data['quantite'],
                'trace_mois'        => json_encode($data['trace_mois'] ?? array_fill(0, 12, false)),
                'date_distribution' => now()->toDateString(),
            ]);

            // Mouvement stock (SORTIE)
            $this->stock->move([
                'materiel_id'    => $materielId,
                'taille_id'      => $tailleId,
                'type_mouvement' => Stock::TYPE_OUT, // <-- IMPORTANT
                'quantite'       => (int)$data['quantite'],
                'date_mouvement' => now()->toDateString(),
                'motif'          => "Distribution à l'employé #{$employe->id}",
                'reference_type' => Distribution::class,
                'reference_id'   => $dist->id,
            ]);

            return $dist;
        });

        return response()->json([
            'message'      => 'Distribution enregistrée.',
            'distribution' => $result,
        ], 201);
    }
}
