/**
 * Aaron Air Care Engineering - Enterprise AI Assistant
 * Production-Level Implementation
 */

let chatSessionId = 'cust_' + Date.now();
let customerIPData = { city: 'Unknown', region: 'Unknown', country: 'IN' };

// Silent IP Geolocation
async function fetchCustomerLocation() {
    try {
        const res = await fetch('https://ipapi.co/json/');
        const data = await res.json();
        customerIPData = {
            city: data.city || 'Unknown',
            region: data.region || 'Unknown',
            country: data.country_name || 'India',
            ip: data.ip
        };
    } catch (e) { console.warn("Geo lookup failed"); }
}
fetchCustomerLocation();

// AI Proxy Endpoint
const AI_PROXY_URL = '/.netlify/functions/ai-assistant';

const COMPANY_KNOWLEDGE = `
WEBSITE CUSTOMER CHATBOT MEMORY
━━━━━━━━━━━━━━━━━━

Purpose:
Handle customer inquiries professionally.

Permanent Memory:

Company:
Aaron Air Care Engineering

Industry:
Industrial HVAC Engineering

Core Services:
- Industrial HVAC Solutions
- AHU Manufacturing
- Industrial Ventilation
- Dust Collection Systems
- GI/SS Duct Fabrication
- Rooftop Ventilation
- Cleanroom HVAC
- Factory Exhaust Systems
- Commercial HVAC
- Turnkey HVAC Projects

Target Industries:
- Pharmaceutical Plants
- Textile Units
- Warehouses
- Food Processing Plants
- Manufacturing Units
- Commercial Buildings

Locations:
- Moradabad
- Uttar Pradesh
- Pune Facility

Business Rules:
1. Speak professionally in simple English/Hinglish
2. Never behave casually
3. Never use emojis excessively
4. Never give fake pricing
5. Never promise impossible timelines
6. Never generate false technical specifications
7. Never answer unrelated topics
8. Push serious leads toward: WhatsApp, Quote Request, Phone Call

Lead Detection Rules:
Detect: hot lead, quotation intent, urgent project, spam user.
Hot lead triggers: quotation, HVAC installation, factory project, ventilation system, AHU setup, turnkey project.

If you detect the customer's name, phone number, or city, include it in your JSON response.

Respond ONLY in JSON format: {"reply": "...", "followUp": "...", "detectedName": "...", "detectedPhone": "..."}
`;

async function sendBotMessage(retryCount = 0) {
    const input = document.getElementById('bot-input');
    const text = input.value.trim();
    if (!text && retryCount === 0) return;

    if (retryCount === 0) {
        appendBotMsg('user', text);
        input.value = '';
        const typing = document.getElementById('bot-typing');
        if (typing) {
            typing.style.display = 'flex';
            typing.scrollIntoView({ behavior: 'smooth' });
        }
    }

    try {
        const allMsgs = Array.from(document.querySelectorAll('.user-msg, .ai-msg'));
        const recentMsgs = allMsgs.slice(-10);

        let geminiContents = [];
        recentMsgs.forEach(el => {
            let content = el.innerText || el.textContent;
            let isUser = el.classList.contains('user-msg');
            geminiContents.push({ role: isUser ? "user" : "model", parts: [{ text: content }] });
        });

        // Local Development Sandbox Fallback
        if (location.hostname === "localhost" || location.hostname === "127.0.0.1") {
            // PRO TIP: To test "Real AI" locally without Netlify, set window.LOCAL_AI_KEY in console
            if (!window.LOCAL_AI_KEY) {
                console.warn("Aaron AI: Running in Local Sandbox Mode. To test 'Real AI' locally, set window.LOCAL_AI_KEY = 'your_key_here'");
                const typing = document.getElementById('bot-typing');
                if (typing) typing.style.display = 'none';

                const mockResponses = [
                    "I am currently in **Local Sandbox Mode**. Once deployed to production, I will use my full Industrial HVAC intelligence to assist you.",
                    "That sounds like a technical requirement! In production, I will analyze your specifications and provide a detailed engineering quote.",
                    "Industrial Ventilation is our specialty. I am ready to assist as soon as the secure AI proxy is active on the live server."
                ];
                const randomMsg = mockResponses[Math.floor(Math.random() * mockResponses.length)];
                appendBotMsg('ai', randomMsg);
                return;
            }
        }

        // Fetch dynamic knowledge from Firestore
        let systemPrompt = COMPANY_KNOWLEDGE; // Fallback
        try {
            if (typeof db !== 'undefined') {
                const kbDoc = await db.collection("ai_config").doc("knowledge_base").get();
                if (kbDoc.exists && kbDoc.data().customer) {
                    systemPrompt = kbDoc.data().customer;
                }
            }
        } catch (e) { console.warn("Knowledge fetch failed, using fallback."); }

        // Determine URL: If we have a local key, call Gemini directly. Otherwise use Proxy.
        let targetUrl = AI_PROXY_URL;
        let requestBody = {
            action: 'chat',
            payload: {
                systemInstruction: systemPrompt,
                contents: geminiContents,
                model: 'gemini-1.5-flash'
            }
        };

        if (window.LOCAL_AI_KEY) {
            targetUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${window.LOCAL_AI_KEY}`;
            requestBody = {
                system_instruction: { parts: { text: systemPrompt } },
                contents: geminiContents,
                generationConfig: { response_mime_type: "application/json" }
            };
        }

        const response = await fetch(targetUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestBody)
        });

        const typing = document.getElementById('bot-typing');
        if (typing) typing.style.display = 'none';

        // Check if response is valid
        if (!response.ok) {
            if (response.status === 405 || response.status === 404) {
                appendBotMsg('ai', "<strong>Environment Note:</strong> The secure AI proxy requires a Netlify environment. For local testing, please use <code>netlify dev</code> or deploy to your production URL.");
                return;
            }
            throw new Error(`HTTP Error ${response.status}`);
        }

        const data = await response.json();

        if (data.error) {
            if (data.error.includes("Missing GEMINI_API_KEY")) {
                appendBotMsg('ai', "<strong>Security Alert:</strong> AI Key not detected. Please configure GEMINI_API_KEY in your Netlify Environment Variables to enable this production assistant.");
                return;
            }
            throw new Error(data.error);
        }

        if (data.candidates && data.candidates[0].content.parts[0].text) {
            let aiRaw = data.candidates[0].content.parts[0].text;

            // Handle Markdown JSON blocks
            aiRaw = aiRaw.replace(/```json\n?|```/g, '').trim();

            let finalMsg = "";
            let detectedData = {};
            try {
                const parsed = JSON.parse(aiRaw);
                finalMsg = parsed.reply || parsed.text || aiRaw;
                if (parsed.followUp) finalMsg += `<br><br><span style="color:var(--accent); font-weight:700;">${parsed.followUp}</span>`;
                detectedData = { name: parsed.detectedName, phone: parsed.detectedPhone };
            } catch (e) {
                finalMsg = aiRaw;
            }

            appendBotMsg('ai', finalMsg);
            logChatToAdmin(text, finalMsg, detectedData);
        } else {
            throw new Error("Empty Response");
        }

    } catch (err) {
        console.error("AI Error:", err);
        const typing = document.getElementById('bot-typing');
        if (typing) typing.style.display = 'none';
        appendBotMsg('ai', "Temporary AI service issue. Please call our team at <strong>+91 70782 84202</strong> for immediate assistance.");
    }
}

function toggleChatbot() {
    const chatWindow = document.getElementById('chatbot-window');
    if (!chatWindow) return;

    chatWindow.classList.toggle('active');

    if (chatWindow.classList.contains('active')) {
        const badge = document.querySelector('.trigger-badge');
        if (badge) badge.style.display = 'none';
        setTimeout(() => {
            document.getElementById('bot-input')?.focus();
        }, 600);
    }
}

function startNewChat() {
    const msgArea = document.getElementById('chatbot-messages');
    if (!msgArea) return;
    msgArea.innerHTML = '';
    chatSessionId = 'cust_' + Date.now();
    appendBotMsg('ai', "Hello! 🤖 I am the official assistant of **Aaron Air Care Engineering**. How can I assist you with your industrial HVAC, AHU, or ventilation projects today?");
}

function appendBotMsg(type, text) {
    const msgArea = document.getElementById('chatbot-messages');
    if (!msgArea) return;

    const div = document.createElement('div');
    div.className = type === 'user' ? 'user-msg' : 'ai-msg';

    // Support for formatting
    let formatted = text
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\n/g, '<br>');
    div.innerHTML = formatted;

    msgArea.appendChild(div);
    setTimeout(() => {
        div.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }, 100);
}

function botQuickAction(action) {
    const input = document.getElementById('bot-input');
    if (action === 'Request Quote') input.value = "I want a formal quote for an HVAC project.";
    if (action === 'Services') input.value = "Tell me about your AHU and Ventilation services.";
    if (action === 'Contact') input.value = "Where are your offices located?";
    if (action === 'About Founder') input.value = "Who is the founder of Aaron Air Care?";
    if (action === 'Recent Projects') input.value = "Show me some of your recent projects.";

    sendBotMessage();
}

async function logChatToAdmin(userMsg, aiMsg, detected = {}) {
    if (typeof db === 'undefined') return;
    try {
        const chatRef = db.collection("customer_chats").doc(chatSessionId);
        let updateData = {
            sessionId: chatSessionId,
            lastMsg: userMsg,
            timestamp: Date.now(),
            dateStr: new Date().toLocaleString(),
            location: customerIPData.city + ", " + customerIPData.region,
            fullLocation: customerIPData,
            status: 'new'
        };

        if (detected.name) updateData.customerName = detected.name;
        if (detected.phone) updateData.phone = detected.phone;

        await chatRef.set(updateData, { merge: true });

        await chatRef.collection("history").add({
            role: 'user',
            text: userMsg,
            timestamp: Date.now()
        });

        await chatRef.collection("history").add({
            role: 'ai',
            text: aiMsg,
            timestamp: Date.now()
        });
    } catch (e) {
        console.warn("Log error:", e);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const btn = document.getElementById('aiChatBtn');
    if (btn) btn.addEventListener('click', toggleChatbot);
});

document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        const chatWindow = document.getElementById('chatbot-window');
        if (chatWindow && chatWindow.classList.contains('active')) toggleChatbot();
    }
});
