function loadSidebar() {
    fetch('sidebar.html')
        .then(res => res.text())
        .then(html => {
            document.getElementById('sidebar-container').innerHTML = html;

            // highlight the current page link
            const links = document.querySelectorAll('.app-nav__link');
            links.forEach(link => {
                if (link.href === window.location.href) {
                    link.setAttribute('aria-current', 'page');
                }
            });
        });
}

loadSidebar();