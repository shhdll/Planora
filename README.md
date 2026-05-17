# Planora – Smart Study Planner
![Planora Header](images/planora_header.png)

**SWE 381 – Web Applications Development (Fall 2026)**



## Project Overview

Planora is a web application designed to help students organize and manage their study schedules more effectively. The system allows users to create personalized study plans, track progress, manage deadlines, and stay consistent with their academic goals.



## Live Demo




## Features

- User account registration and authentication
- Add, edit, and remove courses
- Manage assignments and exam deadlines
- Set weekly study availability
- Generate personalized weekly study plans
- Track completed and missed study sessions
- View study progress and statistics
- Receive reminders for upcoming deadlines and sessions
- AI-powered study suggestions via Groq



## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | HTML, CSS, JavaScript  |
| Database | Firebase Firestore |
| Authentication | Firebase Auth (Email/Password) |
| AI Chatbot | Groq API (LLaMA 3.3) |
| Hosting | Firebase Hosting |




## Project Structure

```
planora/
├── index.html
├── dashboard.html
├── courses.html
├── add-course.html
├── edit-course.html
├── deadlines.html
├── availability.html
├── study-plan.html
├── statistics.html
├── login.html
├── register.html
├── reset-password.html
├── about-us.html
├── topbar.html
├── style.css
├── add-course.css
├── topbar.css
├── images/
└── JS/
    ├── firebase-config.js  (not included — see setup below)
    ├── config.js           (not included — see setup below)
    ├── auth.js
    ├── courses.js
    ├── deadlines.js
    ├── availability.js
    ├── sidebar.js
    ├── topbar.js
    ├── utils.js
    ├── AI.js
    ├── reminders.js
    └── planner.js
```



## Running Locally

### Prerequisites

- A Firebase project 
- A Groq API key (free at [console.groq.com](https://console.groq.com))
- A local server — [Live Server extension](https://marketplace.visualstudio.com/items?itemName=ritwickdey.LiveServer) or `npx live-server`




### Step 1 — Clone the repository

```bash
git clone https://github.com/shhdll/planora.git
cd planora
```



### Step 2 — Set up Firebase

1. Go to [firebase.google.com](https://firebase.google.com) → **Go to console → Add project**
2. Enable **Authentication** → Sign-in method → **Email/Password**
3. Enable **Firestore Database** → Start in test mode
4. Register a web app → copy the config object shown



### Step 3 — Create `JS/firebase-config.js`

This file is gitignored and must be created manually. Create `JS/firebase-config.js` and paste your Firebase config:

```js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_STORAGE_BUCKET",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
```



### Step 4 — Create `JS/config.js`

This file is also gitignored. Create `JS/config.js` with your Groq API key:

```js
const CONFIG = {
    GROQ_KEY: "YOUR_GROQ_API_KEY",
    GROQ_MODEL: "llama-3.3-70b-versatile"
};
```

Get a free key at [console.groq.com](https://console.groq.com).



### Step 5 — Run a local server

**VS Code:** Right-click `index.html` → **Open with Live Server**

**Terminal:**
```bash
npx live-server
```



## Firestore Data Structure

```
/courses/{docId}
    userId, name, code, instructor, creditHours, createdAt

/deadlines/{docId}
    userId, title, course, dueDate, priority, description, completed, createdAt

/availability/{userId}
    userId, updatedAt
    slots[] → { day, startTime, endTime }

/studyPlans/{docId}
    userId, title, course, day, dueDate, startTime, endTime, priority, status, createdAt
```
