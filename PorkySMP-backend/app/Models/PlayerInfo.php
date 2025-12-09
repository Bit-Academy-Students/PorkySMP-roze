<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PlayerInfo extends Model
{
    protected $table = 'player_info';

    protected $fillable = ['user_id', 'skin_url', 'first_login'];
    
    // NIEUW: De attributen die verborgen moeten worden tijdens serialisatie naar JSON.
    protected $hidden = [
        'created_at',
        'updated_at',
    ];

    // Zorgt ervoor dat first_login als een volledig datum/tijd object wordt behandeld
    protected $casts = [
        'first_login' => 'datetime', 
    ];

    /**
     * De gebruiker waartoe deze player info behoort.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}