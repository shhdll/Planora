// Deadlines Class

class Deadline {
  constructor(title,course,dueDate,priority = "Medium",description = "",completed = false,id = Date.now()) {
    this.id = id;
    this.title = title;
    this.course = course;
    this.dueDate = dueDate;
    this.priority = priority;
    this.description = description;
    this.completed = completed;
  }

// create a unique storage name for user's deadlines (if a user is logged in).
  static getStorageKey() {
    const user = Session.getUser(); // the user currently logged in
    return user ? `deadlines_${user.id}` : null;
  }

  // Load all deadlines from local storage
  static getAll() {
    const key = this.getStorageKey();
    if (!key) // if key does not exist
        return []; // no deadlines
    const data = Storage.get(key) || []; // if left side is null/false return empty array on the right
    return data.map((d) => new Deadline( // convert them back into proper deadline objects instead of JSON objects
          d.title,
          d.course,
          d.dueDate,
          d.priority,
          d.description,
          d.completed,
          d.id
        )
    );
  }

  // Save all deadlines back into local storage
  static saveAll(deadlines) {
    const key = this.getStorageKey();
    if (!key) 
        return;
    Storage.set(key, deadlines); // store deadlines array into local storage
  }

  // Add new deadline
  save() {
    const deadlines = Deadline.getAll(); // load all deadlines
    deadlines.push(this); // add items to array deadlines
    Deadline.saveAll(deadlines); // save the array back to storage
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
  toggleComplete() {
    this.completed = !this.completed; // Switch deadline between completed/not completed.
    const deadlines = Deadline.getAll(); // reload all deadlines
    const updated = deadlines.map((deadline) => 
      deadline.id === this.id ? this : deadline // look for the deadline to replace it with the updated version (this)
    );
    Deadline.saveAll(updated); // save the array back to storage
  }

  // Delete deadline
  static delete(id) {
    const deadlines = Deadline.getAll(); // load the deadlines 
    const filtered = deadlines.filter( (deadline) =>
         deadline.id !== id // remove the deadline by its id
    );
    Deadline.saveAll(filtered); // save the array back to local storage
  }

  // Find deadline by ID
  static findById(id) {
    return Deadline.getAll().find( (deadline) => deadline.id == id // find deadline whos id match the given id
    );
  }

  // Render all deadlines (display them on the page)
  static render(containerId = "deadlines-list") {
    const container = document.getElementById(containerId); // the HTML element where deadlines will appear

    if (!container)  // container does not exist
        return;
    const deadlines = Deadline.getAll(); // load the deadlines

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
              <h3>${deadline.title}</h3>
              <span class="priority ${deadline.priority.toLowerCase()}">
                ${deadline.priority}
              </span>
            </div>

            <p><strong>Course:</strong> ${deadline.course}</p>
            <p><strong>Due:</strong> ${
    new Date(deadline.dueDate).toLocaleString()
}</p>

            <p>${deadline.description || "No description provided."}</p>

            <div class="deadline-actions">
              <button onclick="toggleDeadline(${deadline.id})">
                ${deadline.completed ? "Undo" : "Complete"}
              </button>

              <button onclick="removeDeadline(${deadline.id})">
                Delete
              </button>
            </div>
          </div>
        `
      )
      .join("");
  }

  // Create Deadline object from html form
  static fromForm() {

  const title =
    document.getElementById("deadline-title").value;

  const course =
    document.getElementById("deadline-course").value;

  const date =
    document.getElementById("deadline-date").value;

  const time =
    document.getElementById("deadline-time").value;

  const dueDate =
    `${date}T${time}`;

  const priority =
    document.getElementById("deadline-priority").value;

  const description =
    document.getElementById("deadline-description").value;

  return new Deadline(
    title,
    course,
    dueDate,
    priority,
    description
  );
}}

// Initialize page
function initDeadlinesPage() {
  Session.require(); // only logged users access it
  Deadline.render(); // display deadlines
}

// Handle add deadline form when submitted 
function handleDeadlineSubmit(event) {
  event.preventDefault(); // stop page refresh
  const deadline = Deadline.fromForm(); // create object from form
  const error = deadline.validate(); // validate if errors exist

  if (error) { 
    showToast(error, "error"); // show pop-up error
    return;
  }

  deadline.save();
  showToast("Deadline added successfully!", "success");
  document.getElementById("deadline-form").reset(); // clear form field
  Deadline.render(); // refresh list 
}

// Toggle completion
function toggleDeadline(id) {
  const deadline = Deadline.findById(id);

  if (!deadline) 
    return;
  deadline.toggleComplete(); // flip completion state
  Deadline.render(); //refresh
}

// Remove deadline
function removeDeadline(id) {
  Deadline.delete(id);
  showToast("Deadline removed.", "success");
  Deadline.render();
}

// Run page after DOM loads
document.addEventListener("DOMContentLoaded", () => { // wait until page fully loads
  initDeadlinesPage(); // initialize page
  const form = document.getElementById("deadline-form"); // get form element
  if (form) {
    form.addEventListener("submit", handleDeadlineSubmit); // when user sumbits, runn handleDeadlineSubmit()
  }
}
);
