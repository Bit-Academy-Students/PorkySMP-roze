<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Team extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     * Pas deze array aan op basis van uw werkelijke kolommen.
     */
    protected $fillable = [
        'team_name',
        'description',
        'flag_url',
        'capital_coords',
    ];
    
    /**
     * De attributen die verborgen moeten worden tijdens serialisatie naar JSON.
     * Verbergt created_at en updated_at van het team object.
     */
    protected $hidden = [
        'created_at',
        'updated_at',
    ];

    /**
     * De gebruikers die lid zijn van dit team (Many-to-Many).
     */
    public function members(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'user_teams')
                    ->withPivot('role');
    }

    /**
     * De leider van dit team (gebruikt de 'leader' rol in de pivot tabel).
     */
    public function leader(): BelongsToMany
    {
        return $this->members()->wherePivot('role', 'leader');
    }
}