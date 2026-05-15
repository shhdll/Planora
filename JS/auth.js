// Register Function (LocalStorage only)
async function handleRegister(event) {
    event.preventDefault();

    const name = document.getElementById("reg-name").value.trim();
    const email = document.getElementById("reg-email").value.trim().toLowerCase();
    const password = document.getElementById("reg-password").value;
    const confirm = document.getElementById("reg-confirm").value;

    if (!name || !email || !password || !confirm) {
        showToast("Fill all fields", "error");
        return;
    }

    if (password !== confirm) {
        showToast("Passwords do not match", "error");
        return;
    }

    if (password.length < 4) {
        showToast("Password must be at least 4 characters", "error");
        return;
    }

    const users = Storage.get("users") || [];

    const exists = users.find(u => u.email === email);
    if (exists) {
        showToast("User already exists", "error");
        return;
    }

    users.push({ name, email, password });
    Storage.set("users", users);

    // Use Session helper instead of direct localStorage
    Session.setUser({ name, email });

    showToast("Account created successfully!", "success");

    setTimeout(() => {
        window.location.href = "dashboard.html";
    }, 500);
}

// Login Function (LocalStorage only)
async function handleLogin(event) {
    event.preventDefault();

    const email = document.getElementById("login-email").value.trim().toLowerCase();
    const password = document.getElementById("login-password").value;

    if (!email || !password) {
        showToast("Enter email and password", "error");
        return;
    }

    const users = Storage.get("users") || [];

    const user = users.find(u => u.email === email && u.password === password);

    if (!user) {
        showToast("Invalid credentials", "error");
        return;
    }

    // Use Session helper instead of direct localStorage
    Session.setUser({ name: user.name, email: user.email });

    showToast(`Welcome back, ${user.name}!`, "success");

    setTimeout(() => {
        window.location.href = "dashboard.html";
    }, 500);
}

// Logout Function
function handleLogout() {
    Session.clear();  // Clean and simple
    showToast("Logged out successfully", "info");
    setTimeout(() => {
        window.location.href = "login.html";
    }, 300);
}