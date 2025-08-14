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
use Illuminate\Validation\Rule;

class DistributionController extends Controller
{
    public function store(Request $request)
    {
        $data = $request->validate([
            'employe_id'           => ['required', 'exists:employes,id'],
            'affectation_id'       => ['required', 'exists:affectations,id'],
            'detail_id'            => ['required', 'exists:detail_affectations,id'],
            'quantite'             => ['required', 'integer', 'min:1'],
            'override_materiel_id' => ['nullable', 'exists:materiels,id'],
            'override_taille_id'   => ['nullable', 'exists:tailles,id'],
            // 12 booléens [Jan..Déc]
            'trace_mois'           => ['nullable', 'array', 'size:12'],
            'trace_mois.*'         => ['boolean'],
        ]);

        // Empêche les incohérences et les courses
        $distribution = DB::transaction(function () use ($data) {

            // lockForUpdate pour éviter deux distributions simultanées sur la même ligne
            $detail = DetailAffectation::with(['materiel', 'taille', 'affectation'])
                ->whereKey($data['detail_id'])
                ->lockForUpdate()
                ->firstOrFail();

            // 1) Le détail doit appartenir à l'affectation fournie
            if ((int) $detail->affectation_id !== (int) $data['affectation_id']) {
                abort(422, 'Détail non cohérent avec l’affectation.');
            }

            // 2) Optionnel : s’assurer que l’employé existe (et le charger si besoin pour le motif)
            $employe = Employe::findOrFail($data['employe_id']);

            // 3) Quantité disponible = quantité affectée - déjà distribuée
            $dejaDistribue = Distribution::where('detail_id', $detail->id)->sum('quantite');
            $disponible    = max(0, (int) $detail->quantite - (int) $dejaDistribue);

            if ($data['quantite'] > $disponible) {
                abort(422, "Quantité demandée ({$data['quantite']}) > disponible ({$disponible}).");
            }

            // 4) Overrides cohérents ? (si fournis)
            $materielId = $data['override_materiel_id'] ?? $detail->materiel_id;
            $tailleId   = $data['override_taille_id']   ?? $detail->taille_id;

            // Si tu veux forcer cohérence taille/matériel :
            // DB::table('tailles')->where('id', $tailleId)->where('materiel_id', $materielId)->exists()
            // ou via relations si tu as une contrainte DB

            // 5) Créer la distribution
            $distribution = Distribution::create([
                'employe_id'        => $data['employe_id'],
                'affectation_id'    => $data['affectation_id'],
                'detail_id'         => $detail->id,
                'materiel_id'       => $materielId,
                'taille_id'         => $tailleId,
                'quantite'          => (int) $data['quantite'],
                'trace_mois'        => json_encode($data['trace_mois'] ?? array_fill(0, 12, false)),
                'date_distribution' => now(),
            ]);

            // 6) Mouvement de stock (SORTIE) — 100% aligné avec ton StockService
            app(StockService::class)->move([
                'materiel_id'    => $materielId,
                'type_mouvement' => Stock::OUT, // assure-toi que la constante OUT existe (ex: const OUT = 'OUT';)
                'quantite'       => (int) $data['quantite'],
                'date_mouvement' => now()->toDateString(),
                'motif'          => "Distribution à l'employé #{$employe->id}",
                'reference_type' => Distribution::class, // morph optionnel
                'reference_id'   => $distribution->id,   // morph optionnel
            ]);

            return $distribution;
        });

        return response()->json([
            'message'      => 'Distribué.',
            'distribution' => $distribution,
        ], 201);
    }
}
