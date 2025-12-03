<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PlayerInfo extends Model
{
    protected $table = 'player_info';

    protected $fillable = ['user_id', 'skin_url', 'first_login'];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
