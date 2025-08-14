<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Affectation;
use App\Models\Employe;
use Barryvdh\DomPDF\Facade\Pdf;

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

}
