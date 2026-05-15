// Import Firebase
import { db, auth } from './firebase-config.js';
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

// Helper to get active user safely
function getActiveUserId(passedUser) {
  if (passedUser && passedUser.uid) return passedUser.uid;
  const currentUser = auth.currentUser;
  return currentUser ? currentUser.uid : null;
}

// Get courses from Firestore (Accepts passed user context to avoid race conditions)
async function getCourses(passedUser) {
  const userId = getActiveUserId(passedUser);
  if (!userId) {
    console.warn("getCourses called without a valid User ID.");
    return [];
  }
  
  try {
    const q = query(collection(db, "courses"), where("userId", "==", userId));
    const querySnapshot = await getDocs(q);
    const courses = [];
    querySnapshot.forEach((doc) => {
      courses.push({ id: doc.id, ...doc.data() });
    });
    console.log("Courses loaded:", courses); // Debug log
    return courses;
  } catch (error) {
    console.error("Error getting courses:", error);
    return [];
  }
}

// Render courses to the page
async function renderCourses() {
  const list = document.getElementById("courses-list");
  if (!list) {
    console.error("courses-list element not found");
    return;
  }

  console.log("Rendering courses..."); // Debug log
  const courses = await getCourses(auth.currentUser);

  if (courses.length === 0) {
    list.innerHTML = "<li>No courses added yet. <a href='add-course.html'>Add your first course</a></li>";
    return;
  }

  // FIXED: "Remove" link now runs inline, updates the DOM directly, and never leaves courses.html
  list.innerHTML = courses
    .map(
      (c) => `
      <li>
        <strong>${escapeHtml(c.name)}</strong> (${escapeHtml(c.code)})
        ${c.instructor ? ` — ${escapeHtml(c.instructor)}` : ""}
        ${c.creditHours ? ` | ${escapeHtml(c.creditHours)} credit hrs` : ""}
        <br>
        <a href="edit-course.html?id=${c.id}">Edit</a> &nbsp;|&nbsp;
        <a href="javascript:void(0);" onclick="if(confirm('Are you sure you want to remove ${escapeHtml(c.name)}?')) window.inlineDeleteCourse('${c.id}')" style="color: #c0534a; font-weight: 500;">Remove</a> &nbsp;|&nbsp;
        <a href="deadlines.html?courseId=${c.id}">Add Deadline</a>
      </li>`
    )
    .join("");
  
  console.log("Courses rendered, count:", courses.length); // Debug log
}

// Helper to escape HTML
function escapeHtml(str) {
  if (!str) return "";
  return String(str).replace(/[&<>]/g, function(m) {
    if (m === '&') return '&amp;';
    if (m === '<') return '&lt;';
    if (m === '>') return '&gt;';
    return m;
  });
}

// Add a course
async function addCourse(courseData) {
  const userId = getActiveUserId();
  if (!userId) return null;
  
  try {
    const docRef = await addDoc(collection(db, "courses"), {
      ...courseData,
      userId: userId,
      createdAt: new Date().toISOString()
    });
    return { id: docRef.id, ...courseData };
  } catch (error) {
    console.error("Error adding course:", error);
    return null;
  }
}

// Update a course
async function updateCourse(courseId, courseData) {
  try {
    const courseRef = doc(db, "courses", courseId);
    await updateDoc(courseRef, courseData);
    return true;
  } catch (error) {
    console.error("Error updating course:", error);
    return false;
  }
}

// Delete a course
async function deleteCourse(courseId) {
  if (!courseId) {
    console.error("deleteCourse received an empty courseId!");
    return false;
  }
  try {
    await deleteDoc(doc(db, "courses", courseId));
    return true;
  } catch (error) {
    console.error("Error deleting course from Firestore:", error);
    return false;
  }
}

// Handle add course form submission
async function handleAddCourse(event) {
  event.preventDefault();

  const name = document.getElementById("courseName")?.value.trim();
  const code = document.getElementById("courseCode")?.value.trim();
  const instructor = document.getElementById("instructor")?.value.trim();
  const creditHours = document.getElementById("creditHours")?.value;

  if (!name || !code) {
    showToast("Course name and code are required.", "error");
    return;
  }

  const courses = await getCourses(auth.currentUser);
  const duplicate = courses.find(
    (c) => c.code.toLowerCase() === code.toLowerCase()
  );
  if (duplicate) {
    showToast(`A course with code "${code}" already exists.`, "error");
    return;
  }

  const newCourse = {
    name,
    code,
    instructor: instructor || "",
    creditHours: creditHours ? parseInt(creditHours, 10) : null,
  };

  const added = await addCourse(newCourse);
  
  if (added) {
    showToast(`"${name}" added successfully!`, "success");
    setTimeout(() => {
      window.location.href = "courses.html";
    }, 1000);
  } else {
    showToast(`Failed to add "${name}". Please try again.`, "error");
  }
}

// Load edit form
async function loadEditForm() {
  const urlParams = new URLSearchParams(window.location.search);
  const id = urlParams.get("id");
  
  if (!id) {
    showToast("No course selected.", "error");
    return;
  }

  const courses = await getCourses(auth.currentUser);
  const course = courses.find((c) => c.id === id);
  
  if (!course) {
    showToast("Course not found.", "error");
    return;
  }

  const idField = document.getElementById("courseId");
  const nameField = document.getElementById("courseName");
  const codeField = document.getElementById("courseCode");
  const instructorField = document.getElementById("instructor");
  const creditField = document.getElementById("creditHours");

  if (idField) idField.value = course.id;
  if (nameField) nameField.value = course.name;
  if (codeField) codeField.value = course.code;
  if (instructorField) instructorField.value = course.instructor || "";
  if (creditField) creditField.value = course.creditHours || "";
}

// Handle edit course
async function handleEditCourse(event) {
  event.preventDefault();

  const id = document.getElementById("courseId")?.value;
  const name = document.getElementById("courseName")?.value.trim();
  const code = document.getElementById("courseCode")?.value.trim();
  const instructor = document.getElementById("instructor")?.value.trim();
  const creditHours = document.getElementById("creditHours")?.value;

  if (!name || !code) {
    showToast("Course name and code are required.", "error");
    return;
  }

  const courses = await getCourses(auth.currentUser);
  const duplicate = courses.find(
    (c) => c.code.toLowerCase() === code.toLowerCase() && c.id !== id
  );
  if (duplicate) {
    showToast(`Another course already uses code "${code}".`, "error");
    return;
  }

  const updatedCourse = {
    name,
    code,
    instructor: instructor || "",
    creditHours: creditHours ? parseInt(creditHours, 10) : null,
  };

  const success = await updateCourse(id, updatedCourse);
  
  if (success) {
    showToast("Course updated successfully!", "success");
    setTimeout(() => {
      window.location.href = "courses.html";
    }, 1000);
  } else {
    showToast("Failed to update course. Please try again.", "error");
  }
}

// Load remove confirmation (Kept for backwards-compatibility fallback protection)
async function loadRemoveConfirm() {
  const urlParams = new URLSearchParams(window.location.search);
  const id = urlParams.get("id");
  
  if (!id) {
    showToast("No course selected.", "error");
    return;
  }

  const courses = await getCourses(auth.currentUser);
  const course = courses.find((c) => c.id === id);
  
  if (!course) {
    showToast("Course not found.", "error");
    return;
  }

  const idField = document.getElementById("courseId");
  const displaySpan = document.getElementById("course-name-display");
  
  if (idField) idField.value = course.id;
  if (displaySpan) displaySpan.textContent = `${course.name} (${course.code})`;
}

// Handle remove course (Kept for backwards-compatibility fallback protection)
async function handleRemoveCourse(event) {
  event.preventDefault();

  const id = document.getElementById("courseId")?.value;
  
  if (!id) {
    showToast("Cannot process request: Course ID is missing.", "error");
    return;
  }

  const success = await deleteCourse(id);
  
  if (success) {
    showToast("Course removed.", "success");
    setTimeout(() => {
      window.location.href = "courses.html";
    }, 1000);
  } else {
    showToast("Failed to remove course. Please try again.", "error");
  }
}

// Global window mounting to handle execution calls directly from layout strings
window.inlineDeleteCourse = async function(id) {
  if (!id) return;
  
  const success = await deleteCourse(id);
  
  if (success) {
    if (typeof showToast === "function") {
      showToast("Course removed successfully.", "success");
    }
    // Refresh the UI list view instantly to remove the trace element
    await renderCourses(); 
  } else {
    if (typeof showToast === "function") {
      showToast("Failed to remove course. Please try again.", "error");
    }
  }
};

// Export functions
export { 
  renderCourses, 
  handleAddCourse, 
  handleEditCourse, 
  handleRemoveCourse, 
  loadEditForm, 
  loadRemoveConfirm,
  getCourses
};