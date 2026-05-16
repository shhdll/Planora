
// JS/stats.js

import { Session } from './utils.js';

import { Tracker } from './tracker.js';

import { auth } from './firebase-config.js';


Session.require();


// ======================
// WAIT FOR AUTH
// ======================

auth.onAuthStateChanged(

    async (user) => {

        if (!user) return;

        await loadStatistics();
    }
);


// ======================
// LOAD STATISTICS
// ======================

async function loadStatistics() {

    const stats =
        await Tracker.getStatistics();


    // ======================
    // TABLE VALUES
    // ======================

    document.getElementById(
        "stat-total-courses"
    ).textContent =
        stats.totalCourses;


    document.getElementById(
        "stat-total-sessions"
    ).textContent =
        stats.totalSessions;


    document.getElementById(
        "stat-completed"
    ).textContent =
        stats.completedSessions;


    document.getElementById(
        "stat-pending"
    ).textContent =
        stats.pendingSessions;


    document.getElementById(
        "stat-missed"
    ).textContent =
        stats.missedSessions;


    document.getElementById(
        "stat-rate"
    ).textContent =
        stats.completionRate + "%";


    // ======================
    // CHART
    // ======================

    const ctx =
        document.getElementById(
            "statsChart"
        );


    // remove old chart

    if (window.statsChartInstance) {

        window.statsChartInstance.destroy();
    }


    window.statsChartInstance =
        new Chart(ctx, {

            type: 'bar',

            data: {

                labels: [

                    'Completed',
                    'Pending',
                    'Missed'

                ],

                datasets: [

                    {

                        label:
                            'Sessions',

                        data: [

                            stats.completedSessions,

                            stats.pendingSessions,

                            stats.missedSessions

                        ],

                        backgroundColor: [

                            '#22c55e',
                            '#3b82f6',
                            '#ef4444'

                        ],

                        borderRadius: 10
                    }
                ]
            },

            options: {

                responsive: true,

                plugins: {

                    legend: {

                        display: false
                    }
                },

                scales: {

                    y: {

                        beginAtZero: true
                    }
                }
            }
        });
}