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
  // USER ID
  // =========================

  static getUserId() {

    const user = auth.currentUser;

    return user ? user.uid : null;
  }

  // =========================
  // COURSES
  // =========================

  static async getCourses() {

    const userId = this.getUserId();

    if (!userId) return [];

    const q = query(

      collection(db, "courses"),

      where(
        "userId",
        "==",
        userId
      )
    );

    const snapshot =
      await getDocs(q);

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
  // AVAILABILITY
  // =========================

  static async getAvailability() {

    const userId = this.getUserId();

    if (!userId) return null;

    const q = query(

      collection(db, "availability"),

      where(
        "userId",
        "==",
        userId
      )
    );

    const snapshot =
      await getDocs(q);

    if (snapshot.empty) return null;

    const data = snapshot.docs[0].data();

    // Normalize new per-day format {slots: [{day, startTime, endTime}]}
    // into the shape the planner expects: {days, startTime, endTime}
    if (
      Array.isArray(data.slots) &&
      data.slots.length > 0
    ) {

      const DAY_ORDER = [
        "sun", "mon", "tue", "wed", "thu", "fri", "sat"
      ];

      const days = [
        ...new Set(data.slots.map((s) => s.day))
      ].sort(
        (a, b) =>
          DAY_ORDER.indexOf(a) -
          DAY_ORDER.indexOf(b)
      );

      const startTime = data.slots.reduce(
        (min, s) => s.startTime < min ? s.startTime : min,
        data.slots[0].startTime
      );

      const endTime = data.slots.reduce(
        (max, s) => s.endTime > max ? s.endTime : max,
        data.slots[0].endTime
      );

      return { days, startTime, endTime };
    }

    return data;
  }

  // =========================
  // DEADLINES
  // =========================

  static async getDeadlines() {

    return await Deadline.getAll();
  }

  // =========================
  // PRIORITY SCORE
  // =========================

  static calculatePriority(deadline) {

    const now =
      new Date();

    const due =
      new Date(deadline.dueDate);

    const diffDays =
      Math.ceil(

        (due - now)

        /

        (1000 * 60 * 60 * 24)
      );

    let score = 0;

    if (diffDays <= 2) {

      score += 100;

    } else if (diffDays <= 5) {

      score += 70;

    } else if (diffDays <= 10) {

      score += 40;

    } else {

      score += 15;
    }

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
  // ADD HOURS
  // =========================

  static addHours(
    time,
    hoursToAdd
  ) {

    let [hours, minutes] =

      time
      .split(":")
      .map(Number);

    hours += hoursToAdd;

    if (hours >= 24) {

      hours -= 24;
    }

    return `

      ${String(hours).padStart(2, '0')}

      :

      ${String(minutes).padStart(2, '0')}

    `.replace(/\s/g, "");
  }

  // =========================
  // GENERATE PLAN
  // =========================

  static async generateWeeklyPlan() {

    const btn =
      document.getElementById(
        "generate-plan-btn"
      );

    if (btn) {
      btn.disabled = true;
      btn.textContent = "Generating…";
    }

    const userId =
      this.getUserId();

    if (!userId) {

      showToast(
        "Please login first.",
        "error"
      );

      if (btn) {
        btn.disabled = false;
        btn.textContent =
          "Generate Weekly Study Plan";
      }

      return;
    }

    const availability =
      await this.getAvailability();

    if (
      !availability ||
      !availability.days.length
    ) {

      showToast(
        "Please set your availability first.",
        "error"
      );

      return;
    }

    const allDeadlines =
      await this.getDeadlines();

    // remove completed deadlines
    // sort nearest first

    const deadlines =

      allDeadlines

      .filter(
        deadline =>
          !deadline.completed
      )

      .sort(

        (a, b) =>

          new Date(a.dueDate) -
          new Date(b.dueDate)
      );

    const courses =
      await this.getCourses();

    if (!courses.length) {

      showToast(
        "Add courses first.",
        "error"
      );

      return;
    }

    if (!deadlines.length) {

      showToast(
        "No active deadlines found.",
        "error"
      );

      return;
    }

    // remove old plans

    await this.clearExistingPlans();

    const generatedSessions = [];

    let currentDayIndex = 0;

    let currentHour =

      parseInt(
        availability.startTime
        .split(":")[0]
      );

    const startHour =

      parseInt(
        availability.startTime
        .split(":")[0]
      );

    const endHour =

      parseInt(
        availability.endTime
        .split(":")[0]
      );

    for (

      let i = 0;

      i < deadlines.length;

      i++

    ) {

      const deadline =
        deadlines[i];

      const dueDate =
        new Date(deadline.dueDate);

      // =========================
      // START STUDY BEFORE DEADLINE
      // =========================

      const studyDate =
        new Date(dueDate);

      let daysBefore = 3;

      if (
        deadline.priority === "High"
      ) {

        daysBefore = 5;

      } else if (

        deadline.priority === "Medium"

      ) {

        daysBefore = 3;

      } else {

        daysBefore = 2;
      }

      studyDate.setDate(

        dueDate.getDate() -
        daysBefore
      );

      // =========================
      // MOVE TO NEXT DAY
      // =========================

      if (
        currentHour + 2 > endHour
      ) {

        currentDayIndex++;

        currentHour =
          startHour;
      }

      const startTime =

        `${String(currentHour)
        .padStart(2, '0')}:00`;

      const endTime =

        this.addHours(
          startTime,
          2
        );

      // =========================
      // SESSION OBJECT
      // =========================

      const session = {

        title:
          deadline.title,

        course:
          deadline.course,

        dueDate:
          deadline.dueDate,

        studyDate:

          studyDate
          .toISOString()
          .split("T")[0],

        day:

          availability.days[

            currentDayIndex
            %
            availability.days.length
          ],

        startTime,

        endTime,

        priority:
          deadline.priority,

        status:
          "pending",

        userId,

        createdAt:
          new Date().toISOString()
      };

      generatedSessions.push(
        session
      );

      currentHour += 2;

      // break after every 2 sessions

      if ((i + 1) % 2 === 0) {

        currentHour += 1;
      }
    }

    // =========================
    // SAVE SESSIONS
    // =========================

    for (
      const session
      of generatedSessions
    ) {

      await addDoc(

        this.collectionRef,

        session
      );
    }

    showToast(

      "Smart study plan generated!",

      "success"
    );

    await this.renderStudyPlan();

    if (btn) {
      btn.disabled = false;
      btn.textContent =
        "Generate Weekly Study Plan";
    }
  }

  // =========================
  // CLEAR OLD PLANS
  // =========================

  static async clearExistingPlans() {

    const userId =
      this.getUserId();

    const q = query(

      this.collectionRef,

      where(
        "userId",
        "==",
        userId
      )
    );

    const snapshot =
      await getDocs(q);

    for (
      const docItem
      of snapshot.docs
    ) {

      await deleteDoc(

        doc(
          db,
          "studyPlans",
          docItem.id
        )
      );
    }
  }

  // =========================
  // GET PLANS
  // =========================

  static async getPlans() {

    const userId =
      this.getUserId();

    const q = query(

      this.collectionRef,

      where(
        "userId",
        "==",
        userId
      )
    );

    const snapshot =
      await getDocs(q);

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
  // COMPLETE
  // =========================

  static async markCompleted(id) {

    const ref =

      doc(
        db,
        "studyPlans",
        id
      );

    await updateDoc(ref, {

      status: "completed"
    });

    showToast(
      "Session completed!",
      "success"
    );

    await this.renderStudyPlan();
  }

  // =========================
  // MISSED
  // =========================

  static async markMissed(id) {

    const ref =

      doc(
        db,
        "studyPlans",
        id
      );

    await updateDoc(ref, {

      status: "missed"
    });

    showToast(
      "Session marked as missed.",
      "info"
    );

    await this.renderStudyPlan();
  }

  // =========================
  // RENDER PLAN
  // =========================

  static async renderStudyPlan() {

    const tableBody =

      document.getElementById(
        "study-plan-body"
      );

    if (!tableBody) return;

    tableBody.innerHTML = `
      <tr>
        <td colspan="6" class="plan-loading">
          <span class="plan-spinner"></span>
          Loading your study plan…
        </td>
      </tr>
    `;

    const plans =
      await this.getPlans();

    if (!plans.length) {

      tableBody.innerHTML = `

        <tr>

          <td colspan="6">

            No study plan generated yet.

          </td>

        </tr>

      `;

      return;
    }

    // nearest sessions first

    plans.sort(

      (a, b) =>

        new Date(a.studyDate) -
        new Date(b.studyDate)
    );

    tableBody.innerHTML =

      plans.map((plan) => {

        return `

          <tr>

            <td>
              ${plan.studyDate || "N/A"}
            </td>

            <td>
              ${plan.day}
            </td>

            <td>
              ${plan.course}
            </td>

            <td>

              ${plan.startTime}

              -

              ${plan.endTime}

            </td>

            <td>

              <span class="planner-status ${plan.status}">

                ${plan.status}

              </span>

            </td>

            <td>

              <button
                onclick="
                  StudyPlanner.markCompleted(
                    '${plan.id}'
                  )
                "
              >

                Complete

              </button>

              <button
                onclick="
                  StudyPlanner.markMissed(
                    '${plan.id}'
                  )
                "
              >

                Missed

              </button>

            </td>

          </tr>

        `;
      }).join("");
  }
}

window.StudyPlanner =
  StudyPlanner;

export { StudyPlanner };