// reconnect360 Frontend JavaScript

console.log('reconnect360 app loaded');

// API base URL
const API_BASE_URL = 'http://localhost:5000/api';

// Fetch data from backend
async function fetchFromAPI(endpoint) {
    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`);
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error fetching from API:', error);
    }
}

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, initializing app...');
    
    // Check backend health
    fetchFromAPI('/health').then(data => {
        console.log('Backend status:', data);
    });
});

// Navigation
document.querySelectorAll('.navbar a').forEach(link => {
    link.addEventListener('click', (e) => {
        e.preventDefault();
        const sectionId = link.getAttribute('href').substring(1);
        console.log('Navigating to:', sectionId);
    });
});

// Get Started button
document.querySelector('.btn')?.addEventListener('click', () => {
    alert('Feature coming soon! Start building your network.');
});
