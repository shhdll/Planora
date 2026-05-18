import { db, auth } from './firebase-config.js';
import { Session, showToast } from './utils.js';
import { getCourses } from './courses.js';

import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

// Deadlines Class

class Deadline {

  constructor(
    title,
    course,
    dueDate,
    priority = "Medium",
    description = "",
    completed = false,
    id = null
  ) {

    this.id = id;
    this.title = title;
    this.course = course;
    this.dueDate = dueDate;
    this.priority = priority;
    this.description = description;
    this.completed = completed;
  }

  static getCurrentUserId(passedUser = null) {

    if (passedUser?.uid) {
      return passedUser.uid;
    }

    const currentUser = auth.currentUser;

    return currentUser ? currentUser.uid : null;
  }

  // Get all deadlines
  static async getAll(passedUser = null) {

    const userId =
      this.getCurrentUserId(passedUser);

    if (!userId) {

      console.warn(
        "No valid user ID found."
      );

      return [];
    }

    try {

      const q = query(
        collection(db, "deadlines"),
        where("userId", "==", userId)
      );

      const querySnapshot =
        await getDocs(q);

      const deadlines = [];

      querySnapshot.forEach(
        (document) => {

          const data =
            document.data();

          deadlines.push(

            new Deadline(
              data.title,
              data.course,
              data.dueDate,
              data.priority,
              data.description,
              data.completed,
              document.id
            )
          );
        }
      );

      console.log(
        "Deadlines loaded:",
        deadlines
      );

      return deadlines;

    } catch (error) {

      console.error(
        "Error getting deadlines:",
        error
      );

      return [];
    }
  }

  async save() {

    const userId =
      Deadline.getCurrentUserId();

    if (!userId) {

      console.error(
        "No user logged in."
      );

      return;
    }

    try {

      const deadlineData = {

        title: this.title,
        course: this.course,
        dueDate: this.dueDate,
        priority: this.priority,
        description: this.description,
        completed: this.completed,
        userId: userId,
        createdAt:
          new Date().toISOString()
      };

      const docRef =
        await addDoc(
          collection(db, "deadlines"),
          deadlineData
        );

      this.id = docRef.id;

      console.log(
        "Deadline added:",
        this.id
      );

    } catch (error) {

      console.error(
        "Error saving deadline:",
        error
      );
    }
  }

  // Validate form
  validate() {

    if (!this.title.trim()) {
      return "Deadline title is required.";
    }

    if (!this.course.trim()) {
      return "Course name is required.";
    }

    if (!this.dueDate) {
      return "Due date is required.";
    }

    const dateOnly = this.dueDate.split("T")[0];

    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateOnly)) {
      return "Please enter a valid date.";
    }

    const today = new Date();
    const todayStr = [
      today.getFullYear(),
      String(today.getMonth() + 1).padStart(2, "0"),
      String(today.getDate()).padStart(2, "0")
    ].join("-");

    if (dateOnly < todayStr) {
      return "The deadline date has already passed.";
    }

    return null;
  }

  // Toggle complete
  async toggleComplete() {

    this.completed =
      !this.completed;

    try {

      const deadlineRef =
        doc(
          db,
          "deadlines",
          this.id
        );

      await updateDoc(
        deadlineRef,
        {
          completed:
            this.completed
        }
      );

    } catch (error) {

      console.error(
        "Error toggling deadline:",
        error
      );
    }
  }

  static async delete(id) {

    if (!id) return;

    try {

      await deleteDoc(
        doc(
          db,
          "deadlines",
          id
        )
      );

      console.log(
        "Deadline deleted:",
        id
      );

    } catch (error) {

      console.error(
        "Error deleting deadline:",
        error
      );
    }
  }

  static async findById(id) {

    const deadlines =
      await this.getAll(
        auth.currentUser
      );

    return deadlines.find(
      (deadline) =>
        deadline.id === id
    );
  }

  static escapeHtml(str) {

    if (!str) return "";

    return String(str).replace(
      /[&<>]/g,
      function(m) {

        if (m === '&')
          return '&amp;';

        if (m === '<')
          return '&lt;';

        if (m === '>')
          return '&gt;';

        return m;
      }
    );
  }

  static async render(
    containerId = "deadlines-list"
  ) {

    const container =
      document.getElementById(
        containerId
      );

    if (!container) return;

    const deadlines =
      await this.getAll(
        auth.currentUser
      );

    if (
      deadlines.length === 0
    ) {

      container.innerHTML = `
        <p style="
          color:#64748b;
          font-size:0.95rem;
          text-align:center;
          width:100%;
          margin-top:40px;
        ">
          No deadlines added yet.
        </p>
      `;

      return;
    }

    deadlines.sort(

      (a, b) =>
        new Date(a.dueDate) -
        new Date(b.dueDate)
    );

    const now = new Date();

    container.innerHTML =
      deadlines.map(
        (deadline) => {

          const isOverdue =
            !deadline.completed &&
            new Date(deadline.dueDate) < now;

          const cardClass = deadline.completed
            ? "completed"
            : isOverdue ? "overdue" : "";

          return `

        <div class="deadline-card ${cardClass}">

          <div class="deadline-header">

            <h3>
              ${this.escapeHtml(deadline.title)}
            </h3>

            <div style="display:flex;align-items:center;gap:8px;">
              ${isOverdue ? `<span class="deadline-overdue-badge">Overdue</span>` : ""}
              <span class="priority ${deadline.priority.toLowerCase()}">
                ${deadline.priority}
              </span>
            </div>

          </div>

          <p>
            <strong>Course:</strong>
            ${this.escapeHtml(deadline.course)}
          </p>

          <p>
            <strong>Due:</strong>
            ${new Date(deadline.dueDate).toLocaleString()}
          </p>

          <div class="deadline-actions">

            <button
              onclick="window.toggleDeadline('${deadline.id}')"
            >
              ${deadline.completed ? "Undo" : "Complete"}
            </button>

            <button
              onclick="window.removeDeadline('${deadline.id}')"
            >
              Delete
            </button>

          </div>

        </div>

      `;
        }
      ).join("");
  }

  static fromForm() {

    const title =
      document.getElementById(
        "deadline-title"
      ).value;

    const course =
      document.getElementById(
        "deadline-course"
      ).value;

    const date =
      document.getElementById(
        "deadline-date"
      ).value;

    const time =
      document.getElementById(
        "deadline-time"
      ).value;

    const dueDate =
      time
        ? `${date}T${time}`
        : date;

    const priority =
      document.getElementById(
        "deadline-priority"
      ).value;

    const description =
      document.getElementById(
        "deadline-description"
      ).value;

    return new Deadline(

      title,
      course,
      dueDate,
      priority,
      description
    );
  }
}

async function populateCourseDropdown() {

  const select =
    document.getElementById(
      "deadline-course"
    );

  if (!select) return;

  const courses =
    await getCourses(auth.currentUser);

  if (!courses.length) {

    select.innerHTML =
      `<option value="" disabled selected>No courses added yet</option>`;

    return;
  }

  select.innerHTML =
    `<option value="" disabled selected>Select a course</option>` +
    courses
      .map(
        (c) =>
          `<option value="${c.code}">${c.name} (${c.code})</option>`
      )
      .join("");
}

async function initDeadlinesPage() {

  Session.require();

  const dateInput =
    document.getElementById("deadline-date");

  if (dateInput) {
    const today = new Date();
    dateInput.min = [
      today.getFullYear(),
      String(today.getMonth() + 1).padStart(2, "0"),
      String(today.getDate()).padStart(2, "0")
    ].join("-");
  }

  await populateCourseDropdown();
  await Deadline.render();
}

async function handleDeadlineSubmit(event) {

  event.preventDefault();

  const dateValue =
    document.getElementById(
      "deadline-date"
    ).value;

  if (!dateValue) {
    showToast("Due date is required.", "error");
    return;
  }

  const today = new Date();
  const todayStr = [
    today.getFullYear(),
    String(today.getMonth() + 1).padStart(2, "0"),
    String(today.getDate()).padStart(2, "0")
  ].join("-");

  if (dateValue < todayStr) {
    showToast("The deadline date has already passed.", "error");
    return;
  }

  const deadline =
    Deadline.fromForm();

  const error =
    deadline.validate();

  if (error) {

    showToast(
      error,
      "error"
    );

    return;
  }

  await deadline.save();

  showToast(
    "Deadline added successfully!",
    "success"
  );

  document
    .getElementById(
      "deadline-form"
    )
    .reset();

  await Deadline.render();
}

async function toggleDeadline(id) {

  const deadline =
    await Deadline.findById(id);

  if (!deadline) return;

  await deadline.toggleComplete();

  await Deadline.render();
}

async function removeDeadline(id) {

  await Deadline.delete(id);

  showToast(
    "Deadline removed.",
    "success"
  );

  await Deadline.render();
}

window.toggleDeadline =
  toggleDeadline;

window.removeDeadline =
  removeDeadline;

document.addEventListener(
  "DOMContentLoaded",
  () => {

    auth.onAuthStateChanged(
      async (user) => {

        if (!user) return;

        await initDeadlinesPage();

        const form =
          document.getElementById(
            "deadline-form"
          );

        if (form) {

          form.addEventListener(
            "submit",
            handleDeadlineSubmit
          );
        }
      }
    );
  }
);

export { Deadline };