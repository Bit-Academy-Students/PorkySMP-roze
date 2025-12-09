<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;
use Illuminate\Support\Facades\Auth;

class CheckUserRole
{
    /**
     * Behandel een inkomend verzoek.
     * * @param  \Illuminate\Http\Request  $request
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     * @param  string  $role  De vereiste rol (bijv. 'admin', 'user')
     * @return \Symfony\Component\HttpFoundation\Response
     */
    public function handle(Request $request, Closure $next, string $role): Response
    {
        // 1. Controleer of de gebruiker is ingelogd
        if (! Auth::check()) {
            return response()->json(['message' => 'Niet geauthenticeerd.'], 401);
        }

        $user = Auth::user();

        // 2. Converteer de vereiste rol naar kleine letters om consistentie te garanderen
        $requiredRole = strtolower($role);

        // 3. Haal de rol van de gebruiker op en converteer deze ook naar kleine letters
        // We gaan ervan uit dat de 'role' kolom bestaat in de 'users' tabel (bijv. 'user' of 'admin')
        $userRole = strtolower($user->role ?? 'user'); // Standaard op 'user' als er geen rol is

        // 4. Voer de rolcontrole uit
        if ($userRole === $requiredRole) {
            // De rol komt overeen, ga door naar de volgende middleware/controller
            return $next($request);
        }

        // 5. Als de rol niet overeenkomt, retourneer een fout (verboden toegang)
        return response()->json(['message' => 'Toegang verboden. U heeft niet de vereiste rol.'], 403);
    }
}