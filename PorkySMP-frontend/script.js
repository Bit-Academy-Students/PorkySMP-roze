// Gebruikers en teams opslaan in localStorage
let users = JSON.parse(localStorage.getItem('users')) || [];
let teams = JSON.parse(localStorage.getItem('teams')) || [];
let currentUser = JSON.parse(localStorage.getItem('currentUser')) || null;

// DOM elementen
const loginBtn = document.getElementById('loginBtn');
const registerBtn = document.getElementById('registerBtn');
const logoutBtn = document.getElementById('logoutBtn');
const showRegister = document.getElementById('showRegister');
const showLogin = document.getElementById('showLogin');

const welcomeSection = document.getElementById('welcomeSection');
const loginSection = document.getElementById('loginSection');
const registerSection = document.getElementById('registerSection');
const dashboardSection = document.getElementById('dashboardSection');

const loginForm = document.getElementById('loginForm');
const registerForm = document.getElementById('registerForm');

const teamNameInput = document.getElementById('teamName');
const createTeamBtn = document.getElementById('createTeamBtn');
const teamSelect = document.getElementById('teamSelect');
const inviteUsernameInput = document.getElementById('inviteUsername');
const inviteBtn = document.getElementById('inviteBtn');
const teamsList = document.getElementById('teamsList');
const invitationsList = document.getElementById('invitationsList');

const notification = document.getElementById('notification');

// Initialisatie
document.addEventListener('DOMContentLoaded', () => {
    updateUI();
    loadTeamsForUser();
    loadInvitationsForUser();
    updateTeamUI();
});

// Event Listeners
loginBtn.addEventListener('click', () => {
    showSection(loginSection);
    hideSection(registerSection);
    hideSection(welcomeSection);
});

registerBtn.addEventListener('click', () => {
    showSection(registerSection);
    hideSection(loginSection);
    hideSection(welcomeSection);
});

logoutBtn.addEventListener('click', logout);

showRegister.addEventListener('click', () => {
    showSection(registerSection);
    hideSection(loginSection);
});

showLogin.addEventListener('click', () => {
    showSection(loginSection);
    hideSection(registerSection);
});

loginForm.addEventListener('submit', handleLogin);
registerForm.addEventListener('submit', handleRegister);
createTeamBtn.addEventListener('click', createTeam);
inviteBtn.addEventListener('click', sendInvitation);

// Functies
function showSection(section) {
    section.classList.remove('hidden');
}

function hideSection(section) {
    section.classList.add('hidden');
}

function showNotification(message, type = 'info') {
    // Verwijder eventuele bestaande notificaties
    notification.classList.add('hidden');
    
    // Stel bericht en kleur in
    notification.textContent = message;
    
    // Stel kleur in op basis van type
    if (type === 'success') {
        notification.classList.add('bg-green-600');
        notification.classList.remove('bg-red-600', 'bg-blue-600');
    } else if (type === 'error') {
        notification.classList.add('bg-red-600');
        notification.classList.remove('bg-green-600', 'bg-blue-600');
    } else {
        notification.classList.add('bg-blue-600');
        notification.classList.remove('bg-green-600', 'bg-red-600');
    }
    
    // Toon notificatie met animatie
    notification.classList.remove('hidden');
    notification.classList.add('notification-show');
    
    // Verberg notificatie na 3 seconden
    setTimeout(() => {
        notification.classList.remove('notification-show');
        notification.classList.add('notification-hide');
        setTimeout(() => {
            notification.classList.add('hidden');
            notification.classList.remove('notification-hide');
        }, 300);
    }, 3000);
}

function handleLogin(e) {
    e.preventDefault();
    
    const username = document.getElementById('loginUsername').value;
    const password = document.getElementById('loginPassword').value;
    
    // Zoek gebruiker
    const user = users.find(u => u.username === username && u.password === password);
    
    if (user) {
        // Sla ingelogde gebruiker op
        currentUser = user;
        localStorage.setItem('currentUser', JSON.stringify(currentUser));
        
        // Update UI
        updateUI();
        
        // Toon dashboard
        showSection(dashboardSection);
        hideSection(loginSection);
        
        showNotification('Succesvol ingelogd!', 'success');
    } else {
        showNotification('Ongeldige gebruikersnaam of wachtwoord', 'error');
    }
}

function handleRegister(e) {
    e.preventDefault();
    
    const username = document.getElementById('registerUsername').value;
    const email = document.getElementById('registerEmail').value;
    const password = document.getElementById('registerPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    
    // Validatie
    if (password !== confirmPassword) {
        showNotification('Wachtwoorden komen niet overeen', 'error');
        return;
    }
    
    if (users.find(u => u.username === username)) {
        showNotification('Gebruikersnaam is al in gebruik', 'error');
        return;
    }
    
    if (users.find(u => u.email === email)) {
        showNotification('E-mailadres is al in gebruik', 'error');
        return;
    }
    
    // Nieuwe gebruiker toevoegen
    const newUser = {
        id: generateId(),
        username,
        email,
        password,
        teams: [],
        invitations: []
    };
    
    users.push(newUser);
    localStorage.setItem('users', JSON.stringify(users));
    
    showNotification('Account succesvol aangemaakt! Je kunt nu inloggen.', 'success');
    
    // Ga naar inlogscherm
    showSection(loginSection);
    hideSection(registerSection);
    
    // Formulier resetten
    registerForm.reset();
}

function logout() {
    currentUser = null;
    localStorage.removeItem('currentUser');
    updateUI();
    
    showSection(welcomeSection);
    hideSection(dashboardSection);
    
    showNotification('Succesvol uitgelogd', 'info');
}

function updateUI() {
    if (currentUser) {
        // Gebruiker is ingelogd
        loginBtn.classList.add('hidden');
        registerBtn.classList.add('hidden');
        logoutBtn.classList.remove('hidden');
        welcomeSection.classList.add('hidden');
        dashboardSection.classList.remove('hidden');
        loginSection.classList.add('hidden');
        registerSection.classList.add('hidden');
        
        // Update team UI
        updateTeamUI();
    } else {
        // Gebruiker is niet ingelogd
        loginBtn.classList.remove('hidden');
        registerBtn.classList.remove('hidden');
        logoutBtn.classList.add('hidden');
        welcomeSection.classList.remove('hidden');
        dashboardSection.classList.add('hidden');
        loginSection.classList.add('hidden');
        registerSection.classList.add('hidden');
    }
}

function generateId() {
    return '_' + Math.random().toString(36).substr(2, 9);
}

function createTeam() {
    if (!currentUser) return;
    
    const teamName = teamNameInput.value.trim();
    
    if (!teamName) {
        showNotification('Voer een teamnaam in', 'error');
        return;
    }
    
    // Controleer of teamnaam al bestaat
    if (teams.find(t => t.name === teamName)) {
        showNotification('Teamnaam is al in gebruik', 'error');
        return;
    }
    
    // Nieuw team aanmaken
    const newTeam = {
        id: generateId(),
        name: teamName,
        owner: currentUser.id,
        members: [currentUser.id],
        invitations: []
    };
    
    teams.push(newTeam);
    localStorage.setItem('teams', JSON.stringify(teams));
    
    // Team toevoegen aan gebruiker
    currentUser.teams.push(newTeam.id);
    updateUser(currentUser);
    
    // UI bijwerken
    teamNameInput.value = '';
    loadTeamsForUser();
    populateTeamSelect();
    updateTeamUI();
    
    showNotification(`Team "${teamName}" succesvol aangemaakt! Je bent nu de eigenaar en kunt spelers uitnodigen.`, 'success');
}

function sendInvitation() {
    if (!currentUser) return;
    
    const teamId = teamSelect.value;
    const username = inviteUsernameInput.value.trim();
    
    if (!teamId) {
        showNotification('Selecteer eerst een team', 'error');
        return;
    }
    
    if (!username) {
        showNotification('Voer een gebruikersnaam in', 'error');
        return;
    }
    
    // Zoek doelgebruiker
    const targetUser = users.find(u => u.username === username);
    
    if (!targetUser) {
        showNotification('Gebruiker niet gevonden', 'error');
        return;
    }
    
    if (targetUser.id === currentUser.id) {
        showNotification('Je kunt jezelf niet uitnodigen', 'error');
        return;
    }
    
    // Zoek team
    const team = teams.find(t => t.id === teamId);
    
    if (!team) {
        showNotification('Team niet gevonden', 'error');
        return;
    }
    
    // CONTROLE: Controleer of de huidige gebruiker de eigenaar is
    if (team.owner !== currentUser.id) {
        showNotification('Alleen de eigenaar van het team kan mensen uitnodigen', 'error');
        return;
    }
    
    // Controleer of gebruiker al lid is
    if (team.members.includes(targetUser.id)) {
        showNotification('Deze gebruiker is al lid van het team', 'error');
        return;
    }
    
    // Controleer of er al een uitnodiging is
    if (team.invitations.includes(targetUser.id)) {
        showNotification('Deze gebruiker heeft al een uitnodiging voor dit team', 'error');
        return;
    }
    
    // Uitnodiging toevoegen aan team
    team.invitations.push(targetUser.id);
    
    // Uitnodiging toevoegen aan gebruiker
    targetUser.invitations.push({
        teamId: team.id,
        teamName: team.name,
        fromUserId: currentUser.id,
        fromUsername: currentUser.username
    });
    
    localStorage.setItem('teams', JSON.stringify(teams));
    updateUser(targetUser);
    
    // UI bijwerken
    inviteUsernameInput.value = '';
    loadInvitationsForUser();
    
    showNotification(`Uitnodiging verzonden naar ${username}`, 'success');
}

function loadTeamsForUser() {
    if (!currentUser) return;
    
    teamsList.innerHTML = '';
    
    if (currentUser.teams.length === 0) {
        teamsList.innerHTML = '<p class="text-gray-400">Je bent nog geen lid van teams</p>';
        return;
    }
    
    // Toon teams waar de gebruiker lid van is
    currentUser.teams.forEach(teamId => {
        const team = teams.find(t => t.id === teamId);
        if (team) {
            const teamElement = document.createElement('div');
            teamElement.className = 'team-card p-3 rounded mb-2';
            
            // Haal ledennamen op
            const memberNames = team.members.map(memberId => {
                const member = users.find(u => u.id === memberId);
                return member ? member.username : 'Onbekend';
            }).join(', ');
            
            // Tel het aantal leden
            const memberCount = team.members.length;
            
            teamElement.innerHTML = `
                <div class="flex justify-between items-start">
                    <div class="flex-1">
                        <h5 class="font-bold text-lg">${team.name}</h5>
                        <p class="text-sm text-gray-300 mt-1">${memberCount} ${memberCount === 1 ? 'lid' : 'leden'}</p>
                        <p class="text-xs text-gray-400 mt-1">Leden: ${memberNames}</p>
                    </div>
                    <div class="flex flex-col items-end ml-4">
                        ${team.owner === currentUser.id ? 
                            '<span class="bg-yellow-600 text-xs px-2 py-1 rounded mb-1 font-bold">EIGENAAR</span>' : 
                            '<span class="bg-blue-600 text-xs px-2 py-1 rounded mb-1">LID</span>'
                        }
                        ${team.owner === currentUser.id ? 
                            '<span class="text-xs text-green-400 font-bold">Uitnodigen mogelijk</span>' : 
                            '<span class="text-xs text-gray-400">Geen uitnodigingsrechten</span>'
                        }
                    </div>
                </div>
            `;
            
            teamsList.appendChild(teamElement);
        }
    });
    
    // Vul team select voor uitnodigingen
    populateTeamSelect();
}

function populateTeamSelect() {
    if (!currentUser) return;
    
    teamSelect.innerHTML = '<option value="">Selecteer een team</option>';
    
    // Toon alleen teams waar de gebruiker eigenaar van is
    currentUser.teams.forEach(teamId => {
        const team = teams.find(t => t.id === teamId);
        if (team && team.owner === currentUser.id) {
            const option = document.createElement('option');
            option.value = team.id;
            option.textContent = `${team.name} (${team.members.length} leden)`;
            teamSelect.appendChild(option);
        }
    });
    
    // Als er geen teams zijn waar de gebruiker eigenaar van is
    if (teamSelect.options.length === 1) {
        teamSelect.innerHTML = '<option value="">Je hebt geen teams waar je eigenaar van bent</option>';
        inviteBtn.disabled = true;
    } else {
        inviteBtn.disabled = false;
    }
}

function loadInvitationsForUser() {
    if (!currentUser) return;
    
    invitationsList.innerHTML = '';
    
    if (currentUser.invitations.length === 0) {
        invitationsList.innerHTML = '<p class="text-gray-400">Geen uitnodigingen</p>';
        return;
    }
    
    currentUser.invitations.forEach((invitation, index) => {
        const invitationElement = document.createElement('div');
        invitationElement.className = 'invitation-card p-3 rounded mb-2 flex justify-between items-center';
        
        invitationElement.innerHTML = `
            <div class="flex-1">
                <h5 class="font-bold">Uitnodiging voor: ${invitation.teamName}</h5>
                <p class="text-sm text-gray-300">Van: ${invitation.fromUsername}</p>
            </div>
            <div class="flex space-x-2 ml-4">
                <button class="accept-invitation bg-green-600 hover:bg-green-700 px-3 py-2 rounded text-sm font-bold" data-index="${index}">Accepteren</button>
                <button class="decline-invitation bg-red-600 hover:bg-red-700 px-3 py-2 rounded text-sm" data-index="${index}">Weigeren</button>
            </div>
        `;
        
        invitationsList.appendChild(invitationElement);
    });
    
    // Event listeners voor accepteren/weigeren knoppen
    document.querySelectorAll('.accept-invitation').forEach(button => {
        button.addEventListener('click', (e) => {
            const index = e.target.getAttribute('data-index');
            acceptInvitation(index);
        });
    });
    
    document.querySelectorAll('.decline-invitation').forEach(button => {
        button.addEventListener('click', (e) => {
            const index = e.target.getAttribute('data-index');
            declineInvitation(index);
        });
    });
}

function acceptInvitation(index) {
    if (!currentUser || !currentUser.invitations[index]) return;
    
    const invitation = currentUser.invitations[index];
    const team = teams.find(t => t.id === invitation.teamId);
    
    if (!team) {
        showNotification('Team niet gevonden', 'error');
        return;
    }
    
    // Voeg gebruiker toe aan team
    team.members.push(currentUser.id);
    
    // Verwijder uitnodiging van team
    const invitationIndex = team.invitations.indexOf(currentUser.id);
    if (invitationIndex > -1) {
        team.invitations.splice(invitationIndex, 1);
    }
    
    // Voeg team toe aan gebruiker
    currentUser.teams.push(team.id);
    
    // Verwijder uitnodiging van gebruiker
    currentUser.invitations.splice(index, 1);
    
    // Opslaan
    localStorage.setItem('teams', JSON.stringify(teams));
    updateUser(currentUser);
    
    // UI bijwerken
    loadTeamsForUser();
    loadInvitationsForUser();
    updateTeamUI();
    
    showNotification(`Je bent nu lid van team "${team.name}"`, 'success');
}

function declineInvitation(index) {
    if (!currentUser || !currentUser.invitations[index]) return;
    
    const invitation = currentUser.invitations[index];
    const team = teams.find(t => t.id === invitation.teamId);
    
    if (team) {
        // Verwijder uitnodiging van team
        const invitationIndex = team.invitations.indexOf(currentUser.id);
        if (invitationIndex > -1) {
            team.invitations.splice(invitationIndex, 1);
        }
        
        localStorage.setItem('teams', JSON.stringify(teams));
    }
    
    // Verwijder uitnodiging van gebruiker
    currentUser.invitations.splice(index, 1);
    updateUser(currentUser);
    
    // UI bijwerken
    loadInvitationsForUser();
    
    showNotification('Uitnodiging geweigerd', 'info');
}

function updateUser(user) {
    const userIndex = users.findIndex(u => u.id === user.id);
    if (userIndex > -1) {
        users[userIndex] = user;
        localStorage.setItem('users', JSON.stringify(users));
        
        // Update currentUser als het dezelfde gebruiker is
        if (currentUser && currentUser.id === user.id) {
            currentUser = user;
            localStorage.setItem('currentUser', JSON.stringify(currentUser));
        }
    }
}

// Helper functies voor team-eigenaarschap
function isTeamOwner(teamId) {
    if (!currentUser) return false;
    
    const team = teams.find(t => t.id === teamId);
    return team && team.owner === currentUser.id;
}

function getTeamsOwnedByUser() {
    if (!currentUser) return [];
    
    return teams.filter(team => team.owner === currentUser.id);
}

function updateTeamUI() {
    if (!currentUser) return;
    
    const ownedTeams = getTeamsOwnedByUser();
    const noTeamsMessage = document.getElementById('noTeamsMessage');
    const inviteControls = document.getElementById('inviteControls');
    
    if (noTeamsMessage && inviteControls) {
        if (ownedTeams.length === 0) {
            noTeamsMessage.classList.remove('hidden');
            inviteControls.classList.add('hidden');
        } else {
            noTeamsMessage.classList.add('hidden');
            inviteControls.classList.remove('hidden');
        }
    }
}

// Voeg een functie toe om een team te verlaten (voor niet-eigenaars)
function leaveTeam(teamId) {
    if (!currentUser) return;
    
    const team = teams.find(t => t.id === teamId);
    
    if (!team) {
        showNotification('Team niet gevonden', 'error');
        return;
    }
    
    // Controleer of de gebruiker de eigenaar is
    if (team.owner === currentUser.id) {
        showNotification('Eigenaars kunnen hun team niet verlaten. Verwijder het team of geef het eigendom eerst over.', 'error');
        return;
    }
    
    // Verwijder gebruiker uit team
    const memberIndex = team.members.indexOf(currentUser.id);
    if (memberIndex > -1) {
        team.members.splice(memberIndex, 1);
    }
    
    // Verwijder team uit gebruiker
    const teamIndex = currentUser.teams.indexOf(teamId);
    if (teamIndex > -1) {
        currentUser.teams.splice(teamIndex, 1);
    }
    
    // Opslaan
    localStorage.setItem('teams', JSON.stringify(teams));
    updateUser(currentUser);
    
    // UI bijwerken
    loadTeamsForUser();
    updateTeamUI();
    
    showNotification(`Je hebt team "${team.name}" verlaten`, 'info');
}

// Functie om een team te verwijderen (alleen voor eigenaars)
function deleteTeam(teamId) {
    if (!currentUser) return;
    
    const team = teams.find(t => t.id === teamId);
    
    if (!team) {
        showNotification('Team niet gevonden', 'error');
        return;
    }
    
    // Controleer of de gebruiker de eigenaar is
    if (team.owner !== currentUser.id) {
        showNotification('Alleen de eigenaar kan een team verwijderen', 'error');
        return;
    }
    
    // Bevestiging vragen
    if (!confirm(`Weet je zeker dat je team "${team.name}" wilt verwijderen? Dit kan niet ongedaan worden gemaakt.`)) {
        return;
    }
    
    // Verwijder team uit alle leden
    team.members.forEach(memberId => {
        const member = users.find(u => u.id === memberId);
        if (member) {
            const teamIndex = member.teams.indexOf(teamId);
            if (teamIndex > -1) {
                member.teams.splice(teamIndex, 1);
                updateUser(member);
            }
        }
    });
    
    // Verwijder team uit teams array
    const teamIndex = teams.findIndex(t => t.id === teamId);
    if (teamIndex > -1) {
        teams.splice(teamIndex, 1);
    }
    
    // Opslaan
    localStorage.setItem('teams', JSON.stringify(teams));
    
    // UI bijwerken
    loadTeamsForUser();
    updateTeamUI();
    
    showNotification(`Team "${team.name}" is verwijderd`, 'success');
}