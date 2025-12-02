<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\team;
use App\Models\userteam;

class TeamController extends Controller
{
    public function index()
    {
        return Team::with('leader')->get();
    }

    public function show($id)
    {
        return Team::with(['leader', 'users'])->findOrFail($id);
    }

    public function store(Request $request)
    {
        return Team::create($request->all());
    }

    public function update(Request $request, $id)
    {
        $team = Team::findOrFail($id);
        $team->update($request->all());
        return $team;
    }

    public function destroy($id)
    {
        Team::destroy($id);
        return ['message' => 'Team deleted'];
    }

    public function addUser($teamId, $userId)
    {
        UserTeam::create([
            'user_id' => $userId,
            'team_id' => $teamId
        ]);

        return ['message' => 'User added to team'];
    }

    public function removeUser($teamId, $userId)
    {
        UserTeam::where('team_id', $teamId)->where('user_id', $userId)->delete();

        return ['message' => 'User removed'];
    }

    public function members($teamId)
    {
        $team = Team::with('users')->findOrFail($teamId);
        return $team->users;
    }
}
