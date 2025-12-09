<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash; // Hash toegevoegd
use App\Models\User;

class UserController extends Controller
{
    // Alle gebruikers
    public function index()
    {
        return User::all();
    }

    // Gebruiker opvragen
    public function show($id)
    {
        return User::findOrFail($id);
    }

    // Gebruiker updaten
    public function update(Request $request, $id)
    {
        $user = User::findOrFail($id);

        // Valideer indien er een wachtwoord wordt meegegeven
        if ($request->has('password')) {
            // Nu werkt Hash::make() omdat de klasse is geïmporteerd
            $request->merge(['password' => Hash::make($request->password)]);
        }

        $user->update($request->all());

        return response()->json([
            'message' => 'Gebruiker bijgewerkt',
            'user' => $user
        ]);
    }

    // Gebruiker verwijderen
    public function destroy($id)
    {
        User::destroy($id);

        return response()->json([
            'message' => 'Gebruiker verwijderd'
        ]);
    }
}