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
     * @param Team $team
     * @param User $user
     * @return string|null
     */
    private function getLoggedInUserRoleInTeam(Team $team, User $user): ?string
    {
        // Haalt de pivot-informatie op voor de specifieke gebruiker in dit team
        $pivot = $team->members()->where('user_id', $user->id)->first()?->pivot;
        return $pivot ? $pivot->role : null;
    }

    // Ophalen van alle teams
    public function index()
    {
        return response()->json(Team::with('leader', 'members')->get());
    }

    // Ophalen van één team
    public function show(Team $team)
    {
        return response()->json($team->load('leader', 'members'));
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

        $user = $request->user();
        
        // 1. Maak het team aan
        $team = Team::create([
            'team_name' => $request->team_name, 
            'description' => $request->description,
            'flag_url' => $request->flag_url,
            'capital_coords' => $request->capital_coords,
        ]);
        
        // 2. Koppel de leider via de pivot tabel
        $team->members()->attach($user->id, ['role' => 'leader']);

        return response()->json([
            'message' => 'Team succesvol aangemaakt. U bent de leider.',
            'team' => $team->load('leader', 'members')
        ], 201);
    }

    /**
     * Voeg een gebruiker toe aan een team of update de rol van een bestaand lid.
     * Nu toegankelijk voor Leader EN Mod.
     */
    public function attachUser(Request $request, Team $team, User $user)
    {
        $request->validate([
            // Nu toegestaan: member, leader, mod
            'role' => 'required|in:member,leader,mod', 
        ]);

        $newRole = $request->role;
        $loggedInUser = $request->user();
        $leader = $team->leader()->first();
        $loggedInUserRole = $this->getLoggedInUserRoleInTeam($team, $loggedInUser);

        // --- AUTORISATIE CONTROLE ---

        // 1. Check of de ingelogde gebruiker Leader of Mod is
        if (!in_array($loggedInUserRole, ['leader', 'mod'])) {
            return response()->json([
                'message' => 'U moet de leider of een moderator zijn om leden en rollen te beheren.'
            ], 403);
        }

        // 2. De Leider kan zichzelf niet degraderen naar 'member' of 'mod'
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

        // --- ACTIE UITVOEREN ---
        
        $isAlreadyMember = $team->members()->where('user_id', $user->id)->exists();

        if ($isAlreadyMember) {
            // UPDATE BESTAANDE ROL
            $team->members()->updateExistingPivot($user->id, ['role' => $newRole]);
            $message = "Rol van gebruiker {$user->username} is bijgewerkt naar '{$newRole}' in team {$team->team_name}.";
        } else {
            // NIEUW LID TOEVOEGEN
            $team->members()->attach($user->id, ['role' => $newRole]);
            $message = "Gebruiker {$user->username} succesvol toegevoegd aan team {$team->team_name} met de rol '{$newRole}'.";
        }
        
        return response()->json([
            'message' => $message,
            'team' => $team->load('members')
        ]);
    }

    /**
     * Verwijder een gebruiker uit een team.
     * Nu toegankelijk voor Leader EN Mod.
     */
    public function detachUser(Request $request, Team $team, User $user)
    {
        $loggedInUser = $request->user();
        $leader = $team->leader()->first();
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

        // 4. Verwijder de gebruiker uit het team
        $team->members()->detach($user->id);
        
        $username = $user->username ?? 'de gebruiker';

        return response()->json([
            'message' => "Gebruiker {$username} succesvol verwijderd uit team {$team->team_name}.",
            'team' => $team->load('members')
        ]);
    }
}