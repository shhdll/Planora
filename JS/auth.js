// Import Firebase Auth functions
import { auth } from "./firebase-config.js";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

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

  try {
    // Create user in Firebase Auth
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    const users = Storage.get("users") || [];
    users.push({ name, email, password: "FIREBASE_AUTH", uid: user.uid });
    Storage.set("users", users);

    Session.setUser({ name, email, uid: user.uid });

    showToast("Account created successfully!", "success");

    setTimeout(() => {
      window.location.href = "dashboard.html";
    }, 500);
  } catch (error) {
    // Handle Firebase specific errors
    let errorMessage = "Registration failed";
    if (error.code === "auth/email-already-in-use") {
      errorMessage = "User already exists";
    } else if (error.code === "auth/weak-password") {
      errorMessage = "Password is too weak";
    } else if (error.code === "auth/invalid-email") {
      errorMessage = "Invalid email address";
    }
    showToast(errorMessage, "error");
  }
}

async function handleLogin(event) {
  event.preventDefault();

  const email = document.getElementById("login-email").value.trim().toLowerCase();
  const password = document.getElementById("login-password").value;

  if (!email || !password) {
    showToast("Enter email and password", "error");
    return;
  }

  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    const users = Storage.get("users") || [];
    const userData = users.find((u) => u.email === email);
    const userName = userData ? userData.name : email.split("@")[0];

    Session.setUser({ name: userName, email: user.email, uid: user.uid });

    showToast(`Welcome back, ${userName}!`, "success");

    setTimeout(() => {
      window.location.href = "dashboard.html";
    }, 500);
  } catch (error) {
    // Handle Firebase specific errors
    let errorMessage = "Invalid credentials";
    if (error.code === "auth/user-not-found") {
      errorMessage = "User not found";
    } else if (error.code === "auth/wrong-password") {
      errorMessage = "Invalid credentials";
    } else if (error.code === "auth/invalid-email") {
      errorMessage = "Invalid email address";
    } else if (error.code === "auth/too-many-requests") {
      errorMessage = "Too many attempts. Try again later";
    }
    showToast(errorMessage, "error");
  }
}

async function handleLogout() {
  try {
    await signOut(auth);
    Session.clear();
    showToast("Logged out successfully", "info");
    setTimeout(() => {
      window.location.href = "login.html";
    }, 300);
  } catch (error) {
    console.error("Logout error:", error);
    Session.clear();
    window.location.href = "login.html";
  }
}

async function resetPassword(email) {
  try {
    await sendPasswordResetEmail(auth, email);
    return { success: true, message: "Password reset email sent" };
  } catch (error) {
    console.error("Reset password error:", error);
    let errorMessage = "Failed to send reset email";
    if (error.code === "auth/user-not-found") {
      errorMessage = "No account found with this email";
    } else if (error.code === "auth/invalid-email") {
      errorMessage = "Invalid email address";
    }
    return { success: false, error: errorMessage };
  }
}

function getCurrentUser() {
  return auth.currentUser;
}

export { handleRegister, handleLogin, handleLogout, resetPassword, getCurrentUser };
