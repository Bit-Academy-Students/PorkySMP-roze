<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
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
