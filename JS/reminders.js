// Import Firebase
import { auth } from "./firebase-config.js";
import { Deadline } from "./deadlines.js";
import { showToast } from "./utils.js";

class Reminder {
  static get storageKey() {
    const today = new Date().toISOString().split("T")[0];
    return `planora_reminded_${today}`;
  }

  static getNotified() {
    return JSON.parse(localStorage.getItem(this.storageKey) || "[]");
  }

  static markNotified(id) {
    const notified = this.getNotified();
    if (!notified.includes(id)) {
      notified.push(id);
      localStorage.setItem(this.storageKey, JSON.stringify(notified));
    }
  }

  static async checkDeadlines() {
    const deadlines = await Deadline.getAll();
    const now = new Date();
    const notified = this.getNotified();

    deadlines.forEach((deadline) => {
      if (deadline.completed) return;
      if (!deadline.dueDate) return;
      if (notified.includes(deadline.id)) return;

      const dueDate = new Date(deadline.dueDate);
      if (isNaN(dueDate.getTime())) return;

      const hoursLeft = (dueDate - now) / (1000 * 60 * 60);

      if (hoursLeft <= 24 && hoursLeft > 0) {
        showToast(`Reminder: ${deadline.title} is due soon!`, "warning");
        Reminder.sendBrowserNotification(`${deadline.title} is due soon!`);
        Reminder.markNotified(deadline.id);
      }
    });
  }

  // Browser notification
  static sendBrowserNotification(message) {
    if (Notification.permission === "granted") {
      new Notification("Planora Reminder", { body: message });
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
  if (auth.currentUser) {
    Reminder.requestPermission();

    await Reminder.checkDeadlines();
  } else {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        Reminder.requestPermission();

        Reminder.checkDeadlines();

        unsubscribe();
      }
    });
  }
});

export { Reminder };
