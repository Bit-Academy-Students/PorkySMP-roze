<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class TestSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run()
    {
        $user = \App\Models\User::create([
        'username' => 'Fedde',
        'email' => 'fedde@example.com',
        'password' => bcrypt('secret')
        ]);

        $team = \App\Models\Team::create([
        'team_name' => 'Nederland',
        'leader_id' => $user->id
        ]);

        $user->teams()->attach($team->id);

        \App\Models\PlayerInfo::create([
        'user_id' => $user->id,
        'skin_url' => 'url_naar_skin',
        'first_login' => now()
        ]);
    }
}
