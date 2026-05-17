// Aaron Air Care - Ultimate Hybrid AI Assistant - V8 (GROK ENGINE LOCK)
console.log("Chatbot.js: V8 Loading...");

const GEMINI_KEYS = [
    "YOUR_GEMINI_API_KEY_1",
    "YOUR_GEMINI_API_KEY_2"
];

const GROK_KEYS = [
    "YOUR_GROK_API_KEY_1",
    "YOUR_GROK_API_KEY_2",
    "YOUR_GROK_API_KEY_3",
    "YOUR_GROK_API_KEY_4"
];

const SYSTEM_PROMPT = "You are Aaron's Technical HVAC Assistant. Expert in AHU and Industrial Ventilation.";

const chatMessages = document.getElementById('chatbot-messages');
const chatInput = document.getElementById('bot-input');
const typingIndicator = document.getElementById('bot-typing');
const chatWindow = document.getElementById('chatbot-window');

window.toggleChatbot = function () {
    if (chatWindow) {
        chatWindow.classList.toggle('active');
        chatWindow.style.display = chatWindow.classList.contains('active') ? 'flex' : 'none';
    }
};

window.sendBotMessage = async function () {
    const text = chatInput.value.trim();
    if (!text) return;
    appendMessage('user', text);
    chatInput.value = '';
    if (typingIndicator) typingIndicator.style.display = 'flex';
    chatMessages.scrollTop = chatMessages.scrollHeight;

    try {
        const response = await getAIResponse(text);
        if (typingIndicator) typingIndicator.style.display = 'none';
        appendMessage('ai', response);
    } catch (err) {
        if (typingIndicator) typingIndicator.style.display = 'none';
        appendMessage('ai', "Technical service temporarily unavailable. Please call +91 70782 84202.");
        console.error("CRITICAL AI FAILURE:", err);
    }
};

async function getAIResponse(userText) {
    // 1. GEMINI ATTEMPT (v1beta + Multiple Models)
    for (const key of GEMINI_KEYS) {
        const mods = ["gemini-1.5-flash", "gemini-pro"];
        for (const mod of mods) {
            try {
                const url = `https://generativelanguage.googleapis.com/v1beta/models/${mod}:generateContent?key=${key}`;
                const res = await fetch(url, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ contents: [{ parts: [{ text: `${SYSTEM_PROMPT}\n\nUser: ${userText}` }] }] })
                });
                const data = await res.json();
                if (res.ok && data.candidates?.[0]?.content?.parts?.[0]?.text) return data.candidates[0].content.parts[0].text;
            } catch (e) { }
        }
    }

    // 2. GROK ATTEMPT (grok-2 Model Rotation)
    console.log("Switching to Grok-2 Engine...");
    for (const key of GROK_KEYS) {
        const grokModels = ["grok-2", "grok-2-1212", "grok-beta"];
        for (const mod of grokModels) {
            try {
                const res = await fetch("https://api.x.ai/v1/chat/completions", {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${key}` },
                    body: JSON.stringify({
                        model: mod,
                        messages: [{ role: "user", content: `${SYSTEM_PROMPT}\n\nQuestion: ${userText}` }],
                        stream: false
                    })
                });
                const data = await res.json();
                if (res.ok && data.choices?.[0]?.message?.content) return data.choices[0].message.content;
                else console.log(`Grok ${mod} Error:`, data.error?.message || "Unknown");
            } catch (e) { }
        }
    }
    throw new Error("All AI Engines Failed.");
}

function appendMessage(role, text) {
    const div = document.createElement('div');
    div.className = role === 'user' ? 'user-msg' : 'ai-msg';
    div.innerHTML = text.replace(/\n/g, '<br>');
    chatMessages.appendChild(div);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

const aiChatBtn = document.getElementById('aiChatBtn');
if (aiChatBtn) aiChatBtn.addEventListener('click', window.toggleChatbot);

window.botQuickAction = (action) => { chatInput.value = `Tell me about your ${action}`; window.sendBotMessage(); };
window.startNewChat = () => { chatMessages.innerHTML = `<div class="ai-msg">Welcome. How can I help with your HVAC project?</div>`; };
