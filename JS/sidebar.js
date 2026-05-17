// Import Firebase
import { db, auth } from './firebase-config.js';
import {
    collection,
    query,
    where,
    getDocs,
    doc,
    getDoc
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

function loadSidebar() {
    const container = document.getElementById('sidebar-container');
    if (!container) {
        console.error("Sidebar container not found");
        return;
    }

    // Sidebar HTML — FIXED: Removed the availability dot span placeholder completely
    container.innerHTML = `
        <aside class="app-sidebar" aria-label="App navigation">
            <a href="index.html" class="app-brand">
                <img src="images/planora_logo.png" alt="Planora Logo" class="app-brand-logo">
            </a>
            <nav class="app-nav">
                <a href="dashboard.html" class="app-nav__link">Dashboard</a>
                <a href="courses.html" class="app-nav__link">Courses <span id="courses-badge" class="app-nav__badge" style="display:none"></span></a>
                <a href="deadlines.html" class="app-nav__link">Deadlines</a>
                <a href="availability.html" class="app-nav__link">Availability</a>
                <a href="study-plan.html" class="app-nav__link">Study plan</a>
                <a href="statistics.html" class="app-nav__link">Statistics</a>
            </nav>
            <div class="app-sidebar__footer">
                <a href="#" class="app-nav__link" onclick="handleLogout(); return false;">
                    <img src="images/logout-icon.png" alt="" style="width:16px; height:16px; vertical-align:-2px; margin-right:6px;">
                    Log out
                </a>
            </div>
        </aside>`;

    // ONLY add mobile elements if we're on mobile AND they don't exist yet
    if (window.innerWidth <= 768 && !document.querySelector('.mobile-menu-btn')) {
        addMobileElements();
    }
    
    // Setup mobile functionality
    setupMobileMenu();
    
    // Highlight the active page link
    document.querySelectorAll('.app-nav__link').forEach(link => {
        if (link.href === window.location.href) {
            link.setAttribute('aria-current', 'page');
        }
    });

    // Handle logout
    const logoutBtn = document.querySelector('#logout-btn, .app-sidebar__footer a');
    if (logoutBtn && !logoutBtn.hasListener) {
        logoutBtn.hasListener = true;
        logoutBtn.addEventListener('click', async (e) => {
            e.preventDefault();
            try {
                const { signOut } = await import("https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js");
                await signOut(auth);
                localStorage.removeItem('currentUser');
                window.location.href = 'login.html';
            } catch (error) {
                console.error("Logout failed:", error);
            }
        });
    }

    // Call async badge function
    addSidebarBadges();
}

function addMobileElements() {
    // Add mobile menu button
    const menuBtn = document.createElement('button');
    menuBtn.className = 'mobile-menu-btn';
    menuBtn.setAttribute('aria-label', 'Open menu');
    
    // FIXED: Keeps your 3-line vector structure for high-contrast mobile support
    menuBtn.innerHTML = `
        <span></span>
        <span></span>
        <span></span>
    `;
    
    // Insert at the beginning of the body or before the sidebar container
    const sidebarContainer = document.getElementById('sidebar-container');
    if (sidebarContainer) {
        sidebarContainer.insertAdjacentElement('beforebegin', menuBtn);
    } else {
        document.body.insertBefore(menuBtn, document.body.firstChild);
    }
    
    // Add overlay if it doesn't exist
    if (!document.querySelector('.sidebar-overlay')) {
        const overlay = document.createElement('div');
        overlay.className = 'sidebar-overlay';
        document.body.appendChild(overlay);
    }
    
    // Add close button inside sidebar (only on mobile)
    const sidebar = document.querySelector('.app-sidebar');
    if (sidebar && !sidebar.querySelector('.mobile-close-btn')) {
        const closeDiv = document.createElement('div');
        closeDiv.className = 'mobile-only-header'; // Binds cleanly to your stylesheet custom media targets
        closeDiv.style.padding = '16px';
        closeDiv.style.display = 'flex';
        closeDiv.style.justifyContent = 'flex-end';
        closeDiv.style.borderBottom = '1px solid rgba(148, 163, 184, 0.15)';
        closeDiv.innerHTML = '<button class="mobile-close-btn" style="background: none; border: none; font-size: 24px; cursor: pointer; color: #cbd5e1; padding: 8px;">✕</button>';
        sidebar.insertBefore(closeDiv, sidebar.firstChild);
    }
}

function setupMobileMenu() {
    const sidebar = document.querySelector('.app-sidebar');
    const menuBtn = document.querySelector('.mobile-menu-btn');
    const overlay = document.querySelector('.sidebar-overlay');
    const closeBtn = document.querySelector('.mobile-close-btn');
    
    // Only proceed if we're on mobile
    if (window.innerWidth > 768) {
        if (sidebar && sidebar.classList.contains('mobile-open')) {
            sidebar.classList.remove('mobile-open');
        }
        if (overlay && overlay.classList.contains('active')) {
            overlay.classList.remove('active');
        }
        return;
    }
    
    if (!sidebar || !menuBtn) return;
    
    function openMenu() {
        sidebar.classList.add('mobile-open');
        if (overlay) overlay.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
    
    function closeMenu() {
        sidebar.classList.remove('mobile-open');
        if (overlay) overlay.classList.remove('active');
        document.body.style.overflow = '';
    }
    
    // Remove existing listeners to prevent duplicates
    menuBtn.removeEventListener('click', openMenu);
    menuBtn.addEventListener('click', openMenu);
    
    if (closeBtn) {
        closeBtn.removeEventListener('click', closeMenu);
        closeBtn.addEventListener('click', closeMenu);
    }
    
    if (overlay) {
        overlay.removeEventListener('click', closeMenu);
        overlay.addEventListener('click', closeMenu);
    }
    
    // Close menu when clicking nav links
    document.querySelectorAll('.app-nav__link').forEach(link => {
        link.removeEventListener('click', closeMenu);
        link.addEventListener('click', () => {
            setTimeout(closeMenu, 150);
        });
    });
    
    // Close on escape key
    const escapeHandler = (e) => {
        if (e.key === 'Escape' && sidebar.classList.contains('mobile-open')) {
            closeMenu();
        }
    };
    document.removeEventListener('keydown', escapeHandler);
    document.addEventListener('keydown', escapeHandler);
}

// Handle window resize to add/remove mobile elements as needed
function handleResize() {
    const menuBtn = document.querySelector('.mobile-menu-btn');
    const overlay = document.querySelector('.sidebar-overlay');
    const sidebar = document.querySelector('.app-sidebar');
    
    if (window.innerWidth <= 768) {
        if (!menuBtn) {
            addMobileElements();
        }
        setupMobileMenu();
    } else {
        if (menuBtn) menuBtn.remove();
        if (overlay) overlay.remove();
        
        const closeBtn = document.querySelector('.mobile-close-btn');
        const closeDiv = closeBtn?.parentElement;
        if (closeDiv) closeDiv.remove();
        
        if (sidebar) {
            sidebar.classList.remove('mobile-open');
            sidebar.style.transform = '';
            sidebar.style.left = '';
        }
        
        document.body.style.overflow = '';
    }
}

// Populate the badge and dot placeholders in the sidebar
async function addSidebarBadges() {
    if (typeof Utils !== 'undefined' && Utils.Session) {
        const user = Utils.Session.getUser();
        if (!user) return;
    }

    const firebaseUser = auth.currentUser;
    if (!firebaseUser) return;

    try {
        // Course count badge
        const coursesQuery = query(collection(db, "courses"), where("userId", "==", firebaseUser.uid));
        const coursesSnapshot = await getDocs(coursesQuery);
        const coursesCount = coursesSnapshot.size;

        const badge = document.getElementById('courses-badge');
        if (badge && coursesCount > 0) {
            badge.textContent = coursesCount;
            badge.style.display = 'inline-block';
        }

        // FIXED: Cleaned out the availability dot Firestore fetches completely 
        // to stay synchronized with your UI layout specifications.

    } catch (error) {
        console.error("Error loading sidebar badges:", error);
    }
}

// Listen for resize events
window.addEventListener('resize', handleResize);

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadSidebar);
} else {
    loadSidebar();
}

export { loadSidebar, addSidebarBadges };