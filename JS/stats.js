
// JS/stats.js

import { Session } from './utils.js';
import { Tracker } from './tracker.js';
import { Deadline } from './deadlines.js';
import { auth } from './firebase-config.js';

Session.require();

auth.onAuthStateChanged(async (user) => {
    if (!user) return;
    await loadStatistics();
});

async function loadStatistics() {

    const [stats, sessions, deadlines] = await Promise.all([
        Tracker.getStatistics(),
        Tracker.getStudySessions(),
        Deadline.getAll()
    ]);

    // ======================
    // STAT CARDS
    // ======================

    const completedDeadlines = deadlines.filter((d) => d.completed).length;

    document.getElementById("stat-total-courses").textContent =
        stats.totalCourses;

    document.getElementById("stat-completed").textContent =
        `${stats.completedSessions} / ${stats.totalSessions}`;

    document.getElementById("stat-rate").textContent =
        stats.completionRate + "%";

    document.getElementById("stat-deadlines").textContent =
        `${completedDeadlines} / ${deadlines.length}`;

    // ======================
    // CHARTS
    // ======================

    renderHoursPerCourse(sessions);
    renderDeadlineStatus(deadlines);
    renderWeeklyCompletion(sessions);
    renderHoursByDay(sessions);
    renderUpcomingDeadlines(deadlines);
}

function destroyChart(key) {
    if (window[key]) {
        window[key].destroy();
        window[key] = null;
    }
}

function sessionHours(s) {
    const start = parseInt(s.startTime);
    const end = parseInt(s.endTime);
    return (end > start) ? end - start : 2;
}

// ======================
// 1. HOURS PER COURSE
// ======================

function renderHoursPerCourse(sessions) {

    destroyChart('_chartHoursPerCourse');

    const map = {};

    sessions.forEach((s) => {
        const course = s.course || 'Unknown';
        if (!map[course]) map[course] = { completed: 0, planned: 0 };
        const hrs = sessionHours(s);
        if (s.status === 'completed') map[course].completed += hrs;
        else if (s.status === 'pending') map[course].planned += hrs;
    });

    const labels = Object.keys(map);

    window._chartHoursPerCourse = new Chart(
        document.getElementById('chartHoursPerCourse'),
        {
            type: 'bar',
            data: {
                labels,
                datasets: [
                    {
                        label: 'Completed (hrs)',
                        data: labels.map((c) => map[c].completed),
                        backgroundColor: '#6ee7b7',
                        borderRadius: 6
                    },
                    {
                        label: 'Planned (hrs)',
                        data: labels.map((c) => map[c].planned),
                        backgroundColor: '#bfdbfe',
                        borderRadius: 6
                    }
                ]
            },
            options: {
                indexAxis: 'y',
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { position: 'top' } },
                scales: {
                    x: { beginAtZero: true, title: { display: true, text: 'Hours' } }
                }
            }
        }
    );
}

// ======================
// 2. DEADLINE STATUS
// ======================

function renderDeadlineStatus(deadlines) {

    destroyChart('_chartDeadlineStatus');

    const now = new Date();
    let completed = 0, pending = 0, overdue = 0;

    deadlines.forEach((d) => {
        if (d.completed) {
            completed++;
        } else if (new Date(d.dueDate) < now) {
            overdue++;
        } else {
            pending++;
        }
    });

    window._chartDeadlineStatus = new Chart(
        document.getElementById('chartDeadlineStatus'),
        {
            type: 'doughnut',
            data: {
                labels: ['Completed', 'Pending', 'Overdue'],
                datasets: [{
                    data: [completed, pending, overdue],
                    backgroundColor: ['#86efac', '#93c5fd', '#fca5a5'],
                    borderWidth: 0,
                    hoverOffset: 8
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                cutout: '65%',
                plugins: {
                    legend: { position: 'bottom' }
                }
            }
        }
    );
}

// ======================
// 3. THIS WEEK BY DAY
// ======================

function renderWeeklyCompletion(sessions) {

    destroyChart('_chartWeeklyCompletion');

    const DAY_CODES  = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
    const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    // Determine the current week's date range (Sun–Sat)
    const today = new Date();
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - today.getDay());
    weekStart.setHours(0, 0, 0, 0);

    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    weekEnd.setHours(23, 59, 59, 999);

    const byDay = { completed: [0,0,0,0,0,0,0], missed: [0,0,0,0,0,0,0], pending: [0,0,0,0,0,0,0] };

    sessions.forEach((s) => {
        const d = new Date(s.studyDate);
        if (d < weekStart || d > weekEnd) return;
        const idx = DAY_CODES.indexOf(s.day);
        if (idx === -1) return;
        if (byDay[s.status]) byDay[s.status][idx]++;
    });

    window._chartWeeklyCompletion = new Chart(
        document.getElementById('chartWeeklyCompletion'),
        {
            type: 'bar',
            data: {
                labels: DAY_LABELS,
                datasets: [
                    { label: 'Completed', data: byDay.completed, backgroundColor: '#6ee7b7', borderRadius: 4 },
                    { label: 'Missed',    data: byDay.missed,    backgroundColor: '#fca5a5', borderRadius: 4 },
                    { label: 'Pending',   data: byDay.pending,   backgroundColor: '#bfdbfe', borderRadius: 4 }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { position: 'top' } },
                scales: {
                    y: { beginAtZero: true, ticks: { stepSize: 1 } }
                }
            }
        }
    );
}

// ======================
// 4. THIS WEEK ACCOMPLISHED
// ======================

function renderHoursByDay(sessions) {

    destroyChart('_chartHoursByDay');

    const DAY_CODES  = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
    const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const hours = [0, 0, 0, 0, 0, 0, 0];

    const today = new Date();
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - today.getDay());
    weekStart.setHours(0, 0, 0, 0);

    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    weekEnd.setHours(23, 59, 59, 999);

    sessions.forEach((s) => {
        if (s.status !== 'completed') return;
        const d = new Date(s.studyDate);
        if (d < weekStart || d > weekEnd) return;
        const idx = DAY_CODES.indexOf(s.day);
        if (idx !== -1) hours[idx] += sessionHours(s);
    });

    window._chartHoursByDay = new Chart(
        document.getElementById('chartHoursByDay'),
        {
            type: 'bar',
            data: {
                labels: DAY_LABELS,
                datasets: [{
                    label: 'Hours completed',
                    data: hours,
                    backgroundColor: '#c4b5fd',
                    borderRadius: 8
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                    y: { beginAtZero: true, ticks: { stepSize: 1 }, title: { display: true, text: 'Hours' } }
                }
            }
        }
    );
}

// ======================
// 5. UPCOMING DEADLINES COUNTDOWN
// ======================

function renderUpcomingDeadlines(deadlines) {

    const container = document.getElementById('deadlineCountdown');
    if (!container) return;

    const now = new Date();

    const upcoming = deadlines
        .filter((d) => !d.completed && new Date(d.dueDate) >= now)
        .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
        .slice(0, 6);

    if (!upcoming.length) {
        container.innerHTML = `<p class="countdown-empty">No upcoming deadlines.</p>`;
        return;
    }

    container.innerHTML = upcoming.map((d) => {
        const due = new Date(d.dueDate);
        const diffMs = due - now;
        const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

        let label, urgency;
        if (days === 0) {
            label = hours <= 1 ? 'Due now' : `${hours}h left`;
            urgency = 'urgent';
        } else if (days <= 2) {
            label = `${days}d ${hours}h left`;
            urgency = 'urgent';
        } else if (days <= 5) {
            label = `${days} days left`;
            urgency = 'soon';
        } else {
            label = `${days} days left`;
            urgency = 'ok';
        }

        return `
            <div class="countdown-item">
                <div class="countdown-dot countdown-dot--${urgency}"></div>
                <div class="countdown-info">
                    <span class="countdown-title">${d.title}</span>
                    ${d.course ? `<span class="countdown-course">${d.course}</span>` : ''}
                </div>
                <span class="countdown-label countdown-label--${urgency}">${label}</span>
            </div>
        `;
    }).join('');
}
