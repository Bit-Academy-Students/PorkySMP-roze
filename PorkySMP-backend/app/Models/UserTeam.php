<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Relations\Pivot;

// Gebruik Pivot in plaats van Model
class UserTeam extends Pivot
{
    // Specificeer de tabelnaam
    protected $table = 'user_teams';

    // Voeg 'role' toe aan de fillable array
    protected $fillable = ['user_id', 'team_id', 'role'];
}