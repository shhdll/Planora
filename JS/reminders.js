// Import Firebase (for auth and to ensure deadlines are loaded from Firestore)
import { auth } from './firebase-config.js';

// Reminder System

class Reminder {

  // Check upcoming deadlines
  static async checkDeadlines() {

    // get all deadlines from Firestore (using Deadline class from deadlines.js)
    const deadlines = await Deadline.getAll();

    // current date/time
    const now = new Date();

    deadlines.forEach((deadline) => {

      // ignore completed deadlines
      if (deadline.completed) return;

      // deadline date
      const dueDate = new Date(deadline.dueDate);

      // difference in milliseconds
      const diff = dueDate - now;

      // convert to hours
      const hoursLeft = diff / (1000 * 60 * 60);

      // if deadline is within 24 hours
      if (hoursLeft <= 24 && hoursLeft > 0) {

        // toast message (using warning style)
        showToast(
          `Reminder: ${deadline.title} is due soon!`,
          "info" // Changed to "info" since "warning" wasn't defined in showToast
        );

        // browser notification
        Reminder.sendBrowserNotification(
          `${deadline.title} is due soon! Course: ${deadline.course}`
        );
      }
    });
  }

  // Browser notification
  static sendBrowserNotification(message) {

    // check permission
    if (Notification.permission === "granted") {

      new Notification("Planora Reminder", {
        body: message,
        icon: "/images/planora_icon.png" // Optional: add your app icon
      });

    }
  }

  // Ask notification permission
  static requestPermission() {

    if ("Notification" in window && Notification.permission !== "granted") {
      Notification.requestPermission();
    }
  }
}

// Run reminder system after page loads
document.addEventListener("DOMContentLoaded", async () => {
    // Wait for auth to be ready (optional, but good practice)
    if (auth.currentUser) {
      // ask permission
      Reminder.requestPermission();
      // check reminders
      await Reminder.checkDeadlines();
    } else {
      // If no user is logged in, wait for auth state change
      const unsubscribe = auth.onAuthStateChanged((user) => {
        if (user) {
          Reminder.requestPermission();
          Reminder.checkDeadlines();
          unsubscribe(); // Stop listening after first login
        }
      });
    }
  }
);