<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\PDFController;

Route::get('/', function () {
    return view('welcome');
});
Route::get('/affectations/{matricule}/pdf', [PDFController::class, 'generateAffectationPDF']);
