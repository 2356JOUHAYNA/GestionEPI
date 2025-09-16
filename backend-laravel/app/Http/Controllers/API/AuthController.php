<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;
use App\Models\User;
use App\Models\UserLog;

class AuthController extends Controller
{
    public function register(Request $request)
    {
        $v = $request->validate([
            'name'     => 'required|string|max:100',
            'email'    => 'required|email|unique:users,email',
            'password' => 'required|confirmed|min:6',
        ]);

        // Si User::$casts['password'] = 'hashed', pas besoin de Hash::make
        $user = User::create([
            'name'     => $v['name'],
            'email'    => $v['email'],
            'password' => $v['password'],
        ]);

        // Log: inscription
        UserLog::log([
            'user_id' => $user->id,
            'email'   => $user->email,
            'action'  => 'register',
            'success' => true,
        ]);

        $token = $user->createToken('spa')->plainTextToken;

        return response()->json([
            'message' => 'Inscription réussie.',
            'token'   => $token,
            'user'    => $user,
        ], 201);
    }

    public function login(Request $request)
    {
        $v = $request->validate([
            'email'    => 'required|email',
            'password' => 'required',
        ]);

        $user = User::where('email', $v['email'])->first();

        // Échec de login → on loggue aussi
        if (!$user || !Hash::check($v['password'], $user->password)) {
            UserLog::log([
                'email'   => $v['email'],
                'action'  => 'login',
                'success' => false,
            ]);

            throw ValidationException::withMessages([
                'email' => ['Identifiants incorrects.'],
            ]);
        }

        // (optionnel) invalide les anciens tokens
        $user->tokens()->delete();

        $token = $user->createToken('spa')->plainTextToken;

        // Log: login OK
        UserLog::log([
            'user_id' => $user->id,
            'email'   => $user->email,
            'action'  => 'login',
            'success' => true,
        ]);

        // (optionnel) dernière connexion
        // $user->forceFill(['last_login_at' => now()])->save();

        return response()->json([
            'message' => 'Connexion réussie.',
            'token'   => $token,
            'user'    => $user,
        ]);
    }

    public function me(Request $request)
    {
        return $request->user();
    }

    public function logout(Request $request)
    {
        $user = $request->user();

        $request->user()->currentAccessToken()?->delete();

        // Log: logout
        UserLog::log([
            'user_id' => $user?->id,
            'email'   => $user?->email,
            'action'  => 'logout',
            'success' => true,
        ]);

        return response()->json(['message' => 'Déconnexion réussie.']);
    }
}
