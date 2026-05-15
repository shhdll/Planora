// Import Firebase
import { db, auth } from './firebase-config.js';
import {
  collection,
  query,
  where,
  getDocs,
  setDoc,
  doc,
  getDoc
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

// Availability (Now with Firestore)

// Get current user ID from Firebase
function getCurrentUserId() {
  const user = auth.currentUser;
  return user ? user.uid : null;
}

function getAvailabilityKey() {
  const user = Session.getUser();
  return user ? `availability_${user.id}` : null;
}

// Load availability from Firestore
async function loadAvailability() {
  const userId = getCurrentUserId();
  if (!userId) return null;
  
  try {
    const availabilityRef = doc(db, "availability", userId);
    const availabilitySnap = await getDoc(availabilityRef);
    
    if (availabilitySnap.exists()) {
      return availabilitySnap.data();
    } else {
      return { days: [], startTime: "", endTime: "" };
    }
  } catch (error) {
    console.error("Error loading availability:", error);
    return { days: [], startTime: "", endTime: "" };
  }
}

// Save availability to Firestore
async function saveAvailability(data) {
  const userId = getCurrentUserId();
  if (!userId) return;
  
  try {
    const availabilityRef = doc(db, "availability", userId);
    await setDoc(availabilityRef, {
      days: data.days,
      startTime: data.startTime,
      endTime: data.endTime,
      userId: userId,
      updatedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error("Error saving availability:", error);
  }
}

// Populate form with saved values on page load
async function initAvailabilityPage() {
  Session.require();

  const saved = await loadAvailability();
  if (!saved) return;

  if (saved.days && saved.days.length) {
    document.querySelectorAll('input[name="days"]').forEach((cb) => {
      cb.checked = saved.days.includes(cb.value);
    });
  }

  if (saved.startTime) document.getElementById("start-time").value = saved.startTime;
  if (saved.endTime)   document.getElementById("end-time").value   = saved.endTime;
}

// Handle form submission
async function handleAvailabilitySubmit(event) {
  event.preventDefault();

  const selectedDays = Array.from(document.querySelectorAll('input[name="days"]:checked')).map(
    (cb) => cb.value
  );

  const startTime = document.getElementById("start-time").value;
  const endTime   = document.getElementById("end-time").value;

  if (selectedDays.length === 0) {
    showToast("Please select at least one available day.", "error");
    return;
  }

  if (startTime >= endTime) {
    showToast("End time must be after start time.", "error");
    return;
  }

  await saveAvailability({ days: selectedDays, startTime, endTime });
  showToast("Availability saved successfully!", "success");

  setTimeout(() => {
    window.location.href = "dashboard.html";
  }, 1000);
}

document.addEventListener("DOMContentLoaded", () => {
  initAvailabilityPage();

  const form = document.getElementById("availability-form");
  if (form) form.addEventListener("submit", handleAvailabilitySubmit);
});