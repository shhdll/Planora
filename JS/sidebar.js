function loadSidebar() {
    const container = document.getElementById('sidebar-container');
    if (!container) return;

    // Sidebar HTML is embedded here instead of fetched so it works when
    // pages are opened directly from the filesystem (file:// blocks fetch)
    container.innerHTML = `
        <aside class="app-sidebar" aria-label="App navigation">
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
                <a href="index.html" class="app-nav__link app-nav__link--muted">Home</a>
                <a href="#" class="app-nav__link" onclick="handleLogout(); return false;">
                    <img src="images/logout-icon.png" alt="" style="width:16px; height:16px; vertical-align:-2px; margin-right:6px;">
                    Log out
                </a>
            </div>
        </aside>`;

    // Highlight the active page link
    document.querySelectorAll('.app-nav__link').forEach(link => {
        if (link.href === window.location.href) {
            link.setAttribute('aria-current', 'page');
        }
    });

    addSidebarBadges();
}

// Populate the badge and dot placeholders in the sidebar

function addSidebarBadges() {
    const user = Session.getUser();
    if (!user) return;

    // Course count badge — show only when the user has at least one course
    const courses = Storage.get(`courses_${user.id}`) || [];
    const badge = document.getElementById('courses-badge');
    if (badge && courses.length > 0) {
        badge.textContent = courses.length;
        badge.style.display = '';
    }

    // Availability dot — green if days are configured, muted gray if not
    const availability = Storage.get(`availability_${user.id}`);
    const isSet = availability && availability.days && availability.days.length > 0;
    const dot = document.getElementById('availability-dot');
    if (dot) {
        dot.className = `app-nav__dot ${isSet ? 'app-nav__dot--set' : 'app-nav__dot--unset'}`;
        dot.title = isSet ? 'Availability set' : 'Availability not set';
    }
}

loadSidebar();
