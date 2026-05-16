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
  // GET STUDY PLAN SESSIONS
  // =========================

  static async getStudySessions() {

    const userId = this.getUserId();
    if (!userId) return [];

    const q = query(
      collection(db, "studyPlans"),
      where("userId", "==", userId)
    );

    const snapshot = await getDocs(q);
    const sessions = [];

    snapshot.forEach((docItem) => {
      sessions.push({ id: docItem.id, ...docItem.data() });
    });

    return sessions;
  }

  // =========================
  // TOTAL SESSIONS
  // =========================

  static async getTotalStudySessions() {

    const sessions = await this.getStudySessions();
    return sessions.length;
  }

  // =========================
  // COMPLETED SESSIONS
  // =========================

  static async getCompletedSessions() {

    const sessions = await this.getStudySessions();
    return sessions.filter((s) => s.status === "completed").length;
  }

  // =========================
  // PENDING SESSIONS
  // =========================

  static async getPendingSessions() {

    const sessions = await this.getStudySessions();
    return sessions.filter((s) => s.status === "pending").length;
  }

  // =========================
  // MISSED SESSIONS
  // =========================

  static async getMissedSessions() {

    const sessions = await this.getStudySessions();
    return sessions.filter((s) => s.status === "missed").length;
  }

  // =========================
  // MOST / LEAST STUDIED
  // =========================

  static async getProgressTrends() {

    const sessions = await this.getStudySessions();
    const completed = sessions.filter((s) => s.status === "completed");

    if (!completed.length) {
      return { mostStudied: "No data", leastStudied: "No data" };
    }

    const courseStats = {};

    completed.forEach((s) => {
      const course = s.course || "Unknown";
      courseStats[course] = (courseStats[course] || 0) + 1;
    });

    const entries = Object.entries(courseStats).sort((a, b) => b[1] - a[1]);

    return {
      mostStudied: entries[0][0],
      leastStudied: entries[entries.length - 1][0]
    };
  }

  // =========================
  // COMPLETION RATE
  // =========================

  static async getCompletionRate() {

    const sessions = await this.getStudySessions();
    const decided = sessions.filter(
      (s) => s.status === "completed" || s.status === "missed"
    );

    if (!decided.length) return 0;

    const completed = decided.filter((s) => s.status === "completed").length;

    return Math.round((completed / decided.length) * 100);
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