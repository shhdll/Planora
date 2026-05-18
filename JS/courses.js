// Import Firebase
import { db, auth } from "./firebase-config.js";
import { showToast } from "./utils.js";
import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDoc,
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

function getActiveUserId(passedUser) {
  if (passedUser && passedUser.uid) return passedUser.uid;
  const currentUser = auth.currentUser;
  return currentUser ? currentUser.uid : null;
}

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
      courses.push({ ...doc.data(), id: doc.id });
    });
    console.log("Courses loaded:", courses);
    return courses;
  } catch (error) {
    console.error("Error getting courses:", error);
    return [];
  }
}

const ACCENTS = [
  "linear-gradient(90deg,#6366f1,#8b5cf6)",
  "linear-gradient(90deg,#0ea5e9,#06b6d4)",
  "linear-gradient(90deg,#f59e0b,#ef4444)",
  "linear-gradient(90deg,#10b981,#06b6d4)",
  "linear-gradient(90deg,#f43f5e,#ec4899)",
];

function escapeHtml(str) {
  if (!str) return "";
  return String(str).replace(/[&<>]/g, function (m) {
    if (m === "&") return "&amp;";
    if (m === "<") return "&lt;";
    if (m === ">") return "&gt;";
    return m;
  });
}

async function renderCourses() {
  const container = document.getElementById("courses-list");
  const countEl = document.getElementById("courses-count");

  if (!container) {
    console.error("courses-list element not found");
    return;
  }

  console.log("Rendering courses...");
  const courses = await getCourses(auth.currentUser);

  if (countEl) {
    countEl.textContent = `${courses.length} course${courses.length !== 1 ? "s" : ""} enrolled`;
  }

  if (courses.length === 0) {
    container.innerHTML = `
      <p style="color:#64748b;font-size:0.95rem;text-align:center;width:100%;margin-top:40px;">
        No courses added yet. <a href="add-course.html" style="color:#6366f1;font-weight:600;">Add your first course</a>
      </p>`;
    return;
  }

  container.innerHTML = courses
    .map(
      (c, i) => `
    <div class="course-card">
      <div class="course-card__accent" style="background:${ACCENTS[i % ACCENTS.length]}"></div>
      <div class="course-card__body">
        <div>
          <div class="course-card__name">${escapeHtml(c.name)} <span style="font-weight:500;color:#64748b;font-size:0.9rem;">(${escapeHtml(c.code)})</span></div>
          <div class="course-card__sub">
            ${c.instructor ? escapeHtml(c.instructor) : "No instructor set"}
          </div>
        </div>
        <div class="course-card__badges">
          ${c.creditHours ? `<span class="course-badge course-badge--credits">★ ${escapeHtml(String(c.creditHours))} credit hrs</span>` : ""}
          <span class="course-badge course-badge--active">● Active</span>
        </div>
      </div>
      <div class="course-card__footer">
        <a href="edit-course.html?id=${c.id}" class="course-action course-action--edit">✎ Edit</a>
        <a href="deadlines.html?courseId=${c.id}" class="course-action">+ Deadline</a>
        <button
          class="course-action course-action--remove"
          onclick="if(confirm('Remove ${escapeHtml(c.name)}?')) window.inlineDeleteCourse('${c.id}')"
        >✕ Remove</button>
      </div>
    </div>
  `,
    )
    .join("");

  console.log("Courses rendered, count:", courses.length);
}

async function addCourse(courseData) {
  const userId = getActiveUserId(auth.currentUser);
  if (!userId) return null;

  try {
    const docRef = await addDoc(collection(db, "courses"), {
      ...courseData,
      userId: userId,
      createdAt: new Date().toISOString(),
    });
    return { id: docRef.id, ...courseData };
  } catch (error) {
    console.error("Error adding course:", error);
    return null;
  }
}

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

async function deleteCourse(courseId) {
  if (!courseId) {
    console.error("deleteCourse received an empty courseId!");
    return false;
  }
  try {
    const courseSnap = await getDoc(doc(db, "courses", courseId));
    if (courseSnap.exists()) {
      const courseCode = courseSnap.data().code;
      const userId = getActiveUserId(auth.currentUser);
      if (courseCode && userId) {
        const dlSnap = await getDocs(
          query(collection(db, "deadlines"), where("userId", "==", userId), where("course", "==", courseCode)),
        );
        await Promise.all(dlSnap.docs.map((d) => deleteDoc(doc(db, "deadlines", d.id))));
      }
    }
    await deleteDoc(doc(db, "courses", courseId));
    return true;
  } catch (error) {
    console.error("Error deleting course from Firestore:", error);
    return false;
  }
}

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
  const duplicate = courses.find((c) => c.code.toLowerCase() === code.toLowerCase());
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
    window.location.href = "courses.html";
  } else {
    showToast(`Failed to add "${name}". Please try again.`, "error");
  }
}

async function loadEditForm() {
  const id = new URLSearchParams(window.location.search).get("id");

  if (!id) {
    showToast("No course selected.", "error");
    return;
  }

  try {
    const snap = await getDoc(doc(db, "courses", id));

    if (!snap.exists()) {
      showToast("Course not found.", "error");
      return;
    }

    const course = { ...snap.data(), id: snap.id };

    document.getElementById("courseId").value = course.id;
    document.getElementById("courseName").value = course.name || "";
    document.getElementById("courseCode").value = course.code || "";
    document.getElementById("instructor").value = course.instructor || "";
    document.getElementById("creditHours").value = course.creditHours || "";
  } catch (err) {
    console.error("loadEditForm error:", err);
    showToast("Failed to load course.", "error");
  }
}

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
  const duplicate = courses.find((c) => c.code.toLowerCase() === code.toLowerCase() && c.id !== id);
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
    window.location.href = "courses.html";
  } else {
    showToast("Failed to update course. Please try again.", "error");
  }
}

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

window.inlineDeleteCourse = async function (id) {
  if (!id) return;

  const success = await deleteCourse(id);

  if (success) {
    showToast("Course removed successfully.", "success");
    await renderCourses();
  } else {
    showToast("Failed to remove course. Please try again.", "error");
  }
};

export {
  renderCourses,
  handleAddCourse,
  handleEditCourse,
  handleRemoveCourse,
  loadEditForm,
  loadRemoveConfirm,
  getCourses,
};
