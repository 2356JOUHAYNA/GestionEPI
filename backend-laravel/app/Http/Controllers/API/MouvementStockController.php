<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use App\Models\MouvementStock;
use Throwable;

class MouvementStockController extends Controller
{
    public function store(Request $request)
    {
        // ── Anti-champs libres venant de l’UI (sécurité)
        foreach (['materiel_nom', 'materiel_nom_txt', 'taille_libelle_txt'] as $f) {
            if ($request->filled($f)) {
                return response()->json(['message' => "Champ interdit ici: $f"], 422);
            }
        }

        // Détection : présence d’un tableau de tailles non vide
        $rawTailles = $request->input('tailles');
        $hasTailles = is_array($rawTailles) && count($rawTailles) > 0;

        // Log d’entrée (debug)
        logger()->info('POST /api/epi/mouvements payload', $request->all());

        // ── Validation
        if ($hasTailles) {
            $data = $request->validate([
                'materiel_id'          => ['required','exists:materiels,id'],
                'type'                 => ['required','in:IN,OUT,Entrée,Sortie'],
                'date'                 => ['nullable','date'],
                'motif'                => ['nullable','string','max:255'],
                'tailles'              => ['required','array','min:1'],
                'tailles.*.taille_id'  => ['required','exists:tailles,id'],
                'tailles.*.quantite'   => ['required','integer','min:1'],
            ]);
        } else {
            $data = $request->validate([
                'materiel_id' => ['required','exists:materiels,id'],
                'type'        => ['required','in:IN,OUT,Entrée,Sortie'],
                'quantite'    => ['required','integer','min:1'],
                'date'        => ['nullable','date'],
                'motif'       => ['nullable','string','max:255'],
            ]);
        }

        // ── Normalisation du type ("Entrée/Sortie" ↔ "IN/OUT")
        $type = match ($data['type']) {
            'IN', 'Entrée'  => 'IN',
            'OUT', 'Sortie' => 'OUT',
            default         => null,
        };
        if (!$type) {
            return response()->json(['message' => 'Type de mouvement invalide.'], 422);
        }

        $date       = $data['date'] ?? now()->toDateString();
        $materielId = (int) $data['materiel_id'];
        $motif      = $data['motif'] ?? 'Saisie interface stock';

        try {
            if ($hasTailles) {
                // Vérifier que toutes les tailles appartiennent au matériel
                $tailleIds = collect($data['tailles'])->pluck('taille_id')->unique()->values();
                $count = DB::table('tailles')
                    ->where('materiel_id', $materielId)
                    ->whereIn('id', $tailleIds)
                    ->count();

                if ($count !== $tailleIds->count()) {
                    return response()->json([
                        'message' => "Certaines tailles ne sont pas associées au matériel sélectionné."
                    ], 422);
                }

                $created = [];
                DB::transaction(function () use ($data, $date, $materielId, $type, $motif, &$created) {
                    foreach ($data['tailles'] as $row) {
                        $payload = [
                            'materiel_id'     => $materielId,
                            'taille_id'       => (int) $row['taille_id'],
                            'type_mouvement'  => $type,
                            'quantite'        => (int) $row['quantite'],
                            'date_mouvement'  => $date,
                            'motif'           => $motif,
                            'reference_type'  => 'UI',
                            'reference_id'    => null,
                        ];
                        $created[] = MouvementStock::create($payload);
                    }
                });

                logger()->info('Mouvements INSÉRÉS (par tailles)', [
                    'materiel_id' => $materielId,
                    'count' => count($created),
                ]);

                return response()->json(['ok' => true, 'created' => $created], 201);
            }

            // ── Sans tailles : quantité globale
            $created = MouvementStock::create([
                'materiel_id'     => $materielId,
                'taille_id'       => null,
                'type_mouvement'  => $type,
                'quantite'        => (int) $data['quantite'],
                'date_mouvement'  => $date,
                'motif'           => $motif,
                'reference_type'  => 'UI',
                'reference_id'    => null,
            ]);

            logger()->info('Mouvement INSÉRÉ (global)', [
                'materiel_id' => $materielId,
                'id'          => $created->id ?? null,
            ]);

            return response()->json(['ok' => true, 'created' => $created], 201);

        } catch (Throwable $e) {
            logger()->error('Erreur enregistrement mouvement', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            // Pour le debug, tu peux renvoyer le message exact (retire en prod)
            return response()->json([
                'message' => 'Erreur lors de l’enregistrement du mouvement.',
            ], 500);
        }
    }

    // Supprimer UN mouvement précis (ligne de la table stocks)
public function destroyMouvement($id)
{
    $deleted = MouvementStock::where('id', $id)->delete();

    if (!$deleted) {
        return response()->json(['message' => 'Mouvement introuvable'], 404);
    }
    return response()->json(['message' => 'Mouvement supprimé']);
}

// Vider TOUT le stock d’un matériel (supprimer tous ses mouvements)
public function clearByMateriel($materielId)
{
    // Si tu utilises SoftDeletes sur MouvementStock, remplace ->delete() par ->forceDelete() si nécessaire
    MouvementStock::where('materiel_id', $materielId)->delete();

    return response()->json([
        'message' => 'Stock vidé pour ce matériel (tous les mouvements supprimés).'
    ]);
}

// Vider le stock d’un matériel POUR UNE TAILLE précise
public function clearByMaterielTaille($materielId, $tailleId)
{
    MouvementStock::where('materiel_id', $materielId)
        ->where('taille_id', $tailleId)
        ->delete();

    return response()->json([
        'message' => 'Stock vidé pour cette taille du matériel (mouvements supprimés).'
    ]);
}

}
