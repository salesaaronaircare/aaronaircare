// Aaron Air Care - Client-Side Industrial AI Assistant
const GEMINI_KEYS = [
    "AIzaSyDJgdIyIAi1XimoBW3eiBkuH2rFUVhMQtg",
    "AIzaSyDmNO__fxrao8q-K-LHoIp6x9IEx52LRvg",
    "AIzaSyDaAEDWxCMF-BXsdm3LDP0Qt-en-RR3ZNE",
    "AIzaSyCTQfWHB5bkzgwJyPE2Xzha8jLy4cXRg1A"
];

const SYSTEM_PROMPT = "You are Aaron's Industrial AI Consultant. Professional, technical, and helpful. You specialize in HVAC, AHU, and industrial ventilation.";

async function sendBotMessage(userText, history = []) {
    let lastError = "";

    // Convert history for Gemini
    const contents = history.map(h => ({
        role: h.role === 'user' ? 'user' : 'model',
        parts: [{ text: h.text }]
    }));
    contents.push({ role: 'user', parts: [{ text: userText }] });

    for (const key of GEMINI_KEYS) {
        try {
            const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${key}`;
            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents,
                    system_instruction: { parts: [{ text: SYSTEM_PROMPT }] }
                })
            });

            const data = await response.json();
            if (response.ok && data.candidates && data.candidates[0].content.parts[0].text) {
                return data.candidates[0].content.parts[0].text;
            }
            lastError = data.error?.message || "Unknown API Error";
        } catch (err) {
            lastError = err.message;
        }
    }
    throw new Error(lastError || "All AI keys failed.");
}

// UI Integration
const chatInput = document.getElementById('chat-input');
const sendBtn = document.getElementById('send-btn');
const chatMessages = document.getElementById('chat-messages');

let chatHistory = [];

async function handleChat() {
    const text = chatInput.value.trim();
    if (!text) return;

    // Add User Message
    appendMessage('user', text);
    chatInput.value = '';

    // Add Thinking
    const thinkingId = 'thinking-' + Date.now();
    appendMessage('ai', 'Thinking...', thinkingId);

    try {
        const aiResponse = await sendBotMessage(text, chatHistory);
        document.getElementById(thinkingId).innerText = aiResponse;
        chatHistory.push({ role: 'user', text: text });
        chatHistory.push({ role: 'ai', text: aiResponse });
    } catch (err) {
        document.getElementById(thinkingId).innerText = "Temporary AI service issue. Please call us for assistance.";
        console.error("AI Error:", err);
    }
}

function appendMessage(role, text, id = null) {
    const msgDiv = document.createElement('div');
    msgDiv.className = `message ${role}-message`;
    if (id) msgDiv.id = id;
    msgDiv.innerText = text;
    chatMessages.appendChild(msgDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

sendBtn.addEventListener('click', handleChat);
chatInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') handleChat(); });
