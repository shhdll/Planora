// JS/tracker.js

import { db, auth } from './firebase-config.js';

import {
  collection,
  query,
  where,
  getDocs
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

class Tracker {

  // =========================
  // GET USER ID
  // =========================

  static getUserId() {

    const user = auth.currentUser;

    return user ? user.uid : null;
  }

  // =========================
  // TOTAL COURSES
  // =========================

  static async getTotalCourses() {

    const userId = this.getUserId();

    if (!userId) return 0;

    const q = query(

      collection(db, "courses"),

      where("userId", "==", userId)
    );

    const snapshot =
      await getDocs(q);

    return snapshot.size;
  }

  // =========================
  // GET ALL DEADLINES
  // =========================

  static async getDeadlines() {

    const userId =
      this.getUserId();

    if (!userId) return [];

    const q = query(

      collection(db, "deadlines"),

      where("userId", "==", userId)
    );

    const snapshot =
      await getDocs(q);

    const deadlines = [];

    snapshot.forEach((docItem) => {

      deadlines.push({

        id: docItem.id,

        ...docItem.data()
      });
    });

    return deadlines;
  }

  // =========================
  // TOTAL DEADLINES
  // =========================

  static async getTotalStudySessions() {

    const deadlines =
      await this.getDeadlines();

    return deadlines.length;
  }

  // =========================
  // COMPLETED DEADLINES
  // =========================

  static async getCompletedSessions() {

    const deadlines =
      await this.getDeadlines();

    return deadlines.filter(

      d => d.completed === true

    ).length;
  }

  // =========================
  // PENDING DEADLINES
  // =========================

  static async getPendingSessions() {

    const deadlines =
      await this.getDeadlines();

    return deadlines.filter(

      d => !d.completed

    ).length;
  }

  // =========================
  // MISSED DEADLINES
  // =========================

  static async getMissedSessions() {

    const deadlines =
      await this.getDeadlines();

    const now =
      new Date();

    return deadlines.filter((d) => {

      if (d.completed) {

        return false;
      }

      return new Date(d.dueDate) < now;

    }).length;
  }

  // =========================
  // MOST / LEAST STUDIED
  // =========================

  static async getProgressTrends() {

    const deadlines =
      await this.getDeadlines();

    if (!deadlines.length) {

      return {

        mostStudied: "No data",

        leastStudied: "No data"
      };
    }

    const courseStats = {};

    deadlines.forEach((deadline) => {

      const course =
        deadline.course || "Unknown";

      if (!courseStats[course]) {

        courseStats[course] = {

          completed: 0
        };
      }

      if (deadline.completed) {

        courseStats[course].completed += 1;
      }
    });

    const entries =
      Object.entries(courseStats);

    entries.sort(

      (a, b) =>

        b[1].completed -
        a[1].completed
    );

    return {

      mostStudied:
        entries[0][0],

      leastStudied:
        entries[
          entries.length - 1
        ][0]
    };
  }

  // =========================
  // COMPLETION RATE
  // =========================

  static async getCompletionRate() {

    const total =
      await this.getTotalStudySessions();

    const completed =
      await this.getCompletedSessions();

    if (total === 0) {

      return 0;
    }

    return Math.round(

      (
        completed / total
      ) * 100
    );
  }

  // =========================
  // GET ALL STATISTICS
  // =========================

  static async getStatistics() {

    const totalCourses =
      await this.getTotalCourses();

    const totalSessions =
      await this.getTotalStudySessions();

    const completedSessions =
      await this.getCompletedSessions();

    const pendingSessions =
      await this.getPendingSessions();

    const missedSessions =
      await this.getMissedSessions();

    const completionRate =
      await this.getCompletionRate();

    const trends =
      await this.getProgressTrends();

    return {

      totalCourses,

      totalSessions,

      completedSessions,

      pendingSessions,

      missedSessions,

      completionRate,

      mostStudied:
        trends.mostStudied,

      leastStudied:
        trends.leastStudied
    };
  }
}

window.Tracker =
  Tracker;

export { Tracker };