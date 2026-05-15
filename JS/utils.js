// Import Firebase Auth for session management
import { auth } from './firebase-config.js';
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

// Storage Helpers (Now syncs with Firebase, but maintains localStorage for backward compatibility)
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

// Session Helpers (Now powered by Firebase Auth)
const Session = {
  // Returns the currently logged-in user, or null
  getUser() {
    // First check Firebase Auth state (source of truth)
    const firebaseUser = auth.currentUser;
    if (firebaseUser) {
      // Get additional user data from localStorage for compatibility
      const localUser = Storage.get("currentUser");
      return {
        email: firebaseUser.email,
        uid: firebaseUser.uid,
        name: localUser?.name || firebaseUser.email.split('@')[0]
      };
    }
    
    // Fallback to localStorage for backward compatibility
    return Storage.get("currentUser");
  },

  // Save logged-in user to session
  setUser(user) {
    // Store in localStorage for backward compatibility
    Storage.set("currentUser", user);
    // Note: The actual Firebase user is set by Firebase Auth during login
  },

  // Clear session (logout)
  async clear() {
    // Remove from localStorage
    Storage.remove("currentUser");
    // Note: Actual Firebase logout happens in auth.js handleLogout
  },

  // Redirect to login if no active session
  require() {
    const user = this.getUser();
    if (!user) {
      window.location.href = "login.html";
    }
  },

  // Redirect to dashboard if already logged in
  redirectIfLoggedIn() {
    const user = this.getUser();
    if (user) {
      window.location.href = "dashboard.html";
    }
  },
  
  // NEW: Listen to auth state changes (optional, for real-time updates)
  onAuthChange(callback) {
    return onAuthStateChanged(auth, (user) => {
      if (callback) {
        callback(user);
      }
    });
  }
};

// Date Helpers (No changes needed - pure JS)
const DateUtils = {
  today() {
    return new Date().toISOString().split("T")[0];
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

// Toast notification (No changes needed - pure UI)
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

export { Storage, Session, DateUtils, showToast };
