// Import Firebase (for auth and to ensure deadlines are loaded from Firestore)
import { auth } from './firebase-config.js';

// Reminder System

class Reminder {

  // Check upcoming deadlines
  static async checkDeadlines() {

    const deadlines = Deadline.getAll();

    const now = new Date();

    deadlines.forEach((deadline) => {

        if (deadline.completed) return;

        if (!deadline.dueDate) return;

        const dueDate =
            new Date(deadline.dueDate);

        if (isNaN(dueDate.getTime())) return;

        const diff =
            dueDate.getTime() - now.getTime();

        const hoursLeft =
            diff / (1000 * 60 * 60);

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