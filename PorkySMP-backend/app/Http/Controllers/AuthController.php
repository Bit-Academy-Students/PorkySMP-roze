<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use App\Models\User; 
// Zorg ervoor dat u dit bovenaan uw controller heeft staan om de User class te kunnen typen
use Laravel\Sanctum\HasApiTokens; 


class AuthController extends Controller
{
    /**
     * Registreer een nieuwe gebruiker.
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function register(Request $request)
    {
        $request->validate([
            'username' => 'required|string|max:255|unique:users',
            'email' => 'required|string|email|max:255|unique:users',
            'password' => 'required|string|min:6|confirmed',
        ]);

        $user = User::create([
            'username' => $request->username,
            'email' => $request->email,
            'password' => Hash::make($request->password),
        ]);

        // De linter geeft hier meestal geen fout omdat $user direct een User is
        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'message' => 'Registratie succesvol',
            'user' => $user,
            'token' => $token,
            'token_type' => 'Bearer',
        ], 201);
    }

    /**
     * Log de gebruiker in en retourneer een Bearer token.
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function login(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
            'password' => 'required',
        ]);

        // Probeer de gebruiker te authenticeren
        if (!Auth::attempt($request->only('email', 'password'))) {
            return response()->json([
                'message' => 'Onjuiste inloggegevens'
            ], 401);
        }

        // ** DE LINTER FIX: Voeg DocBlock toe **
        /** @var \App\Models\User $user */
        $user = Auth::user();
        
        // Nu zal de linter de createToken() methode herkennen
        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'message' => 'Ingelogd',
            'user' => $user,
            'token' => $token, 
            'token_type' => 'Bearer',
        ], 200);
    }

    /**
     * Log de gebruiker uit (revok de token).
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function logout(Request $request)
    {
        // $request->user() is al correct getype-hint
        $request->user()->currentAccessToken()->delete();

        return response()->json([
            'message' => 'Succesvol uitgelogd en token ingetrokken'
        ], 200);
    }
}