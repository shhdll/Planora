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

    // Add mobile menu button to the page if it doesn't exist
    if (!document.querySelector('.mobile-menu-btn')) {
        const menuBtn = document.createElement('button');
        menuBtn.className = 'mobile-menu-btn';
        menuBtn.innerHTML = '☰ Menu';
        menuBtn.setAttribute('aria-label', 'Toggle navigation menu');
        document.body.insertBefore(menuBtn, document.body.firstChild);
        
        // Create overlay
        const overlay = document.createElement('div');
        overlay.className = 'sidebar-overlay';
        document.body.appendChild(overlay);
    }

    // Sidebar HTML - Fixed version with proper brand link
    container.innerHTML = `
        <aside class="app-sidebar" aria-label="App navigation">
            <div style="display: flex; justify-content: flex-end; padding: 12px;">
                <button class="mobile-close-btn" style="background: none; border: none; font-size: 24px; cursor: pointer; display: none;">&times;</button>
            </div>
            <a href="index.html" class="app-brand">
                <img src="images/planora_logo.png" alt="Planora Logo" class="app-brand-logo">
            </a>
            <nav class="app-nav">
                <a href="dashboard.html" class="app-nav__link">Dashboard</a>
                <a href="courses.html" class="app-nav__link">Courses <span id="courses-badge" class="app-nav__badge" style="display:none"></span></a>
                <a href="deadlines.html" class="app-nav__link">Deadlines</a>
                <a href="availability.html" class="app-nav__link">Availability <span id="availability-dot" class="app-nav__dot app-nav__dot--unset" title="Availability not set"></span></a>
                <a href="study-plan.html" class="app-nav__link">Study plan</a>
                <a href="statistics.html" class="app-nav__link">Statistics</a>
            </nav>
            <div class="app-sidebar__footer">
                <a href="#" class="app-nav__link" id="logout-btn">
                    <img src="images/logout-icon.png" alt="" style="width:16px; height:16px; vertical-align:-2px; margin-right:6px;">
                    Log out
                </a>
            </div>
        </aside>`;

    // Get sidebar elements
    const sidebar = document.querySelector('.app-sidebar');
    const menuBtn = document.querySelector('.mobile-menu-btn');
    const overlay = document.querySelector('.sidebar-overlay');
    const closeBtn = document.querySelector('.mobile-close-btn');

    // Mobile menu functions
    function openMobileMenu() {
        if (sidebar && window.innerWidth < 768) {
            sidebar.classList.add('open');
            if (overlay) overlay.classList.add('active');
            document.body.style.overflow = 'hidden';
        }
    }

    function closeMobileMenu() {
        if (sidebar) {
            sidebar.classList.remove('open');
            if (overlay) overlay.classList.remove('active');
            document.body.style.overflow = '';
        }
    }

    // Event listeners for mobile menu
    if (menuBtn) {
        menuBtn.addEventListener('click', openMobileMenu);
    }

    if (overlay) {
        overlay.addEventListener('click', closeMobileMenu);
    }

    if (closeBtn) {
        closeBtn.addEventListener('click', closeMobileMenu);
        // Show close button only on mobile
        if (window.innerWidth < 768) {
            closeBtn.style.display = 'block';
        }
    }

    // Close menu on window resize if moving from mobile to desktop
    window.addEventListener('resize', () => {
        if (window.innerWidth >= 768) {
            closeMobileMenu();
            if (closeBtn) closeBtn.style.display = 'none';
            if (sidebar) sidebar.classList.remove('open');
        } else {
            if (closeBtn) closeBtn.style.display = 'block';
        }
    });

    // Close menu when clicking a nav link (on mobile)
    document.querySelectorAll('.app-nav__link').forEach(link => {
        link.addEventListener('click', (e) => {
            if (window.innerWidth < 768) {
                // Don't close immediately to allow navigation
                setTimeout(closeMobileMenu, 100);
            }
        });
    });

    // Highlight the active page link
    document.querySelectorAll('.app-nav__link').forEach(link => {
        if (link.href === window.location.href) {
            link.setAttribute('aria-current', 'page');
        }
    });

    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
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

// Populate the badge and dot placeholders in the sidebar
async function addSidebarBadges() {
    const user = Utils.Session.getUser()
    if (!user) return;

    // Get current Firebase user for UID
    const firebaseUser = auth.currentUser;
    if (!firebaseUser) return;

    try {
        // Course count badge - load from Firestore
        const coursesQuery = query(collection(db, "courses"), where("userId", "==", firebaseUser.uid));
        const coursesSnapshot = await getDocs(coursesQuery);
        const coursesCount = coursesSnapshot.size;

        const badge = document.getElementById('courses-badge');
        if (badge && coursesCount > 0) {
            badge.textContent = coursesCount;
            badge.style.display = 'inline-block';
        }

        // Availability dot — load from Firestore
        const availabilityRef = doc(db, "availability", firebaseUser.uid);
        const availabilitySnap = await getDoc(availabilityRef);

        let isSet = false;
        if (availabilitySnap.exists()) {
            const availability = availabilitySnap.data();
            isSet = availability.days && availability.days.length > 0;
        }

        const dot = document.getElementById('availability-dot');
        if (dot) {
            dot.className = `app-nav__dot ${isSet ? 'app-nav__dot--set' : 'app-nav__dot--unset'}`;
            dot.title = isSet ? 'Availability set' : 'Availability not set';
        }
    } catch (error) {
        console.error("Error loading sidebar badges:", error);
    }
}

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadSidebar);
} else {
    loadSidebar();
}

export { loadSidebar, addSidebarBadges };