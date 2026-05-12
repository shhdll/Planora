// Storage Helpers 

const Storage = {
  get(key) {
    try {
      return JSON.parse(localStorage.getItem(key));
    } catch {
      return null;
    }
  },

  set(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  },

  remove(key) {
    localStorage.removeItem(key);
  },
};

// Session Helpers 

const Session = {
  // Returns the currently logged-in user, or null
  getUser() {
    return Storage.get("currentUser");
  },

  // Save logged-in user to session
  setUser(user) {
    Storage.set("currentUser", user);
  },

  // Clear session (logout)
  clear() {
    Storage.remove("currentUser");
  },

  // Redirect to login if no active session
  // Call this at the top of every protected page
  require() {
    if (!Session.getUser()) {
      window.location.href = "login.html";
    }
  },

  // Redirect to dashboard if already logged in
  // Call this on login/register pages so logged-in users skip them
  redirectIfLoggedIn() {
    if (Session.getUser()) {
      window.location.href = "dashboard.html";
    }
  },
};

// Date Helpers 

const DateUtils = {
  today() {
    return new Date().toISOString().split("T")[0]; // "YYYY-MM-DD"
  },

  formatDisplay(dateStr) {
    if (!dateStr) return "";
    const [y, m, d] = dateStr.split("-");
    return `${d}/${m}/${y}`;
  },

  daysUntil(dateStr) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const target = new Date(dateStr);
    target.setHours(0, 0, 0, 0);
    return Math.ceil((target - today) / (1000 * 60 * 60 * 24));
  },
};

//  Toast notification (this is used to give more time for the messages that pops up)

function showToast(message, type = "success") {
  const existing = document.getElementById("planora-toast");
  if (existing) existing.remove();

  const toast = document.createElement("div");
  toast.id = "planora-toast";
  toast.textContent = message;

  const colors = {
    success: { bg: "#22c55e", color: "#fff" },
    error:   { bg: "#ef4444", color: "#fff" },
    info:    { bg: "#3b82f6", color: "#fff" },
  };

  const c = colors[type] || colors.info;

  Object.assign(toast.style, {
    position: "fixed",
    bottom: "80px",
    left: "50%",
    transform: "translateX(-50%)",
    backgroundColor: c.bg,
    color: c.color,
    padding: "12px 24px",
    borderRadius: "8px",
    fontWeight: "600",
    fontSize: "14px",
    zIndex: "9999",
    boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
    transition: "opacity 0.4s ease",
    opacity: "1",
  });

  document.body.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = "0";
    setTimeout(() => toast.remove(), 400);
  }, 3000);
}