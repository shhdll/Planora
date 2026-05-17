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

    container.innerHTML = `
        <aside class="app-sidebar" aria-label="App navigation">
            <div class="mobile-only-header" style="padding: 16px; display: flex; justify-content: flex-end; border-bottom: 1px solid rgba(148, 163, 184, 0.15);">
                <button class="mobile-close-btn" style="background: none; border: none; font-size: 24px; cursor: pointer; color: #cbd5e1; padding: 8px;">✕</button>
            </div>
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
                <a href="#" class="app-nav__link">
                    <img src="images/logout-icon.png" alt="" style="width:16px; height:16px; vertical-align:-2px; margin-right:6px;">
                    Log out
                </a>
            </div>
        </aside>`;

    // Add mobile menu button if on mobile and it doesn't exist
    if (window.innerWidth <= 768) {
        addMobileMenuButton();
    }
    
    // Setup mobile menu functionality
    setupMobileMenu();
    
    // Highlight active page link
    document.querySelectorAll('.app-nav__link').forEach(link => {
        if (link.href === window.location.href) {
            link.setAttribute('aria-current', 'page');
        }
    });

    // Handle logout
    const logoutBtn = document.querySelector('.app-sidebar__footer a');
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

function addMobileMenuButton() {
    if (document.querySelector('.mobile-menu-btn')) return;
    
    const menuBtn = document.createElement('button');
    menuBtn.className = 'mobile-menu-btn';
    menuBtn.setAttribute('aria-label', 'Open menu');
    
    menuBtn.innerHTML = `
        <span></span>
        <span></span>
        <span></span>
    `;
    document.body.appendChild(menuBtn);
    console.log("Mobile menu button added");
    
    // Add overlay if it doesn't exist
    if (!document.querySelector('.sidebar-overlay')) {
        const overlay = document.createElement('div');
        overlay.className = 'sidebar-overlay';
        document.body.appendChild(overlay);
        console.log("Overlay added");
    }
}

function setupMobileMenu() {
    const sidebar = document.querySelector('.app-sidebar');
    const menuBtn = document.querySelector('.mobile-menu-btn');
    const overlay = document.querySelector('.sidebar-overlay');
    const closeBtn = document.querySelector('.mobile-close-btn');
    
    if (window.innerWidth > 768) {
        if (sidebar) sidebar.classList.remove('mobile-open');
        if (overlay) overlay.classList.remove('active');
        return;
    }
    
    if (!sidebar || !menuBtn) {
        setTimeout(setupMobileMenu, 100);
        return;
    }
    
    function openMenu(e) {
        if (e) e.preventDefault();
        console.log("Opening menu");
        sidebar.classList.add('mobile-open');
        const activeOverlay = document.querySelector('.sidebar-overlay');
        if (activeOverlay) activeOverlay.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
    
    function closeMenu() {
        console.log("Closing menu");
        sidebar.classList.remove('mobile-open');
        const activeOverlay = document.querySelector('.sidebar-overlay');
        if (activeOverlay) activeOverlay.classList.remove('active');
        document.body.style.overflow = '';
    }
    
    menuBtn.onclick = openMenu;
    
    if (closeBtn) closeBtn.onclick = closeMenu;
    if (overlay) overlay.onclick = closeMenu;
    
    // Close menu when clicking nav links
    document.querySelectorAll('.app-nav__link').forEach(link => {
        link.onclick = () => {
            setTimeout(closeMenu, 150);
        };
    });
    
    // Close on escape key
    document.onkeydown = (e) => {
        if (e.key === 'Escape' && sidebar.classList.contains('mobile-open')) {
            closeMenu();
        }
    };
}

// Handle window resize
let resizeTimer;
window.addEventListener('resize', function() {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(function() {
        const menuBtn = document.querySelector('.mobile-menu-btn');
        const overlay = document.querySelector('.sidebar-overlay');
        const sidebar = document.querySelector('.app-sidebar');
        
        if (window.innerWidth <= 768) {
            if (!menuBtn) {
                addMobileMenuButton();
            }
            setupMobileMenu();
        } else {
            if (menuBtn) menuBtn.remove();
            if (overlay) overlay.remove();
            if (sidebar) sidebar.classList.remove('mobile-open');
            document.body.style.overflow = '';
        }
    }, 250);
});

// Populate badges
async function addSidebarBadges() {
    if (typeof Utils !== 'undefined' && Utils.Session) {
        const user = Utils.Session.getUser();
        if (!user) return;
    }

    const firebaseUser = auth.currentUser;
    if (!firebaseUser) return;

    try {
        const coursesQuery = query(collection(db, "courses"), where("userId", "==", firebaseUser.uid));
        const coursesSnapshot = await getDocs(coursesQuery);
        const coursesCount = coursesSnapshot.size;

        const badge = document.getElementById('courses-badge');
        if (badge && coursesCount > 0) {
            badge.textContent = coursesCount;
            badge.style.display = 'inline-block';
        }


    } catch (error) {
        console.error("Error loading sidebar badges:", error);
    }
}

// Initialize
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadSidebar);
} else {
    loadSidebar();
}

export { loadSidebar, addSidebarBadges };