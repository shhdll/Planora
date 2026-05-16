// Import Firebase
import { auth } from './firebase-config.js';
import { Deadline } from './deadlines.js';
import { showToast } from './utils.js';

// Reminder System
class Reminder {

  // Check upcoming deadlines
  static async checkDeadlines() {

    const deadlines = await Deadline.getAll();

    const now = new Date();

    deadlines.forEach((deadline) => {

      if (deadline.completed) return;

      if (!deadline.dueDate) return;

      const dueDate = new Date(deadline.dueDate);

      if (isNaN(dueDate.getTime())) return;

      const diff = dueDate - now;

      const hoursLeft = diff / (1000 * 60 * 60);

      // if deadline is within 24 hours
      if (hoursLeft <= 24 && hoursLeft > 0) {

        showToast(
          `Reminder: ${deadline.title} is due soon!`,
          "warning"
        );

        Reminder.sendBrowserNotification(
          `${deadline.title} is due soon!`
        );
      }
    });
  }

  // Browser notification
  static sendBrowserNotification(message) {

    if (Notification.permission === "granted") {

      new Notification("Planora Reminder", {
        body: message
      });
    }
  }

  // Ask notification permission
  static requestPermission() {

    if (
      "Notification" in window &&
      Notification.permission !== "granted"
    ) {
      Notification.requestPermission();
    }
  }
}

// Run reminder system after page loads
document.addEventListener("DOMContentLoaded", async () => {

  if (auth.currentUser) {

    Reminder.requestPermission();

    await Reminder.checkDeadlines();

  } else {

    const unsubscribe =
      auth.onAuthStateChanged((user) => {

        if (user) {

          Reminder.requestPermission();

          Reminder.checkDeadlines();

          unsubscribe();
        }
      });
  }
});

export { Reminder };