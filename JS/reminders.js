// Reminder System

class Reminder {

  // Check upcoming deadlines
  static checkDeadlines() {

    // get all deadlines
    const deadlines = Deadline.getAll();

    // current date/time
    const now = new Date();

    deadlines.forEach((deadline) => {

      // ignore completed deadlines
      if (deadline.completed) return;

      // deadline date
      const dueDate = new Date(deadline.dueDate);

      // difference in milliseconds
      const diff =
        dueDate - now;

      // convert to hours
      const hoursLeft =
        diff / (1000 * 60 * 60);

      // if deadline is within 24 hours
      if (hoursLeft <= 24 && hoursLeft > 0) {

        // toast message
        showToast(
          `Reminder: ${deadline.title} is due soon!`,
          "warning"
        );

        // browser notification
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

      new Notification(message);

    }
  }

  // Ask notification permission
  static requestPermission() {

    if ("Notification" in window && Notification.permission !== "granted") 
      {Notification.requestPermission();}
  }
}

// Run reminder system after page loads
document.addEventListener("DOMContentLoaded", () => {
    // ask permission
    Reminder.requestPermission();
    // check reminders
    Reminder.checkDeadlines();
  }
);