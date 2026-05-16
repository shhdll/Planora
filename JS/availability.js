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

// Slots are stored per-day: [{day, startTime, endTime}, ...]
async function loadSlots() {

  const userId = getCurrentUserId();
  if (!userId) return [];

  try {

    const snap = await getDoc(
      doc(db, "availability", userId)
    );

    if (!snap.exists()) return [];

    const data = snap.data();

    if (!Array.isArray(data.slots) || data.slots.length === 0) return [];

    // Migrate old multi-day format {days: [], startTime, endTime}
    if (Array.isArray(data.slots[0].days)) {
      const perDay = [];
      data.slots.forEach((slot) => {
        slot.days.forEach((day) => {
          perDay.push({
            day,
            startTime: slot.startTime,
            endTime: slot.endTime
          });
        });
      });
      return perDay;
    }

    return data.slots;

  } catch (error) {

    console.error("Error loading availability:", error);
    return [];
  }
}

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

// Merges adjacent or overlapping intervals for a single day
function mergeIntervals(intervals) {

  if (intervals.length <= 1) return intervals;

  intervals.sort(
    (a, b) => a.startTime.localeCompare(b.startTime)
  );

  const merged = [{ ...intervals[0] }];

  for (let i = 1; i < intervals.length; i++) {

    const last = merged[merged.length - 1];
    const curr = intervals[i];

    if (curr.startTime <= last.endTime) {
      // Adjacent or overlapping — extend end if needed
      if (curr.endTime > last.endTime) last.endTime = curr.endTime;
    } else {
      merged.push({ ...curr });
    }
  }

  return merged;
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

const DAY_ORDER = [
  "sun", "mon", "tue", "wed", "thu", "fri", "sat"
];

function formatTime(t) {
  if (!t) return "";
  const [h, m] = t.split(":");
  const hour = parseInt(h, 10);
  const ampm = hour >= 12 ? "PM" : "AM";
  const h12 = hour % 12 || 12;
  return `${h12}:${m} ${ampm}`;
}

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

  // Group by day
  const byDay = {};
  slots.forEach((slot) => {
    if (!byDay[slot.day]) byDay[slot.day] = [];
    byDay[slot.day].push({
      startTime: slot.startTime,
      endTime: slot.endTime
    });
  });

  section.style.display = "";

  const container = document.getElementById("avail-slots");

  container.innerHTML =
    DAY_ORDER
      .filter((day) => byDay[day])
      .map((day) => `
        <div class="avail-slot">
          <span class="course-badge avail-day-badge">${DAY_LABELS[day]}</span>
          <div class="avail-slot__times">
            ${byDay[day].map((t) => `
              <div class="avail-slot__row">
                <p class="avail-slot__time">${formatTime(t.startTime)} – ${formatTime(t.endTime)}</p>
                <button
                  class="avail-delete-btn"
                  data-day="${day}"
                  data-start="${t.startTime}"
                  data-end="${t.endTime}"
                  title="Remove"
                >×</button>
              </div>
            `).join("")}
          </div>
        </div>
      `).join("");
}

async function deleteSlot(day, startTime, endTime) {

  slots = slots.filter(
    (s) =>
      !(s.day === day &&
        s.startTime === startTime &&
        s.endTime === endTime)
  );

  const success = await saveSlots(slots);

  if (success) {
    renderSchedule(slots);
  }
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

  document
    .getElementById("avail-slots")
    .addEventListener("click", (e) => {
      const btn = e.target.closest(".avail-delete-btn");
      if (!btn) return;
      deleteSlot(
        btn.dataset.day,
        btn.dataset.start,
        btn.dataset.end
      );
    });
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

  // For each selected day: pull existing intervals, add new one, merge, put back
  let updated = [...slots];

  selectedDays.forEach((day) => {

    const existing = updated
      .filter((s) => s.day === day)
      .map((s) => ({ startTime: s.startTime, endTime: s.endTime }));

    updated = updated.filter((s) => s.day !== day);

    const merged = mergeIntervals([
      ...existing,
      { startTime, endTime }
    ]);

    merged.forEach((interval) => {
      updated.push({ day, ...interval });
    });
  });

  slots = updated;

  const success = await saveSlots(slots);

  if (success) {

    showToast("Availability saved!", "success");
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
