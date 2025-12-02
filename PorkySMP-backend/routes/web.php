<?php


use Illuminate\Support\Facades\Route;

use App\Models\User;

Route::get('/', function () {
    return view('welcome');
});

Route::get('/users-page', function () {
    $users = User::all();
    return view('users', compact('users'));
});
