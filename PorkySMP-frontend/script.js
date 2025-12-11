// Globale instellingen
const API_BASE_URL = 'http://127.0.0.1:8000/api';
let apiToken = localStorage.getItem('apiToken') || null;
let currentUser = JSON.parse(localStorage.getItem('currentUser')) || null;
// Gebruiker cache om opzoeken van ID's bij username sneller te maken (en voor admin paneel)
let userCache = []; 

// DOM elementen
const loginBtn = document.getElementById('loginBtn');
const registerBtn = document.getElementById('registerBtn');
const logoutBtn = document.getElementById('logoutBtn');
const adminBtn = document.getElementById('adminBtn');
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

// GEWIJZIGDE LID TOEVOEGEN ELEMENTEN
const manageMemberTeamSelect = document.getElementById('manageMemberTeamSelect');
const manageMemberUsernameInput = document.getElementById('manageMemberUsername');
const manageMemberForm = document.getElementById('manageMemberForm');
// manageMemberRoleSelect en detachMemberBtn zijn verwijderd

// Player Info elementen
const managePlayerInfoForm = document.getElementById('managePlayerInfoForm');
const skinUrlInput = document.getElementById('skinUrl');

// Modals
const teamManagementModal = document.getElementById('teamManagementModal');
const teamMembersModal = document.getElementById('teamMembersModal');
const updateTeamForm = document.getElementById('updateTeamForm');
const transferLeaderBtn = document.getElementById('transferLeaderBtn');

// NIEUWE/GEWIJZIGDE Leden Modal Elementen
const memberSearchInput = document.getElementById('memberSearchInput');
const teamMemberManagementForm = document.getElementById('teamMemberManagementForm');
const manageMemberTeamIdInput = document.getElementById('manageMemberTeamId');
const manageMemberIdInput = document.getElementById('manageMemberId');
const managedMemberUsernameDisplay = document.getElementById('managedMemberUsernameDisplay');
const manageMemberUsernameDisplayInput = document.getElementById('manageMemberUsernameDisplayInput'); // De disabled input
const manageMemberNewRoleSelect = document.getElementById('manageMemberNewRole');
const updateMemberRoleBtn = document.getElementById('updateMemberRoleBtn');
const kickMemberBtn = document.getElementById('kickMemberBtn');


// Admin Modal Elementen
const adminPanelModal = document.getElementById('adminPanelModal');
const userSearchInput = document.getElementById('userSearchInput');
const adminUserList = document.getElementById('adminUserList');
const adminUserManagementForm = document.getElementById('adminUserManagementForm');
const manageUserIdInput = document.getElementById('manageUserId');
const managedUsernameDisplay = document.getElementById('managedUsernameDisplay');
const manageUsernameInput = document.getElementById('manageUsername');
const manageEmailInput = document.getElementById('manageEmail');
const manageRoleSelect = document.getElementById('manageRole');
const deleteUserBtn = document.getElementById('deleteUserBtn');

// Wachtwoord Reset Formulier
const adminUserPasswordForm = document.getElementById('adminUserPasswordForm');
const manageUserIdPasswordInput = document.getElementById('manageUserIdPassword');
const managePasswordInput = document.getElementById('managePassword');
const managePasswordConfirmInput = document.getElementById('managePasswordConfirm');

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

// Ophalen van alle gebruikers (voor ID lookup & Admin Panel)
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
    
    // 1. Haal de volledige gebruikerslijst op (voor lookups/admin panel)
    await fetchAllUsers();

    const adminUserInCache = userCache.find(u => u.id === currentUser.id);
    if (adminUserInCache && adminUserInCache.role) {
        currentUser.role = adminUserInCache.role;
        localStorage.setItem('currentUser', JSON.stringify(currentUser));
    }
    // *******************************************************


    // 2. Haal de volledige teamslijst op (met leden)
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
    
    // Player Info velden vullen
    if (currentUser.player_info) {
        skinUrlInput.value = currentUser.player_info.skin_url || '';
    } else {
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
 * Vult de team selector in de sectie Lid Toevoegen met teams waar de gebruiker leider/mod is.
 */
function updateMemberManagementSelect(teams) {
    manageMemberTeamSelect.innerHTML = '<option value="">Selecteer Team</option>';
    if (!teams) return;

    teams.forEach(team => {
        // Alleen Leader en Mod mogen leden toevoegen
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
        const isLeader = team.role === 'leader';
        // Gebruiker is Leader of Mod
        const canManageMembers = isLeader || team.role === 'mod'; 
        
        const teamElement = document.createElement('div');
        teamElement.className = 'p-4 bg-gray-700 rounded-lg shadow-md mb-3 flex justify-between items-center';

        // 1. Leden Beheer / Leden Overzicht knop
        const membersButtonText = canManageMembers ? 'Leden Beheer' : 'Leden Overzicht';

        teamElement.innerHTML = `
            <div>
                <h3 class="text-xl font-bold">${team.team_name}</h3>
                <p class="text-sm text-gray-400">Rol: <span class="font-semibold text-yellow-300">${team.role.toUpperCase()}</span></p>
                ${team.description ? `<p class="text-xs text-gray-500">${team.description}</p>` : ''}
            </div>
            <div class="space-x-2 flex items-center">
                <button onclick="openTeamMembersModal(${team.id})" class="bg-gray-600 hover:bg-gray-700 px-3 py-1 text-sm rounded">${membersButtonText}</button>
                ${isLeader ? `<button onclick="openTeamManagementModal(${team.id})" class="bg-indigo-600 hover:bg-indigo-700 px-3 py-1 text-sm rounded">Team Beheer</button>` : ''}
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
        const result = await apiCall(`/teams/${teamId}`, 'DELETE');
        if (result) {
            await refreshDashboard();
        }
    } else {
        const result = await apiCall(`/teams/${teamId}/members/${currentUser.id}/detach`, 'DELETE');
        if (result) {
            await refreshDashboard();
        }
    }
}

// ----------------------------------------------------
// LID TOEVOEGEN (Alleen Attachen als 'member')
// ----------------------------------------------------

async function handleMemberManagement(event) {
    event.preventDefault();
    if (!currentUser) return;

    const teamId = manageMemberTeamSelect.value;
    const username = manageMemberUsernameInput.value.trim();
    
    if (!teamId || !username) {
        showNotification('Selecteer een team en voer een gebruikersnaam in.', 'error');
        return;
    }

    const invitedUserId = findUserIdByUsername(username);

    if (!invitedUserId) {
        showNotification(`Gebruiker met naam "${username}" niet gevonden. Let op: de gebruiker moet minstens één keer zijn ingelogd op het platform om in de cache te staan.`, 'error');
        return;
    }

    // Voeg toe met de standaardrol 'member'
    const data = { role: 'member' };
    const result = await apiCall(`/teams/${teamId}/members/${invitedUserId}/attach`, 'POST', data);

    if (result) {
        manageMemberUsernameInput.value = '';
        await refreshDashboard();
    }
}

// ----------------------------------------------------
// PLAYER INFO BEHEER
// ----------------------------------------------------

async function handlePlayerInfoManagement(event) {
    event.preventDefault();
    if (!currentUser) return;

    const data = {
        skin_url: skinUrlInput.value.trim(),
    };

    const result = await apiCall('/player-info', 'POST', data);

    if (result && result.user) {
        currentUser = result.user;
        localStorage.setItem('currentUser', JSON.stringify(currentUser));

        await refreshDashboard();
        showNotification('Player Info succesvol opgeslagen.', 'success');
    }
}


// ----------------------------------------------------
// TEAMLEDEN BEHEER IN MODAL
// ----------------------------------------------------

/**
 * Haalt verse data op en werkt de relevante UI-elementen in de modal bij.
 * @param {number} teamId
 */
async function updateModalDataAndUI(teamId) {
    const freshTeamData = await apiCall(`/teams/${teamId}`, 'GET');
    if (!freshTeamData) return;

    // Sla de team data op in een attribuut voor later gebruik in de modal functies
    teamMembersModal.setAttribute('data-current-team', JSON.stringify(freshTeamData));

    // Reset en vul de ledenlijst
    displayMemberList(freshTeamData, memberSearchInput.value);

    // Reset het beheer formulier
    resetMemberManagementForm();

    // Ververs ook het dashboard in de achtergrond voor de teamlijst
    refreshDashboard();
}

/**
 * Open de Team Leden Beheer Modal.
 */
async function openTeamMembersModal(teamId) {
    const team = currentUser.teams.find(t => t.id === teamId);

    if (!team) return;

    // Haal de initiële verse data op en sla op
    const freshTeamData = await apiCall(`/teams/${teamId}`, 'GET');
    if (!freshTeamData) return;
    teamMembersModal.setAttribute('data-current-team', JSON.stringify(freshTeamData));


    // Bepaal of de gebruiker Leader/Mod is
    const canManageMembers = team.role === 'leader' || team.role === 'mod';

    // Elementen voor dynamische aanpassing
    const modalContent = document.getElementById('membersModalContentContainer');
    const modalTitleSpan = document.getElementById('membersModalTitle');
    const memberListContainer = document.getElementById('membersListContainer');

    document.getElementById('membersModalTeamName').textContent = freshTeamData.team_name;

    if (canManageMembers) {
        modalTitleSpan.textContent = 'Leden Beheer: ';
        // Huidige grote layout (max-w-4xl)
        modalContent.classList.remove('max-w-lg');
        modalContent.classList.add('max-w-4xl');
        // Lijst neemt 1/3e van de ruimte in de grid en heeft een scheiding
        memberListContainer.classList.remove('md:col-span-3', 'md:pr-0');
        memberListContainer.classList.add('md:col-span-1', 'border-r', 'border-gray-700', 'md:pr-4');
    } else {
        modalTitleSpan.textContent = 'Leden Overzicht: ';
        // Gewenste kleinere layout (max-w-lg)
        modalContent.classList.remove('max-w-4xl');
        modalContent.classList.add('max-w-lg');
        // Lijst neemt de volledige breedte in de grid en heeft geen scheiding/minder padding rechts
        memberListContainer.classList.remove('md:col-span-1', 'border-r', 'border-gray-700', 'md:pr-4');
        memberListContainer.classList.add('md:col-span-3', 'md:pr-0'); // Gebruik md:col-span-3 om 100% breedte van de grid te pakken.
    }

    // Deel het beheerformulier en gerelateerde elementen in/uit.
    document.getElementById('memberManagementPanel').classList.toggle('hidden', !canManageMembers);
    document.getElementById('memberSearchInputContainer').classList.toggle('hidden', !canManageMembers);

    // Reset en vul de ledenlijst
    displayMemberList(freshTeamData);

    // Reset het beheer formulier (alleen als de gebruiker kan beheren)
    if (canManageMembers) {
        resetMemberManagementForm();
    } else {
        // Zorg ervoor dat de beheervelden leeg zijn als ze niet getoond worden
        managedMemberUsernameDisplay.textContent = 'Selecteer een lid';
    }

    memberSearchInput.value = ''; // Reset zoekveld

    teamMembersModal.classList.remove('hidden');
}
window.openTeamMembersModal = openTeamMembersModal;

/**
 * Reset het lid beheer formulier in de modal.
 */
function resetMemberManagementForm() {
    managedMemberUsernameDisplay.textContent = 'Selecteer een lid';
    teamMemberManagementForm.reset();
    manageMemberTeamIdInput.value = '';
    manageMemberIdInput.value = '';
    manageMemberUsernameDisplayInput.value = '';

    // Alles uitschakelen tot een lid is geselecteerd
    manageMemberNewRoleSelect.disabled = true;
    updateMemberRoleBtn.disabled = true;
    kickMemberBtn.disabled = true;

    // Reset de "leader" optie disabled status
    const leaderOption = manageMemberNewRoleSelect.querySelector('option[value="leader"]');
    if (leaderOption) {
        leaderOption.disabled = false;
    }

    // Visuele feedback verwijderen
    document.querySelectorAll('#membersList > div').forEach(el => {
        el.classList.remove('bg-gray-600', 'border-2', 'border-indigo-500');
    });
}

/**
 * Functie om de ledenlijst in de modal weer te geven.
 */
function displayMemberList(teamData, filter = '') {
    const membersListDiv = document.getElementById('membersList');
    membersListDiv.innerHTML = '';
    const teamMembers = teamData.members;

    const loggedInUserRole = currentUser.teams.find(t => t.id === teamData.id)?.role;
    const canManageMembers = loggedInUserRole === 'leader' || loggedInUserRole === 'mod';

    document.getElementById('memberCount').textContent = teamMembers.length;

    // Sorteer op rol: Leader, Mod, Member
    teamMembers.sort((a, b) => {
        const roleOrder = { leader: 1, mod: 2, member: 3 };
        return roleOrder[a.pivot.role] - roleOrder[b.pivot.role];
    });

    const filteredMembers = teamMembers.filter(member =>
        member.username.toLowerCase().includes(filter.toLowerCase())
    );

    if (filteredMembers.length === 0) {
        membersListDiv.innerHTML = `<p class="text-gray-400 p-2">Geen leden gevonden${filter ? ' voor zoekterm "' + filter + '"' : ''}.</p>`;
        return;
    }

    filteredMembers.forEach(member => {
        const memberElement = document.createElement('div');

        let elementClasses = 'p-3 bg-gray-700 rounded-lg flex justify-between items-center transition duration-150';
        if (canManageMembers) {
            elementClasses += ' hover:bg-gray-600 cursor-pointer';
        }
        memberElement.className = elementClasses;

        memberElement.setAttribute('data-member-id', member.id);

        const isSelf = member.id === currentUser.id;

        memberElement.innerHTML = `
            <div>
                <span class="font-bold">${member.username} ${isSelf ? '(Jij)' : ''}</span>
                <span class="text-sm text-yellow-400 ml-2">(${member.pivot.role.toUpperCase()})</span>
            </div>
        `;

        // Leden alleen laden voor beheer als de gebruiker geautoriseerd is
        if (canManageMembers) {
            memberElement.addEventListener('click', () => loadMemberForManagement(member, teamData));
        }

        membersListDiv.appendChild(memberElement);
    });
}

/**
 * Functie om een specifiek lid te laden voor beheer.
 */
function loadMemberForManagement(member, teamData) {
    const loggedInUserRole = currentUser.teams.find(t => t.id === teamData.id)?.role;
    const isLeader = loggedInUserRole === 'leader';
    const isSelf = member.id === currentUser.id;
    const isTargetLeader = member.pivot.role === 'leader';

    // Dit zou niet moeten gebeuren, maar voor de zekerheid:
    if (loggedInUserRole !== 'leader' && loggedInUserRole !== 'mod') {
        showNotification('U bent geen leider of moderator van dit team en mag de leden niet beheren.', 'error');
        return;
    }


    // UI velden vullen
    managedMemberUsernameDisplay.textContent = member.username;
    manageMemberTeamIdInput.value = teamData.id;
    manageMemberIdInput.value = member.id;
    manageMemberUsernameDisplayInput.value = member.username;
    manageMemberNewRoleSelect.value = member.pivot.role;

    // ----- LOGICA: Voorkom dat de leider de 'leader' optie kan kiezen in Leden Beheer -----
    const leaderOption = manageMemberNewRoleSelect.querySelector('option[value="leader"]');
    if (leaderOption) {
        // Reset de disabled status (belangrijk bij het wisselen van selectie)
        leaderOption.disabled = false;

        if (isLeader) {
            leaderOption.disabled = true;
        }
    }
    // ---------------------------------------------------------------------------------------------


    // 1. Rol wijzigen
    if (isSelf) {
        // Je kunt je eigen rol niet wijzigen via dit paneel
        manageMemberNewRoleSelect.disabled = true;
        updateMemberRoleBtn.disabled = true;
    } else if (isTargetLeader) {
        // Alleen de leader kan de rol van een andere leader wijzigen (naar leader = overdragen)
        // Nu kan de leader alleen nog een downgrade uitvoeren, omdat de 'leader' optie is uitgeschakeld.
        manageMemberNewRoleSelect.disabled = !isLeader;
        updateMemberRoleBtn.disabled = !isLeader;
    } else {
        // Leader en Mod kunnen andere leden en mods wijzigen
        manageMemberNewRoleSelect.disabled = !(isLeader || loggedInUserRole === 'mod');
        updateMemberRoleBtn.disabled = !(isLeader || loggedInUserRole === 'mod');
    }

    if (loggedInUserRole === 'mod') {
        const leaderOption = manageMemberNewRoleSelect.querySelector('option[value="leader"]');
        if (leaderOption) {
            leaderOption.disabled = true;
        }
    } else if (isLeader) {
        const leaderOption = manageMemberNewRoleSelect.querySelector('option[value="leader"]');
        if (leaderOption) {
            leaderOption.disabled = true;
        }
    }


    // 2. Kicken
    if (isSelf || isTargetLeader) {
        // Je kunt jezelf of de leader niet kicken
        kickMemberBtn.disabled = true;
    } else {
        // Leader en Mod kunnen andere leden en mods kicken
        kickMemberBtn.disabled = !(isLeader || loggedInUserRole === 'mod');
    }

    // Visuele feedback voor de selectie
    document.querySelectorAll('#membersList > div').forEach(el => {
        el.classList.remove('bg-gray-600', 'border-2', 'border-indigo-500');
    });
    const selectedEl = document.querySelector(`[data-member-id="${member.id}"]`);
    if (selectedEl) {
        selectedEl.classList.add('bg-gray-600', 'border-2', 'border-indigo-500');
    }
}

/**
 * Lidrol bijwerken in het team.
 */
async function handleMemberRoleUpdate(event) {
    event.preventDefault();
    const teamId = manageMemberTeamIdInput.value;
    const memberId = manageMemberIdInput.value;
    const newRole = manageMemberNewRoleSelect.value;
    const username = manageMemberUsernameDisplayInput.value;

    if (!teamId || !memberId) return;

    const teamData = JSON.parse(teamMembersModal.getAttribute('data-current-team'));
    const loggedInUserRole = currentUser.teams.find(t => t.id == teamId)?.role;
    const targetMember = teamData.members.find(m => m.id == memberId);

    if (newRole === 'leader') {
        showNotification('Leiderschap kan alleen worden overgedragen via de Team Beheer modal.', 'error');
        return;
    }

    const data = { role: newRole };
    const result = await apiCall(`/teams/${teamId}/members/${memberId}/attach`, 'POST', data);

    if (result) {
        await updateModalDataAndUI(teamId); 
        showNotification(`Rol van ${username} succesvol gewijzigd naar ${newRole.toUpperCase()}.`, 'success');
    }
}

/**
 * Lid uit het team kicken/verwijderen.
 */
async function handleMemberKick() {
    const teamId = manageMemberTeamIdInput.value;
    const memberId = manageMemberIdInput.value;
    const username = manageMemberUsernameDisplayInput.value;

    if (!teamId || !memberId) return;

    if (!confirm(`Weet je zeker dat je lid ${username} wilt kicken uit het team?`)) {
        return;
    }

    const result = await apiCall(`/teams/${teamId}/members/${memberId}/detach`, 'DELETE');

    if (result) {
        await updateModalDataAndUI(teamId); 
        showNotification(`${username} succesvol gekickt uit het team.`, 'success');
    }
}


// ----------------------------------------------------
// ADMIN PANEEL FUNCTIES
// ----------------------------------------------------

/**
 * Functie om de gebruikerslijst in de modal weer te geven.
 */
function displayUserList(users) {
    adminUserList.innerHTML = '';
    document.getElementById('userCount').textContent = users.length;

    users.sort((a, b) => a.username.localeCompare(b.username)); // Sorteer op gebruikersnaam

    users.forEach(user => {
        const isSelf = user.id === currentUser.id;
        const userElement = document.createElement('div');
        userElement.className = 'p-3 bg-gray-700 hover:bg-gray-600 rounded-lg flex justify-between items-center cursor-pointer transition duration-150';
        userElement.setAttribute('data-user-id', user.id);

        userElement.innerHTML = `
            <div>
                <span class="font-bold">${user.username} ${isSelf ? '(Jij)' : ''}</span>
                <span class="text-sm text-yellow-400 ml-2">(${user.role.toUpperCase()})</span>
            </div>
        `;

        userElement.addEventListener('click', () => loadUserForManagement(user.id));
        adminUserList.appendChild(userElement);
    });
}

/**
 * Functie om de gebruikerslijst te filteren op zoekterm.
 */
function filterUserListBySearch() {
    const searchTerm = userSearchInput.value.toLowerCase().trim();
    if (!searchTerm) {
        displayUserList(userCache);
        return;
    }

    const filteredUsers = userCache.filter(user =>
        user.username.toLowerCase().includes(searchTerm)
    );
    displayUserList(filteredUsers);
}

/**
 * Functie om een specifieke gebruiker te laden voor beheer.
 */
async function loadUserForManagement(userId) {
    let user = userCache.find(u => u.id === userId);

    if (!user) {
        // Als de gebruiker niet gevonden is, ondanks dat de cache net ververst is door de caller, 
        // is er een ernstigere fout. Toon direct de fout.
        showNotification('Gebruiker niet gevonden in cache. De lijst is verouderd. Probeer de admin modal opnieuw te openen.', 'error');
        return;
    }


    // UI velden vullen
    managedUsernameDisplay.textContent = user.username;
    manageUserIdInput.value = user.id;
    manageUserIdPasswordInput.value = user.id;
    manageUsernameInput.value = user.username;
    manageEmailInput.value = user.email;
    manageRoleSelect.value = user.role;

    // Knoppen en velden inschakelen
    const isSelf = user.id === currentUser.id;

    // Je kunt je eigen rol niet wijzigen of jezelf verwijderen
    manageRoleSelect.disabled = isSelf;
    deleteUserBtn.disabled = isSelf;

    // Alle andere velden inschakelen
    manageUsernameInput.disabled = false;
    manageEmailInput.disabled = false;
    document.getElementById('updateUserBtn').disabled = false;

    // Wachtwoord velden inschakelen
    managePasswordInput.disabled = false;
    managePasswordConfirmInput.disabled = false;
    document.getElementById('updatePasswordBtn').disabled = false;

    // Visuele feedback voor de selectie 
    document.querySelectorAll('#adminUserList > div').forEach(el => {
        el.classList.remove('bg-gray-600', 'border-2', 'border-indigo-500');
    });
    const selectedEl = document.querySelector(`[data-user-id="${userId}"]`);
    if (selectedEl) {
        selectedEl.classList.add('bg-gray-600', 'border-2', 'border-indigo-500');
    }
}
window.loadUserForManagement = loadUserForManagement;

/**
 * Open de Admin Panel Modal.
 */
async function openAdminPanelModal() {

    // 1. Forceer een volledige refresh van de gebruikerslijst (incl. rollen/emails)
    // Dit zorgt ervoor dat userCache de meest recente data bevat.
    await fetchAllUsers();

    // 2. Werk de lokale currentUser bij met de verse rol uit de cache
    const adminUserInCache = userCache.find(u => u.id === currentUser.id);
    if (adminUserInCache && adminUserInCache.role) {
        currentUser.role = adminUserInCache.role;
        localStorage.setItem('currentUser', JSON.stringify(currentUser));
    }

    // 3. Voer de autorisatiecheck uit op de VERRRSE data.
    if (!currentUser || currentUser.role !== 'admin') {
        showNotification('Toegang geweigerd.', 'error');
        return;
    }

    // 4. Doorgaan met het openen van het paneel
    displayUserList(userCache);

    // Reset het beheer formulier
    managedUsernameDisplay.textContent = 'Selecteer een gebruiker';
    adminUserManagementForm.reset();
    adminUserPasswordForm.reset();

    // Alles uitschakelen tot een gebruiker is geselecteerd
    manageUsernameInput.disabled = true;
    manageEmailInput.disabled = true;
    manageRoleSelect.disabled = true;
    document.getElementById('updateUserBtn').disabled = true;
    deleteUserBtn.disabled = true;
    managePasswordInput.disabled = true;
    managePasswordConfirmInput.disabled = true;
    document.getElementById('updatePasswordBtn').disabled = true;

    adminPanelModal.classList.remove('hidden');
}
window.openAdminPanelModal = openAdminPanelModal;

/**
 * Gebruikersgegevens bijwerken (Naam/Email/Rol).
 */
async function handleUserUpdate(event) {
    event.preventDefault();
    const userId = manageUserIdInput.value;

    if (!userId) return;

    const data = {
        username: manageUsernameInput.value.trim(),
        email: manageEmailInput.value.trim(),
        role: manageRoleSelect.value,
    };

    const result = await apiCall(`/users/${userId}`, 'PUT', data);

    if (result) {
        showNotification(`Gebruiker ${data.username} succesvol bijgewerkt.`, 'success');

        await fetchAllUsers();

        displayUserList(userCache);

        await loadUserForManagement(parseInt(userId));

        if (currentUser.id == userId) {
            const updatedUser = userCache.find(u => u.id === parseInt(userId));
            if (updatedUser) {
                currentUser = updatedUser;
                localStorage.setItem('currentUser', JSON.stringify(currentUser));
                updateUI();
            }
        }
    }
}

/**
 * Gebruikerswachtwoord bijwerken.
 */
async function handlePasswordUpdate(event) {
    event.preventDefault();
    const userId = manageUserIdPasswordInput.value;
    const password = managePasswordInput.value;
    const passwordConfirm = managePasswordConfirmInput.value;

    if (!userId) return;

    if (password.length < 6) {
        showNotification('Wachtwoord moet minimaal 6 tekens lang zijn.', 'error');
        return;
    }

    if (password !== passwordConfirm) {
        showNotification('Wachtwoorden komen niet overeen.', 'error');
        return;
    }

    const data = {
        password: password,
        password_confirmation: passwordConfirm,
    };

    const result = await apiCall(`/users/${userId}`, 'PUT', data);

    if (result) {
        showNotification(`Wachtwoord voor gebruiker succesvol gewijzigd.`, 'success');
        adminUserPasswordForm.reset();
    }
}

/**
 * Gebruiker verwijderen.
 */
async function deleteUser() {
    const userId = manageUserIdInput.value;
    const username = managedUsernameDisplay.textContent;

    if (!userId || userId == currentUser.id) return;

    if (!confirm(`WEET U ZEKER dat u gebruiker "${username}" (ID: ${userId}) wilt verwijderen? Dit kan NIET ongedaan worden gemaakt.`)) {
        return;
    }

    const result = await apiCall(`/users/${userId}`, 'DELETE');

    if (result) {
        showNotification(`Gebruiker ${username} succesvol verwijderd.`, 'success');

        await fetchAllUsers();

        displayUserList(userCache);
        managedUsernameDisplay.textContent = 'Selecteer een gebruiker';
        adminUserManagementForm.reset();
        adminUserPasswordForm.reset();

        // Reset knoppen en velden
        manageUsernameInput.disabled = true;
        manageEmailInput.disabled = true;
        manageRoleSelect.disabled = true;
        document.getElementById('updateUserBtn').disabled = true;
        deleteUserBtn.disabled = true;
        managePasswordInput.disabled = true;
        managePasswordConfirmInput.disabled = true;
        document.getElementById('updatePasswordBtn').disabled = true;
    }
}


// ----------------------------------------------------
// MODAL FUNCTIES
// ----------------------------------------------------

function closeModal(modalId) {
    document.getElementById(modalId).classList.add('hidden');
}
window.closeModal = closeModal; 

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

async function updateTeam(event) {
    event.preventDefault();
    const teamId = document.getElementById('updateTeamId').value;

    const data = {
        team_name: document.getElementById('updateTeamName').value.trim(),
        description: document.getElementById('updateTeamDescription').value.trim(),
        flag_url: document.getElementById('updateTeamFlagUrl').value.trim(),
        capital_coords: document.getElementById('updateTeamCapitalCoords').value.trim(),
    };

    const result = await apiCall(`/teams/${teamId}`, 'PUT', data);

    if (result) {
        closeModal('teamManagementModal');
        await refreshDashboard();
    }
}

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

    const team = currentUser.teams.find(t => t.id == teamId);
    
    if (!confirm(`Weet u zeker dat u het leiderschap van dit team wilt overdragen aan ${newLeaderUsername}? U wordt dan Moderator.`)) {
        return;
    }

    // De attach route zal automatisch de rol van de oude leader naar 'mod' zetten als de nieuwe rol 'leader' is
    const result = await apiCall(`/teams/${teamId}/members/${newLeaderId}/attach`, 'POST', { role: 'leader' });

    if (result) {
        showNotification(`Leiderschap succesvol overgedragen aan ${newLeaderUsername}. U bent nu moderator.`, 'success');
        closeModal('teamManagementModal');
        await refreshDashboard();
    }
}


// ----------------------------------------------------
// UI FUNCTIES
// ----------------------------------------------------

function updateUI() {
    const isLoggedIn = !!apiToken && !!currentUser;
    const isAdmin = isLoggedIn && currentUser && currentUser.role === 'admin'; 

    loginBtn.classList.toggle('hidden', isLoggedIn);
    registerBtn.classList.toggle('hidden', isLoggedIn);
    logoutBtn.classList.toggle('hidden', !isLoggedIn);
    adminBtn.classList.toggle('hidden', !isAdmin); 
    
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

    // Team acties
    createTeamForm.addEventListener('submit', createTeam);
    manageMemberForm.addEventListener('submit', handleMemberManagement);
    updateTeamForm.addEventListener('submit', updateTeam);
    transferLeaderBtn.addEventListener('click', transferTeamLeadership);
    
    // Player Info
    managePlayerInfoForm.addEventListener('submit', handlePlayerInfoManagement);

    // Admin Knoppen
    adminBtn.addEventListener('click', openAdminPanelModal);
    adminUserManagementForm.addEventListener('submit', handleUserUpdate);
    deleteUserBtn.addEventListener('click', deleteUser);
    adminUserPasswordForm.addEventListener('submit', handlePasswordUpdate);
    userSearchInput.addEventListener('input', filterUserListBySearch);

    // Leden Beheer in Modal
    memberSearchInput.addEventListener('input', () => {
        const teamDataString = teamMembersModal.getAttribute('data-current-team');
        if (teamDataString) {
            const teamData = JSON.parse(teamDataString);
            displayMemberList(teamData, memberSearchInput.value);
        }
    });
    teamMemberManagementForm.addEventListener('submit', handleMemberRoleUpdate);
    kickMemberBtn.addEventListener('click', handleMemberKick);


    // Initialisatie bij laden van de pagina
    updateUI();
    if (apiToken && currentUser) {
        refreshDashboard();
    }
});