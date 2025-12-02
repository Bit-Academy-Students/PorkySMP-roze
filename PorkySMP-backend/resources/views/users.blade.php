<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Gebruikers - PorkySMP</title>
    <style>
        body { font-family: Arial, sans-serif; padding: 20px; }
        h1 { color: #333; }
        .user-card { 
            border: 1px solid #ccc; 
            padding: 10px; 
            margin-bottom: 10px; 
            border-radius: 8px; 
        }
        .team-list { margin-left: 20px; }
    </style>
</head>
<body>

    <h1>Alle Gebruikers</h1>

    @foreach($users as $user)
        <div class="user-card">
            <strong>{{ $user->username }}</strong> ({{ $user->email }})<br>
            Role: {{ $user->role }}<br>
            Teams: <span id="teams-{{ $user->id }}">Loading...</span>
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
