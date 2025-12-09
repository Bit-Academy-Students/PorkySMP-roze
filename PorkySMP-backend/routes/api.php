<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\TeamController;
use App\Http\Controllers\PlayerInfoController; // NIEUWE IMPORT

/*
|--------------------------------------------------------------------------
| Public Routes
|--------------------------------------------------------------------------
| Authenticatie is hier niet nodig.
*/

// Auth
Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);


// Teams (Publieke Leesacties) - Nu direct onder /api/teams
Route::get('/teams', [TeamController::class, 'index']); 
Route::get('/teams/{team}', [TeamController::class, 'show']);


/*
|--------------------------------------------------------------------------
| Protected Routes (Auth:Sanctum vereist)
|--------------------------------------------------------------------------
| Alleen ingelogde gebruikers met een geldige token.
*/
Route::middleware('auth:sanctum')->group(function () {
    
    // Auth (Uitloggen)
    Route::post('/logout', [AuthController::class, 'logout']);

    // --- Player Info Beheer ---
    // POST /api/player-info - Maak/Update PlayerInfo voor ingelogde gebruiker
    Route::post('/player-info', [PlayerInfoController::class, 'storeOrUpdate']);

    // --- Team Management Routes ---
    Route::prefix('teams')->group(function () {
        // Team aanmaken (Toegankelijk voor elke ingelogde gebruiker)
        Route::post('/', [TeamController::class, 'store']); 
        
        // Team Leden Acties
        // POST /api/teams/{team}/members/{user}/attach - Lid toevoegen/rol wijzigen
        Route::post('/{team}/members/{user}/attach', [TeamController::class, 'attachUser']); 

        // DELETE /api/teams/{team}/members/{user}/detach - Lid verwijderen
        Route::delete('/{team}/members/{user}/detach', [TeamController::class, 'detachUser']);
    });
    
    // -----------------------------------------------------------
    // GEBRUIKERS LIJST (Toegankelijk voor alle ingelogde gebruikers, data wordt gefilterd)
    // -----------------------------------------------------------
    Route::get('/users', [UserController::class, 'index']); 

    
    // -----------------------------------------------------------
    // GEBRUIKERS BEHEER (Alleen Admin - CRUD)
    // -----------------------------------------------------------
    Route::middleware('role:admin')->prefix('users')->group(function () {
        // index() is hierboven al gedefinieerd en toegankelijk voor iedereen.
        Route::get('/{user}', [UserController::class, 'show']); // Specifieke gebruiker OPHALEN (Admin ziet ALLES)
        Route::put('/{user}', [UserController::class, 'update']); // Gebruiker bijwerken
        Route::delete('/{user}', [UserController::class, 'destroy']); // Gebruiker verwijderen
    });
});