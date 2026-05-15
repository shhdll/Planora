function loadTopbar() {
    fetch('topbar.html')
        .then(res => res.text())
        .then(html => {
            document.getElementById('topbar-container').innerHTML = html;
            initTopbar();
        });
}

function initTopbar() {
    const user = Session.getUser();
    if (!user) return;

    // Set page title based on current page
    const titles = {
        'dashboard.html': 'Dashboard',
        'courses.html': 'Courses',
        'deadlines.html': 'Deadlines',
        'availability.html': 'Availability',
        'study-plan.html': 'Study Plan',
        'statistics.html': 'Statistics',
    };
    const page = window.location.pathname.split('/').pop();
    

    // Set user info
    const initials = user.name
        ? user.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
        : '?';

    document.getElementById('topbar-avatar').textContent = initials;
    document.getElementById('dropdown-avatar').textContent = initials;
    document.getElementById('topbar-name').textContent = user.name || 'User';
    document.getElementById('dropdown-name').textContent = user.name || 'User';
    document.getElementById('dropdown-email').textContent = user.email || '';

    // Toggle profile dropdown
    const profileBtn = document.getElementById('profile-btn');
    const profileDropdown = document.getElementById('profile-dropdown');
    const notifBtn = document.getElementById('notif-btn');
    const notifDropdown = document.getElementById('notif-dropdown');

    profileBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        profileDropdown.classList.toggle('open');
        notifDropdown.classList.remove('open');
    });

    notifBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        notifDropdown.classList.toggle('open');
        profileDropdown.classList.remove('open');
    });

    // Close dropdowns when clicking outside
    document.addEventListener('click', () => {
        profileDropdown.classList.remove('open');
        notifDropdown.classList.remove('open');
    });
}

loadTopbar();