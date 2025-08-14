<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Manager;
use App\Models\Employe;


class ManagerController extends Controller
{
    public function index()
    {
        return response()->json(Manager::all());
    }
    public function getEmployesByManager($id)
{
    $employes = Employe::where('manager_id', $id)->get();
    return response()->json($employes);
}
}
