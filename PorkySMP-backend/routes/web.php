<?php

use Illuminate\Support\Facades\Route;
use App\Models\User;
use App\Models\Team;

// Homepagina
Route::get('/', function () {
    return view('welcome');
});

// Users & Teams JSON pagina
Route::get('/users-page', function () {
    // Alle users met player info en teams
    $users = User::with('playerInfo', 'teams')->get();

    // Alle teams met leden en leider
    $teams = Team::with('users', 'leader')->get();

    // Combineer in 1 array
    $data = [
        'users' => $users,
        'teams' => $teams
    ];

    // Stuur naar Blade view
    return view('users', compact('data'));
});
