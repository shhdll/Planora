// Courses

// Storage helpers

function getCoursesKey() {
  const user = Session.getUser();
  return user ? `courses_${user.id}` : null;
}

function getCourses() {
  const key = getCoursesKey();
  return key ? Storage.get(key) || [] : [];
}

function saveCourses(courses) {
  const key = getCoursesKey();
  if (key) Storage.set(key, courses);
}

// courses.html — build the <ul id="courses-list"> from localStorage

function renderCourses() {
  const list = document.getElementById("courses-list");
  if (!list) return;

  const courses = getCourses();

  if (courses.length === 0) {
    list.innerHTML = "<li>No courses added yet.</li>";
    return;
  }

  list.innerHTML = courses
    .map(
      (c) => `
      <li>
        <strong>${c.name}</strong> (${c.code})
        ${c.instructor ? ` — ${c.instructor}` : ""}
        ${c.creditHours ? ` | ${c.creditHours} credit hrs` : ""}
        <br>
        <a href="edit-course.html?id=${c.id}">Edit</a> &nbsp;|&nbsp;
        <a href="remove-course.html?id=${c.id}">Remove</a> &nbsp;|&nbsp;
        <a href="deadlines.html?courseId=${c.id}">Add Deadline</a>
      </li>`
    )
    .join("");
}

// add-course.html — create and save a new course

function handleAddCourse(event) {
  event.preventDefault();

  const name        = document.getElementById("courseName").value.trim();
  const code        = document.getElementById("courseCode").value.trim();
  const instructor  = document.getElementById("instructor").value.trim();
  const creditHours = document.getElementById("creditHours").value;

  if (!name || !code) {
    showToast("Course name and code are required.", "error");
    return;
  }

  const courses = getCourses();

  const duplicate = courses.find(
    (c) => c.code.toLowerCase() === code.toLowerCase()
  );
  if (duplicate) {
    showToast(`A course with code "${code}" already exists.`, "error");
    return;
  }

  const newCourse = {
    id: Date.now().toString(),
    name,
    code,
    instructor,
    creditHours: creditHours ? parseInt(creditHours) : null,
    createdAt: new Date().toISOString(),
  };

  courses.push(newCourse);
  saveCourses(courses);

  showToast(`"${name}" added successfully!`, "success");

  setTimeout(() => {
    window.location.href = "courses.html";
  }, 1000);
}

// edit-course.html — pre-fill the form from the ?id= query param

function loadEditForm() {
  const id = new URLSearchParams(window.location.search).get("id");
  if (!id) {
    showToast("No course selected.", "error");
    return;
  }

  const course = getCourses().find((c) => c.id === id);
  if (!course) {
    showToast("Course not found.", "error");
    return;
  }

  document.getElementById("courseId").value      = course.id;
  document.getElementById("courseName").value    = course.name;
  document.getElementById("courseCode").value    = course.code;
  document.getElementById("instructor").value    = course.instructor  || "";
  document.getElementById("creditHours").value   = course.creditHours || "";
}

// edit-course.html — save updated course back to localStorage

function handleEditCourse(event) {
  event.preventDefault();

  const id          = document.getElementById("courseId").value;
  const name        = document.getElementById("courseName").value.trim();
  const code        = document.getElementById("courseCode").value.trim();
  const instructor  = document.getElementById("instructor").value.trim();
  const creditHours = document.getElementById("creditHours").value;

  if (!name || !code) {
    showToast("Course name and code are required.", "error");
    return;
  }

  const courses = getCourses();

  const duplicate = courses.find(
    (c) => c.code.toLowerCase() === code.toLowerCase() && c.id !== id
  );
  if (duplicate) {
    showToast(`Another course already uses code "${code}".`, "error");
    return;
  }

  const index = courses.findIndex((c) => c.id === id);
  if (index === -1) {
    showToast("Course not found.", "error");
    return;
  }

  courses[index] = {
    ...courses[index],
    name,
    code,
    instructor,
    creditHours: creditHours ? parseInt(creditHours) : null,
  };

  saveCourses(courses);
  showToast("Course updated successfully!", "success");

  setTimeout(() => {
    window.location.href = "courses.html";
  }, 1000);
}

// remove-course.html — show the course name for confirmation

function loadRemoveConfirm() {
  const id = new URLSearchParams(window.location.search).get("id");
  if (!id) {
    showToast("No course selected.", "error");
    return;
  }

  const course = getCourses().find((c) => c.id === id);
  if (!course) {
    showToast("Course not found.", "error");
    return;
  }

  document.getElementById("courseId").value        = course.id;
  document.getElementById("course-name-display").textContent =
    `${course.name} (${course.code})`;
}

// remove-course.html — delete the course from localStorage

function handleRemoveCourse(event) {
  event.preventDefault();

  const id = document.getElementById("courseId").value;

  const courses = getCourses();
  const updated = courses.filter((c) => c.id !== id);

  if (updated.length === courses.length) {
    showToast("Course not found.", "error");
    return;
  }

  saveCourses(updated);
  showToast("Course removed.", "success");

  setTimeout(() => {
    window.location.href = "courses.html";
  }, 1000);
}
