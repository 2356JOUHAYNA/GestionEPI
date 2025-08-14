<?php

namespace App\Http\Controllers;

use App\Models\Materiel;
use Illuminate\Http\JsonResponse;

class MaterielController extends Controller
{
    public function index(): JsonResponse
    {
        return response()->json(Materiel::all());
    }
      public function withTailles()
    {
        return response()->json(Materiel::with('tailles')->get());
    }
}