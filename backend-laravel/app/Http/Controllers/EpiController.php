<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class EpiController extends Controller
{
    /**
     * Prévisions de consommation EPI
     * Exemple : /api/epi/previsions?materiel_id=1&taille_id=1&months=6
     */
    public function previsions(Request $request): JsonResponse
    {
        $materielId = $request->query('materiel_id', 1);
        $tailleId   = $request->query('taille_id', 1);
        $months     = (int) $request->query('months', 6);

        // 👉 Exemple de mock, à remplacer par une requête Eloquent
        $data = [];
        for ($i = 1; $i <= $months; $i++) {
            $periode = now()->addMonths($i)->format('Y-m'); // 2025-02, 2025-03...
            $qte     = rand(40, 70);
            $data[] = [
                'periode'     => $periode,
                'qte_prevue'  => $qte,
            ];
        }

        return response()->json($data);
    }

    /**
     * Recommandations d’approvisionnement
     * Exemple : /api/epi/reco-appro?months=2&safety=5
     */
    public function recoAppro(Request $request): JsonResponse
    {
        $months   = (int) $request->query('months', 2);
        $safety   = (int) $request->query('safety', 5);

        // 👉 Exemple mock
        $data = [
            [
                'materiel'        => 'Casque de sécurité',
                'taille'          => 'M',
                'stock_actuel'    => 15,
                'demande_window'  => 25,
                'a_commander'     => 10,
                'priority'        => 'high',
            ],
            [
                'materiel'        => 'Gants de protection',
                'taille'          => 'L',
                'stock_actuel'    => 30,
                'demande_window'  => 20,
                'a_commander'     => 0,
                'priority'        => 'low',
            ],
            [
                'materiel'        => 'Chaussures de sécurité',
                'taille'          => '42',
                'stock_actuel'    => 8,
                'demande_window'  => 15,
                'a_commander'     => 7,
                'priority'        => 'medium',
            ],
            [
                'materiel'        => 'Gilet haute visibilité',
                'taille'          => 'XL',
                'stock_actuel'    => 5,
                'demande_window'  => 12,
                'a_commander'     => 7,
                'priority'        => 'high',
            ],
        ];

        return response()->json($data);
    }
}
