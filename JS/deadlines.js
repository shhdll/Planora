// Import Firebase
import { db, auth } from './firebase-config.js';
import { Session, showToast } from './utils.js';
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

// Deadlines Class (Now with Firestore)

class Deadline {
  constructor(title, course, dueDate, priority = "Medium", description = "", completed = false, id = null) {
    this.id = id || Date.now(); // Use provided id or generate one
    this.title = title;
    this.course = course;
    this.dueDate = dueDate;
    this.priority = priority;
    this.description = description;
    this.completed = completed;
  }

  // Get current user ID from Firebase
  static getCurrentUserId() {
    const user = auth.currentUser;
    return user ? user.uid : null;
  }

  // create a unique storage name for user's deadlines (maintains compatibility)
  static getStorageKey() {
    const user = Session.getUser(); // the user currently logged in
    return user ? `deadlines_${user.id}` : null;
  }

  // Load all deadlines from Firestore
  static async getAll() {
    const userId = this.getCurrentUserId();
    if (!userId) return [];
    
    try {
      const q = query(collection(db, "deadlines"), where("userId", "==", userId));
      const querySnapshot = await getDocs(q);
      const deadlines = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        deadlines.push(new Deadline(
          data.title,
          data.course,
          data.dueDate,
          data.priority,
          data.description,
          data.completed,
          doc.id // Use Firestore document ID
        ));
      });
      return deadlines;
    } catch (error) {
      console.error("Error getting deadlines:", error);
      return [];
    }
  }

  // Save all deadlines back to Firestore (replaces all deadlines for user)
  static async saveAll(deadlines) {
    const userId = this.getCurrentUserId();
    if (!userId) return;
    
    try {
      // Get existing deadlines
      const existingDeadlines = await this.getAll();
      
      // Delete all existing deadlines for this user
      for (const deadline of existingDeadlines) {
        await deleteDoc(doc(db, "deadlines", deadline.id));
      }
      
      // Add all new deadlines
      for (const deadline of deadlines) {
        const deadlineData = {
          title: deadline.title,
          course: deadline.course,
          dueDate: deadline.dueDate,
          priority: deadline.priority,
          description: deadline.description,
          completed: deadline.completed,
          userId: userId
        };
        await addDoc(collection(db, "deadlines"), deadlineData);
      }
    } catch (error) {
      console.error("Error saving deadlines:", error);
    }
  }

  // Add new deadline
  async save() {
    const userId = Deadline.getCurrentUserId();
    if (!userId) return;
    
    try {
      const deadlineData = {
        title: this.title,
        course: this.course,
        dueDate: this.dueDate,
        priority: this.priority,
        description: this.description,
        completed: this.completed,
        userId: userId,
        createdAt: new Date().toISOString()
      };
      
      const docRef = await addDoc(collection(db, "deadlines"), deadlineData);
      this.id = docRef.id; // Update with Firestore ID
    } catch (error) {
      console.error("Error saving deadline:", error);
    }
  }

  // Validate deadline data
  validate() {
    if (!this.title.trim()) { // if no title is written by user
      return "Deadline title is required.";
    }

    if (!this.course.trim()) { // if no course is written by user
      return "Course name is required.";
    }

    if (!this.dueDate) { // if no date is chosen by user
      return "Due date is required.";
    }
    return null; // indicating no errors found
  }

  // Toggle completion status
  async toggleComplete() {
    this.completed = !this.completed; // Switch deadline between completed/not completed
    
    // Update in Firestore
    const userId = Deadline.getCurrentUserId();
    if (userId) {
      try {
        const deadlineRef = doc(db, "deadlines", this.id);
        await updateDoc(deadlineRef, {
          completed: this.completed
        });
      } catch (error) {
        console.error("Error toggling deadline:", error);
      }
    }
  }

  // Delete deadline
  static async delete(id) {
    const userId = Deadline.getCurrentUserId();
    if (!userId) return;
    
    try {
      await deleteDoc(doc(db, "deadlines", id));
    } catch (error) {
      console.error("Error deleting deadline:", error);
    }
  }

  // Find deadline by ID
  static async findById(id) {
    const deadlines = await this.getAll();
    return deadlines.find((deadline) => deadline.id == id);
  }

  // Render all deadlines (display them on the page)
  static async render(containerId = "deadlines-list") {
    const container = document.getElementById(containerId); // the HTML element where deadlines will appear

    if (!container) return; // container does not exist
    
    const deadlines = await this.getAll(); // load the deadlines from Firestore

    if (deadlines.length === 0) { // if deadlines array is empty
      container.innerHTML = `<div class="empty-state"> <p>No deadlines added yet.</p> </div>`;
      return;
    }
    
    deadlines.sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate)); // sort the array by the earliest date

    container.innerHTML = deadlines.map(
        (deadline) => `
          <div class="deadline-card ${
            deadline.completed ? "completed" : ""
          }">
            <div class="deadline-header">
              <h3>${this.escapeHtml(deadline.title)}</h3>
              <span class="priority ${deadline.priority.toLowerCase()}">
                ${deadline.priority}
              </span>
            </div>

            <p><strong>Course:</strong> ${this.escapeHtml(deadline.course)}</p>
            <p><strong>Due:</strong> ${
              new Date(deadline.dueDate).toLocaleString()
            }</p>

            <p>${deadline.description ? this.escapeHtml(deadline.description) : "No description provided."}</p>

            <div class="deadline-actions">
              <button onclick="window.toggleDeadline(${JSON.stringify(deadline.id)})">
                ${deadline.completed ? "Undo" : "Complete"}
              </button>

              <button onclick="window.removeDeadline(${JSON.stringify(deadline.id)})">
                Delete
              </button>
            </div>
          </div>
        `
      )
      .join("");
  }
  
  // Helper to escape HTML
  static escapeHtml(str) {
    if (!str) return "";
    return str.replace(/[&<>]/g, function(m) {
      if (m === '&') return '&amp;';
      if (m === '<') return '&lt;';
      if (m === '>') return '&gt;';
      return m;
    });
  }

  // Create Deadline object from html form
  static fromForm() {
    const title = document.getElementById("deadline-title").value;
    const course = document.getElementById("deadline-course").value;
    const date = document.getElementById("deadline-date").value;
    const time = document.getElementById("deadline-time").value;
    const dueDate = `${date}T${time}`;
    const priority = document.getElementById("deadline-priority").value;
    const description = document.getElementById("deadline-description").value;

    return new Deadline(
      title,
      course,
      dueDate,
      priority,
      description
    );
  }
}

// Initialize page
async function initDeadlinesPage() {
  Session.require(); // only logged users access it
  await Deadline.render(); // display deadlines from Firestore
}

// Handle add deadline form when submitted 
async function handleDeadlineSubmit(event) {
  event.preventDefault(); // stop page refresh
  const deadline = Deadline.fromForm(); // create object from form
  const error = deadline.validate(); // validate if errors exist

  if (error) { 
    showToast(error, "error"); // show pop-up error
    return;
  }

  await deadline.save();
  showToast("Deadline added successfully!", "success");
  document.getElementById("deadline-form").reset(); // clear form field
  await Deadline.render(); // refresh list 
}

// Toggle completion
async function toggleDeadline(id) {
  const deadline = await Deadline.findById(id);
  if (!deadline) return;
  await deadline.toggleComplete(); // flip completion state
  await Deadline.render(); //refresh
}

// Remove deadline
async function removeDeadline(id) {
  await Deadline.delete(id);
  showToast("Deadline removed.", "success");
  await Deadline.render();
}

// Make functions available globally for onclick handlers
window.toggleDeadline = toggleDeadline;
window.removeDeadline = removeDeadline;

// Run page after DOM loads
document.addEventListener("DOMContentLoaded", () => { // wait until page fully loads
  initDeadlinesPage(); // initialize page
  const form = document.getElementById("deadline-form"); // get form element
  if (form) {
    form.addEventListener("submit", handleDeadlineSubmit); // when user submits, run handleDeadlineSubmit()
  }
});

export { Deadline };
