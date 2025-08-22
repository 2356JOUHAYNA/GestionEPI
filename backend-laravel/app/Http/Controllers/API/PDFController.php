<?php

namespace App\Http\Controllers\Api;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;                 // ✅ le bon Request
use Barryvdh\DomPDF\Facade\Pdf as PDF;      // ou use Barryvdh\DomPDF\Facade\Pdf;

use App\Models\Affectation;
use App\Models\AffectationDetail; 


use App\Models\Employe;


class PDFController extends Controller
{
   public function distributionLinePDF($affectationId, $detailId, $employeId)
{
    $employe = \App\Models\Employe::findOrFail($employeId);
    $detail = \App\Models\DetailAffectation::with(['materiel','taille','affectation.manager'])->findOrFail($detailId);

    $pdf = \Barryvdh\DomPDF\Facade\Pdf::loadView('pdf.distribution_line', [
        'employe' => $employe,
        'detail' => $detail,
        'date' => now()->format('Y-m-d'),
    ]);
    return $pdf->download("distribution_{$employe->matricule}_{$detail->id}.pdf");
}
public function generateAffectationPDF(Request $request, $affectation, $detail)
    {
        // Récupère le nom à afficher dans le PDF (champ saisi côté front)
        $nomEmploye = trim($request->query('nom', ''));

        // ⚠️ Adapte les relations selon ton schéma
        // Exemple : Affectation -> details (hasMany), chaque detail a materiel, taille
        $aff = Affectation::with([
            'manager',
            'employe',
            'details.materiel',
            'details.taille',
        ])->find($affectation);

        if (!$aff) {
            return response()->json(['message' => 'Affectation introuvable'], 404);
        }

        $det = optional($aff->details)->firstWhere('id', (int) $detail);
        if (!$det) {
            return response()->json(['message' => 'Détail introuvable pour cette affectation'], 404);
        }

        // Données pour la vue
        $data = [
            'doc_title'   => 'Fiche de distribution - EPI',
            'date'        => now()->format('d/m/Y H:i'),
            'manager'     => $aff->manager->nom ?? '—',
            'employe'     => [
                'nom'       => $nomEmploye !== '' ? $nomEmploye : (($aff->employe->nom ?? '—') . ' ' . ($aff->employe->prenom ?? '')),
                'matricule' => $aff->employe->matricule ?? '—',
                'fonction'  => $aff->employe->fonction ?? '—',
            ],
            'materiel'    => $det->materiel->nom ?? $det->materiel->libelle ?? '—',
            'taille'      => $det->taille->libelle ?? $det->taille->nom ?? '—',
            'quantite'    => $det->quantite ?? 1,
            // Si tu enregistres un suivi mensuel, tu peux l’ajouter ici
            'mois'        => $det->trace_mois ?? [], // optionnel
        ];

        // Rend la vue Blade en PDF
        $pdf = Pdf::loadView('pdf.affectation', $data)->setPaper('A4');

        $filename = sprintf('affectation_%s_detail_%s.pdf', $affectation, $detail);
        return $pdf->stream($filename);  // ou ->download($filename)
    }
}


