<?php

namespace App\Http\Controllers;

use App\Models\Affectation;
use App\Models\DetailAffectation;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class AffectationController extends Controller
{
    /**
     * Enregistrement d'une nouvelle affectation.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'manager_id' => 'required|exists:managers,id',
            'date' => 'required|date',
            'commentaire' => 'nullable|string',
            'affectations' => 'required|array',
            'affectations.*.materiel_id' => 'required|exists:materiels,id',
            'affectations.*.tailles' => 'required|array',
            'affectations.*.tailles.*.taille_id' => 'required|exists:tailles,id',
            'affectations.*.tailles.*.quantite' => 'required|integer|min:1',
        ]);

        DB::beginTransaction();

        try {
            // 📅 Format de la date
            $formattedDate = Carbon::parse($validated['date'])->format('Y-m-d');

            // ✅ Création de l'affectation principale
            $affectation = Affectation::create([
                'manager_id' => $validated['manager_id'],
                'date' => $formattedDate,
                'commentaire' => $validated['commentaire'] ?? null,
            ]);

            // 📦 Enregistrement des détails (matériels et tailles)
            foreach ($validated['affectations'] as $aff) {
                foreach ($aff['tailles'] as $taille) {
                    DetailAffectation::create([
                        'affectation_id' => $affectation->id,
                        'materiel_id' => $aff['materiel_id'],
                        'taille_id' => $taille['taille_id'],
                        'quantite' => $taille['quantite'],
                    ]);
                }
            }

            DB::commit();

            return response()->json(['message' => 'Affectation enregistrée avec succès'], 201);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'message' => 'Erreur lors de l\'enregistrement',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Liste des affectations d’un manager donné.
     */
    public function getByManager($id)
    {
        try {
            $affectations = Affectation::where('manager_id', $id)
                ->with(['details.materiel', 'details.taille'])
                ->get();

            return response()->json($affectations);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Erreur lors de la récupération des affectations du manager',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
