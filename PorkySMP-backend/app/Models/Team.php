<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Team extends Model
{
    protected $fillable = ['team_name', 'flag_url', 'capital_coords', 'description', 'leader_id'];

    public function users()
    {
        return $this->belongsToMany(User::class, 'user_teams');
    }

    public function leader()
    {
        return $this->belongsTo(User::class, 'leader_id');
    }
}
