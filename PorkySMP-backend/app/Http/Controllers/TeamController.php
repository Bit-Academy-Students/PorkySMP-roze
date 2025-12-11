<?php

namespace App\Http\Controllers;

use App\Models\Team;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\ValidationException;

class TeamController extends Controller
{
    /**
     * Helper functie om de rol van een gebruiker binnen een team op te halen.
     */
    private function getLoggedInUserRoleInTeam(Team $team, User $user): ?string
    {
        $pivot = $team->members()->where('user_id', $user->id)->first()?->pivot;
        return $pivot ? $pivot->role : null;
    }

    // Ophalen van alle teams
    public function index()
    {
        // FIX: Laad alleen 'members'. De 'leader' Accessor wordt automatisch toegevoegd.
        return response()->json(Team::with('members')->get());
    }

    // Ophalen van één team
    public function show(Team $team)
    {
        // FIX: Laad alleen 'members'. De 'leader' Accessor wordt automatisch toegevoegd.
        return response()->json($team->load('members'));
    }

    /**
     * Maak een nieuw team aan en wijs de ingelogde gebruiker toe als leider.
     */
    public function store(Request $request)
    {
        $request->validate([
            'team_name' => 'required|string|max:255|unique:teams,team_name',
            'description' => 'nullable|string',
            'flag_url' => 'nullable|string',
            'capital_coords' => 'nullable|string',
        ]);

        /** @var \App\Models\User $user */
        $user = $request->user();
        
        $team = Team::create($request->only('team_name', 'description', 'flag_url', 'capital_coords'));
        
        $team->members()->attach($user->id, ['role' => 'leader']);

        return response()->json([
            'message' => 'Team succesvol aangemaakt. U bent de leider.',
            // FIX: Laad 'members' voor de Accessor
            'team' => $team->load('members') 
        ], 201);
    }
    
    /**
     * Update een bestaand team.
     * Alleen toegestaan voor de Leader van het team.
     */
    public function update(Request $request, Team $team)
    {
        $request->validate([
            'team_name' => 'nullable|string|max:255|unique:teams,team_name,' . $team->id,
            'description' => 'nullable|string',
            'flag_url' => 'nullable|string',
            'capital_coords' => 'nullable|string',
        ]);

        /** @var \App\Models\User $loggedInUser */
        $loggedInUser = $request->user();
        $loggedInUserRole = $this->getLoggedInUserRoleInTeam($team, $loggedInUser);

        // Autoriteit Check: Alleen de Leader mag dit doen
        if ($loggedInUserRole !== 'leader') {
            return response()->json([
                'message' => 'U moet de leider van het team zijn om de teamdetails te wijzigen.'
            ], 403);
        }

        // Update de team details (alleen de meegegeven velden)
        $team->update($request->only('team_name', 'description', 'flag_url', 'capital_coords'));

        // FIX: Laad 'members' voor de Accessor
        return response()->json([
            'message' => 'Team details succesvol bijgewerkt.',
            'team' => $team->load('members') 
        ]);
    }

    /**
     * Verwijder een team.
     * Alleen toegestaan voor de Leader van het team.
     */
    public function destroy(Team $team, Request $request)
    {
        /** @var \App\Models\User $loggedInUser */
        $loggedInUser = $request->user();
        $loggedInUserRole = $this->getLoggedInUserRoleInTeam($team, $loggedInUser);

        // Autoriteit Check: Alleen de Leader mag dit doen
        if ($loggedInUserRole !== 'leader') {
            return response()->json([
                'message' => 'U moet de leider van het team zijn om het team te verwijderen.'
            ], 403);
        }
        
        $teamName = $team->team_name;
        
        // Verwijder het team (zal ook alle pivot records verwijderen door onDelete('cascade') in de migratie)
        $team->delete();

        return response()->json([
            'message' => "Team '{$teamName}' succesvol verwijderd."
        ]);
    }


    /**
     * Voeg een gebruiker toe aan een team of update de rol van een bestaand lid.
     */
    public function attachUser(Request $request, Team $team, User $user)
    {
        $request->validate([
            'role' => 'required|in:member,leader,mod', 
        ]);

        $newRole = $request->role;
        /** @var \App\Models\User $loggedInUser */
        $loggedInUser = $request->user();
        
        $team->load('members'); // Zorg dat members geladen zijn
        $leader = $team->leader; // GEBRUIK NU DE ACCESSOR
        
        $loggedInUserRole = $this->getLoggedInUserRoleInTeam($team, $loggedInUser);

        // 1. Check of de ingelogde gebruiker Leader of Mod is
        if (!in_array($loggedInUserRole, ['leader', 'mod'])) {
            return response()->json([
                'message' => 'U moet de leider of een moderator zijn om leden en rollen te beheren.'
            ], 403);
        }

        // 2. De Leider kan zichzelf niet degraderen
        if ($leader && $leader->id === $user->id && $newRole !== 'leader') {
             return response()->json(['message' => 'De leider kan zichzelf niet degraderen. Draag eerst het leiderschap over.'], 400);
        }

        // 3. Een Mod kan NIET de Leader's rol wijzigen
        if ($loggedInUserRole === 'mod' && $leader && $leader->id === $user->id) {
            return response()->json([
                'message' => 'Als moderator mag u de rol van de leider niet wijzigen.'
            ], 403);
        }

        // 4. Een Mod kan NIET een andere gebruiker promoveren tot Leader
        if ($loggedInUserRole === 'mod' && $newRole === 'leader') {
            return response()->json([
                'message' => 'Alleen de leider kan een andere gebruiker tot leider promoveren.'
            ], 403);
        }
        
        // 5. CRUCIALE LOGICA: Leiderschap overdragen
        if ($newRole === 'leader' && $leader && $leader->id !== $user->id) {
            // De ingelogde gebruiker moet de leider zijn om het leiderschap over te dragen
            if ($loggedInUserRole !== 'leader') {
                 return response()->json([
                    'message' => 'Alleen de huidige leider kan het leiderschap overdragen.'
                ], 403);
            }
            
            // Downgrade de oude leider naar 'mod'
            $team->members()->updateExistingPivot($leader->id, ['role' => 'mod']);
        }
        
        $isAlreadyMember = $team->members()->where('user_id', $user->id)->exists();

        if ($isAlreadyMember) {
            $team->members()->updateExistingPivot($user->id, ['role' => $newRole]);
            $message = "Rol van gebruiker {$user->username} is bijgewerkt naar '{$newRole}' in team {$team->team_name}.";
        } else {
            // Dit zou in het geval van leiderschapsoverdracht niet moeten gebeuren, 
            // omdat de nieuwe leider lid moet zijn van het team, maar we houden de logica.
            $team->members()->attach($user->id, ['role' => $newRole]);
            $message = "Gebruiker {$user->username} succesvol toegevoegd aan team {$team->team_name} met de rol '{$newRole}'.";
        }
        
        // FIX: Laad 'members' voor de Accessor
        return response()->json([
            'message' => $message,
            'team' => $team->load('members') 
        ]);
    }

    /**
     * Verwijder een gebruiker uit een team.
     */
    public function detachUser(Request $request, Team $team, User $user)
    {
        /** @var \App\Models\User $loggedInUser */
        $loggedInUser = $request->user();
        
        $team->load('members'); // Zorg dat members geladen zijn
        $leader = $team->leader; // GEBRUIK NU DE ACCESSOR
        
        $loggedInUserRole = $this->getLoggedInUserRoleInTeam($team, $loggedInUser);

        // 1. Autoriteit Check: Alleen Leader of Mod mag dit doen
        if (!in_array($loggedInUserRole, ['leader', 'mod'])) {
            return response()->json([
                'message' => 'U moet de leider of een moderator zijn om leden te verwijderen.'
            ], 403);
        }

        // 2. Voorkom dat de leider zichzelf uit het team verwijdert
        if ($leader && $leader->id === $user->id) {
             return response()->json(['message' => 'U kunt de leider niet op deze manier verwijderen. Draag het leiderschap over of ontbind het team.'], 400);
        }

        // 3. Controleer of de gebruiker lid is van dit team
        if (!$team->members()->where('user_id', $user->id)->exists()) {
            return response()->json(['message' => 'Deze gebruiker is geen lid van dit team.'], 400);
        }

        $team->members()->detach($user->id);
        
        $username = $user->username ?? 'de gebruiker';

        // FIX: Laad 'members' voor de Accessor
        return response()->json([
            'message' => "Gebruiker {$username} succesvol verwijderd uit team {$team->team_name}.",
            'team' => $team->load('members') 
        ]);
    }
}