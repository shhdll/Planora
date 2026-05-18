import { auth, db } from "./firebase-config.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { collection, query, where, getDocs } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

function loadTopbar() {
  fetch("topbar.html")
    .then((res) => res.text())
    .then((html) => {
      document.getElementById("topbar-container").innerHTML = html;
      initTopbar();
    })
    .catch((error) => {
      console.error("Error loading topbar:", error);
    });
}

function updateUIWithUserData(user) {
  if (!user) return;

  const initials = user.name
    ? user.name
        .split(" ")
        .map((w) => w[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : user.email
      ? user.email[0].toUpperCase()
      : "?";

  const avatarElement = document.getElementById("topbar-avatar");
  const dropdownAvatarElement = document.getElementById("dropdown-avatar");
  const nameElement = document.getElementById("topbar-name");
  const dropdownNameElement = document.getElementById("dropdown-name");
  const emailElement = document.getElementById("dropdown-email");

  const displayName = user.name || user.email?.split("@")[0] || "User";

  if (avatarElement) avatarElement.textContent = initials;
  if (dropdownAvatarElement) dropdownAvatarElement.textContent = initials;
  if (nameElement) nameElement.textContent = displayName;
  if (dropdownNameElement) dropdownNameElement.textContent = displayName;
  if (emailElement) emailElement.textContent = user.email || "";
}

// NOTIFICATIONS
const DISMISSED_KEY = "planora_dismissed_notifs";
const SEEN_KEY = "planora_seen_notifs";

function getDismissed() {
  return JSON.parse(localStorage.getItem(DISMISSED_KEY) || "[]");
}

function getSeen() {
  return JSON.parse(localStorage.getItem(SEEN_KEY) || "[]");
}

function markAllSeen(ids) {
  const seen = getSeen();
  ids.forEach((id) => {
    if (!seen.includes(id)) seen.push(id);
  });
  localStorage.setItem(SEEN_KEY, JSON.stringify(seen));
}

function dismiss(id) {
  const dismissed = getDismissed();
  if (!dismissed.includes(id)) {
    dismissed.push(id);
    localStorage.setItem(DISMISSED_KEY, JSON.stringify(dismissed));
  }
}

function dismissAll(ids) {
  const dismissed = getDismissed();
  ids.forEach((id) => {
    if (!dismissed.includes(id)) dismissed.push(id);
  });
  localStorage.setItem(DISMISSED_KEY, JSON.stringify(dismissed));
}

function toLocalDateStr(date) {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
}

function fmtTime(t) {
  if (!t) return "";
  const [h, min] = t.split(":");
  const hour = parseInt(h, 10);
  return `${hour % 12 || 12}:${min} ${hour >= 12 ? "PM" : "AM"}`;
}

function timeUntil(date) {
  const diff = date - new Date();
  const h = Math.floor(diff / (1000 * 60 * 60));
  const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  if (h <= 0 && m <= 0) return "now";
  if (h === 0) return `in ${m}m`;
  if (m === 0) return `in ${h}h`;
  return `in ${h}h ${m}m`;
}

async function loadNotifications(firebaseUser) {
  const now = new Date();
  const in24h = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const todayStr = toLocalDateStr(now);
  const tomorrowStr = toLocalDateStr(new Date(now.getTime() + 24 * 60 * 60 * 1000));

  const notifications = [];

  // Deadlines due within the next 24 hours
  try {
    const dlSnap = await getDocs(
      query(collection(db, "deadlines"), where("userId", "==", firebaseUser.uid), where("completed", "==", false)),
    );
    dlSnap.forEach((d) => {
      const data = { id: d.id, ...d.data() };
      const due = new Date(data.dueDate);
      if (due > now && due <= in24h) {
        notifications.push({
          id: `dl_${data.id}`,
          type: "deadline",
          title: data.title,
          sub: data.course,
          time: due,
          label: `Due ${timeUntil(due)}`,
        });
      }
    });
  } catch (e) {
    console.error("Notif deadlines error", e);
  }

  // Study sessions starting within the next 24 hours
  try {
    const ssSnap = await getDocs(
      query(collection(db, "studyPlans"), where("userId", "==", firebaseUser.uid), where("status", "==", "pending")),
    );
    ssSnap.forEach((s) => {
      const data = { id: s.id, ...s.data() };
      if (data.studyDate !== todayStr && data.studyDate !== tomorrowStr) return;
      const sessionStart = new Date(`${data.studyDate}T${data.startTime}`);
      if (sessionStart > now && sessionStart <= in24h) {
        notifications.push({
          id: `ss_${data.id}`,
          type: "session",
          title: data.course,
          sub: `${fmtTime(data.startTime)} – ${fmtTime(data.endTime)}`,
          time: sessionStart,
          label: `Starts ${timeUntil(sessionStart)}`,
        });
      }
    });
  } catch (e) {
    console.error("Notif sessions error", e);
  }

  // Sort soonest first
  notifications.sort((a, b) => a.time - b.time);

  renderNotifications(notifications);
}

function renderNotifications(notifications) {
  const list = document.getElementById("notif-list");
  const badge = document.getElementById("notif-badge");
  const dismissAllBtn = document.getElementById("notif-dismiss-all");
  if (!list) return;

  const dismissed = getDismissed();
  const seen = getSeen();
  const visible = notifications.filter((n) => !dismissed.includes(n.id));
  const hasUnseen = visible.some((n) => !seen.includes(n.id));

  // Red dot only for unseen (friend's feature)
  if (badge) badge.style.display = hasUnseen ? "block" : "none";
  if (dismissAllBtn) dismissAllBtn.style.display = visible.length > 0 ? "block" : "none";

  if (!visible.length) {
    list.innerHTML = `<p class="topbar-dropdown__empty">No new notifications</p>`;
    return;
  }

  list.innerHTML = visible
    .map(
      (n) => `
        <div class="notif-item notif-item--${n.type}" data-id="${n.id}">
            <div class="notif-item__icon">
                ${n.type === "deadline" ? `<i class="ti ti-calendar-due"></i>` : `<i class="ti ti-clock"></i>`}
            </div>
            <div class="notif-item__body">
                <div class="notif-item__title">${n.title}</div>
                <div class="notif-item__sub">${n.sub}</div>
                <div class="notif-item__label">${n.label}</div>
            </div>
            <button class="notif-item__dismiss" data-id="${n.id}" aria-label="Dismiss">✕</button>
        </div>
    `,
    )
    .join("");

  // Individual dismiss
  list.querySelectorAll(".notif-item__dismiss").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      dismiss(btn.dataset.id);
      renderNotifications(notifications);
    });
  });

  // Dismiss all
  if (dismissAllBtn) {
    dismissAllBtn.onclick = (e) => {
      e.stopPropagation();
      dismissAll(notifications.map((n) => n.id));
      renderNotifications(notifications);
    };
  }
}

// MOBILE SIDEBAR
function setupMobileSidebar() {
  // Create overlay
  let overlay = document.getElementById("sidebar-overlay");
  if (!overlay) {
    overlay = document.createElement("div");
    overlay.id = "sidebar-overlay";
    overlay.className = "sidebar-overlay";
    document.body.appendChild(overlay);
  }

  const menuBtn = document.getElementById("mobile-menu-btn");

  if (menuBtn) {
    menuBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      const sidebar = document.querySelector(".app-sidebar");
      if (!sidebar) return;
      sidebar.classList.toggle("mobile-open");
      overlay.classList.toggle("active");
      document.body.style.overflow = sidebar.classList.contains("mobile-open") ? "hidden" : "";
    });
  }

  overlay.addEventListener("click", () => {
    const sidebar = document.querySelector(".app-sidebar");
    if (sidebar) sidebar.classList.remove("mobile-open");
    overlay.classList.remove("active");
    document.body.style.overflow = "";
  });

  // Close sidebar when nav link clicked on mobile
  document.addEventListener("click", (e) => {
    if (e.target.closest(".app-nav__link") && window.innerWidth <= 768) {
      const sidebar = document.querySelector(".app-sidebar");
      if (sidebar) sidebar.classList.remove("mobile-open");
      overlay.classList.remove("active");
      document.body.style.overflow = "";
    }
  });
}

// INIT
function initTopbar() {
  const titles = {
    "dashboard.html": "Dashboard",
    "courses.html": "Courses",
    "deadlines.html": "Deadlines",
    "availability.html": "Availability",
    "study-plan.html": "Study Plan",
    "statistics.html": "Statistics",
    "about-us.html": "About Us",
    "add-course.html": "Add Course",
    "edit-course.html": "Edit Course",
    "remove-course.html": "Remove Course",
  };

  const page = window.location.pathname.split("/").pop();
  const pageTitleElement = document.getElementById("topbar-page-title");
  if (pageTitleElement) pageTitleElement.textContent = titles[page] || "Planora";

  const sessionUser = typeof Session !== "undefined" ? Session.getUser() : null;
  if (sessionUser) updateUIWithUserData(sessionUser);

  const profileBtn = document.getElementById("profile-btn");
  const profileDropdown = document.getElementById("profile-dropdown");
  const notifBtn = document.getElementById("notif-btn");
  const notifDropdown = document.getElementById("notif-dropdown");
  const badge = document.getElementById("notif-badge");

  if (profileBtn && profileDropdown) {
    profileBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      profileDropdown.classList.toggle("open");
      if (notifDropdown) notifDropdown.classList.remove("open");
    });
  }

  if (notifBtn && notifDropdown) {
    notifBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      notifDropdown.classList.toggle("open");
      if (profileDropdown) profileDropdown.classList.remove("open");

      // Mark notifications as seen when dropdown opens (friend's feature)
      if (notifDropdown.classList.contains("open")) {
        const visible = [...document.querySelectorAll(".notif-item")].map((el) => el.dataset.id);
        if (visible.length) markAllSeen(visible);
        if (badge) badge.style.display = "none";
      }
    });
  }

  document.addEventListener("click", () => {
    if (profileDropdown) profileDropdown.classList.remove("open");
    if (notifDropdown) notifDropdown.classList.remove("open");
  });

  if (profileDropdown) profileDropdown.addEventListener("click", (e) => e.stopPropagation());
  if (notifDropdown) notifDropdown.addEventListener("click", (e) => e.stopPropagation());

  setTimeout(setupMobileSidebar, 100);

  onAuthStateChanged(auth, (firebaseUser) => {
    if (firebaseUser) {
      updateUIWithUserData({ name: firebaseUser.displayName, email: firebaseUser.email });
      loadNotifications(firebaseUser);
    }
  });
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", loadTopbar);
} else {
  loadTopbar();
}
