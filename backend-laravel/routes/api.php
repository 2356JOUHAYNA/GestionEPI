<?php

use Illuminate\Support\Facades\Route;

/**
 * ─────────────────────────────────────────────────────────────
 * 🟣 IMPORTS — ROUTES DE TA COPINE (inchangées)
 * ─────────────────────────────────────────────────────────────
 */
use App\Http\Controllers\EmployeController;
use App\Http\Controllers\MaterielController;
use App\Http\Controllers\AffectationController;
use App\Http\Controllers\StockController;

use App\Http\Controllers\Api\TailleController;            // Api\
use App\Http\Controllers\Api\PDFController;               // Api\
use App\Http\Controllers\Api\DistributionController;      // Api\
use App\Http\Controllers\Api\ManagerController;           // Api\
use App\Http\Controllers\Api\ServiceGenerauxController;   // Api\

/**
 * ─────────────────────────────────────────────────────────────
 * 🟢 IMPORTS — TES AJOUTS
 * ─────────────────────────────────────────────────────────────
 */
use App\Http\Controllers\Api\DashboardController;         // Api\
use App\Http\Controllers\Api\CategorieController;         // Api\
use App\Http\Controllers\Api\MouvementStockController;    // Api\
use App\Http\Controllers\Api\MaterielCrudController;      // Api\
use App\Http\Controllers\Api\ManagerCrudController;       // Api\
use App\Http\Controllers\Api\EmployeCrudController;       // Api\
use App\Http\Controllers\Api\FonctionController;          // Api\


/**
 * ─────────────────────────────────────────────────────────────
 * TOUTES LES ROUTES SOUS /api/epi
 * ─────────────────────────────────────────────────────────────
 */
Route::prefix('epi')->group(function () {

    /**
     * ─────────────────────────────────────────────────────────
     * 🟣 ROUTES DE TA COPINE
     * ─────────────────────────────────────────────────────────
     */

    // Employés (lecture)
    Route::get('/employes', [EmployeController::class, 'index']);
    Route::get('/employes/{matricule}/affectations', [EmployeController::class, 'getAffectationsByMatricule']);

    // Matériels (lecture)
    Route::get('/materiels', [MaterielController::class, 'index']);
    Route::get('/materiels/{id}/tailles', [TailleController::class, 'getByMateriel']);

    // Affectations (création / suppression)
    Route::post('/affectations', [AffectationController::class, 'store']);
    Route::delete('/affectations/{id}', [AffectationController::class, 'destroy']);
    Route::get('/managers/{id}/affectations', [AffectationController::class, 'getByManager']);

    // Managers (lecture)
    Route::get('/managers', [ManagerController::class, 'index']);
    Route::get('/managers/{id}/employes', [ManagerController::class, 'getEmployesByManager']);

    // Distribution (lecture / création)
    Route::get('/distribution/manager/{nom}', [DistributionController::class, 'searchManager']);
    Route::get('/distribution/affectations/manager/{id}', [DistributionController::class, 'getAffectationsByManager']);
    Route::get('/distribution/affectation/{id}/employes', [DistributionController::class, 'getEmployesByAffectation']);
    Route::post('/distributions', [DistributionController::class, 'store']);

    // PDF
    Route::get('/affectations/{matricule}/pdf', [PDFController::class, 'generateAffectationPDF']);
    Route::get('/distributions/pdf/{affectationId}/{detailId}/{employeId}', [PDFController::class, 'distributionLinePDF']);

    // Détails d’affectation (suppression d’une ligne)
    Route::delete('/affectations/{affectation}/details/{detail}', [ServiceGenerauxController::class, 'deleteDetail']);

    // Service généraux (lecture)
    Route::get('/employes/{matricule}', [ServiceGenerauxController::class, 'getEmployeByMatricule']);
    Route::get('/employes/{matricule}/manager-affectations', [ServiceGenerauxController::class, 'getManagerAffectations']);

    // Stocks
    Route::get('/stocks', [StockController::class, 'index']);
    Route::get('/stocks/{materiel}/history', [StockController::class, 'history']);
    Route::post('/stocks/move', [StockController::class, 'store']);

    /**
     * ─────────────────────────────────────────────────────────
     * 🟢 TES ROUTES — AJOUTS
     * ─────────────────────────────────────────────────────────
     */

    // Dashboard stocks
    Route::get('/dashboard', [DashboardController::class, 'index']);
    Route::get('/dashboard/stock-count', [DashboardController::class, 'stockCount']);
    Route::get('/dashboard/frequence-usage', [DashboardController::class, 'frequenceUsage']);
    Route::get('/dashboard/distribution-par-fonction', [DashboardController::class, 'distributionParFonction']);
    Route::get('/dashboard/stock-par-mois', [DashboardController::class, 'stockParMois']);

    // Catégories
    Route::get('/categories', [CategorieController::class, 'index']);

    // Mouvements de stock
    Route::post('/mouvements', [MouvementStockController::class, 'store'])->name('api.epi.mouvements.store');
    

    // Tailles — variantes liées à un matériel
    Route::get('/materiels/{materiel}/tailles-rmb', [TailleController::class, 'getByMaterielBound'])->whereNumber('materiel');
    Route::get('/materiels/{materiel}/tailles-disponibles', [TailleController::class, 'getByMaterielFiltered'])->whereNumber('materiel');

    // Tailles — global (recherche)  ✅ (corrigé : pas de ']' parasite)
    Route::get('/tailles', [TailleController::class, 'indexGlobal']);
    Route::get('/tailles/search', [TailleController::class, 'searchGlobal']);

    // Tailles — CRUD
    Route::post('/tailles', [TailleController::class, 'store']);
    Route::put('/tailles/{taille}', [TailleController::class, 'update'])->whereNumber('taille');
    Route::delete('/tailles/{taille}', [TailleController::class, 'destroy'])->whereNumber('taille');

    // Matériels — vues enrichies
    Route::get('/materiels/with-tailles', [MaterielController::class, 'withTailles']);
    Route::get('/materiels/with-tailles-filtered', [MaterielController::class, 'withTaillesFiltered']);
    Route::get('/materiels/with-tailles-agg', [MaterielController::class, 'withTaillesAgg']);

    // Matériels — CRUD (classique)
    Route::post('/materiels', [MaterielController::class, 'store']);
    Route::get('/materiels/{id}', [MaterielController::class, 'show'])->whereNumber('id');
    Route::put('/materiels/{id}', [MaterielController::class, 'update'])->whereNumber('id');
    Route::delete('/materiels/{id}', [MaterielController::class, 'destroy'])->whereNumber('id');

    // Matériels — création complète (matériel + tailles + quantités initiales)
    Route::post('/materiels/full', [MaterielCrudController::class, 'storeFull']);
    Route::get('/materiels/with-tailles-crud', [MaterielCrudController::class, 'indexWithTailles']);

    // Managers — CRUD/équipe
    Route::post('/managers', [ManagerCrudController::class, 'store']);
    Route::put('/managers/{manager}', [ManagerCrudController::class, 'update'])->whereNumber('manager');
    Route::delete('/managers/{manager}', [ManagerCrudController::class, 'destroy'])->whereNumber('manager');
    Route::post('/managers/{manager}/employes', [ManagerCrudController::class, 'attach'])->whereNumber('manager');
    Route::delete('/managers/{manager}/employes/{employe}', [ManagerCrudController::class, 'detach'])
        ->whereNumber('manager')->whereNumber('employe');

    // Employés — CRUD (écriture seulement ; la lecture reste sur EmployeController@index)
    Route::post('/employes', [EmployeCrudController::class, 'store']);
    Route::put('/employes/{employe}', [EmployeCrudController::class, 'update'])->whereNumber('employe');
    Route::delete('/employes/{employe}', [EmployeCrudController::class, 'destroy'])->whereNumber('employe');

    // Fonctions — lecture seule (pour le sélecteur côté front)
    Route::get('/fonctions', [FonctionController::class, 'index']);


    // Mouvements de stock
Route::post('/mouvements', [MouvementStockController::class, 'store'])->name('api.epi.mouvements.store');

// Supprimer une ligne de mouvement
Route::delete('/mouvements/{id}', [MouvementStockController::class, 'destroyMouvement']);

// Vider tout le stock d’un matériel
Route::delete('/mouvements/by-materiel/{materielId}', [MouvementStockController::class, 'clearByMateriel']);

// Vider le stock d’un matériel pour une taille précise
Route::delete('/mouvements/by-materiel/{materielId}/taille/{tailleId}', [MouvementStockController::class, 'clearByMaterielTaille']);

});
