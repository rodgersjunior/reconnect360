// reconnect360 Frontend JavaScript - With Authentication

const API_BASE_URL = 'http://localhost:5000/api';
let authToken = localStorage.getItem('authToken');
let currentUser = null;

// Navigation functions
function showSection(sectionId) {
    // Hide all sections
    document.querySelectorAll('.section').forEach(section => {
        section.classList.remove('active');
    });
    
    // Show target section
    const section = document.getElementById(sectionId);
    if (section) {
        section.classList.add('active');
    }
}

function showHome() {
    updateNavigation();
    showSection('home');
}

function showLogin() {
    showSection('login');
}

function showMyProfile() {
    if (!currentUser) {
        alert('Please login first!');
        showLogin();
        return;
    }
    loadMyProfile();
    showSection('my-profile');
}

function showProfiles() {
    loadProfiles();
    showSection('profiles');
}

function switchAuthTab(tab) {
    // Hide all forms
    document.querySelectorAll('.auth-form').forEach(form => {
        form.classList.remove('active');
    });
    document.querySelectorAll('.auth-tab').forEach(t => {
        t.classList.remove('active');
    });
    
    // Show selected
    if (tab === 'login') {
        document.getElementById('loginForm').classList.add('active');
    } else {
        document.getElementById('signupForm').classList.add('active');
    }
    
    event.target.classList.add('active');
}

function updateNavigation() {
    if (authToken && currentUser) {
        // User is logged in
        document.getElementById('navAuth').style.display = 'none';
        document.getElementById('navProfiles').style.display = 'block';
        document.getElementById('navMyProfile').style.display = 'block';
        document.getElementById('navLogout').style.display = 'block';
        document.getElementById('homeBtn').textContent = 'Browse Profiles';
        document.getElementById('homeBtn').onclick = () => showProfiles();
    } else {
        // User is not logged in
        document.getElementById('navAuth').style.display = 'block';
        document.getElementById('navProfiles').style.display = 'none';
        document.getElementById('navMyProfile').style.display = 'none';
        document.getElementById('navLogout').style.display = 'none';
        document.getElementById('homeBtn').textContent = 'Get Started';
        document.getElementById('homeBtn').onclick = () => showLogin();
    }
}

// API Functions
async function fetchFromAPI(endpoint, method = 'GET', body = null, requireAuth = false) {
    try {
        const options = {
            method,
            headers: {
                'Content-Type': 'application/json'
            }
        };
        
        if (requireAuth && authToken) {
            options.headers['Authorization'] = `Bearer ${authToken}`;
        }
        
        if (body) {
            options.body = JSON.stringify(body);
        }
        
        const response = await fetch(`${API_BASE_URL}${endpoint}`, options);
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || 'API Error');
        }
        
        return data;
    } catch (error) {
        console.error('API Error:', error);
        return null;
    }
}

// Authentication Functions
async function login(username, password) {
    const result = await fetchFromAPI('/auth/login', 'POST', {
        username,
        password
    });
    
    if (result && result.token) {
        authToken = result.token;
        currentUser = result.user;
        localStorage.setItem('authToken', authToken);
        localStorage.setItem('currentUser', JSON.stringify(currentUser));
        
        showSuccessMessage('Logged in successfully!');
        updateNavigation();
        
        setTimeout(() => {
            showHome();
        }, 1000);
    } else {
        showErrorMessage(result?.error || 'Login failed');
    }
}

async function signup(username, email, password, name, profession, location, bio) {
    const result = await fetchFromAPI('/auth/signup', 'POST', {
        username,
        email,
        password,
        name,
        profession,
        location,
        bio
    });
    
    if (result && result.token) {
        authToken = result.token;
        currentUser = result.user;
        localStorage.setItem('authToken', authToken);
        localStorage.setItem('currentUser', JSON.stringify(currentUser));
        
        showSuccessMessage('Account created successfully!');
        updateNavigation();
        
        setTimeout(() => {
            showHome();
        }, 1000);
    } else {
        showErrorMessage(result?.error || 'Signup failed');
    }
}

async function logout() {
    if (authToken) {
        await fetchFromAPI('/auth/logout', 'POST', { token: authToken });
    }
    
    authToken = null;
    currentUser = null;
    localStorage.removeItem('authToken');
    localStorage.removeItem('currentUser');
    
    showSuccessMessage('Logged out successfully!');
    updateNavigation();
    showHome();
}

// Profile Functions
async function loadMyProfile() {
    if (!authToken || !currentUser) return;
    
    const user = await fetchFromAPI(`/users/${currentUser.user_id}`, 'GET', null, true);
    
    if (user) {
        const html = renderProfileCard(user, true);
        document.getElementById('myProfileContent').innerHTML = html;
    }
}

async function loadProfiles() {
    const result = await fetchFromAPI('/users');
    
    if (result && result.users) {
        if (result.users.length === 0) {
            document.getElementById('profilesList').innerHTML = '<p>No profiles yet. Be the first to create one!</p>';
            return;
        }
        
        let html = '';
        result.users.forEach(user => {
            html += renderProfileItem(user);
        });
        
        document.getElementById('profilesList').innerHTML = html;
    }
}

function renderProfileCard(user, isOwn = false) {
    const initials = user.name.split(' ').map(n => n[0]).join('').toUpperCase();
    
    let buttons = '';
    if (isOwn) {
        buttons = `
            <button class="btn btn-small" onclick="editProfile('${user.user_id}')">Edit Profile</button>
            <button class="btn btn-small" onclick="viewConnections('${user.user_id}')">View Connections</button>
        `;
    } else {
        buttons = `
            <button class="btn btn-small" onclick="connectUser('${user.user_id}')">Connect</button>
            <button class="btn btn-small" onclick="viewConnections('${user.user_id}')">View Connections</button>
        `;
    }
    
    return `
        <div class="profile-header">
            <div class="profile-avatar">${initials}</div>
            <div class="profile-info">
                <div class="profile-name">${user.name}</div>
                <div class="profile-username">@${user.username}</div>
                <div class="profile-profession">${user.profession}</div>
                <div class="profile-location">📍 ${user.location}</div>
            </div>
        </div>
        <div class="profile-details">
            <div class="profile-detail-row">
                <span class="profile-label">Email:</span>
                <span class="profile-value">${user.email}</span>
            </div>
            <div class="profile-detail-row">
                <span class="profile-label">Connections:</span>
                <span class="profile-value">${user.connections_count}</span>
            </div>
        </div>
        ${user.bio ? `<div class="profile-bio"><strong>About:</strong><br>${user.bio}</div>` : ''}
        ${buttons}
    `;
}

function renderProfileItem(user) {
    const initials = user.name.split(' ').map(n => n[0]).join('').toUpperCase();
    
    return `
        <div class="profile-item">
            <div class="profile-item-avatar">${initials}</div>
            <div class="profile-item-name">${user.name}</div>
            <div class="profile-item-username">@${user.username}</div>
            <div class="profile-item-profession">${user.profession}</div>
            <div class="profile-item-location">📍 ${user.location}</div>
            <button class="btn-view" onclick="viewProfile('${user.user_id}')">View Profile</button>
        </div>
    `;
}

function viewProfile(userId) {
    fetchFromAPI(`/users/${userId}`).then(user => {
        if (user) {
            const html = renderProfileCard(user, userId === currentUser?.user_id);
            document.getElementById('profileDetail').innerHTML = html;
            showSection('profile-detail');
        }
    });
}

function connectUser(userId) {
    if (!currentUser) {
        showErrorMessage('Please login to connect');
        return;
    }
    
    fetchFromAPI(`/users/${currentUser.user_id}/connect/${userId}`, 'POST', null, true).then(result => {
        if (result) {
            showSuccessMessage('Connected successfully!');
            loadMyProfile();
        }
    });
}

function editProfile(userId) {
    alert('Edit profile feature coming soon!');
}

function viewConnections(userId) {
    fetchFromAPI(`/users/${userId}/connections`).then(data => {
        if (data && data.connections) {
            let html = `<h3>${data.connections.length} Connections</h3>`;
            
            if (data.connections.length === 0) {
                html += '<p>No connections yet.</p>';
            } else {
                html += '<div class="profiles-grid">';
                data.connections.forEach(conn => {
                    html += renderProfileItem(conn);
                });
                html += '</div>';
            }
            
            document.getElementById('profileDetail').innerHTML = html;
            showSection('profile-detail');
        }
    });
}

// Form Handling
document.addEventListener('DOMContentLoaded', () => {
    console.log('App loaded');
    
    // Check for saved auth token
    if (authToken) {
        currentUser = JSON.parse(localStorage.getItem('currentUser'));
    }
    
    updateNavigation();
    
    // Login Form submission
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
            const username = document.getElementById('login-username').value;
            const password = document.getElementById('login-password').value;
            
            login(username, password);
        });
    }
    
    // Signup Form submission
    const signupForm = document.getElementById('signupForm');
    if (signupForm) {
        signupForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
            const username = document.getElementById('signup-username').value;
            const email = document.getElementById('signup-email').value;
            const password = document.getElementById('signup-password').value;
            const name = document.getElementById('signup-name').value;
            const profession = document.getElementById('signup-profession').value;
            const location = document.getElementById('signup-location').value;
            const bio = document.getElementById('signup-bio').value;
            
            signup(username, email, password, name, profession, location, bio);
        });
    }
});

// Message Functions
function showSuccessMessage(message) {
    const msg = document.createElement('div');
    msg.className = 'success-message';
    msg.textContent = message;
    document.body.insertBefore(msg, document.querySelector('main'));
    setTimeout(() => msg.remove(), 3000);
}

function showErrorMessage(message) {
    const msg = document.createElement('div');
    msg.className = 'error-message';
    msg.textContent = message;
    document.body.insertBefore(msg, document.querySelector('main'));
    setTimeout(() => msg.remove(), 3000);
}
