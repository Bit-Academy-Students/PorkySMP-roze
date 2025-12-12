<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use App\Models\Team;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;

class DatabaseSeeder extends Seeder
{
    /**
     * Run the database seeds.
     *
     * @return void
     */
    public function run()
    {
        // Het universele wachtwoord voor de presentatie: 123456
        $passwordHash = Hash::make('123456');

        // -------------------------------------------------------------
        // 1. Presentatie Admin (user1: Leader, Mod, Member in verschillende teams)
        // -------------------------------------------------------------
        $presenterAdmin = User::create([
            'username' => 'user1',
            'email' => 'user1@gmail.com',
            'password' => $passwordHash, 
            'role' => 'admin', 
        ]);
        
        // -------------------------------------------------------------
        // 2. Reguliere Gebruikers
        // -------------------------------------------------------------
        $user2 = User::create([
            'username' => 'user2',
            'email' => 'user2@gmail.com',
            'password' => $passwordHash,
        ]);

        $user3 = User::create([
            'username' => 'user3',
            'email' => 'user3@gmail.com',
            'password' => $passwordHash,
        ]);
        
        $user4 = User::create([
            'username' => 'user4',
            'email' => 'user4@gmail.com',
            'password' => $passwordHash,
        ]);
        
        $user5 = User::create([
            'username' => 'user5',
            'email' => 'user5@gmail.com',
            'password' => $passwordHash,
        ]);


        // -------------------------------------------------------------
        // 3. Teams aanmaken met aangepaste beschrijvingen
        // -------------------------------------------------------------
        $teamNederland = Team::create([
            'team_name' => 'Nederland',
            'description' => 'Beschrijving Nederland',
        ]);
        
        $teamFrankrijk = Team::create([
            'team_name' => 'Frankrijk',
            'description' => 'Beschrijving Frankrijk',
        ]);

        $teamDuitsland = Team::create([
            'team_name' => 'Duitsland',
            'description' => 'Beschrijving Duitsland',
        ]);
        
        $teamSpanje = Team::create([
            'team_name' => 'Spanje',
            'description' => 'Beschrijving Spanje',
        ]);

        // -------------------------------------------------------------
        // 4. Leden toevoegen en Rollen instellen
        // -------------------------------------------------------------

        // Team Nederland (user1 Leader)
        $teamNederland->members()->attach($presenterAdmin->id, ['role' => 'leader']);
        $teamNederland->members()->attach($user2->id, ['role' => 'mod']);
        $teamNederland->members()->attach($user3->id, ['role' => 'member']);
        
        // Team Frankrijk (user1 Mod)
        $teamFrankrijk->members()->attach($user2->id, ['role' => 'leader']); // user2 is Leader
        $teamFrankrijk->members()->attach($presenterAdmin->id, ['role' => 'mod']);
        $teamFrankrijk->members()->attach($user4->id, ['role' => 'member']);

        // Team Duitsland (user1 Member)
        $teamDuitsland->members()->attach($user3->id, ['role' => 'leader']); // user3 is Leader
        $teamDuitsland->members()->attach($user4->id, ['role' => 'mod']);
        $teamDuitsland->members()->attach($presenterAdmin->id, ['role' => 'member']);
        $teamDuitsland->members()->attach($user5->id, ['role' => 'member']);

        // Team Spanje (Extra team)
        $teamSpanje->members()->attach($user5->id, ['role' => 'leader']); 
        $teamSpanje->members()->attach($user2->id, ['role' => 'member']);
    }
}