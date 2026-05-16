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

// Get current user ID
function getCurrentUserId() {

  const user = auth.currentUser;

  return user ? user.uid : null;
}

// Load availability
async function loadAvailability() {

  const userId =
    getCurrentUserId();

  if (!userId) return null;

  try {

    const availabilityRef =
      doc(
        db,
        "availability",
        userId
      );

    const availabilitySnap =
      await getDoc(
        availabilityRef
      );

    if (
      availabilitySnap.exists()
    ) {

      return availabilitySnap.data();
    }

    return {

      days: [],
      startTime: "",
      endTime: ""
    };

  } catch (error) {

    console.error(
      "Error loading availability:",
      error
    );

    return {

      days: [],
      startTime: "",
      endTime: ""
    };
  }
}

// Save availability
async function saveAvailability(data) {

  const userId =
    getCurrentUserId();

  if (!userId) {

    console.error(
      "No logged in user."
    );

    return false;
  }

  try {

    const availabilityRef =
      doc(
        db,
        "availability",
        userId
      );

    await setDoc(
      availabilityRef,
      {

        days: data.days,
        startTime: data.startTime,
        endTime: data.endTime,
        userId: userId,
        updatedAt:
          new Date().toISOString()
      }
    );

    console.log(
      "Availability saved"
    );

    return true;

  } catch (error) {

    console.error(
      "Error saving availability:",
      error
    );

    return false;
  }
}

// Initialize page
async function initAvailabilityPage() {

  Session.require();

  const saved =
    await loadAvailability();

  if (!saved) return;

  // Restore checked days
  if (
    saved.days &&
    saved.days.length
  ) {

    document
      .querySelectorAll(
        'input[name="days"]'
      )
      .forEach((cb) => {

        cb.checked =
          saved.days.includes(
            cb.value
          );
      });
  }

  // Restore times
  if (saved.startTime) {

    document.getElementById(
      "start-time"
    ).value =
      saved.startTime;
  }

  if (saved.endTime) {

    document.getElementById(
      "end-time"
    ).value =
      saved.endTime;
  }
}

// Handle form submit
async function handleAvailabilitySubmit(event) {

  event.preventDefault();

  const selectedDays =

    Array.from(

      document.querySelectorAll(
        'input[name="days"]:checked'
      )

    ).map(
      (cb) => cb.value
    );

  const startTime =
    document.getElementById(
      "start-time"
    ).value;

  const endTime =
    document.getElementById(
      "end-time"
    ).value;

  if (
    selectedDays.length === 0
  ) {

    showToast(
      "Please select at least one available day.",
      "error"
    );

    return;
  }

  if (
    startTime >= endTime
  ) {

    showToast(
      "End time must be after start time.",
      "error"
    );

    return;
  }

  const success =
    await saveAvailability({

      days: selectedDays,
      startTime,
      endTime
    });

  if (success) {

    showToast(
      "Availability saved successfully!",
      "success"
    );

    setTimeout(() => {

      window.location.href =
        "dashboard.html";

    }, 1000);
  }
}

// Wait for Firebase auth
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