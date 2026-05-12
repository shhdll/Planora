// JS/AI.js

// Get the API key from config.js (Groq)
const GROQ_API_KEY = typeof CONFIG !== 'undefined' ? CONFIG.GROQ_KEY : "";
const GROQ_MODEL = typeof CONFIG !== 'undefined' && CONFIG.GROQ_MODEL ? CONFIG.GROQ_MODEL : "llama-4-scout";
const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";

document.addEventListener("DOMContentLoaded", () => {
    injectStyles();
    injectHTML();
    setupEventListeners();
});

// 1. Inject CSS directly into the page
function injectStyles() {
    const style = document.createElement('style');
    style.textContent = `
        #ai-spark-container {
            position: fixed;
            bottom: 25px;
            right: 25px;
            z-index: 10000;
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        }
        #ai-spark-btn {
            width: 60px;
            height: 60px;
            border-radius: 50%;
            background: linear-gradient(135deg, #6e8efb, #a777e3);
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 24px;
            cursor: pointer;
            box-shadow: 0 4px 15px rgba(0,0,0,0.2);
            transition: transform 0.3s ease;
        }
        #ai-spark-btn:hover { transform: scale(1.1) rotate(10deg); }
        
        #ai-panel {
            position: absolute;
            bottom: 80px;
            right: 0;
            width: 320px;
            height: 450px;
            background: rgba(255, 255, 255, 0.95);
            backdrop-filter: blur(10px);
            border-radius: 20px;
            box-shadow: 0 10px 25px rgba(0,0,0,0.15);
            display: none;
            flex-direction: column;
            overflow: hidden;
            border: 1px solid rgba(255,255,255,0.3);
        }
        .ai-header { padding: 15px; background: #6e8efb; color: white; font-weight: bold; border-bottom: 1px solid rgba(255,255,255,0.2); }
        #ai-chat-body { flex: 1; padding: 15px; overflow-y: auto; font-size: 14px; display: flex; flex-direction: column; gap: 10px; background: rgba(255,255,255,0.5); }
        .ai-message { padding: 10px 14px; border-radius: 15px; max-width: 85%; line-height: 1.4; }
        .user-msg { align-self: flex-end; background: #6e8efb; color: white; border-bottom-right-radius: 2px; }
        .bot-msg { align-self: flex-start; background: #f1f5f9; color: #1e293b; border-bottom-left-radius: 2px; border: 1px solid #e2e8f0; }
        .ai-input-area { padding: 12px; display: flex; gap: 8px; border-top: 1px solid #e2e8f0; background: white; }
        #ai-input { flex: 1; border: 1px solid #cbd5e1; padding: 10px 15px; border-radius: 25px; outline: none; font-size: 14px; }
        #ai-input:focus { border-color: #6e8efb; }
        #ai-send-btn { background: #6e8efb; color: white; border: none; padding: 0 15px; border-radius: 25px; cursor: pointer; font-weight: 600; transition: background 0.2s; }
        #ai-send-btn:hover { background: #5a78e6; }
    `;
    document.head.appendChild(style);
}

// 2. Inject the Assistant UI
function injectHTML() {
    const container = document.createElement('div');
    container.id = 'ai-spark-container';
    container.innerHTML = `
        <div id="ai-panel">
            <div class="ai-header">Planora Spark ✨</div>
            <div id="ai-chat-body">
                <div class="ai-message bot-msg">Hi! I'm your Planora assistant. I know your courses and schedule. How can I help you today?</div>
            </div>
            <div class="ai-input-area">
                <input type="text" id="ai-input" placeholder="Ask a question...">
                <button id="ai-send-btn">Send</button>
            </div>
        </div>
        <div id="ai-spark-btn">✨</div>
    `;
    document.body.appendChild(container);
}

// 3. Handle interactions
function setupEventListeners() {
    const btn = document.getElementById('ai-spark-btn');
    const panel = document.getElementById('ai-panel');
    const sendBtn = document.getElementById('ai-send-btn');
    const input = document.getElementById('ai-input');

    if (btn) {
        btn.onclick = () => {
            panel.style.display = (panel.style.display === 'flex' ? 'none' : 'flex');
        };
    }

    if (sendBtn) sendBtn.onclick = () => handleChat();
    if (input) {
        input.onkeypress = (e) => { if (e.key === 'Enter') handleChat(); };
    }
}

// 4. The "Brain" - Talking to Groq
async function handleChat() {
    const input = document.getElementById('ai-input');
    const userText = input.value.trim();

    if (!userText) return;
    
    if (!GROQ_API_KEY || GROQ_API_KEY === "") {
        appendMessage("API key is missing! Please add your Groq API key to config.js", 'bot-msg');
        console.error("Groq API Key missing! Check JS/config.js");
        return;
    }

    // Show User Message
    appendMessage(userText, 'user-msg');
    input.value = '';

    // Get real context from your app's storage
    const user = JSON.parse(sessionStorage.getItem('planora_user')) || { name: 'Student', id: 'guest' };
    const coursesKey = `${user.id}_courses`;
    const courses = JSON.parse(localStorage.getItem(coursesKey)) || [];

    const systemPrompt = `You are Planora Spark, a helpful AI tutor for a student named ${user.name}. 
    They are currently enrolled in these courses: ${courses.map(c => c.name || c).join(', ') || 'no courses yet'}. 
    Keep responses brief, helpful, and focused on university success.`;

    try {
        const response = await fetch(GROQ_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${GROQ_API_KEY}`
            },
            body: JSON.stringify({
                model: GROQ_MODEL,
                messages: [
                    { role: "system", content: systemPrompt },
                    { role: "user", content: userText }
                ],
                temperature: 0.7,
                max_tokens: 1024
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            console.error("Groq API Error:", errorData);
            
            if (response.status === 429) {
                appendMessage("I'm getting too many requests. Please wait a moment and try again.", 'bot-msg');
            } else {
                appendMessage(`Error: ${errorData.error?.message || "Something went wrong"}`, 'bot-msg');
            }
            return;
        }

        const data = await response.json();
        const aiResponse = data.choices[0].message.content;
        appendMessage(aiResponse, 'bot-msg');
    } catch (error) {
        console.error("Groq Error:", error);
        appendMessage("Having trouble connecting. Please check your internet.", 'bot-msg');
    }
}

function appendMessage(text, className) {
    const chatBody = document.getElementById('ai-chat-body');
    if (!chatBody) return;
    const msgDiv = document.createElement('div');
    msgDiv.className = `ai-message ${className}`;
    msgDiv.textContent = text;
    chatBody.appendChild(msgDiv);
    chatBody.scrollTop = chatBody.scrollHeight;
}