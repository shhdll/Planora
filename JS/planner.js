// JS/planner.js

import { db, auth } from './firebase-config.js';
import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  updateDoc,
  doc,
  deleteDoc
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

import { Deadline } from './deadlines.js';
import { showToast } from './utils.js';

class StudyPlanner {

  // =========================
  // COLLECTION
  // =========================

  static get collectionRef() {
    return collection(db, "studyPlans");
  }

  // =========================
  // GET USER ID
  // =========================

  static getUserId() {
    const user = auth.currentUser;
    return user ? user.uid : null;
  }

  // =========================
  // LOAD COURSES
  // =========================

  static async getCourses() {
    const userId = this.getUserId();
    if (!userId) return [];

    const q = query(
      collection(db, "courses"),
      where("userId", "==", userId)
    );

    const snapshot = await getDocs(q);

    const courses = [];

    snapshot.forEach((docItem) => {
      courses.push({
        id: docItem.id,
        ...docItem.data()
      });
    });

    return courses;
  }

  // =========================
  // LOAD AVAILABILITY
  // =========================

  static async getAvailability() {
    const userId = this.getUserId();
    if (!userId) return null;

    const q = query(
      collection(db, "availability"),
      where("userId", "==", userId)
    );

    const snapshot = await getDocs(q);

    if (snapshot.empty) return null;

    return snapshot.docs[0].data();
  }

  // =========================
  // LOAD DEADLINES
  // =========================

  static async getDeadlines() {
    return await Deadline.getAll();
  }

  // =========================
  // PRIORITY SCORE
  // =========================

  static calculatePriority(deadline) {

    const now = new Date();
    const due = new Date(deadline.dueDate);

    const diffDays = Math.ceil(
      (due - now) / (1000 * 60 * 60 * 24)
    );

    let score = 0;

    // Near deadline = higher score
    if (diffDays <= 2) {
      score += 100;
    }
    else if (diffDays <= 5) {
      score += 70;
    }
    else if (diffDays <= 10) {
      score += 40;
    }
    else {
      score += 15;
    }

    // Manual priority
    switch (deadline.priority) {
      case 'High':
        score += 50;
        break;

      case 'Medium':
        score += 30;
        break;

      case 'Low':
        score += 10;
        break;
    }

    return score;
  }

  // =========================
  // GENERATE PLAN
  // =========================

  static async generateWeeklyPlan() {

    const userId = this.getUserId();

    if (!userId) {
      showToast("Please login first.", "error");
      return;
    }

    const availability = await this.getAvailability();

    if (!availability || !availability.days.length) {
      showToast("Please set your availability first.", "error");
      return;
    }

    const deadlines = await this.getDeadlines();

    if (!deadlines.length) {
      showToast("Add deadlines first.", "error");
      return;
    }

    // Remove old plans
    await this.clearExistingPlans();

    // Sort by importance
    deadlines.sort((a, b) => {
      return this.calculatePriority(b) - this.calculatePriority(a);
    });

    const generatedSessions = [];

    let currentDayIndex = 0;

    for (const deadline of deadlines) {

      const dayName = availability.days[
        currentDayIndex % availability.days.length
      ];

      const session = {
        title: deadline.title,
        course: deadline.course,
        dueDate: deadline.dueDate,
        day: dayName,
        startTime: availability.startTime,
        endTime: availability.endTime,
        priority: deadline.priority,
        status: "pending",
        userId,
        createdAt: new Date().toISOString()
      };

      generatedSessions.push(session);

      currentDayIndex++;
    }

    // Save all sessions
    for (const session of generatedSessions) {
      await addDoc(this.collectionRef, session);
    }

    showToast("Study plan generated successfully!", "success");

    await this.renderStudyPlan();
  }

  // =========================
  // CLEAR OLD PLANS
  // =========================

  static async clearExistingPlans() {

    const userId = this.getUserId();

    const q = query(
      this.collectionRef,
      where("userId", "==", userId)
    );

    const snapshot = await getDocs(q);

    for (const docItem of snapshot.docs) {
      await deleteDoc(doc(db, "studyPlans", docItem.id));
    }
  }

  // =========================
  // GET ALL PLANS
  // =========================

  static async getPlans() {

    const userId = this.getUserId();

    const q = query(
      this.collectionRef,
      where("userId", "==", userId)
    );

    const snapshot = await getDocs(q);

    const plans = [];

    snapshot.forEach((docItem) => {
      plans.push({
        id: docItem.id,
        ...docItem.data()
      });
    });

    return plans;
  }

  // =========================
  // COMPLETE SESSION
  // =========================

  static async markCompleted(id) {

    const ref = doc(db, "studyPlans", id);

    await updateDoc(ref, {
      status: "completed"
    });

    showToast("Session completed!", "success");

    await this.renderStudyPlan();
  }

  // =========================
  // MISSED SESSION
  // =========================

  static async markMissed(id) {

    const ref = doc(db, "studyPlans", id);

    await updateDoc(ref, {
      status: "missed"
    });

    showToast("Session marked as missed.", "info");

    // automatic rescheduling
    await this.rescheduleMissedSession(id);

    await this.renderStudyPlan();
  }

  // =========================
  // RESCHEDULE
  // =========================

  static async rescheduleMissedSession(id) {

    const plans = await this.getPlans();

    const target = plans.find((p) => p.id === id);

    if (!target) return;

    const availability = await this.getAvailability();

    if (!availability) return;

    const nextDay = availability.days[
      Math.floor(Math.random() * availability.days.length)
    ];

    await addDoc(this.collectionRef, {
      ...target,
      day: nextDay,
      status: "pending",
      createdAt: new Date().toISOString()
    });
  }

  // =========================
  // RENDER TABLE
  // =========================

  static async renderStudyPlan() {

    const tableBody = document.getElementById("study-plan-body");

    if (!tableBody) return;

    const plans = await this.getPlans();

    if (!plans.length) {
      tableBody.innerHTML = `
        <tr>
          <td colspan="5">No study plan generated yet.</td>
        </tr>
      `;
      return;
    }

    tableBody.innerHTML = plans.map((plan) => {

      return `
        <tr>
          <td>${plan.day}</td>
          <td>${plan.course}</td>
          <td>${plan.startTime} - ${plan.endTime}</td>
          <td>
            <span class="planner-status ${plan.status}">
              ${plan.status}
            </span>
          </td>
          <td>
            <button onclick="StudyPlanner.markCompleted('${plan.id}')">
              Complete
            </button>

            <button onclick="StudyPlanner.markMissed('${plan.id}')">
              Missed
            </button>
          </td>
        </tr>
      `;
    }).join("");
  }

  // =========================
  // STATISTICS
  // =========================

  static async calculateStatistics() {

    const plans = await this.getPlans();

    const completed = plans.filter(
      (p) => p.status === "completed"
    ).length;

    const missed = plans.filter(
      (p) => p.status === "missed"
    ).length;

    const pending = plans.filter(
      (p) => p.status === "pending"
    ).length;

    const total = plans.length;

    const completionRate = total
      ? Math.round((completed / total) * 100)
      : 0;

    return {
      total,
      completed,
      missed,
      pending,
      completionRate,
      estimatedHours: total * 2
    };
  }
}

// expose globally
window.StudyPlanner = StudyPlanner;

export { StudyPlanner };