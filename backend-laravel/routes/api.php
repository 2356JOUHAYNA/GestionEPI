<?php


use Illuminate\Support\Facades\Route;
use App\Http\Controllers\EmployeController;
use App\Http\Controllers\MaterielController;
use App\Http\Controllers\AffectationController;
use App\Http\Controllers\Api\TailleController;
use App\Http\Controllers\Api\PDFController;
use App\Http\Controllers\Api\DistributionController;
use App\Http\Controllers\Api\ManagerController;
use App\Http\Controllers\Api\ServiceGenerauxController;
use App\Http\Controllers\StockController;

use App\Http\Controllers\Api\ReplenishController;
use App\Http\Controllers\EpiController;
use App\Http\Controllers\Api\AiForecastController;

Route::prefix('epi')->group(function () {
    Route::get('/employes', [EmployeController::class, 'index']);
    Route::get('/materiels', [MaterielController::class, 'index']);
    Route::post('/affectations', [AffectationController::class, 'store']);
    Route::get('/materiels/{id}/tailles', [TailleController::class, 'getByMateriel']);
    Route::get('/employes/{matricule}/affectations', [EmployeController::class, 'getAffectationsByMatricule']);
    Route::delete('/affectations/{id}', [AffectationController::class, 'destroy']);
    Route::get('/affectations/{matricule}/pdf', [PDFController::class, 'generateAffectationPDF']);
    Route::get('/distribution/manager/{nom}', [DistributionController::class, 'searchManager']);
    Route::get('/managers', [ManagerController::class, 'index']);
    Route::get('/managers/{id}/affectations', [AffectationController::class, 'getByManager']);
    Route::get('/managers/{id}/employes', [ManagerController::class, 'getEmployesByManager']);
    Route::get('/affectations/{matricule}/pdf', [PDFController::class, 'generateAffectationPDF']);
    Route::get('/distribution/affectations/manager/{id}', [DistributionController::class, 'getAffectationsByManager']);
    Route::get('/distribution/affectation/{id}/employes', [DistributionController::class, 'getEmployesByAffectation']);
    Route::post('/distributions', [DistributionController::class, 'store']);
    Route::get('/epi/distributions/pdf/{affectation}/{employe}', [PDFController::class, 'generateDistributionPDF']);
// employé par matricule (retourne aussi son manager et ses collègues)
    Route::get('/employes/{matricule}', [ServiceGenerauxController::class, 'getEmployeByMatricule']);
    // lignes d’affectations du manager de cet employé (détails)
    Route::get('/employes/{matricule}/manager-affectations', [ServiceGenerauxController::class, 'getManagerAffectations']);

    // distribuer 1 ligne (materiel+taille) à un employé
    Route::post('/distributions', [DistributionController::class, 'store']);

    // supprimer une ligne d’une affectation (stock manager)
    Route::delete('/affectations/{affectation}/details/{detail}', [ServiceGenerauxController::class, 'deleteDetail']);

    // PDF
    Route::get('/distributions/pdf/{affectationId}/{detailId}/{employeId}', [PDFController::class, 'distributionLinePDF']);
    Route::get('/employes/{matricule}/pdf', [PDFController::class, 'generateAffectationPDF']);
    Route::get('/stocks', [StockController::class, 'index']);                    // stock courant
    Route::get('/stocks/{materiel}/history', [StockController::class, 'history']); // historique
    Route::get('/stocks', [StockController::class, 'stocks']);
    Route::get('/previsions', [StockController::class, 'previsions']);
    Route::get('/reco-appro', [StockController::class, 'recommandations']);
    
    
    Route::get('/ai/health',   [AiForecastController::class, 'health']);
    Route::post('/forecast',   [AiForecastController::class, 'forecast']); // POST /api/epi/forecast
});

