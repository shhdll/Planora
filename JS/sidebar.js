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
    if (!container) return;

    container.innerHTML = `
        <aside class="app-sidebar" aria-label="App navigation">
            <a href="index.html" class="app-brand">
                <img src="images/planora_logo.png" alt="Planora Logo" class="app-brand-logo">
            </a>
            <nav class="app-nav">
                <a href="dashboard.html" class="app-nav__link">Dashboard</a>
                <a href="courses.html" class="app-nav__link">Courses</a>
                <a href="deadlines.html" class="app-nav__link">Deadlines</a>
                <a href="availability.html" class="app-nav__link">Availability</a>
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

    // Highlight active page
    document.querySelectorAll('.app-nav__link').forEach(link => {
        if (link.href === window.location.href) {
            link.setAttribute('aria-current', 'page');
        }
    });

    // Logout
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

    addSidebarBadges();
}

async function addSidebarBadges() {
    const firebaseUser = auth.currentUser;
    if (!firebaseUser) return;

    try {
        const coursesSnapshot = await getDocs(
            query(collection(db, "courses"), where("userId", "==", firebaseUser.uid))
        );

        const badge = document.getElementById('courses-badge');
        if (badge && coursesSnapshot.size > 0) {
            badge.textContent = coursesSnapshot.size;
            badge.style.display = 'inline-block';
        }

        const availabilitySnap = await getDoc(doc(db, "availability", firebaseUser.uid));
        let isSet = false;
        if (availabilitySnap.exists()) {
            const data = availabilitySnap.data();
            isSet = data.slots && data.slots.length > 0;
        }

        const dot = document.getElementById('availability-dot');
        if (dot) {
            dot.className = `app-nav__dot ${isSet ? 'app-nav__dot--set' : 'app-nav__dot--unset'}`;
        }
    } catch (error) {
        console.error("Error loading sidebar badges:", error);
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadSidebar);
} else {
    loadSidebar();
}

export { loadSidebar, addSidebarBadges };