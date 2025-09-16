<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Fonction;
use Illuminate\Http\JsonResponse;

class FonctionController extends Controller
{
    public function index(): JsonResponse
    {
        $rows = Fonction::query()
            ->select('id', 'nom_fonction')
            ->where(function ($q) { $q->where('active', 1)->orWhereNull('active'); })
            ->orderBy('nom_fonction')
            ->get();

        return response()->json($rows);
    }
}
