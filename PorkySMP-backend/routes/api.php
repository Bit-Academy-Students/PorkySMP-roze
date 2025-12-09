<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\TeamController;

/*
|--------------------------------------------------------------------------
| Public Routes
|--------------------------------------------------------------------------
| Authenticatie is hier niet nodig.
*/

// Auth
Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);

// Teams (Publieke Leesacties)
Route::prefix('public')->group(function () {
    Route::get('/teams', [TeamController::class, 'index']); // Iedereen mag alle teams zien
    Route::get('/teams/{team}', [TeamController::class, 'show']); // Iedereen mag details van een team zien
    Route::get('/teams/{team}/members', [TeamController::class, 'members']); // Iedereen mag de leden van een team zien
});


/*
|--------------------------------------------------------------------------
| Protected Routes (Auth:Sanctum vereist)
|--------------------------------------------------------------------------
| Alleen ingelogde gebruikers met een geldige token.
*/
Route::middleware('auth:sanctum')->group(function () {
    
    // Auth (Uitloggen)
    Route::post('/logout', [AuthController::class, 'logout']);

    // Teambeheer (Toegankelijk voor elke ingelogde gebruiker)
    Route::post('/teams', [TeamController::class, 'store']); // Team aanmaken
    
    // Team Leden Acties
    Route::post('/teams/{team}/users/{user}', [TeamController::class, 'attachUser']); // Lid toevoegen/rol wijzigen (Autorisatie via Policy! Zie de uitleg hieronder.)
    Route::delete('/teams/{team}/users/{user}', [TeamController::class, 'detachUser']); // Lid verwijderen (Autorisatie via Policy!)
    
    
    // -----------------------------------------------------------
    // GEBRUIKERS BEHEER (Alleen Admin)
    // -----------------------------------------------------------
    Route::middleware('role:admin')->prefix('users')->group(function () {
        Route::get('/', [UserController::class, 'index']); // Alle gebruikers ophalen
        Route::get('/{user}', [UserController::class, 'show']); // Specifieke gebruiker ophalen
        Route::put('/{user}', [UserController::class, 'update']); // Gebruiker bijwerken
        Route::delete('/{user}', [UserController::class, 'destroy']); // Gebruiker verwijderen
    });
});