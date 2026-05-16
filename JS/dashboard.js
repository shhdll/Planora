import { auth, db }
from './firebase-config.js';

import {
    Session,
    DateUtils,
    showToast
}
from './utils.js';

import {
    collection,
    query,
    where,
    getDocs
}
from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

import {
    Deadline
}
from './deadlines.js';


let user = null;


// ======================
// ESCAPE HTML
// ======================

function escapeHtml(str) {

    if (!str) return '';

    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}


// ======================
// LOAD DASHBOARD
// ======================

async function loadDashboardData() {

    try {

        // ======================
        // COURSES
        // ======================

        const coursesQuery = query(

            collection(db, "courses"),

            where(
                "userId",
                "==",
                user.uid
            )
        );

        const coursesSnapshot =
            await getDocs(coursesQuery);

        const courses = [];

        coursesSnapshot.forEach((docItem) => {

            courses.push({

                id: docItem.id,
                ...docItem.data()
            });
        });

        document.getElementById(
            "stat-courses"
        ).textContent =
            courses.length;


        // ======================
        // DEADLINES
        // ======================

        const allDeadlines =
            await Deadline.getAll();

        document.getElementById(
            "stat-deadlines"
        ).textContent =
            allDeadlines.filter(
                d => !d.completed
            ).length;


        const deadlineContainer =
            document.getElementById(
                "dashboard-deadlines-list"
            );


        const upcoming =
            allDeadlines

            .filter(

                d =>
                    d.dueDate &&
                    !d.completed
            )

            .sort(

                (a, b) =>

                    new Date(a.dueDate) -
                    new Date(b.dueDate)
            );


        if (upcoming.length > 0) {

            deadlineContainer.innerHTML = "";

            upcoming
                .slice(0, 3)

                .forEach((d) => {

                    const days =
                        DateUtils.daysUntil(
                            d.dueDate
                        );

                    const div =
                        document.createElement(
                            "div"
                        );

                    div.className =
                        "deadline";

                    div.innerHTML = `

                        <span style="${
                            days <= 2
                            ? "color:#ef4444;font-weight:bold;"
                            : ""
                        }">

                            ${escapeHtml(d.title)}

                            —

                            ${new Date(d.dueDate).toLocaleDateString()}

                        </span>

                        <span style="
                            float:right;
                            color:#64748b;
                            font-size:0.85rem;
                        ">

                            ${
                                days === 0
                                ? "Today!"

                                : days === 1
                                ? "Tomorrow"

                                : `In ${days} days`
                            }

                        </span>
                    `;

                    deadlineContainer.appendChild(div);
                });

        } else {

            deadlineContainer.innerHTML = `

                <div class="deadline">

                    No upcoming deadlines yet.

                </div>
            `;
        }


        // ======================
        // STUDY PLANS
        // ======================

        const plansQuery = query(

            collection(db, "studyPlans"),

            where(
                "userId",
                "==",
                user.uid
            )
        );

        const plansSnapshot =
            await getDocs(plansQuery);

        const allPlans = [];

        plansSnapshot.forEach((docItem) => {

            allPlans.push({

                id: docItem.id,
                ...docItem.data()
            });
        });


        // ======================
        // TODAY DATE
        // ======================

        const todayDate =
            new Date()
            .toISOString()
            .split("T")[0];


        // ======================
        // TODAY SESSIONS
        // ======================

        const todaySessions =

            allPlans.filter((s) => {

                if (!s.studyDate)
                    return false;

                const sessionDate =
                    new Date(
                        s.studyDate
                    )
                    .toISOString()
                    .split("T")[0];

                return (
                    sessionDate === todayDate
                );
            });


        // ======================
        // TODAY DEADLINES
        // ======================

        const todayDeadlines =

            allDeadlines.filter((d) => {

                if (!d.dueDate)
                    return false;

                const deadlineDate =
                    new Date(
                        d.dueDate
                    )
                    .toISOString()
                    .split("T")[0];

                return (
                    deadlineDate === todayDate &&
                    !d.completed
                );
            });


        // ======================
        // TOTAL TODAY ACTIVITY
        // ======================

        document.getElementById(
            "stat-sessions"
        ).textContent =

            todaySessions.length +
            todayDeadlines.length;


        // ======================
        // TABLE
        // ======================

        const table =
            document.getElementById(
                "today-plan-table"
            );

        const noMsg =
            document.getElementById(
                "no-sessions-msg"
            );


        while (
            table.rows.length > 1
        ) {

            table.deleteRow(1);
        }


        // ======================
        // SHOW DATA
        // ======================

        if (
            todaySessions.length > 0 ||
            todayDeadlines.length > 0
        ) {

            noMsg.style.display =
                "none";


            // ======================
            // STUDY SESSIONS
            // ======================

            todaySessions.forEach((s) => {

                const row =
                    table.insertRow();

                const statusColor =

                    s.status === "completed"
                    ? "#22c55e"

                    : s.status === "missed"
                    ? "#ef4444"

                    : "#64748b";

                row.innerHTML = `

                    <td>

                        <strong>

                            ${escapeHtml(s.startTime)}

                            –

                            ${escapeHtml(s.endTime)}

                        </strong>

                    </td>

                    <td>

                        ${escapeHtml(s.course)}

                    </td>

                    <td style="
                        color:${statusColor};
                        font-weight:600;
                        text-transform:capitalize;
                    ">

                        ${escapeHtml(s.status || "pending")}

                    </td>
                `;
            });


            // ======================
            // DEADLINES TODAY
            // ======================

            todayDeadlines.forEach((d) => {

                const row =
                    table.insertRow();

                row.innerHTML = `

                    <td>

                        <strong style="
                            color:#ef4444;
                        ">

                            Deadline

                        </strong>

                    </td>

                    <td>

                        ${escapeHtml(d.course)}

                    </td>

                    <td style="
                        color:#ef4444;
                        font-weight:600;
                    ">

                        Due Today

                    </td>
                `;
            });

        } else {

            noMsg.style.display =
                "block";
        }

    } catch (error) {

        console.error(
            "Dashboard error:",
            error
        );

        showToast(
            "Error loading dashboard",
            "error"
        );
    }
}


// ======================
// AUTH
// ======================

document.addEventListener(

    "DOMContentLoaded",

    () => {

        auth.onAuthStateChanged(

            async (firebaseUser) => {

                if (!firebaseUser) {

                    window.location.href =
                        "login.html";

                    return;
                }

                user = firebaseUser;

                const greetingElement =
                    document.getElementById(
                        "dashboard-greeting"
                    );

                const sessionUser =
                    Session.getUser();

                const userName =
                    sessionUser?.name ||
                    user.email?.split('@')[0] ||
                    'User';

                greetingElement.innerHTML =
                    `Welcome, ${escapeHtml(userName)}! 👋`;

                await loadDashboardData();
            }
        );
    }
);