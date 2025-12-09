<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use App\Models\User;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Collection;


class UserController extends Controller
{
    /**
     * Helper functie om gevoelige velden te verbergen van gebruikers in een lijst.
     * @param Collection $users
     * @param bool $isAdmin
     * @return Collection
     */
    private function filterUserList(Collection $users, bool $isAdmin): Collection
    {
        return $users->map(function (User $user) use ($isAdmin) {
            
            // Als de gebruiker GEEN admin is
            if (!$isAdmin) {
                // Toon expliciet alleen de velden die een normale gebruiker mag zien (username)
                $user->makeVisible(['username']); 
                
                // Verwijder de algemene rol en email
                unset($user->email);
                unset($user->role); 
            } else {
                 // Toon voor admins ook de verborgen velden
                $user->makeVisible(['email', 'role']);
            }
            
            // Verberg team metadata in de gebruikerslijst, focus op de pivot (role)
            if ($user->relationLoaded('teams')) {
                $user->teams->each(function ($team) {
                    unset($team->description);
                    unset($team->flag_url);
                    unset($team->capital_coords);
                    unset($team->created_at);
                    unset($team->updated_at);
                });
            }
            
            return $user;
        });
    }


    // Alle gebruikers - Aangepast voor Role-Based Data (Toegankelijk voor iedereen)
    public function index()
    {
        /** @var \App\Models\User|null $loggedInUser */
        $loggedInUser = Auth::user();
        
        // Controleer of de ingelogde gebruiker een 'admin' is
        $isAdmin = $loggedInUser && strtolower($loggedInUser->role ?? 'user') === 'admin';

        // Standaard query: haal teams en playerInfo op
        $users = User::with('teams', 'playerInfo')->get();

        // Filter de data op basis van de rol van de ingelogde gebruiker
        $filteredUsers = $this->filterUserList($users, $isAdmin);

        return response()->json($filteredUsers);
    }

    // Gebruiker opvragen (Alleen voor admin, wordt gefilterd door 'role:admin' middleware)
    public function show($id)
    {
        // Haal gebruiker op met alle relaties
        $user = User::with('teams', 'playerInfo')->findOrFail($id);

        // Voor een admin: maak ALLE verborgen velden zichtbaar, inclusief de verborgen in het model ($hidden)
        $user->makeVisible(['email', 'role']);
        
        // Zorg ervoor dat team metadata ook zichtbaar is.
        $user->teams->each(function ($team) {
            $team->makeVisible(['description', 'flag_url', 'capital_coords']);
        });
        
        return $user;
    }

    // Gebruiker updaten (Alleen voor admin)
    public function update(Request $request, $id)
    {
        $user = User::findOrFail($id);
        
        // Valideer de nieuwe velden
        $request->validate([
            'username' => 'nullable|string|max:255|unique:users,username,' . $user->id,
            'email' => 'nullable|string|email|max:255|unique:users,email,' . $user->id,
            'role' => 'nullable|in:user,admin',
            'password' => 'nullable|string|min:6|confirmed',
        ]);

        // Valideer en hashen van wachtwoord indien aanwezig
        if ($request->has('password')) {
            $request->merge(['password' => Hash::make($request->password)]);
        }

        // Update de gebruiker. password_confirmation wordt uitgesloten door 'except'.
        $user->update($request->except(['password_confirmation']));

        // Zorg ervoor dat de bijgewerkte rol en e-mail zichtbaar zijn in de respons
        return response()->json([
            'message' => 'Gebruiker bijgewerkt',
            'user' => $user->load('teams', 'playerInfo')->makeVisible(['email', 'role']) 
        ]);
    }

    // Gebruiker verwijderen (Alleen voor admin)
    public function destroy($id)
    {
        $user = User::findOrFail($id);
        $user->delete();

        return response()->json([
            'message' => "Gebruiker {$user->username} (ID: {$id}) verwijderd"
        ]);
    }
}