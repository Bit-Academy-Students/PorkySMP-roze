<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Casts\Attribute; // Belangrijk: Importeer dit

class Team extends Model
{
    use HasFactory;

    protected $fillable = [
        'team_name',
        'description',
        'flag_url',
        'capital_coords',
    ];
    
    protected $hidden = [
        'created_at',
        'updated_at',
    ];

    // CRUCIAAL: Voeg 'leader' toe om ervoor te zorgen dat deze gecomputeerde property
    // automatisch in de JSON-output wordt opgenomen.
    protected $appends = ['leader']; 

    /**
     * De gebruikers die lid zijn van dit team (Many-to-Many).
     */
    public function members(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'user_teams')
                    ->withPivot('role');
    }

    /**
     * De LEIDER als COMPUTED ATTRIBUTE (Accessor).
     * Dit zoekt de leader in de reeds geladen members collectie.
     * Het resultaat is een enkel User object of null.
     */
    protected function leader(): Attribute
    {
        return Attribute::make(
            // Zoek de leider in de reeds geladen 'members' collectie
            get: fn () => $this->members->where('pivot.role', 'leader')->first(),
        )->shouldCache();
    }
}