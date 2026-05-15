// API Configuration
const API_URL = 'http://localhost:5000/api';

// Storage Helpers (keep as is)
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

// Session Helpers (updated to work with JWT)
const Session = {
  // Returns the currently logged-in user, or null
  getUser() {
    return Storage.get("currentUser");
  },

  // Save logged-in user and token to session
  setUser(user, token) {
    Storage.set("currentUser", user);
    Storage.set("authToken", token);
  },

  // Clear session (logout)
  clear() {
    Storage.remove("currentUser");
    Storage.remove("authToken");
  },

  // Get auth token for API requests
  getToken() {
    return Storage.get("authToken");
  },

  // Redirect to login if no active session
  async require() {
    const user = Session.getUser();
    const token = Session.getToken();
    
    if (!user || !token) {
      window.location.href = "login.html";
      return false;
    }
    
    // Optional: Verify token with backend
    try {
      const response = await fetch(`${API_URL}/auth/me`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        Session.clear();
        window.location.href = "login.html";
        return false;
      }
    } catch (error) {
      console.error("Session verification failed:", error);
    }
    
    return true;
  },

  // Redirect to dashboard if already logged in
  redirectIfLoggedIn() {
    if (Session.getUser() && Session.getToken()) {
      window.location.href = "dashboard.html";
    }
  },
};

// Date Helpers (keep as is)
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

// Toast notification (keep as is)
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

// Register Function (updated to use backend API)
async function handleRegister(event) {
  event.preventDefault();

  const name = document.getElementById("reg-name").value.trim();
  const email = document.getElementById("reg-email").value.trim().toLowerCase();
  const password = document.getElementById("reg-password").value;
  const confirm = document.getElementById("reg-confirm").value;

  // Validation
  if (!name || !email || !password || !confirm) {
    showToast("Please fill in all fields.", "error");
    return;
  }

  if (password.length < 6) {
    showToast("Password must be at least 6 characters.", "error");
    return;
  }

  if (password !== confirm) {
    showToast("Passwords do not match.", "error");
    return;
  }

  // Show loading state
  const submitBtn = event.target.querySelector('button[type="submit"]');
  const originalText = submitBtn.textContent;
  submitBtn.textContent = "Creating account...";
  submitBtn.disabled = true;

  try {
    const response = await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ name, email, password })
    });

    const data = await response.json();

    if (data.success) {
      // Save user and token
      Session.setUser(data.user, data.token);
      showToast(`Welcome to Planora, ${name}! 🎉`, "success");

      setTimeout(() => {
        window.location.href = "dashboard.html";
      }, 1000);
    } else {
      showToast(data.message || "Registration failed", "error");
    }
  } catch (error) {
    console.error("Registration error:", error);
    showToast("Cannot connect to server. Make sure backend is running.", "error");
  } finally {
    submitBtn.textContent = originalText;
    submitBtn.disabled = false;
  }
}

// Login Function (updated to use backend API)
async function handleLogin(event) {
  event.preventDefault();

  const email = document.getElementById("login-email").value.trim().toLowerCase();
  const password = document.getElementById("login-password").value;

  if (!email || !password) {
    showToast("Please enter your email and password.", "error");
    return;
  }

  // Show loading state
  const submitBtn = event.target.querySelector('button[type="submit"]');
  const originalText = submitBtn.textContent;
  submitBtn.textContent = "Logging in...";
  submitBtn.disabled = true;

  try {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email, password })
    });

    const data = await response.json();

    if (data.success) {
      // Save user and token
      Session.setUser(data.user, data.token);
      showToast(`Welcome back, ${data.user.name}!`, "success");

      setTimeout(() => {
        window.location.href = "dashboard.html";
      }, 1000);
    } else {
      showToast(data.message || "Invalid email or password", "error");
    }
  } catch (error) {
    console.error("Login error:", error);
    showToast("Cannot connect to server. Make sure backend is running on port 5000", "error");
  } finally {
    submitBtn.textContent = originalText;
    submitBtn.disabled = false;
  }
}

// Logout Function
function handleLogout() {
  Session.clear();
  window.location.href = "login.html";
}

// Helper function for authenticated API requests
async function apiRequest(endpoint, options = {}) {
  const token = Session.getToken();
  
  const defaultOptions = {
    headers: {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` })
    }
  };
  
  const response = await fetch(`${API_URL}${endpoint}`, {
    ...defaultOptions,
    ...options,
    headers: {
      ...defaultOptions.headers,
      ...options.headers
    }
  });
  
  const data = await response.json();
  
  if (!response.ok) {
    if (response.status === 401) {
      // Token expired or invalid
      Session.clear();
      window.location.href = "login.html";
    }
    throw new Error(data.message || 'API request failed');
  }
  
  return data;
}

// Example: Get courses from backend
async function fetchCourses() {
  try {
    const data = await apiRequest('/courses');
    return data.courses;
  } catch (error) {
    console.error('Failed to fetch courses:', error);
    return [];
  }
}

// Example: Create a course
async function createCourse(courseData) {
  try {
    const data = await apiRequest('/courses', {
      method: 'POST',
      body: JSON.stringify(courseData)
    });
    return data.course;
  } catch (error) {
    console.error('Failed to create course:', error);
    throw error;
  }
}