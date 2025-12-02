<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Gebruikers & Teams - PorkySMP</title>
    <style>
        body { font-family: Arial, sans-serif; padding: 20px; background: #f5f5f5; }
        h1 { color: #333; }
        .user-card, .team-card {
            border: 1px solid #ccc;
            border-radius: 8px;
            background: #fff;
            padding: 15px;
            margin-bottom: 15px;
        }
        .user-card img {
            width: 50px; height: 50px;
            border-radius: 50%;
            vertical-align: middle;
            margin-right: 10px;
        }
        .team-list { margin-left: 20px; }
    </style>
</head>
<body>

<h1>Gebruikers & Teams - PorkySMP</h1>

@foreach($users as $user)
    <div class="user-card">
        <!-- Username en Email -->
        <strong>{{ $user->username }}</strong> ({{ $user->email }})<br>
        Role: {{ $user->role }}<br>

        <!-- Player info -->
        @if($user->playerInfo)
            <img src="{{ $user->playerInfo->skin_url }}" alt="Skin van {{ $user->username }}">
            First login: {{ $user->playerInfo->first_login }}
        @else
            Geen spelerinformatie
        @endif
        <br>

        <!-- Teams -->
        Teams:
        <span id="teams-{{ $user->id }}">Loading...</span>
    </div>
@endforeach

<h2>Team overzicht</h2>

@foreach($teams as $team)
    <div class="team-card">
        <strong>{{ $team->team_name }}</strong><br>
        Vlag: @if($team->flag_url)<img src="{{ $team->flag_url }}" alt="Vlag" width="30">@endif<br>
        Hoofdstad coordinaten: {{ $team->capital_coords ?? 'Niet ingesteld' }}<br>
        Leider: {{ $team->leader ? $team->leader->username : 'Geen leider' }}<br>
        Teamleden:
        <ul>
            @foreach($team->users as $member)
                <li>{{ $member->username }} ({{ $member->email }})</li>
            @endforeach
        </ul>
    </div>
@endforeach

<script>
    @foreach($users as $user)
        fetch(`http://127.0.0.1:8000/api/users/{{ $user->id }}`)
        .then(res => res.json())
        .then(userDetail => {
            let teamsHtml = '';
            if(userDetail.teams && userDetail.teams.length > 0){
                teamsHtml = '<ul class="team-list">' + 
                    userDetail.teams.map(t => `<li>${t.team_name}</li>`).join('') + 
                    '</ul>';
            } else {
                teamsHtml = 'Geen teams';
            }
            document.getElementById(`teams-{{ $user->id }}`).innerHTML = teamsHtml;
        })
        .catch(err => {
            document.getElementById(`teams-{{ $user->id }}`).innerHTML = 'Fout bij laden teams';
            console.error(err);
        });
    @endforeach
</script>

</body>
</html>
