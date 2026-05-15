// Import Firebase (for auth state)
import { auth } from './firebase-config.js';
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

function loadTopbar() {
    fetch('topbar.html')
        .then(res => res.text())
        .then(html => {
            document.getElementById('topbar-container').innerHTML = html;
            initTopbar();
        })
        .catch(error => {
            console.error("Error loading topbar:", error);
        });
}

function updateUIWithUserData(user) {
    if (!user) return;

    // Calculate initials safely
    const initials = user.name
        ? user.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
        : user.email ? user.email[0].toUpperCase() : '?';

    const avatarElement = document.getElementById('topbar-avatar');
    const dropdownAvatarElement = document.getElementById('dropdown-avatar');
    const nameElement = document.getElementById('topbar-name');
    const dropdownNameElement = document.getElementById('dropdown-name');
    const emailElement = document.getElementById('dropdown-email');

    const displayName = user.name || user.email?.split('@')[0] || 'User';

    if (avatarElement) avatarElement.textContent = initials;
    if (dropdownAvatarElement) dropdownAvatarElement.textContent = initials;
    if (nameElement) nameElement.textContent = displayName;
    if (dropdownNameElement) dropdownNameElement.textContent = displayName;
    if (emailElement) emailElement.textContent = user.email || '';
}

function initTopbar() {
    // 1. Set page title based on current page string mapping
    const titles = {
        'dashboard.html': 'Dashboard',
        'courses.html': 'Courses',
        'deadlines.html': 'Deadlines',
        'availability.html': 'Availability',
        'study-plan.html': 'Study Plan',
        'statistics.html': 'Statistics',
        'about-us.html': 'About Us',
        'add-course.html': 'Add Course',
        'edit-course.html': 'Edit Course',
        'remove-course.html': 'Remove Course'
    };
    const page = window.location.pathname.split('/').pop();
    const pageTitle = titles[page] || 'Planora';
    
    const pageTitleElement = document.getElementById('topbar-page-title');
    if (pageTitleElement) {
        pageTitleElement.textContent = pageTitle;
    }

    // 2. Fallback: Populate layout instantly if a baseline local session exists
    const sessionUser = typeof Session !== 'undefined' ? Session.getUser() : null;
    if (sessionUser) {
        updateUIWithUserData(sessionUser);
    }

    // 3. Dropdown click management setup
    const profileBtn = document.getElementById('profile-btn');
    const profileDropdown = document.getElementById('profile-dropdown');
    const notifBtn = document.getElementById('notif-btn');
    const notifDropdown = document.getElementById('notif-dropdown');

    if (profileBtn && profileDropdown) {
        profileBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            profileDropdown.classList.toggle('open');
            if (notifDropdown) notifDropdown.classList.remove('open');
        });
    }

    if (notifBtn && notifDropdown) {
        notifBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            notifDropdown.classList.toggle('open');
            if (profileDropdown) profileDropdown.classList.remove('open');
        });
    }

    // Dismiss active elements if click lands outside dropdown ecosystems
    document.addEventListener('click', () => {
        if (profileDropdown) profileDropdown.classList.remove('open');
        if (notifDropdown) notifDropdown.classList.remove('open');
    });
    
    // Prevent closing when interacting inside the panels themselves
    if (profileDropdown) profileDropdown.addEventListener('click', (e) => e.stopPropagation());
    if (notifDropdown) notifDropdown.addEventListener('click', (e) => e.stopPropagation());

    // 4. Hook real-time listener from Firebase for authoritative state changes
    onAuthStateChanged(auth, (firebaseUser) => {
        if (firebaseUser) {
            const mappedUser = {
                name: firebaseUser.displayName,
                email: firebaseUser.email
            };
            updateUIWithUserData(mappedUser);
        }
    });
}

// Global invocation setup
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadTopbar);
} else {
    loadTopbar();
}