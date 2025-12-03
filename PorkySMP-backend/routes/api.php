<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\TeamController;
use App\Http\Controllers\UserController;

// AUTH
Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);

// USERS
Route::get('/users', [UserController::class, 'index']);
Route::get('/users/{id}', [UserController::class, 'show']);
Route::put('/users/{id}', [UserController::class, 'update']);
Route::delete('/users/{id}', [UserController::class, 'destroy']);

// TEAMS
Route::get('/teams', [TeamController::class, 'index']); 
Route::get('/teams/{id}', [TeamController::class, 'show']);
Route::post('/teams', [TeamController::class, 'store']);
Route::put('/teams/{id}', [TeamController::class, 'update']);
Route::delete('/teams/{id}', [TeamController::class, 'destroy']);

// TEAM MEMBERS
Route::post('/teams/{teamId}/users/{userId}', [TeamController::class, 'addUser']);
Route::delete('/teams/{teamId}/users/{userId}', [TeamController::class, 'removeUser']);
Route::get('/teams/{teamId}/members', [TeamController::class, 'members']);
