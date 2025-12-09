<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up()
    {
        Schema::create('user_teams', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
            $table->foreignId('team_id')->constrained('teams')->onDelete('cascade');
            // Nieuwe kolom voor de rol binnen het team
            $table->enum('role', ['leader', 'mod', 'member'])->default('member');
            $table->timestamps();

            // Zorg ervoor dat een gebruiker maar één keer in een team zit
            $table->unique(['user_id', 'team_id']);
        });
    }


    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('user_teams');
    }
};