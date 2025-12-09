<?php

namespace App\Models;

use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable;

    /**
     * The attributes that are mass assignable.
     */
    protected $fillable = [
        'username',
        'email',
        'password',
        'role', // Zorg ervoor dat de rol indien nodig in te stellen is via de admin-route
    ];

    /**
     * De attributen die verborgen moeten worden tijdens serialisatie naar JSON.
     * Nu is 'role' toegevoegd om de algemene rol te verbergen voor normale users.
     */
    protected $hidden = [
        'password',
        'remember_token',
        'created_at',
        'updated_at',
        'email', // Blijft verborgen in alle gevallen tenzij Admin deze expliciet toont
        'role', // Nu toegevoegd om de algemene rol te verbergen voor normale users
    ];

    /**
     * The attributes that should be cast.
     */
    protected $casts = [
        'password' => 'hashed',
    ];
    
    /**
     * De teams waar de gebruiker lid van is (via de pivot tabel 'user_teams').
     */
    public function teams(): BelongsToMany
    {
        return $this->belongsToMany(Team::class, 'user_teams')
                    ->withPivot('role');
    }

    /**
     * De PlayerInfo van deze gebruiker (One-to-One).
     */
    public function playerInfo(): HasOne
    {
        return $this->hasOne(PlayerInfo::class);
    }
}