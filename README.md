# Planora – Smart Study Planner

![Planora Header](images/planora_header.png)

**SWE 381 – Web Applications Development (Fall 2026)**

---

## Project Overview

Planora is a web application designed to help students plan, organize, and track their study activities. The system generates personalized study schedules, monitors study progress, and adapts plans using rule-based logic.

---

## Features

- Create an account and securely log in/out
- Add, edit, and remove courses
- Enter assignment deadlines and exam dates
- Define weekly availability for study sessions
- Automatically generate weekly study plans
- Track completed or missed study sessions
- View study statistics and progress trends
- Receive reminders for upcoming sessions and deadlines

---

## Prerequisites

Before running this project, make sure you have the following installed:

| Requirement | Version | Download |
|---|---|---|
| Node.js | v14 or higher | https://nodejs.org/ |
| npm | Included with Node.js | - |
| Git | Latest version | https://git-scm.com/ |
| MongoDB Atlas Account | Free tier supported | https://www.mongodb.com/atlas |

---

## Quick Setup

### 1. Clone the Repository

```bash
git clone https://github.com/shhdll/Planora.git
cd Planora/backend
```

---

### 2. Install Dependencies

```bash
npm install
```

This installs the required packages:

- express
- mongoose
- bcryptjs
- jsonwebtoken
- cors
- dotenv
- nodemon

---

### 3. Create the Environment File

Create a `.env` file inside the `backend` folder.

#### Windows (PowerShell)

```powershell
New-Item .env
```

#### macOS / Linux

```bash
touch .env
```

---

### 4. Add Environment Variables

Open the `.env` file and add the following:

```env
PORT=5000
MONGO_URI=mongodb+srv://planoraDB:%26123456@planora.w12us6l.mongodb.net/planora?retryWrites=true&w=majority
JWT_SECRET=planora_secret_key_2026
```

---

## Environment Variables

| Variable | Description | Example |
|---|---|---|
| PORT | Server port number | 5000 |
| MONGO_URI | MongoDB Atlas connection string | mongodb+srv://... |
| JWT_SECRET | Secret key used for JWT authentication | planora_secret_key_2026 |

---

## Running the Server

### Development Mode

```bash
npm run dev
```

### Expected Output

```text
🚀 Server running on http://localhost:5000
✅ MongoDB Atlas connected successfully
[nodemon] watching path(s): *.*
```

---

## Project Structure

```text
Planora/
│
├── backend/
│   ├── models/
│   ├── routes/
│   ├── middleware/
│   ├── controllers/
│   ├── config/
│   ├── .env
│   ├── package.json
│   └── server.js
│
├── frontend/
│
└── README.md
```

---

## Tech Stack

### Frontend
- HTML
- CSS
- JavaScript

### Backend
- Node.js
- Express.js

### Database
- MongoDB Atlas
- Mongoose

### Authentication
- JWT (JSON Web Tokens)
- bcryptjs

