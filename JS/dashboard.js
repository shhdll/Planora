import { auth, db } from './firebase-config.js';
import { Session, DateUtils, showToast } from './utils.js';
import { collection, query, where, getDocs } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { Deadline } from './deadlines.js';

let user = null;

function escapeHtml(str) {
    if (!str) return '';
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

async function loadDashboardData() {
    try {

        // COURSES
        const coursesSnapshot = await getDocs(
            query(collection(db, "courses"), where("userId", "==", user.uid))
        );
        document.getElementById("stat-courses").textContent = coursesSnapshot.size;

        // DEADLINES
        const allDeadlines = await Deadline.getAll();
        const pendingDeadlines = allDeadlines.filter(d => !d.completed);

        document.getElementById("stat-deadlines").textContent = pendingDeadlines.length;

        const deadlineContainer = document.getElementById("dashboard-deadlines-list");

        const upcoming = pendingDeadlines
            .filter(d => d.dueDate && DateUtils.daysUntil(d.dueDate) >= 0)
            .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));

        if (upcoming.length > 0) {
            deadlineContainer.innerHTML = "";
            upcoming.slice(0, 3).forEach((d) => {
                const days = DateUtils.daysUntil(d.dueDate);
                const priority = (d.priority || 'low').toLowerCase();
                const daysLabel = days === 0 ? "Today!" : days === 1 ? "Tomorrow" : `In ${days} days`;

                const div = document.createElement("div");
                div.className = "dash-deadline-item";
                div.innerHTML = `
                    <div class="dash-deadline-dot ${priority}"></div>
                    <div class="dash-deadline-name">${escapeHtml(d.title)} — ${escapeHtml(d.course)}</div>
                    <div class="dash-deadline-date">${daysLabel}</div>
                `;
                deadlineContainer.appendChild(div);
            });
        } else {
            deadlineContainer.innerHTML = `<p class="dash-empty">No upcoming deadlines.</p>`;
        }

        // STUDY PLANS
        const plansSnapshot = await getDocs(
            query(collection(db, "studyPlans"), where("userId", "==", user.uid))
        );

        const allPlans = [];
        plansSnapshot.forEach((docItem) => {
            allPlans.push({ id: docItem.id, ...docItem.data() });
        });

        const todayDate = new Date().toISOString().split("T")[0];

        const todaySessions = allPlans.filter((s) => {
            if (!s.studyDate) return false;
            const sessionDate = new Date(s.studyDate).toISOString().split("T")[0];
            return sessionDate === todayDate;
        });

        const todayDeadlines = allDeadlines.filter((d) => {
            if (!d.dueDate || d.completed) return false;
            const deadlineDate = new Date(d.dueDate).toISOString().split("T")[0];
            return deadlineDate === todayDate;
        });

        document.getElementById("stat-sessions").textContent =
            todaySessions.length + todayDeadlines.length;

        // TODAY PLAN LIST
        const planList = document.getElementById("today-plan-list");

        if (todaySessions.length > 0 || todayDeadlines.length > 0) {
            planList.innerHTML = "";

            todaySessions.forEach((s) => {
                const status = s.status || "pending";
                const div = document.createElement("div");
                div.className = "dash-session-item";
                div.innerHTML = `
                    <div class="dash-session-time">${escapeHtml(s.startTime)} – ${escapeHtml(s.endTime)}</div>
                    <div class="dash-session-course">${escapeHtml(s.course)}</div>
                    <span class="dash-status-pill ${status}">${status}</span>
                `;
                planList.appendChild(div);
            });

            todayDeadlines.forEach((d) => {
                const div = document.createElement("div");
                div.className = "dash-session-item";
                div.innerHTML = `
                    <div class="dash-session-time" style="color:#ef4444;font-weight:600;">Due today</div>
                    <div class="dash-session-course">${escapeHtml(d.title)}</div>
                    <span class="dash-status-pill missed">Deadline</span>
                `;
                planList.appendChild(div);
            });

        } else {
            planList.innerHTML = `<p class="dash-empty">No sessions today. Generate a study plan first.</p>`;
        }

        // WEEKLY PROGRESS
        const progressContainer = document.getElementById("weekly-progress");

        const courseNames = [...new Set(allPlans.map(s => s.course).filter(Boolean))];

        if (courseNames.length > 0) {
            const colors = ["#6366f1", "#0ea5e9", "#f59e0b", "#10b981", "#f43f5e"];

            progressContainer.innerHTML = courseNames.map((course, i) => {
                const sessions = allPlans.filter(s => s.course === course);
                const completed = sessions.filter(s => s.status === "completed").length;
                const pct = sessions.length > 0 ? Math.round((completed / sessions.length) * 100) : 0;

                return `
                    <div class="dash-progress-row">
                        <div class="dash-progress-label">${escapeHtml(course)}</div>
                        <div class="dash-progress-bar-wrap">
                            <div class="dash-progress-bar" style="width:${pct}%;background:${colors[i % colors.length]}"></div>
                        </div>
                        <div class="dash-progress-pct">${pct}%</div>
                    </div>
                `;
            }).join("");
        } else {
            progressContainer.innerHTML = `<p class="dash-empty">No study data yet.</p>`;
        }

    } catch (error) {
        console.error("Dashboard error:", error);
        showToast("Error loading dashboard", "error");
    }
}

document.addEventListener("DOMContentLoaded", () => {
    auth.onAuthStateChanged(async (firebaseUser) => {
        if (!firebaseUser) {
            window.location.href = "login.html";
            return;
        }

        user = firebaseUser;

        const sessionUser = Session.getUser();
        const userName = sessionUser?.name || user.email?.split('@')[0] || 'User';

        const greetingEl = document.getElementById("dashboard-greeting");
        if (greetingEl) greetingEl.textContent = `Good ${getTimePeriod()}, ${userName}!`;

        const sublineEl = document.getElementById("dashboard-subline");
        if (sublineEl) sublineEl.textContent = "Here's your study snapshot for today.";

        await loadDashboardData();
    });
});

function getTimePeriod() {
    const h = new Date().getHours();
    return h < 12 ? "morning" : h < 17 ? "afternoon" : "evening";
}