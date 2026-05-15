// JS/AI.js

// Import Firebase (for getting real user data)
import { db, auth } from './firebase-config.js';
import {
  collection,
  query,
  where,
  getDocs
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

// Get the API key from config.js (Groq)
const GROQ_API_KEY = typeof CONFIG !== 'undefined' ? CONFIG.GROQ_KEY : "";
const GROQ_MODEL = typeof CONFIG !== 'undefined' && CONFIG.GROQ_MODEL ? CONFIG.GROQ_MODEL : "llama-4-scout";
const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";

document.addEventListener("DOMContentLoaded", () => {
    injectStyles();
    injectHTML();
    setupEventListeners();
});

//Inject CSS and HTML

const SPARK_ICON_SVG = `<svg class="planora-spark-svg" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><circle cx="12" cy="12" r="2.25" fill="currentColor"/><path d="M12 3.5v3M12 17.5v3M3.5 12h3M17.5 12h3" stroke="currentColor" stroke-width="1.85" stroke-linecap="round" opacity="0.9"/><path d="M6 6l2.5 2.5M16 16l2.5 2.5M18 6l-2.5 2.5M8 16l-2.5 2.5" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" opacity="0.45"/></svg>`;
function injectHTML() {
  const container = document.createElement("div");
  container.id = "ai-spark-container";
  container.innerHTML = `
    <div id="ai-panel" role="dialog" aria-label="Planora Spark assistant" aria-modal="true">
      <div class="ai-panel-header">
        <div class="ai-panel-brand">
          <div class="ai-panel-mark">${SPARK_ICON_SVG}</div>
          <div>
            <div class="ai-panel-title">Planora Spark</div>
            <div class="ai-panel-sub">Study copilot · context-aware</div>
          </div>
        </div>
        <button type="button" id="ai-panel-close" aria-label="Close chat">✕</button>
      </div>
      <div id="ai-chat-body">
        <div class="ai-msg-row">
          <div class="ai-msg-avatar ai-msg-avatar--bot" aria-hidden="true">AI</div>
          <div class="ai-message bot-msg">Hey — I can help you prioritize this week, break down big assignments, or tune your study blocks. What is on your mind?</div>
        </div>
      </div>
      <div class="ai-composer">
        <input type="text" id="ai-input" placeholder="Message Spark…" autocomplete="off">
        <button type="button" id="ai-send-btn" aria-label="Send message">
          <svg class="ai-send-icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M22 2 11 13"/><path d="M22 2 15 22l-4-9-9-4 20-7z"/></svg>
        </button>
      </div>
    </div>
    <button type="button" id="ai-spark-btn" aria-label="Open Planora Spark" aria-expanded="false">
      <span class="spark-launcher-glow" aria-hidden="true"></span>
      <span class="spark-launcher-inner">
        ${SPARK_ICON_SVG}
        <span class="spark-launcher-text">
          <span class="spark-launcher-label">Spark</span>
          <span class="spark-launcher-hint">Tap to chat</span>
        </span>
      </span>
    </button>
  `;
  document.body.appendChild(container);
}

function injectStyles() {
  const style = document.createElement("style");
  style.textContent = `
    #ai-spark-container {
      --spark-surface: rgba(15, 23, 42, 0.78);
      --spark-border: rgba(148, 163, 184, 0.22);
      --spark-accent: #a5b4fc;
      --spark-mint: #5eead4;
      position: fixed;
      bottom: 22px;
      right: 22px;
      z-index: 10050;
      font-family: "Plus Jakarta Sans", system-ui, -apple-system, sans-serif;
    }

    @keyframes planora-spark-float {
      0%, 100% { transform: translateY(0); }
      50% { transform: translateY(-4px); }
    }

    @keyframes planora-spark-breathe {
      0%, 100% { opacity: 0.55; transform: scale(1); }
      50% { opacity: 0.85; transform: scale(1.06); }
    }

    #ai-spark-btn {
      position: relative;
      border: none;
      padding: 0;
      cursor: pointer;
      background: none;
      animation: planora-spark-float 4s ease-in-out infinite;
      filter: drop-shadow(0 12px 28px rgba(15, 23, 42, 0.35));
    }

    #ai-spark-btn:hover {
      animation-play-state: paused;
      transform: translateY(-2px);
    }

    #ai-spark-btn:hover .spark-launcher-inner {
      border-color: rgba(165, 180, 252, 0.45);
      box-shadow:
        0 0 0 1px rgba(94, 234, 212, 0.15),
        inset 0 1px 0 rgba(255,255,255,0.12);
    }

    #ai-spark-btn.is-open .spark-launcher-inner {
      background: rgba(30, 27, 75, 0.92);
      border-color: rgba(167, 139, 250, 0.35);
    }

    .spark-launcher-glow {
      position: absolute;
      left: 50%;
      bottom: 2px;
      width: 140%;
      height: 70%;
      transform: translateX(-50%);
      background: radial-gradient(ellipse at center, rgba(99, 102, 241, 0.55) 0%, rgba(45, 212, 191, 0.2) 45%, transparent 70%);
      filter: blur(18px);
      pointer-events: none;
      z-index: 0;
      animation: planora-spark-breathe 3.2s ease-in-out infinite;
    }

    .spark-launcher-inner {
      position: relative;
      z-index: 1;
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 11px 16px 11px 14px;
      border-radius: 16px;
      background: var(--spark-surface);
      backdrop-filter: blur(16px);
      -webkit-backdrop-filter: blur(16px);
      border: 1px solid var(--spark-border);
      box-shadow:
        inset 0 1px 0 rgba(255,255,255,0.1),
        0 4px 24px rgba(0,0,0,0.25);
    }

    .planora-spark-svg {
      width: 22px;
      height: 22px;
      color: var(--spark-accent);
      flex-shrink: 0;
      filter: drop-shadow(0 0 10px rgba(167, 139, 250, 0.45));
    }

    .spark-launcher-label {
      font-size: 0.9375rem;
      font-weight: 700;
      letter-spacing: -0.03em;
      color: #f1f5f9;
      line-height: 1;
    }

    .spark-launcher-hint {
      font-size: 0.65rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.12em;
      color: rgba(148, 163, 184, 0.9);
      margin-top: 3px;
    }

    .spark-launcher-text {
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      text-align: left;
    }

    @media (max-width: 380px) {
      .spark-launcher-text { display: none; }
      .spark-launcher-inner { padding: 12px; border-radius: 14px; }
    }

    #ai-panel {
      position: absolute;
      bottom: 58px;
      right: 0;
      width: min(400px, calc(100vw - 28px));
      height: min(520px, calc(100vh - 100px));
      display: none;
      flex-direction: column;
      overflow: hidden;
      border-radius: 20px;
      background: #0c0f19;
      border: 1px solid rgba(148, 163, 184, 0.14);
      box-shadow:
        0 0 0 1px rgba(0,0,0,0.4),
        0 32px 64px rgba(0, 0, 0, 0.55),
        0 0 80px rgba(99, 102, 241, 0.12);
    }

    #ai-panel::before {
      content: "";
      position: absolute;
      inset: 0;
      background:
        radial-gradient(120% 80% at 100% 0%, rgba(99, 102, 241, 0.18), transparent 50%),
        radial-gradient(80% 50% at 0% 100%, rgba(45, 212, 191, 0.08), transparent 45%);
      pointer-events: none;
      z-index: 0;
    }

    .ai-panel-header {
      position: relative;
      z-index: 1;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      padding: 14px 14px 14px 16px;
      border-bottom: 1px solid rgba(51, 65, 85, 0.65);
      background: rgba(15, 23, 42, 0.6);
    }

    .ai-panel-brand {
      display: flex;
      align-items: center;
      gap: 12px;
      min-width: 0;
    }

    .ai-panel-mark {
      width: 40px;
      height: 40px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(145deg, rgba(79, 70, 229, 0.5), rgba(15, 118, 110, 0.35));
      border: 1px solid rgba(148, 163, 184, 0.2);
      color: #e0e7ff;
      flex-shrink: 0;
    }

    .ai-panel-mark .planora-spark-svg {
      width: 20px;
      height: 20px;
    }

    .ai-panel-title {
      font-size: 0.95rem;
      font-weight: 700;
      letter-spacing: -0.02em;
      color: #f8fafc;
      line-height: 1.2;
    }

    .ai-panel-sub {
      font-size: 0.72rem;
      color: #94a3b8;
      margin-top: 2px;
      font-weight: 500;
    }

    #ai-panel-close {
      flex-shrink: 0;
      width: 36px;
      height: 36px;
      border-radius: 10px;
      border: 1px solid rgba(71, 85, 105, 0.6);
      background: rgba(30, 41, 59, 0.5);
      color: #94a3b8;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: color 0.15s, background 0.15s, border-color 0.15s;
    }

    #ai-panel-close:hover {
      color: #f1f5f9;
      background: rgba(51, 65, 85, 0.7);
      border-color: rgba(100, 116, 139, 0.8);
    }

    #ai-chat-body {
      position: relative;
      z-index: 1;
      flex: 1;
      padding: 16px;
      overflow-y: auto;
      font-size: 0.875rem;
      line-height: 1.55;
      display: flex;
      flex-direction: column;
      gap: 12px;
      background: linear-gradient(180deg, rgba(12, 15, 25, 0.3) 0%, rgba(15, 23, 42, 0.25) 100%);
    }

    .ai-msg-row {
      display: flex;
      gap: 10px;
      max-width: 100%;
      align-items: flex-end;
    }

    .ai-msg-row--user {
      flex-direction: row-reverse;
    }

    .ai-msg-avatar {
      width: 28px;
      height: 28px;
      border-radius: 8px;
      flex-shrink: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.65rem;
      font-weight: 800;
      letter-spacing: 0.02em;
    }

    .ai-msg-avatar--bot {
      background: linear-gradient(135deg, #4f46e5, #0d9488);
      color: #fff;
      border: 1px solid rgba(255,255,255,0.12);
    }

    .ai-msg-avatar--user {
      background: rgba(51, 65, 85, 0.9);
      color: #cbd5e1;
      border: 1px solid rgba(148, 163, 184, 0.25);
    }

    .ai-message {
      padding: 11px 14px;
      border-radius: 14px;
      max-width: calc(100% - 38px);
      line-height: 1.5;
      white-space: pre-wrap;
      word-break: break-word;
    }

    .user-msg {
      background: rgba(51, 65, 85, 0.85);
      color: #f1f5f9;
      border: 1px solid rgba(100, 116, 139, 0.35);
      border-bottom-right-radius: 5px;
    }

    .bot-msg {
      background: rgba(30, 41, 59, 0.75);
      color: #e2e8f0;
      border: 1px solid rgba(71, 85, 105, 0.5);
      border-bottom-left-radius: 5px;
    }

    .ai-composer {
      position: relative;
      z-index: 1;
      padding: 12px;
      display: flex;
      gap: 8px;
      align-items: center;
      border-top: 1px solid rgba(51, 65, 85, 0.65);
      background: rgba(15, 23, 42, 0.85);
      backdrop-filter: blur(10px);
    }

    #ai-input {
      flex: 1;
      min-width: 0;
      border: 1px solid rgba(71, 85, 105, 0.7);
      background: rgba(15, 23, 42, 0.9);
      color: #f1f5f9;
      padding: 11px 14px;
      border-radius: 12px;
      outline: none;
      font-size: 0.875rem;
      font-family: inherit;
      transition: border-color 0.15s, box-shadow 0.15s;
    }

    #ai-input::placeholder {
      color: #64748b;
    }

    #ai-input:focus {
      border-color: rgba(129, 140, 248, 0.65);
      box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.2);
    }

    #ai-send-btn {
      flex-shrink: 0;
      width: 44px;
      height: 44px;
      border-radius: 12px;
      border: none;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(145deg, #6366f1, #4338ca);
      color: #fff;
      box-shadow: 0 4px 14px rgba(79, 70, 229, 0.45);
      transition: transform 0.15s, filter 0.15s;
    }

    #ai-send-btn:hover {
      filter: brightness(1.08);
      transform: scale(1.03);
    }

    #ai-send-btn:active {
      transform: scale(0.97);
    }

    .ai-send-icon-svg {
      width: 18px;
      height: 18px;
    }
  `;
  document.head.appendChild(style);
}

function setPanelOpen(open) {
  const panel = document.getElementById("ai-panel");
  const btn = document.getElementById("ai-spark-btn");
  if (!panel || !btn) return;
  panel.style.display = open ? "flex" : "none";
  btn.setAttribute("aria-expanded", open ? "true" : "false");
  btn.classList.toggle("is-open", open);
  if (open) {
    const input = document.getElementById("ai-input");
    if (input) setTimeout(() => input.focus(), 120);
  }
}

function setupEventListeners() {
  const btn = document.getElementById("ai-spark-btn");
  const panel = document.getElementById("ai-panel");
  const closeBtn = document.getElementById("ai-panel-close");
  const sendBtn = document.getElementById("ai-send-btn");
  const input = document.getElementById("ai-input");

  if (btn && panel) {
    btn.addEventListener("click", () => {
      const open = panel.style.display === "flex";
      setPanelOpen(!open);
    });
  }

  if (closeBtn) {
    closeBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      setPanelOpen(false);
    });
  }

  if (sendBtn) sendBtn.addEventListener("click", () => handleChat());
  if (input) {
    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") handleChat();
    });
  }

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && panel && panel.style.display === "flex") {
      setPanelOpen(false);
    }
  });
}

function getPlanoraUser() {
  try {
    if (typeof Session !== "undefined" && Session.getUser) {
      const u = Session.getUser();
      if (u) return u;
    }
    // Fallback to Firebase auth
    if (auth && auth.currentUser) {
      return { 
        name: auth.currentUser.displayName || auth.currentUser.email?.split('@')[0] || "Student", 
        id: auth.currentUser.uid 
      };
    }
    const raw = localStorage.getItem("currentUser");
    if (raw) return JSON.parse(raw);
  } catch (_) {}
  return { name: "Student", id: "guest" };
}

// Get courses from Firestore
async function getCoursesForUser(user) {
  try {
    // Use Firebase if user is authenticated
    if (auth && auth.currentUser) {
      const coursesQuery = query(collection(db, "courses"), where("userId", "==", auth.currentUser.uid));
      const coursesSnapshot = await getDocs(coursesQuery);
      const courses = [];
      coursesSnapshot.forEach((doc) => {
        const courseData = doc.data();
        courses.push({
          name: courseData.name,
          code: courseData.code,
          id: doc.id
        });
      });
      return courses;
    }
    
    // Fallback to localStorage
    const key = `courses_${user.id}`;
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : [];
  } catch (_) {
    return [];
  }
}

async function handleChat() {
  const input = document.getElementById("ai-input");
  const userText = input.value.trim();

  if (!userText) return;

  if (!GROQ_API_KEY || GROQ_API_KEY === "") {
    appendMessage(
      "Add your Groq API key in JS/config.js to enable live answers.",
      "bot-msg"
    );
    return;
  }

  appendMessage(userText, "user-msg");
  input.value = "";

  const user = getPlanoraUser();
  const courses = await getCoursesForUser(user);
  const courseNames = courses
    .map((c) => c.name || c.courseCode || "")
    .filter(Boolean)
    .join(", ");

  const systemPrompt = `You are Planora Spark, a concise, friendly AI coach for ${user.name}. 
Their courses: ${courseNames || "none listed yet"}. 
Give short, practical study advice. Use bullet points only when helpful.`;

  try {
    const response = await fetch(GROQ_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: GROQ_MODEL,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userText },
        ],
        temperature: 0.7,
        max_tokens: 1024,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      if (response.status === 429) {
        appendMessage("Too many requests—please wait a moment.", "bot-msg");
      } else {
        appendMessage(
          `Error: ${errorData.error?.message || "Something went wrong"}`,
          "bot-msg"
        );
      }
      return;
    }

    const data = await response.json();
    const aiResponse = data.choices[0].message.content;
    appendMessage(aiResponse, "bot-msg");
  } catch (error) {
    console.error("Groq Error:", error);
    appendMessage("Connection issue—check your network and try again.", "bot-msg");
  }
}

function appendMessage(text, className) {
  const chatBody = document.getElementById("ai-chat-body");
  if (!chatBody) return;

  const row = document.createElement("div");
  row.className =
    className === "user-msg" ? "ai-msg-row ai-msg-row--user" : "ai-msg-row";

  const avatar = document.createElement("div");
  avatar.className =
    "ai-msg-avatar " +
    (className === "user-msg" ? "ai-msg-avatar--user" : "ai-msg-avatar--bot");
  avatar.setAttribute("aria-hidden", "true");
  avatar.textContent = className === "user-msg" ? "You" : "AI";

  const msgDiv = document.createElement("div");
  msgDiv.className = `ai-message ${className}`;
  msgDiv.textContent = text;

  row.appendChild(avatar);
  row.appendChild(msgDiv);
  chatBody.appendChild(row);
  chatBody.scrollTop = chatBody.scrollHeight;
}