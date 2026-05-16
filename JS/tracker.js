// JS/tracker.js
//// doonntttt truustttt ittttttt 
// Tracker class for study sessions
class Tracker {
    constructor() {
        this.sessions = JSON.parse(localStorage.getItem("studySessions")) || [];
    }

    saveSessions() {
        localStorage.setItem("studySessions", JSON.stringify(this.sessions));
    }

    markSession(sessionId, status) {
        const existing = this.sessions.find(s => s.id === sessionId);

        if (existing) {
            existing.status = status;
        } else {
            this.sessions.push({
                id: sessionId,
                status: status,
                date: new Date().toISOString()
            });
        }

        this.saveSessions();
        this.updateStatistics();
    }

    getCompletedSessions() {
        return this.sessions.filter(s => s.status === "completed").length;
    }

    getMissedSessions() {
        return this.sessions.filter(s => s.status === "missed").length;
    }

    getTotalSessions() {
        return this.sessions.length;
    }

    updateStatistics() {
        const completed = this.getCompletedSessions();
        const missed = this.getMissedSessions();
        const total = this.getTotalSessions();

        const completedElement = document.getElementById("stat-completed");
        const totalSessionsElement = document.getElementById("stat-total-sessions");
        const weeklyHoursElement = document.getElementById("stat-weekly-hours");
        const weeklyGoalElement = document.getElementById("weekly-goal");
        const weeklyGoalStatusElement = document.getElementById("weekly-goal-status");

        if (completedElement) {
            completedElement.textContent = completed;
        }

        if (totalSessionsElement) {
            totalSessionsElement.textContent = `${total * 1.5} hours`;
        }

        if (weeklyHoursElement) {
            weeklyHoursElement.textContent = `${completed * 1.5} hours`;
        }

        if (weeklyGoalElement) {
            if (total === 0) {
                weeklyGoalElement.textContent = "No sessions tracked yet";
            } else {
                const percent = Math.round((completed / total) * 100);
                weeklyGoalElement.textContent = `${percent}% of sessions completed`;
            }
        }

        if (weeklyGoalStatusElement) {
            if (total === 0) {
                weeklyGoalStatusElement.textContent = "No data";
                weeklyGoalStatusElement.className = "";
            } else if (completed >= missed) {
                weeklyGoalStatusElement.textContent = "On track";
                weeklyGoalStatusElement.className = "positive";
            } else {
                weeklyGoalStatusElement.textContent = "Needs improvement";
                weeklyGoalStatusElement.className = "negative";
            }
        }
    }

    attachStudyPlanListeners() {
        const radios = document.querySelectorAll("input[type='radio']");

        radios.forEach((radio) => {
            radio.addEventListener("change", (event) => {
                const sessionId = event.target.name;
                const status = event.target.value;

                this.markSession(sessionId, status);
            });
        });
    }

    loadSavedChoices() {
        this.sessions.forEach((session) => {
            const radio = document.querySelector(
                `input[name="${session.id}"][value="${session.status}"]`
            );

            if (radio) {
                radio.checked = true;
            }
        });
    }

    init() {
        this.attachStudyPlanListeners();
        this.loadSavedChoices();
        this.updateStatistics();
    }
}

// Create object from Tracker
const tracker = new Tracker();

// Run tracker when page loads
if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => tracker.init());
} else {
    tracker.init();
}

// Export if another file needs it
export { Tracker };