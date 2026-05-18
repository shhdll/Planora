import { db, auth } from "./firebase-config.js";

import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  updateDoc,
  doc,
  deleteDoc,
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

import { Deadline } from "./deadlines.js";
import { showToast } from "./utils.js";

class StudyPlanner {
  // COLLECTION

  static get collectionRef() {
    return collection(db, "studyPlans");
  }

  // USER ID

  static getUserId() {
    const user = auth.currentUser;

    return user ? user.uid : null;
  }

  // COURSES

  static async getCourses() {
    const userId = this.getUserId();

    if (!userId) return [];

    const q = query(
      collection(db, "courses"),

      where("userId", "==", userId),
    );

    const snapshot = await getDocs(q);

    const courses = [];

    snapshot.forEach((docItem) => {
      courses.push({
        id: docItem.id,

        ...docItem.data(),
      });
    });

    return courses;
  }

  // AVAILABILITY

  static async getAvailability() {
    const userId = this.getUserId();

    if (!userId) return null;

    const q = query(
      collection(db, "availability"),

      where("userId", "==", userId),
    );

    const snapshot = await getDocs(q);

    if (snapshot.empty) return null;

    const data = snapshot.docs[0].data();

    if (Array.isArray(data.slots) && data.slots.length > 0) {
      const DAY_ORDER = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];

      const days = [...new Set(data.slots.map((s) => s.day))].sort(
        (a, b) => DAY_ORDER.indexOf(a) - DAY_ORDER.indexOf(b),
      );

      const startTime = data.slots.reduce((min, s) => (s.startTime < min ? s.startTime : min), data.slots[0].startTime);

      const endTime = data.slots.reduce((max, s) => (s.endTime > max ? s.endTime : max), data.slots[0].endTime);

      return { days, startTime, endTime };
    }

    return data;
  }

  // AVAILABILITY SLOTS

  static async getAvailabilitySlots() {
    const userId = this.getUserId();
    if (!userId) return [];

    const q = query(collection(db, "availability"), where("userId", "==", userId));

    const snapshot = await getDocs(q);
    if (snapshot.empty) return [];

    const data = snapshot.docs[0].data();

    if (Array.isArray(data.slots) && data.slots.length > 0 && data.slots[0].day) {
      return data.slots;
    }

    if (Array.isArray(data.slots) && data.slots.length > 0 && data.slots[0].days) {
      const perDay = [];
      data.slots.forEach((slot) => {
        slot.days.forEach((day) => {
          perDay.push({ day, startTime: slot.startTime, endTime: slot.endTime });
        });
      });
      return perDay;
    }

    if (Array.isArray(data.days) && data.days.length) {
      return data.days.map((day) => ({
        day,
        startTime: data.startTime,
        endTime: data.endTime,
      }));
    }

    return [];
  }

  // DEADLINES

  static async getDeadlines() {
    return await Deadline.getAll();
  }

  // PRIORITY

  static calculatePriority(deadline) {
    const now = new Date();

    const due = new Date(deadline.dueDate);

    const diffDays = Math.ceil((due - now) / (1000 * 60 * 60 * 24));

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
      case "High":
        score += 50;
        break;

      case "Medium":
        score += 30;
        break;

      case "Low":
        score += 10;
        break;
    }

    return score;
  }

  // TIME HELPERS

  static toLocalDateStr(date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }

  static toMinutes(time) {
    const [h, m] = time.split(":").map(Number);
    return h * 60 + m;
  }

  static fromMinutes(mins) {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
  }

  // Snap to nearest :00 or :30 that is >= the given minute value
  static snapToHalf(mins) {
    const remainder = mins % 30;
    return remainder === 0 ? mins : mins + (30 - remainder);
  }

  // GENERATE PLAN

  static async generateWeeklyPlan() {
    const btn = document.getElementById("generate-plan-btn");

    if (btn) {
      btn.disabled = true;
      btn.textContent = "Generating…";
    }

    const userId = this.getUserId();

    if (!userId) {
      showToast("Please login first.", "error");

      if (btn) {
        btn.disabled = false;
        btn.textContent = "Generate Weekly Study Plan";
      }

      return;
    }

    const availSlots = await this.getAvailabilitySlots();

    if (!availSlots.length) {
      showToast("Please set your availability first.", "error");

      if (btn) {
        btn.disabled = false;
        btn.textContent = "Generate Weekly Study Plan";
      }

      return;
    }

    const allDeadlines = await this.getDeadlines();

    const deadlines = allDeadlines
      .filter((d) => !d.completed)
      .sort((a, b) => this.calculatePriority(b) - this.calculatePriority(a));

    const courses = await this.getCourses();

    if (!courses.length) {
      showToast("Add courses first.", "error");

      if (btn) {
        btn.disabled = false;
        btn.textContent = "Generate Weekly Study Plan";
      }

      return;
    }

    if (!deadlines.length) {
      showToast("No active deadlines found.", "error");

      if (btn) {
        btn.disabled = false;
        btn.textContent = "Generate Weekly Study Plan";
      }

      return;
    }

    await this.clearExistingPlans();

    const DAY_CODES = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const weekDays = [];

    for (let i = 0; i < 7; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      weekDays.push(d);
    }

    const slotsByDay = {};

    availSlots.forEach((s) => {
      if (!slotsByDay[s.day]) slotsByDay[s.day] = [];
      slotsByDay[s.day].push(s);
    });

    const generatedSessions = [];
    let deadlineIndex = 0;

    for (const date of weekDays) {
      if (deadlineIndex >= deadlines.length) break;

      const dayCode = DAY_CODES[date.getDay()];
      const daySlots = slotsByDay[dayCode] || [];

      for (const slot of daySlots) {
        let current = this.snapToHalf(this.toMinutes(slot.startTime));
        const slotEnd = this.toMinutes(slot.endTime);

        while (current + 120 <= slotEnd && deadlineIndex < deadlines.length) {
          const deadline = deadlines[deadlineIndex];

          generatedSessions.push({
            title: deadline.title,
            course: deadline.course,
            dueDate: deadline.dueDate,
            studyDate: this.toLocalDateStr(date),
            day: dayCode,
            startTime: this.fromMinutes(current),
            endTime: this.fromMinutes(current + 120),
            priority: deadline.priority,
            status: "pending",
            userId,
            createdAt: new Date().toISOString(),
          });

          current += 120;
          deadlineIndex++;
        }
      }
    }

    // SAVE SESSIONS

    for (const session of generatedSessions) {
      await addDoc(
        this.collectionRef,

        session,
      );
    }

    showToast(
      "Smart study plan generated!",

      "success",
    );

    await this.renderStudyPlan();

    if (btn) {
      btn.disabled = false;
      btn.textContent = "Generate Weekly Study Plan";
    }
  }

  // CLEAR OLD PLANS
  static async clearExistingPlans() {
    const userId = this.getUserId();

    const q = query(
      this.collectionRef,

      where("userId", "==", userId),
    );

    const snapshot = await getDocs(q);

    for (const docItem of snapshot.docs) {
      await deleteDoc(doc(db, "studyPlans", docItem.id));
    }
  }

  // GET PLANS
  static async getPlans() {
    const userId = this.getUserId();

    const q = query(
      this.collectionRef,

      where("userId", "==", userId),
    );

    const snapshot = await getDocs(q);

    const plans = [];

    snapshot.forEach((docItem) => {
      plans.push({
        id: docItem.id,

        ...docItem.data(),
      });
    });

    return plans;
  }

  // COMPLETE
  static async markCompleted(id) {
    const ref = doc(db, "studyPlans", id);

    await updateDoc(ref, {
      status: "completed",
    });

    showToast("Session completed!", "success");

    await this.renderStudyPlan();
  }

  // RESCHEDULE
  static async reschedule(missed) {
    const availSlots = await this.getAvailabilitySlots();
    if (!availSlots.length) return false;

    const allPlans = await this.getPlans();

    // EXCLUDE the missed session and only take OTHER pending sessions
    const taken = allPlans
        .filter((p) => p.status === "pending" && p.id !== missed.id)
        .map((p) => `${p.studyDate}|${p.startTime}`);

    const DAY_CODES = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];

    const slotsByDay = {};
    availSlots.forEach((s) => {
        if (!slotsByDay[s.day]) slotsByDay[s.day] = [];
        slotsByDay[s.day].push(s);
    });

    // Search the next 7 days for a free 2-hour window
    const start = new Date();
    start.setDate(start.getDate() + 1);
    start.setHours(0, 0, 0, 0);

    for (let i = 0; i < 7; i++) {
        const date = new Date(start);
        date.setDate(start.getDate() + i);

        const dayCode = DAY_CODES[date.getDay()];
        const dateStr = this.toLocalDateStr(date);
        const daySlots = slotsByDay[dayCode] || [];

        for (const slot of daySlots) {
            let current = this.snapToHalf(this.toMinutes(slot.startTime));
            const slotEnd = this.toMinutes(slot.endTime);

            while (current + 120 <= slotEnd) {
                const startTime = this.fromMinutes(current);
                const endTime = this.fromMinutes(current + 120);
                const slotKey = `${dateStr}|${startTime}`;

                // Check if this slot is already taken
                if (!taken.includes(slotKey)) {
                    // Also check if this is the same as the original missed session
                    const isSameAsOriginal = (dateStr === missed.studyDate && startTime === missed.startTime);

                    if (!isSameAsOriginal) {
                        await addDoc(this.collectionRef, {
                            title: missed.title,
                            course: missed.course,
                            dueDate: missed.dueDate,
                            studyDate: dateStr,
                            day: dayCode,
                            startTime: startTime,
                            endTime: endTime,
                            priority: missed.priority,
                            status: "pending",
                            rescheduled: true,
                            rescheduledFrom: missed.id,
                            userId: this.getUserId(),
                            createdAt: new Date().toISOString(),
                        });

                        return true;
                    }
                }

                current += 120;
            }
        }
    }

    return false;
}

  // MISSED
  static async markMissed(id) {
    const allPlans = await this.getPlans();
    const missed = allPlans.find((p) => p.id === id);

    if (!missed) return;

    // First, mark the current session as missed
    await updateDoc(doc(db, "studyPlans", id), {
        status: "missed",
        missedAt: new Date().toISOString()
    });

    // Then try to reschedule to a different day/time
    const rescheduled = await this.reschedule(missed);

    showToast(
        rescheduled
            ? "Session missed — rescheduled to the next available slot."
            : "Session missed. No free slot found in the next 7 days.",
        "info",
    );

    await this.renderStudyPlan();
}

  // RENDER PLAN

  static async renderStudyPlan() {
    const tableBody = document.getElementById("study-plan-body");

    if (!tableBody) return;

    tableBody.innerHTML = `
      <tr>
        <td colspan="5" class="plan-loading">
          <span class="plan-spinner"></span>
          Loading your study plan…
        </td>
      </tr>
    `;

    const plans = await this.getPlans();

    if (!plans.length) {
      tableBody.innerHTML = `
        <tr>
          <td colspan="5" style="text-align:center; color:#94a3b8; padding:32px;">
            No study plan generated yet.
          </td>
        </tr>
      `;

      return;
    }

    plans.sort((a, b) => new Date(a.studyDate) - new Date(b.studyDate));

    const DAY_LABELS = {
      sun: "Sunday",
      mon: "Monday",
      tue: "Tuesday",
      wed: "Wednesday",
      thu: "Thursday",
      fri: "Friday",
      sat: "Saturday",
    };

    const fmtDate = (d) => {
      if (!d) return "N/A";
      const [y, m, day] = d.split("-");
      return new Date(y, m - 1, day).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
    };

    const fmtTime = (t) => {
      if (!t) return "";
      const [h, min] = t.split(":");
      const hour = parseInt(h, 10);
      return `${hour % 12 || 12}:${min} ${hour >= 12 ? "PM" : "AM"}`;
    };

    tableBody.innerHTML = plans
      .map((plan) => {
        const isPending = plan.status === "pending";

        const statusCell = isPending
          ? `<button onclick="StudyPlanner.markCompleted('${plan.id}')">Complete</button>
           <button onclick="StudyPlanner.markMissed('${plan.id}')">Missed</button>`
          : `<span class="planner-status ${plan.status}">${plan.status}</span>`;

        return `
        <tr>
          <td>${DAY_LABELS[plan.day] || plan.day}</td>
          <td>${fmtDate(plan.studyDate)}</td>
          <td>${plan.course}</td>
          <td>${fmtTime(plan.startTime)} – ${fmtTime(plan.endTime)}</td>
          <td>${statusCell}</td>
        </tr>
      `;
      })
      .join("");
  }
}

window.StudyPlanner = StudyPlanner;

export { StudyPlanner };
