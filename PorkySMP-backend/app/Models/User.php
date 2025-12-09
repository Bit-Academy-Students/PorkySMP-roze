<?php

namespace App\Models;

use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable;

    /**
     * The attributes that are mass assignable.
     * Nu aangepast naar 'username' (afhankelijk van uw database schema).
     */
    protected $fillable = [
        'username',
        'email',
        'password',
    ];

    /**
     * De attributen die verborgen moeten worden tijdens serialisatie naar JSON.
     * Verbergt alle gevraagde timestamps en gevoelige velden.
     */
    protected $hidden = [
        'password',
        'remember_token',
        'email_verified_at',
        'created_at',
        'updated_at',
    ];

    /**
     * The attributes that should be cast.
     */
    protected $casts = [
        'email_verified_at' => 'datetime',
        'password' => 'hashed',
    ];
    
    /**
     * De teams waar de gebruiker lid van is (via de pivot tabel 'user_teams').
     */
    public function teams(): BelongsToMany
    {
        // Koppel User aan Team via de pivot tabel 'user_teams'
        // Let op: Ik heb .using(UserTeam::class) weggelaten omdat het Pivot Model niet in de context is.
        return $this->belongsToMany(Team::class, 'user_teams')
                    ->withPivot('role');
    }

    /**
     * Optionele helper om de rol van de gebruiker in een specifiek team op te vragen.
     * @param Team $team
     * @return string|null
     */
    public function getTeamRole(Team $team): ?string
    {
        return $this->teams()->where('team_id', $team->id)->first()?->pivot->role;
    }
}