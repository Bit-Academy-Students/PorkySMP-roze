<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Relations\Pivot;

class UserTeam extends Pivot
{
    // Specificeer de tabelnaam
    protected $table = 'user_teams';

    protected $fillable = ['user_id', 'team_id', 'role'];
}