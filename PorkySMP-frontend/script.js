// Globale instellingen
const API_BASE_URL = 'http://127.0.0.1:8000/api';
let apiToken = localStorage.getItem('apiToken') || null;
let currentUser = JSON.parse(localStorage.getItem('currentUser')) || null;
// Gebruiker cache om opzoeken van ID's bij username sneller te maken
let userCache = []; 

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

const createTeamForm = document.getElementById('createTeamForm');
const teamsList = document.getElementById('teamsList');
// API Output element is verwijderd uit de HTML

const manageMemberTeamSelect = document.getElementById('manageMemberTeamSelect');
const manageMemberUsernameInput = document.getElementById('manageMemberUsername');
const manageMemberRoleSelect = document.getElementById('manageMemberRole');
const manageMemberForm = document.getElementById('manageMemberForm');
const detachMemberBtn = document.getElementById('detachMemberBtn');

// NIEUWE Player Info elementen
const managePlayerInfoForm = document.getElementById('managePlayerInfoForm');
const skinUrlInput = document.getElementById('skinUrl');

// Modals
const teamManagementModal = document.getElementById('teamManagementModal');
const teamMembersModal = document.getElementById('teamMembersModal');
const updateTeamForm = document.getElementById('updateTeamForm');
const transferLeaderBtn = document.getElementById('transferLeaderBtn');

const notification = document.getElementById('notification');

/**
 * CRUCIALE FUNCTIE: Wrapper voor API-calls met autorisatie en foutafhandeling.
 * @param {string} endpoint - Het API-pad (bijv. '/login' of '/teams/1').
 * @param {string} method - HTTP methode (GET, POST, PUT, DELETE).
 * @param {object} data - Data om te verzenden (voor POST/PUT).
 * @returns {Promise<object|null>} De JSON-respons data of null bij een fout.
 */
async function apiCall(endpoint, method = 'GET', data = null) {
    const url = `${API_BASE_URL}${endpoint}`;
    const headers = {
        'Accept': 'application/json',
    };

    if (apiToken) {
        headers['Authorization'] = `Bearer ${apiToken}`;
    }

    if (data && method !== 'GET') {
        headers['Content-Type'] = 'application/json';
    }

    const config = {
        method: method,
        headers: headers,
        body: data ? JSON.stringify(data) : null,
    };

    try {
        const response = await fetch(url, config);
        const responseText = await response.text();
        const responseData = responseText ? JSON.parse(responseText) : {};
        
        if (!response.ok) {
            const errorMessage = responseData.message || response.statusText;
            showNotification(`Fout (${response.status}): ${errorMessage}`, 'error');
            
            if (response.status === 401 && endpoint !== '/login' && endpoint !== '/register') {
                logoutUser(false); 
            }
            
            throw new Error(errorMessage); 
        }

        if (method !== 'GET' && responseData.message) {
            showNotification(responseData.message, 'success');
        }

        return responseData;

    } catch (error) {
        console.error('API Call Fout:', error);
        if (error.message && !error.message.startsWith('Fout (')) {
             showNotification(`Netwerkfout of JSON-parsingfout: ${error.message}`, 'error');
        }
        return null;
    }
}

// ----------------------------------------------------
// AUTHENTICATIE
// ----------------------------------------------------

async function registerUser(event) {
    event.preventDefault();
    
    if (registerForm.password.value !== registerForm.password_confirmation.value) {
        showNotification('Wachtwoorden komen niet overeen.', 'error');
        return;
    }

    const data = {
        username: registerForm.username.value,
        email: registerForm.email.value,
        password: registerForm.password.value,
        password_confirmation: registerForm.password_confirmation.value
    };

    const result = await apiCall('/register', 'POST', data);

    if (result && result.token) {
        apiToken = result.token;
        // API respons bevat user.playerInfo
        currentUser = result.user; 
        localStorage.setItem('apiToken', apiToken);
        localStorage.setItem('currentUser', JSON.stringify(currentUser));
        
        registerForm.reset();
        updateUI();
        await refreshDashboard();
    }
}

async function loginUser(event) {
    event.preventDefault();

    const data = {
        email: loginForm.email.value,
        password: loginForm.password.value,
    };

    const result = await apiCall('/login', 'POST', data);

    if (result && result.token) {
        apiToken = result.token;
        // API respons bevat user.playerInfo
        currentUser = result.user;
        localStorage.setItem('apiToken', apiToken);
        localStorage.setItem('currentUser', JSON.stringify(currentUser));

        loginForm.reset();
        updateUI();
        await refreshDashboard();
    }
}

function logoutUser(callApi = true) {
    if (callApi && apiToken) {
        apiCall('/logout', 'POST'); 
    }
    
    apiToken = null;
    currentUser = null;
    localStorage.removeItem('apiToken');
    localStorage.removeItem('currentUser');
    
    updateUI(); 
    showNotification('U bent succesvol uitgelogd.', 'info');
}

// ----------------------------------------------------
// DASHBOARD & DATA BEHEER
// ----------------------------------------------------

// Ophalen van alle teams (publieke route)
async function fetchAllTeams() {
    const result = await apiCall('/teams', 'GET');
    return result || []; 
}

// Ophalen van alle gebruikers (voor ID lookup)
async function fetchAllUsers() {
    const result = await apiCall('/users', 'GET'); 
    userCache = result || [];
    return userCache;
}

/**
 * Haalt de laatste data op en werkt het dashboard bij.
 */
async function refreshDashboard() {
    if (!currentUser || !apiToken) {
        updateUI();
        return;
    }
    
    // Zorg ervoor dat we de volledige gebruikerslijst hebben voor lookups
    await fetchAllUsers();

    // 1. Haal de volledige teamslijst op (met leden)
    const allTeams = await fetchAllTeams();
    
    let userTeamsData = [];
    if (allTeams) {
        userTeamsData = allTeams.filter(team => 
            team.members.some(member => member.id === currentUser.id)
        ).map(team => {
            const userMember = team.members.find(member => member.id === currentUser.id);
            return {
                ...team,
                role: userMember ? userMember.pivot.role : 'member' 
            };
        });
        
        currentUser.teams = userTeamsData;
        localStorage.setItem('currentUser', JSON.stringify(currentUser));
        
        displayTeams(currentUser.teams);
        updateMemberManagementSelect(currentUser.teams);
    } else {
        currentUser.teams = [];
        displayTeams([]);
        updateMemberManagementSelect([]);
    }
    
    document.getElementById('teamsCount').textContent = `${currentUser.teams.length} ${currentUser.teams.length === 1 ? 'team' : 'teams'}`;
    
    // NIEUW: Player Info velden vullen
    // De API respons in login/register zorgt dat player_info meekomt
    if (currentUser.player_info) {
        skinUrlInput.value = currentUser.player_info.skin_url || '';
    } else {
        // Indien er nog geen record is, is de waarde leeg
        skinUrlInput.value = '';
    }
    
    updateUI(); 
}

/**
 * Zoek een User ID op basis van de gebruikersnaam.
 * @param {string} username 
 * @returns {number|null} user ID
 */
function findUserIdByUsername(username) {
    const user = userCache.find(u => u.username.toLowerCase() === username.toLowerCase());
    return user ? user.id : null;
}

/**
 * Vult de team selector in de sectie Ledenbeheer met teams waar de gebruiker leider/mod is.
 */
function updateMemberManagementSelect(teams) {
    manageMemberTeamSelect.innerHTML = '<option value="">Selecteer Team (Alleen Teams waar u Leader/Mod bent)</option>';
    if (!teams) return;

    teams.forEach(team => {
        // Alleen Leader en Mod mogen leden toevoegen/wijzigen/verwijderen
        if (team.role === 'leader' || team.role === 'mod') {
            manageMemberTeamSelect.innerHTML += `<option value="${team.id}" data-role="${team.role}">${team.team_name} (${team.role})</option>`;
        }
    });
}

function displayTeams(teams) {
    teamsList.innerHTML = '';

    if (teams.length === 0) {
        teamsList.innerHTML = '<p class="text-gray-400">U bent nog lid van geen enkel team. Maak een team aan!</p>';
        return;
    }
    
    teams.forEach(team => {
        const isManager = team.role === 'leader' || team.role === 'mod'; // Leader en Mod kunnen beheren/verlaten
        const isLeader = team.role === 'leader';
        
        const teamElement = document.createElement('div');
        teamElement.className = 'p-4 bg-gray-700 rounded-lg shadow-md mb-3 flex justify-between items-center';
        teamElement.innerHTML = `
            <div>
                <h3 class="text-xl font-bold">${team.team_name}</h3>
                <p class="text-sm text-gray-400">Rol: <span class="font-semibold text-yellow-300">${team.role.toUpperCase()}</span></p>
                ${team.description ? `<p class="text-xs text-gray-500">${team.description}</p>` : ''}
            </div>
            <div class="space-x-2 flex items-center">
                <button onclick="openTeamMembersModal(${team.id})" class="bg-gray-600 hover:bg-gray-700 px-3 py-1 text-sm rounded">Leden</button>
                ${isLeader ? `<button onclick="openTeamManagementModal(${team.id})" class="bg-indigo-600 hover:bg-indigo-700 px-3 py-1 text-sm rounded">Beheer</button>` : ''}
                <button onclick="leaveTeam(${team.id}, '${team.team_name}')" class="bg-yellow-500 hover:bg-yellow-600 px-3 py-1 text-sm rounded">${isLeader ? 'Ontbinden' : 'Verlaten'}</button>
            </div>
        `;
        teamsList.appendChild(teamElement);
    });
}

// ----------------------------------------------------
// TEAM ACTIES
// ----------------------------------------------------

async function createTeam(event) {
    event.preventDefault();
    if (!currentUser) return;
    
    const teamName = document.getElementById('teamName').value.trim();
    if (!teamName) {
        showNotification('Voer een teamnaam in', 'error');
        return;
    }
    
    const data = {
        team_name: teamName,
        description: document.getElementById('teamDescription').value.trim(),
        flag_url: document.getElementById('teamFlagUrl').value.trim(),
        capital_coords: document.getElementById('teamCapitalCoords').value.trim(),
    };
    
    const result = await apiCall('/teams', 'POST', data);
    
    if (result && result.team) {
        createTeamForm.reset(); 
        await refreshDashboard();
    }
}

async function leaveTeam(teamId, teamName) {
    if (!currentUser) return;
    
    const team = currentUser.teams.find(t => t.id === teamId);
    if (!team) return;
    
    const confirmationText = team.role === 'leader' 
        ? `Weet je zeker dat je team "${teamName}" wilt ontbinden? Dit verwijdert het team voor iedereen.`
        : `Weet je zeker dat je team "${teamName}" wilt verlaten?`;
        
    if (!confirm(confirmationText)) {
        return;
    }
    
    if (team.role === 'leader') {
        // DELETE /api/teams/{team} (TeamController@destroy)
        const result = await apiCall(`/teams/${teamId}`, 'DELETE');
        if (result) {
            await refreshDashboard();
        }
    } else {
        // DELETE /api/teams/{team}/members/{user}/detach
        const result = await apiCall(`/teams/${teamId}/members/${currentUser.id}/detach`, 'DELETE');
        if (result) {
            await refreshDashboard();
        }
    }
}

// ----------------------------------------------------
// LID TOEVOEGEN/WIJZIGEN/VERWIJDEREN
// ----------------------------------------------------

async function handleMemberManagement(event) {
    event.preventDefault();
    if (!currentUser) return;

    const teamId = manageMemberTeamSelect.value;
    const username = manageMemberUsernameInput.value.trim();
    const role = manageMemberRoleSelect.value;
    
    if (!teamId || !username) {
        showNotification('Selecteer een team en voer een gebruikersnaam in.', 'error');
        return;
    }

    const invitedUserId = findUserIdByUsername(username);

    if (!invitedUserId) {
        showNotification(`Gebruiker met naam "${username}" niet gevonden.`, 'error');
        return;
    }

    if (event.submitter && event.submitter.id === 'detachMemberBtn') {
        // Verwijderen
        await detachMember(teamId, invitedUserId, username);
    } else {
        // Toevoegen/Rol wijzigen
        const data = { role: role };
        // POST /api/teams/{team}/members/{user}/attach
        const result = await apiCall(`/teams/${teamId}/members/${invitedUserId}/attach`, 'POST', data);
        
        if (result) {
            manageMemberUsernameInput.value = ''; 
            await refreshDashboard();
        }
    }
}

async function detachMember(teamId, userId, username) {
    if (!confirm(`Weet je zeker dat je lid ${username} wilt verwijderen uit het team?`)) {
        return;
    }
    // DELETE /api/teams/{team}/members/{user}/detach
    const result = await apiCall(`/teams/${teamId}/members/${userId}/detach`, 'DELETE');

    if (result) {
        manageMemberUsernameInput.value = ''; 
        await refreshDashboard();
    }
}

// ----------------------------------------------------
// PLAYER INFO BEHEER (NIEUW)
// ----------------------------------------------------

async function handlePlayerInfoManagement(event) {
    event.preventDefault();
    if (!currentUser) return;

    const data = {
        skin_url: skinUrlInput.value.trim(),
    };

    // POST /api/player-info (PlayerInfoController@storeOrUpdate)
    const result = await apiCall('/player-info', 'POST', data);

    if (result && result.user) {
        // Update de currentUser met de nieuwe data (inclusief bijgewerkte player_info)
        currentUser = result.user;
        localStorage.setItem('currentUser', JSON.stringify(currentUser));
        
        // Refresh de UI
        await refreshDashboard(); 
        showNotification('Player Info succesvol opgeslagen.', 'success');
    }
}


// ----------------------------------------------------
// MODAL FUNCTIES
// ----------------------------------------------------

function closeModal(modalId) {
    document.getElementById(modalId).classList.add('hidden');
}
window.closeModal = closeModal; 

/**
 * Opent de Team Beheer modal en laadt de data.
 */
async function openTeamManagementModal(teamId) {
    const team = currentUser.teams.find(t => t.id === teamId);
    if (!team || team.role !== 'leader') {
        showNotification('U bent geen leider van dit team en mag het niet beheren.', 'error');
        return;
    }

    document.getElementById('modalTeamName').textContent = team.team_name;
    document.getElementById('updateTeamId').value = team.id;
    document.getElementById('updateTeamName').value = team.team_name;
    document.getElementById('updateTeamDescription').value = team.description || '';
    document.getElementById('updateTeamFlagUrl').value = team.flag_url || '';
    document.getElementById('updateTeamCapitalCoords').value = team.capital_coords || '';
    document.getElementById('transferLeaderUsername').value = ''; 
    
    teamManagementModal.classList.remove('hidden');
}
window.openTeamManagementModal = openTeamManagementModal;

/**
 * Verwerkt de Team Update (PUT /api/teams/{team}).
 */
async function updateTeam(event) {
    event.preventDefault();
    const teamId = document.getElementById('updateTeamId').value;

    const data = {
        team_name: document.getElementById('updateTeamName').value.trim(),
        description: document.getElementById('updateTeamDescription').value.trim(),
        flag_url: document.getElementById('updateTeamFlagUrl').value.trim(),
        capital_coords: document.getElementById('updateTeamCapitalCoords').value.trim(),
    };

    // PUT /api/teams/{team}
    const result = await apiCall(`/teams/${teamId}`, 'PUT', data);

    if (result) {
        closeModal('teamManagementModal');
        await refreshDashboard();
    }
}

/**
 * Verwerkt de Leiderschap Overdracht.
 */
async function transferTeamLeadership() {
    const teamId = document.getElementById('updateTeamId').value;
    const newLeaderUsername = document.getElementById('transferLeaderUsername').value.trim();

    if (!newLeaderUsername) {
        showNotification('Voer de gebruikersnaam van de nieuwe leider in.', 'error');
        return;
    }

    const newLeaderId = findUserIdByUsername(newLeaderUsername);
    if (!newLeaderId) {
        showNotification(`Gebruiker met naam "${newLeaderUsername}" niet gevonden.`, 'error');
        return;
    }
    
    // Controleer of de nieuwe leider al lid is van het team (dit is vereist door de API)
    const team = currentUser.teams.find(t => t.id == teamId);
    const isMember = team.members.some(member => member.id === newLeaderId);
    if (!isMember) {
        showNotification(`Gebruiker ${newLeaderUsername} moet eerst lid zijn van het team.`, 'error');
        return;
    }
    
    if (!confirm(`Weet u zeker dat u het leiderschap van dit team wilt overdragen aan ${newLeaderUsername}?`)) {
        return;
    }

    // POST /api/teams/{team}/members/{user}/attach met role: 'leader'
    const result = await apiCall(`/teams/${teamId}/members/${newLeaderId}/attach`, 'POST', { role: 'leader' });

    if (result) {
        showNotification(`Leiderschap succesvol overgedragen aan ${newLeaderUsername}. U bent nu moderator.`, 'success');
        closeModal('teamManagementModal');
        await refreshDashboard();
    }
}


/**
 * Opent de Leden modal en laadt de ledenlijst.
 */
async function openTeamMembersModal(teamId) {
    const team = currentUser.teams.find(t => t.id === teamId);
    
    const freshTeamData = await apiCall(`/teams/${teamId}`, 'GET');

    if (!freshTeamData) return;

    document.getElementById('membersModalTeamName').textContent = freshTeamData.team_name;
    const membersListDiv = document.getElementById('membersList');
    membersListDiv.innerHTML = '';
    
    freshTeamData.members.sort((a, b) => {
        // Sorteer op rol: Leader eerst, dan Mod, dan Member
        const roleOrder = { leader: 1, mod: 2, member: 3 };
        return roleOrder[a.pivot.role] - roleOrder[b.pivot.role];
    });

    freshTeamData.members.forEach(member => {
        const memberElement = document.createElement('div');
        memberElement.className = 'p-3 bg-gray-700 rounded-lg flex justify-between items-center';
        
        const isSelf = member.id === currentUser.id;
        
        memberElement.innerHTML = `
            <div>
                <span class="font-bold">${member.username} ${isSelf ? '(Jij)' : ''}</span>
                <span class="text-sm text-yellow-400 ml-2">(${member.pivot.role.toUpperCase()})</span>
            </div>
            ${freshTeamData.leader && member.id === freshTeamData.leader.id ? '<span class="text-xs text-green-400">LEIDER</span>' : ''}
        `;
        membersListDiv.appendChild(memberElement);
    });

    teamMembersModal.classList.remove('hidden');
}
window.openTeamMembersModal = openTeamMembersModal;


// ----------------------------------------------------
// UI FUNCTIES
// ----------------------------------------------------

function updateUI() {
    const isLoggedIn = !!apiToken && !!currentUser;
    
    loginBtn.classList.toggle('hidden', isLoggedIn);
    registerBtn.classList.toggle('hidden', isLoggedIn);
    logoutBtn.classList.toggle('hidden', !isLoggedIn);
    
    welcomeSection.classList.toggle('hidden', isLoggedIn);
    loginSection.classList.add('hidden');
    registerSection.classList.add('hidden');
    dashboardSection.classList.toggle('hidden', !isLoggedIn);
    
    if (isLoggedIn) {
        document.getElementById('dashboardUser').textContent = currentUser.username;
    } else {
        welcomeSection.classList.remove('hidden');
    }
}

function showNotification(message, type = 'info') {
    notification.textContent = message;
    notification.className = `fixed bottom-4 right-4 z-50 p-3 rounded shadow-lg transition-opacity duration-300`;
    
    if (type === 'error') {
        notification.classList.add('bg-red-700', 'text-white');
    } else if (type === 'success') {
        notification.classList.add('bg-green-600', 'text-white');
    } else {
        notification.classList.add('bg-blue-600', 'text-white');
    }
    
    notification.style.opacity = '1';

    setTimeout(() => {
        notification.style.opacity = '0';
    }, 5000);
}


// ----------------------------------------------------
// INITIALISATIE
// ----------------------------------------------------

document.addEventListener('DOMContentLoaded', () => {
    // Navigatie knoppen
    loginBtn.addEventListener('click', () => {
        welcomeSection.classList.add('hidden');
        registerSection.classList.add('hidden');
        loginSection.classList.remove('hidden');
    });

    registerBtn.addEventListener('click', () => {
        welcomeSection.classList.add('hidden');
        loginSection.classList.add('hidden');
        registerSection.classList.remove('hidden');
    });

    showRegister.addEventListener('click', () => {
        loginSection.classList.add('hidden');
        registerSection.classList.remove('hidden');
    });

    showLogin.addEventListener('click', () => {
        registerSection.classList.add('hidden');
        loginSection.classList.remove('hidden');
    });

    // Formulier en actie knoppen
    loginForm.addEventListener('submit', loginUser);
    registerForm.addEventListener('submit', registerUser);
    logoutBtn.addEventListener('click', () => logoutUser(true)); 

    // Nieuwe acties
    createTeamForm.addEventListener('submit', createTeam); 
    manageMemberForm.addEventListener('submit', handleMemberManagement); 
    // De knop om lid te verwijderen staat in manageMemberForm, maar we gebruiken event.submitter.id om te bepalen welke actie wordt uitgevoerd in handleMemberManagement.
    // detachMemberBtn.addEventListener('click', detachMember); // Is niet nodig door handleMemberManagement
    updateTeamForm.addEventListener('submit', updateTeam); 
    transferLeaderBtn.addEventListener('click', transferTeamLeadership); 
    
    // NIEUW: Player Info
    managePlayerInfoForm.addEventListener('submit', handlePlayerInfoManagement);


    // Initialisatie bij laden van de pagina
    updateUI();
    if (apiToken && currentUser) {
        refreshDashboard();
    }
});