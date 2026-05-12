
// Register 

function handleRegister(event) {
  event.preventDefault();

  const name     = document.getElementById("reg-name").value.trim();
  const email    = document.getElementById("reg-email").value.trim().toLowerCase();
  const password = document.getElementById("reg-password").value;
  const confirm  = document.getElementById("reg-confirm").value;

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

  // Check for duplicate email

  const users = Storage.get("users") || [];
  const exists = users.find((u) => u.email === email);

  if (exists) {
    showToast("An account with this email already exists.", "error");
    return;
  }

  // Save new user 

  const newUser = {
    id: Date.now().toString(),   // simple unique ID
    name,
    email,
    password,                    // plain text for now (no backend = no bcrypt)   :) ill see what that even mean
    createdAt: new Date().toISOString(),
  };

  users.push(newUser);
  Storage.set("users", users);

  // Auto login after register
  // Store user without password in session
  const { password: _pw, ...safeUser } = newUser;
  Session.setUser(safeUser);

  showToast(`Welcome to Planora, ${name}! 🎉`, "success");

  // Small delay so toast is visible before redirect
  setTimeout(() => {
    window.location.href = "dashboard.html";
  }, 1000);
}

// Login

function handleLogin(event) {
  event.preventDefault();

  const email    = document.getElementById("login-email").value.trim().toLowerCase();
  const password = document.getElementById("login-password").value;

  if (!email || !password) {
    showToast("Please enter your email and password.", "error");
    return;
  }

  const users = Storage.get("users") || [];
  const user  = users.find((u) => u.email === email && u.password === password);

  if (!user) {
    showToast("Incorrect email or password.", "error");
    return;
  }

  // Save session without password
  const { password: _pw, ...safeUser } = user;
  Session.setUser(safeUser);

  showToast(`Welcome back, ${user.name}!`, "success");

  setTimeout(() => {
    window.location.href = "dashboard.html";
  }, 1000);
}

// Logout 

function handleLogout() {
  Session.clear();
  window.location.href = "login.html";
}