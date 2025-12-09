<?php

namespace App\Http\Controllers;

use App\Models\PlayerInfo;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class PlayerInfoController extends Controller
{
    /**
     * Maak of werk de PlayerInfo record van de ingelogde gebruiker bij.
     * De 'first_login' datum wordt automatisch vastgelegd.
     */
    public function storeOrUpdate(Request $request)
    {
        $request->validate([
            'skin_url' => 'nullable|url|max:255',
        ]);

        /** @var \App\Models\User $user */
        $user = Auth::user();

        // Gebruik firstOrNew om een bestaande record op te halen of een nieuwe instantie aan te maken
        $playerInfo = PlayerInfo::firstOrNew(['user_id' => $user->id]);

        // Alleen de first_login datum instellen als deze nog niet is ingesteld (robuuste fallback)
        if (is_null($playerInfo->first_login)) {
            $playerInfo->first_login = now()->toDateString();
        }
        
        // Update de skin URL indien deze is meegegeven
        if ($request->has('skin_url')) {
            $playerInfo->skin_url = $request->skin_url;
        }

        // Sla de record op (dit doet een INSERT als het een nieuwe record is, anders een UPDATE)
        $playerInfo->save();

        return response()->json([
            'message' => 'PlayerInfo succesvol opgeslagen/bijgewerkt.',
            'player_info' => $playerInfo
        ], 200);
    }
}