<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use App\Models\User; 
use Laravel\Sanctum\HasApiTokens; 
use App\Models\PlayerInfo; 

class AuthController extends Controller
{
    /**
     * Zorgt ervoor dat de PlayerInfo record bestaat voor de gebruiker en stelt 
     * de first_login datum/tijd in als deze nog niet is ingesteld.
     */
    private function ensurePlayerInfoFirstLogin(User $user)
    {
        // Zoek de bestaande PlayerInfo record of maak een nieuwe instantie aan
        $playerInfo = PlayerInfo::firstOrNew(['user_id' => $user->id]);

        if (is_null($playerInfo->first_login)) {
            $playerInfo->first_login = now(); 
        }
        
        $playerInfo->save();
        
        return $playerInfo;
    }

    /**
     * Registreer een nieuwe gebruiker.
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

        $this->ensurePlayerInfoFirstLogin($user);

        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'message' => 'Registratie succesvol',
            'user' => $user->load('playerInfo'),
            'token' => $token,
            'token_type' => 'Bearer',
        ], 201);
    }

    /**
     * Log de gebruiker in en retourneer een Bearer token.
     */
    public function login(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
            'password' => 'required',
        ]);

        if (!Auth::attempt($request->only('email', 'password'))) {
            return response()->json([
                'message' => 'Onjuiste inloggegevens'
            ], 401);
        }

        /** @var \App\Models\User $user */
        $user = Auth::user();
        
        $this->ensurePlayerInfoFirstLogin($user);
        
        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'message' => 'Ingelogd',
            'user' => $user->load('playerInfo'),
            'token' => $token, 
            'token_type' => 'Bearer',
        ], 200);
    }

    /**
     * Log de gebruiker uit (revok de token).
     */
    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json([
            'message' => 'Succesvol uitgelogd'
        ]);
    }
}