// Import Firebase
import { db, auth } from './firebase-config.js';

import {
  Session,
  showToast
} from './utils.js';

import {
  setDoc,
  doc,
  getDoc
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

function getCurrentUserId() {
  const user = auth.currentUser;
  return user ? user.uid : null;
}

// Load all saved slots
async function loadSlots() {

  const userId = getCurrentUserId();
  if (!userId) return [];

  try {

    const snap = await getDoc(
      doc(db, "availability", userId)
    );

    if (!snap.exists()) return [];

    const data = snap.data();

    // Support old single-slot format
    if (Array.isArray(data.slots)) {
      return data.slots;
    }

    if (data.days && data.days.length) {
      return [{
        days: data.days,
        startTime: data.startTime,
        endTime: data.endTime
      }];
    }

    return [];

  } catch (error) {

    console.error("Error loading availability:", error);
    return [];
  }
}

// Save all slots
async function saveSlots(slots) {

  const userId = getCurrentUserId();

  if (!userId) {
    console.error("No logged in user.");
    return false;
  }

  try {

    await setDoc(
      doc(db, "availability", userId),
      {
        slots,
        userId,
        updatedAt: new Date().toISOString()
      }
    );

    return true;

  } catch (error) {

    console.error("Error saving availability:", error);
    return false;
  }
}

const DAY_LABELS = {
  sun: "Sunday",
  mon: "Monday",
  tue: "Tuesday",
  wed: "Wednesday",
  thu: "Thursday",
  fri: "Friday",
  sat: "Saturday"
};

function formatTime(t) {
  if (!t) return "";
  const [h, m] = t.split(":");
  const hour = parseInt(h, 10);
  const ampm = hour >= 12 ? "PM" : "AM";
  const h12 = hour % 12 || 12;
  return `${h12}:${m} ${ampm}`;
}

const DAY_ORDER = [
  "sun", "mon", "tue", "wed", "thu", "fri", "sat"
];

function renderSchedule(slots) {

  const section =
    document.getElementById(
      "availability-schedule"
    );

  if (!section) return;

  if (!slots || slots.length === 0) {
    section.style.display = "none";
    return;
  }

  // Group time ranges by day
  const byDay = {};
  slots.forEach((slot) => {
    slot.days.forEach((day) => {
      if (!byDay[day]) byDay[day] = [];
      byDay[day].push({
        startTime: slot.startTime,
        endTime: slot.endTime
      });
    });
  });

  section.style.display = "";

  document.getElementById(
    "avail-slots"
  ).innerHTML =
    DAY_ORDER
      .filter((day) => byDay[day])
      .map((day) => `
        <div class="avail-slot">
          <span class="course-badge avail-day-badge">${DAY_LABELS[day]}</span>
          <div class="avail-slot__times">
            ${byDay[day].map((t) =>
              `<p class="avail-slot__time">${formatTime(t.startTime)} – ${formatTime(t.endTime)}</p>`
            ).join("")}
          </div>
        </div>
      `).join("");
}

function resetForm() {

  document
    .querySelectorAll('input[name="days"]')
    .forEach((cb) => { cb.checked = false; });

  document.getElementById("start-time").value = "";
  document.getElementById("end-time").value = "";
}

let slots = [];

async function initAvailabilityPage() {

  Session.require();

  slots = await loadSlots();
  renderSchedule(slots);
}

async function handleAvailabilitySubmit(event) {

  event.preventDefault();

  const selectedDays =
    Array.from(
      document.querySelectorAll(
        'input[name="days"]:checked'
      )
    ).map((cb) => cb.value);

  const startTime =
    document.getElementById("start-time").value;

  const endTime =
    document.getElementById("end-time").value;

  if (selectedDays.length === 0) {
    showToast(
      "Please select at least one available day.",
      "error"
    );
    return;
  }

  if (startTime >= endTime) {
    showToast(
      "End time must be after start time.",
      "error"
    );
    return;
  }

  slots = [...slots, { days: selectedDays, startTime, endTime }];

  const success = await saveSlots(slots);

  if (success) {

    showToast(
      "Availability added!",
      "success"
    );

    renderSchedule(slots);
    resetForm();
  }
}

document.addEventListener(
  "DOMContentLoaded",
  () => {

    auth.onAuthStateChanged(
      async (user) => {

        if (!user) return;

        await initAvailabilityPage();

        const form =
          document.getElementById(
            "availability-form"
          );

        if (form) {
          form.addEventListener(
            "submit",
            handleAvailabilitySubmit
          );
        }
      }
    );
  }
);
