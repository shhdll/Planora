# Planora – Smart Study Planner

![Planora Header](images/planora_header.png)

**SWE 381 – Web Applications Development (Fall 2026)**

---

## Project Overview

Planora is a web application that helps students plan, organize, and track their study activities. It generates personalized study schedules, monitors progress, and adapts plans using rule-based logic.

---

## Features

- Create an account and securely log in/out  
- Add, edit, and remove courses  
- Enter assignment deadlines and exam dates  
- Define weekly availability for study sessions  
- Automatically generate weekly study plans  
- Track completed or missed study sessions  
- View statistics and progress trends  
- Receive reminders for upcoming sessions and deadlines  

---

## Prerequisites

Before running this project, install the following:

| Requirement | Version | Download |
|---|---|---|
| Node.js | v14+ | https://nodejs.org/ |
| npm | Included with Node.js | - |
| Git | Latest | https://git-scm.com/ |

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

---

### 3. Environment Setup

Create a `.env` file inside the `backend` folder:

```bash
touch .env
```

Add the following variables:

```env
PORT=5000
MONGO_URI='..'
JWT_SECRET='..'
```

---

## Running the Server

### Development Mode

```bash
npm run dev
```

### Expected Output

```
Server running on http://localhost:5000
MongoDB connected successfully
```

---

## Project Structure

```
Planora/
│
├── backend/
│   ├── models/
│   ├── routes/
│   ├── controllers/
│   ├── middleware/
│   ├── config/
│   ├── server.js
│   ├── package.json
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


