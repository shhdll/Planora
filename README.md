# Planora – Smart Study Planner

![Planora Header](images/planora_header.png)

**SWE 381 – Web Applications Development (Fall 2026)**

---

## Project Overview

Planora is a web application designed to help students organize and manage their study schedules more effectively. The system allows users to create personalized study plans, track progress, manage deadlines, and stay consistent with their academic goals.

---

## Features

- User account registration and authentication
- Add, edit, and remove courses
- Manage assignments and exam deadlines
- Set weekly study availability
- Generate personalized weekly study plans
- Track completed and missed study sessions
- View study progress and statistics
- Receive reminders for upcoming tasks and sessions

---

## Live Demo


https://planora-f2a2b.web.app


No installation is required to use the hosted version.

---

## Clone the Project

```bash
git clone https://github.com/shhdll/Planora.git
cd planora
```

---

## Requirements

Make sure the following are installed on your machine:

- Node.js
- npm
- Firebase CLI

Check installed versions:

```bash
node -v
npm -v
firebase --version
```

---

## Install Dependencies

Install the required packages:

```bash
npm install
```

---

## Firebase Deployment

### 1. Login to Firebase

```bash
firebase login
```

---

### 2. Initialize Firebase

Run:

```bash
firebase init
```

Select the following options during setup:

| Setting | Value |
|---|---|
| Features | Hosting |
| Project Setup | Use existing project |
| Firebase Project | `planora-f2a2b` |
| Public Directory | `.` |
| Single-page app (SPA) | No |
| GitHub automatic deploys | No |
| Overwrite existing files | No |

---

### 3. Deploy the Website

```bash
firebase deploy
```

After deployment, the website will be available at:

```txt
https://planora-f2a2b.web.app
```

---

## Updating the Website

After making changes, redeploy using:

```bash
firebase deploy --only hosting
```
