<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Auth;
use App\Models\User;

class AuthController extends Controller
{
    // REGISTER
    public function register(Request $request)
    {
        $request->validate([
            'username' => 'required|string|unique:users',
            'email' => 'required|email|unique:users',
            'password' => 'required|string|min:6'
        ]);

        $user = User::create([
            'username' => $request->username,
            'email'    => $request->email,
            'password' => Hash::make($request->password), // veilig hashen
        ]);

        return response()->json([
            'message' => 'Account succesvol aangemaakt!',
            'user' => $user
        ], 201);
    }

    // LOGIN (zonder JWT, maar werkt)
    public function login(Request $request)
    {
        $credentials = $request->only('email', 'password');

        if (!Auth::attempt($credentials)) {
            return response()->json([
                'message' => 'Login mislukt: onjuiste gegevens'
            ], 401);
        }

        $user = Auth::user();

        return response()->json([
            'message' => 'Ingelogd',
            'user' => $user
        ]);
    }
}
