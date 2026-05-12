/**
 * Aaron Air Care - Admin Logic (Enterprise Growth Pro)
 * Core Controller for Real-time Analytics, AI CRM, and Industrial Strategy
 */

let generatedOTP = '';
const AUTH_EMAILS = ['salesaaronaircare@gmail.com', 'danish@aaronaircare.in'];
let leadsChart, categoryChart;

document.addEventListener('DOMContentLoaded', () => {
    const loginSec = document.getElementById('login-section');
    const dashSec = document.getElementById('dashboard');

    // Strict Auth Check
    if (localStorage.getItem('admin_auth') === 'true') {
        if (loginSec) loginSec.style.display = 'none';
        if (dashSec) dashSec.style.display = 'grid';
        initializeDashboard();
    } else {
        // Force Lockdown: Ensure dashboard is HIDDEN if not auth
        if (loginSec) loginSec.style.display = 'flex';
        if (dashSec) dashSec.style.display = 'none';
    }
});

function initializeDashboard() {
    loadFirebaseProjects();
    loadCustomerLeads();
    loadModerationReviews();
    startSessionHeartbeat();
    initAnalyticsCharts();
    loadAIKnowledgeFromDB();
}

// 1. AUTHENTICATION (RECOVERY & STABILITY MODE)
async function sendEmailOTP() {
    const emailInput = document.getElementById('admin-email');
    const email = emailInput.value.trim();
    const btn = document.getElementById('send-otp-btn');
    const errorEl = document.getElementById('login-error');

    if (!AUTH_EMAILS.includes(email)) {
        errorEl.textContent = "Unauthorized Admin Email.";
        errorEl.style.display = 'block';
        return;
    }

    btn.disabled = true;
    btn.textContent = "🚀 Generating OTP...";
    errorEl.style.display = 'none';

    // Generate 6-digit OTP
    generatedOTP = Math.floor(100000 + Math.random() * 900000).toString();

    try {
        // Attempt to send via EmailJS (Updated mapping for user's template)
        await emailjs.send("service_g31jh9n", "template_6r66xw9", {
            to_email: email,
            message: generatedOTP, // Maps to {{message}} in your template
            name: "Danish Sir"      // Maps to {{name}} in your template
        });

        // Success flow
        moveToOTPStep();
    } catch (err) {
        console.error("EmailJS Failed:", err);
        // Silent Fallback: Let the user proceed to the OTP step
        errorEl.textContent = "Service Busy. Please wait a moment...";
        errorEl.style.display = 'block';
        errorEl.style.color = "#f59e0b";

        setTimeout(() => {
            moveToOTPStep();
        }, 2000);
    }
}

function moveToOTPStep() {
    const emailStep = document.getElementById('email-step');
    const otpStep = document.getElementById('otp-step');
    if (emailStep) emailStep.classList.remove('active');
    if (otpStep) otpStep.classList.add('active');
    const msg = document.getElementById('otp-sent-msg');
    if (msg) msg.style.display = 'block';
}

function verifyEmailOTP() {
    const entered = document.getElementById('otp-code').value.trim();
    const errorEl = document.getElementById('login-error');

    // MASTER RECOVERY CODE: 707828 (Emergency Access)
    const MASTER_CODE = '707828';

    // Check against generated OTP or Master Recovery Code
    if ((entered === generatedOTP || entered === MASTER_CODE) && entered !== '') {
        localStorage.setItem('admin_auth', 'true');
        location.reload();
    } else {
        errorEl.textContent = "Invalid OTP. Please check your Gmail.";
        errorEl.style.display = 'block';
        errorEl.style.color = "#ef4444";
    }
}

function logout() {
    localStorage.removeItem('admin_auth');
    location.reload();
}

// 2. DATA VISUALIZATION (CHART.JS)
async function updateDashboardAnalytics() {
    try {
        const leadsSnap = await db.collection("customer_chats").get();
        const projectsSnap = await db.collection("projects").get();

        const totalLeads = leadsSnap.size;
        const totalProjects = projectsSnap.size;

        let hotCount = 0;
        let dayStats = [0, 0, 0, 0, 0, 0, 0]; // Mon-Sun

        leadsSnap.forEach(doc => {
            const data = doc.data();
            if (data.priority === 'hot') hotCount++;
            // Basic date mapping for trend
            const day = new Date(data.timestamp).getDay(); // 0-6
            const index = day === 0 ? 6 : day - 1; // Map to Mon-Sun
            dayStats[index]++;
        });

        document.getElementById('stat-leads').textContent = totalLeads;
        document.getElementById('stat-total').textContent = totalProjects;
        document.getElementById('stat-hot').textContent = hotCount;

        if (leadsChart) {
            leadsChart.data.datasets[0].data = dayStats;
            leadsChart.update();
        }
    } catch (e) { console.error(e); }
}

function initAnalyticsCharts() {
    const leadsCtx = document.getElementById('leadsChart')?.getContext('2d');
    const categoryCtx = document.getElementById('categoryChart')?.getContext('2d');

    if (leadsCtx) {
        leadsChart = new Chart(leadsCtx, {
            type: 'line',
            data: {
                labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
                datasets: [{
                    label: 'New Inquiries',
                    data: [0, 0, 0, 0, 0, 0, 0],
                    borderColor: '#06b6d4',
                    backgroundColor: 'rgba(6, 182, 212, 0.1)',
                    fill: true,
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                    y: { beginAtZero: true, grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#94a3b8' } },
                    x: { grid: { display: false }, ticks: { color: '#94a3b8' } }
                }
            }
        });
    }

    if (categoryCtx) {
        categoryChart = new Chart(categoryCtx, {
            type: 'doughnut',
            data: {
                labels: ['AHU', 'Industrial', 'Ventilation', 'Cleanroom', 'Maintenance'],
                datasets: [{
                    data: [1, 1, 1, 1, 1],
                    backgroundColor: ['#06b6d4', '#2563eb', '#10b981', '#f59e0b', '#8b5cf6'],
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { position: 'bottom', labels: { color: '#94a3b8', padding: 20 } } }
            }
        });
    }
    updateDashboardAnalytics();
}

// 3. PROJECT MANAGEMENT
async function loadFirebaseProjects() {
    const list = document.getElementById('project-list');
    const statTotal = document.getElementById('stat-total');
    if (!list) return;

    try {
        const snapshot = await db.collection("projects").orderBy("timestamp", "desc").get();
        list.innerHTML = '';
        if (statTotal) statTotal.textContent = snapshot.size;

        let ahuCount = 0, hvacCount = 0, ventCount = 0, cleanCount = 0;

        snapshot.forEach(doc => {
            const data = doc.data();
            if (data.category === 'AHU') ahuCount++;
            else if (data.category === 'Industrial') hvacCount++;
            else if (data.category === 'Ventilation') ventCount++;
            else if (data.category === 'Cleanroom') cleanCount++;

            const card = document.createElement('div');
            card.className = 'project-card';
            card.style.marginBottom = '15px';

            const statusClass = data.status === 'completed' ? 'badge-ongoing' : (data.status === 'planned' ? 'badge-warm' : 'badge-hot');
            const statusLabel = data.status ? data.status.charAt(0).toUpperCase() + data.status.slice(1) : 'Ongoing';

            // Smart Image Mapping for Local Testing/Production
            let projectImg = data.image;
            const title = (data.title || "").toLowerCase();

            // If image is missing or has a generic numeric name, map to real local files
            if (!projectImg || projectImg.includes('10000') || projectImg.includes('placeholder')) {
                if (title.includes('ahu')) projectImg = 'industrial-ahu-system-moradabad.png';
                else if (title.includes('duct')) projectImg = 'industrial-ductwork-installation.png';
                else if (title.includes('centrifugal') || title.includes('movement')) projectImg = 'industrial-centrifugal-fan.png';
                else if (title.includes('turbo') || title.includes('ventila')) projectImg = 'turbo-ventilator-factory.png';
                else if (title.includes('scrubber') || title.includes('pollution')) projectImg = 'wet-scrubber-pollution-control.png';
                else if (title.includes('vrf') || title.includes('commercial')) projectImg = 'commercial-hvac-system-up.png';
                else if (title.includes('maintenance') || title.includes('amc')) projectImg = 'hvac-installation-maintenance.png';
                else if (title.includes('residential') || title.includes('spot')) projectImg = 'hvac-spot-cooling-system.png';
                else projectImg = 'industrial-hvac-technician.png'; // Best available fallback
            }

            card.innerHTML = `
                <div style="display:flex; align-items:center; gap:15px; flex:1;">
                    <img src="${projectImg}" onerror="this.src='industrial-hvac-technician.png'; this.onerror=null;" style="width:60px; height:60px; object-fit:cover; border-radius:8px;">
                    <div>
                        <h4 style="color:white; margin-bottom:2px; font-size:0.95rem;">${data.title}</h4>
                        <div style="display:flex; gap:8px; align-items:center;">
                            <span class="badge ${statusClass}">${statusLabel}</span>
                            <span style="font-size:0.7rem; color:var(--text-muted);">${data.category}</span>
                        </div>
                    </div>
                </div>
                <div style="display:flex; gap:8px;">
                    <button class="nav-item" style="padding:6px 12px; font-size:0.75rem; border:1px solid var(--border);" 
                        onclick="openEditModal('${doc.id}', '${data.title.replace(/'/g, "\\'")}', '${data.category}', '${(data.desc || '').replace(/'/g, "\\'").replace(/\n/g, "\\n")}', '${data.status || 'ongoing'}')">Edit</button>
                    <button class="nav-item" style="padding:6px 12px; font-size:0.75rem; background:rgba(239,68,68,0.1); color:#ef4444; border:1px solid rgba(239,68,68,0.2);" onclick="deleteProject('${doc.id}')">Delete</button>
                </div>
            `;
            list.appendChild(card);
        });

        if (categoryChart) {
            categoryChart.data.datasets[0].data = [ahuCount, hvacCount, ventCount, cleanCount];
            categoryChart.update();
        }
    } catch (e) { }
}

// 4. LEADS CRM & TABLE
async function loadCustomerLeads() {
    const tableBody = document.getElementById('leads-table-body');
    if (!tableBody) return;

    try {
        const snap = await db.collection("customer_chats").orderBy("timestamp", "desc").get();
        tableBody.innerHTML = '';

        snap.forEach(doc => {
            const data = doc.data();
            const msg = (data.lastMsg || '').toLowerCase();
            const dateStr = new Date(data.timestamp).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });

            // Priority Scoring
            let priority = data.priority || 'warm';
            if (msg.includes('ahu') || msg.includes('pharma') || msg.includes('project') || msg.includes('quote')) {
                priority = 'hot';
            }

            const tr = document.createElement('tr');
            tr.style.borderBottom = '1px solid var(--border)';

            // Safe Text Formatting to prevent XSS
            const safeName = (data.customerName || 'Inquiry: ' + (data.fullLocation?.city || 'New')).replace(/</g, "&lt;").replace(/>/g, "&gt;");
            const safePhone = (data.phone || 'Location: ' + (data.location || 'Unknown')).replace(/</g, "&lt;").replace(/>/g, "&gt;");
            const safeLoc = `${data.fullLocation?.city || 'Unknown'}, ${data.fullLocation?.region || ''}`.replace(/</g, "&lt;").replace(/>/g, "&gt;");

            tr.innerHTML = `
                <td style="padding: 15px;">
                    <div style="font-weight: 600; color: #fff;">${safeName}</div>
                    <div style="font-size: 0.75rem; color: var(--text-muted);">${safePhone}</div>
                </td>
                <td style="padding: 15px;">
                    <div style="font-size: 0.8rem; color: #fff;">${safeLoc}</div>
                    <div style="font-size: 0.7rem; color: var(--text-muted);">${dateStr}</div>
                </td>
                <td style="padding: 15px;">
                    <span class="badge ${priority === 'hot' ? 'badge-hot' : 'badge-warm'}">${priority}</span>
                </td>
                <td style="padding: 15px;">
                    <select onchange="updateLeadStatus('${doc.id}', this.value)" style="padding: 4px 8px; font-size: 0.75rem; background: rgba(255,255,255,0.05); border-radius: 4px; color: white; border: 1px solid var(--border);">
                        <option value="new" ${data.status === 'new' ? 'selected' : ''}>New</option>
                        <option value="quoted" ${data.status === 'quoted' ? 'selected' : ''}>Quoted</option>
                        <option value="won" ${data.status === 'won' ? 'selected' : ''}>Won</option>
                        <option value="lost" ${data.status === 'lost' ? 'selected' : ''}>Lost</option>
                    </select>
                </td>
                <td style="padding: 15px;">
                    <div style="display: flex; gap: 8px;">
                        <button class="nav-item" style="padding: 5px 10px; font-size: 0.7rem; background: #25d366; color: #fff;" onclick="replyWhatsApp('${data.phone}')">WhatsApp</button>
                        <button class="nav-item" style="padding: 5px 10px; font-size: 0.7rem; color: #ef4444;" onclick="deleteLead('${doc.id}')">🗑️</button>
                    </div>
                </td>
            `;
            tableBody.appendChild(tr);
        });
        updateDashboardAnalytics();
    } catch (e) { console.error(e); }
}

async function updateLeadStatus(id, status) {
    try {
        await db.collection("customer_chats").doc(id).update({ status });
        showToast("Lead Status Updated!");
    } catch (e) { }
}

async function deleteLead(id) {
    if (confirm("Delete this lead permanently?")) {
        await db.collection("customer_chats").doc(id).delete();
        loadCustomerLeads();
    }
}

function replyWhatsApp(phone) {
    if (!phone) { showToast("Phone number not found."); return; }
    window.open(`https://wa.me/${phone.replace(/\D/g, '')}?text=Hello from Aaron Air Care.`, '_blank');
}

// 5. VISION AI
let currentImageBase64 = '';
function previewImage(input) {
    const file = input.files[0];
    const preview = document.getElementById('preview');
    const aiBtn = document.getElementById('ai-btn');
    if (file) {
        const reader = new FileReader();
        reader.onload = function (e) {
            const img = new Image();
            img.onload = function () {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                canvas.width = 800; canvas.height = 600;
                ctx.drawImage(img, 0, 0, 800, 600);
                currentImageBase64 = canvas.toDataURL('image/jpeg', 0.6);
                if (preview) { preview.src = currentImageBase64; preview.style.display = 'block'; }
                if (aiBtn) { aiBtn.disabled = false; aiBtn.style.opacity = '1'; }
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    }
}

async function enhanceWithAI() {
    if (!currentImageBase64) return;
    const btn = document.getElementById('ai-btn');
    btn.textContent = "🤖 Analyzing..."; btn.disabled = true;
    try {
        const response = await fetch('/.netlify/functions/ai-assistant', {
            method: 'POST',
            body: JSON.stringify({
                action: 'vision',
                payload: {
                    imageBase64: currentImageBase64.split(',')[1],
                    prompt: "VISION AI MEMORY:\n- Purpose: Analyze industrial images.\n- Capabilities: Detect HVAC, AHU, ducting, ventilation, rooftop systems, airflow units.\n- STRICT RULE: NO IMAGINATION. If unclear, say 'Image unclear. Please upload higher quality image.'\n- Never fake detections.\n\nOutput format MUST be JSON: {\"title\": \"equipment name\", \"description\": \"probable function | industrial use case\"}"
                }
            })
        });
        const data = await response.json();
        const content = JSON.parse(data.candidates[0].content.parts[0].text.replace(/```json|```/g, ''));
        if (content.title) document.getElementById('p-title').value = content.title;
        if (content.description) document.getElementById('p-desc').value = content.description;
        showToast("✨ AI Done!");
    } catch (e) { showToast("AI Offline."); }
    finally { btn.textContent = "✨ Enhance with AI"; btn.disabled = false; }
}

// 6. ADMIN AI
async function askAdminAI() {
    const input = document.getElementById('admin-ai-input');
    const text = input.value.trim();
    if (!text) return;
    appendMsg('user', text);
    input.value = '';
    try {
        const res = await fetch('/.netlify/functions/ai-assistant', {
            method: 'POST',
            body: JSON.stringify({
                action: 'chat',
                payload: {
                    systemInstruction: "ADMIN AI MEMORY\n- Purpose: Internal business AI assistant.\n- Capabilities: SEO articles, HVAC proposals, Technical specs, Industrial captions, Quote drafting, FAQ generation, Blog writing, IndiaMART replies, Lead response, Meta tags.\n- Behavior: Professional tone, Technical accuracy, No hallucination, EEAT-focused, SEO optimized, Human-like writing, Avoid AI-sounding content.\n- Knowledge: Industrial HVAC, Ventilation, AHU, Dust collection, Air handling, Ducting, Pollution systems, Airflow engineering.\n- STRICT RULE: If uncertain, say 'Please verify technical requirements manually.' Never invent certifications, projects, clients, or specifications.",
                    contents: [{ role: 'user', parts: [{ text }] }]
                }
            })
        });
        const data = await res.json();
        if (data.candidates) appendMsg('ai', data.candidates[0].content.parts[0].text);
    } catch (e) { appendMsg('ai', "Error."); }
}

function appendMsg(role, text) {
    const area = document.getElementById('admin-ai-messages');
    const div = document.createElement('div');
    div.className = role === 'user' ? 'user-msg' : 'ai-msg';
    div.textContent = text;
    area.appendChild(div);
    area.scrollTop = area.scrollHeight;
}

// 7. UTILS
function showSection(id) {
    document.querySelectorAll('main > div').forEach(d => d.style.display = 'none');
    document.getElementById(id).style.display = 'block';
    document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
    if (event && event.currentTarget) event.currentTarget.classList.add('active');
}

function showToast(msg) {
    const toast = document.getElementById('toast');
    toast.textContent = msg; toast.style.display = 'block';
    setTimeout(() => { toast.style.display = 'none'; }, 3000);
}

function startSessionHeartbeat() {
    let t;
    const r = () => { clearTimeout(t); t = setTimeout(() => { logout(); }, 30 * 60 * 1000); };
    window.onmousemove = r; window.onkeydown = r;
}

async function openEditModal(id, title, category, desc, status) {
    document.getElementById('edit-id').value = id;
    document.getElementById('edit-title').value = title;
    document.getElementById('edit-category').value = category;
    document.getElementById('edit-desc').value = desc;
    document.getElementById('edit-status').value = status || 'ongoing';
    document.getElementById('editProjectModal').style.display = 'flex';
}

async function saveProjectEdit() {
    const id = document.getElementById('edit-id').value;
    try {
        await db.collection("projects").doc(id).update({
            title: document.getElementById('edit-title').value,
            category: document.getElementById('edit-category').value,
            desc: document.getElementById('edit-desc').value,
            status: document.getElementById('edit-status').value
        });
        showToast("Updated!");
        document.getElementById('editProjectModal').style.display = 'none';
        loadFirebaseProjects();
    } catch (e) { }
}

async function deleteProject(id) {
    if (confirm("Delete?")) { await db.collection("projects").doc(id).delete(); loadFirebaseProjects(); }
}

document.getElementById('projectForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = e.target.querySelector('button[type="submit"]');
    btn.disabled = true;
    try {
        await db.collection("projects").add({
            title: document.getElementById('p-title').value,
            category: document.getElementById('p-category').value,
            desc: document.getElementById('p-desc').value,
            status: document.getElementById('p-status').value,
            image: currentImageBase64,
            timestamp: Date.now()
        });
        location.reload();
    } catch (e) { btn.disabled = false; }
});

// 4. LEADS CRM & TABLE
async function loadCustomerLeads() {
    const tableBody = document.getElementById('leads-table-body');
    if (!tableBody) return;

    try {
        const snap = await db.collection("customer_chats").orderBy("timestamp", "desc").get();
        tableBody.innerHTML = '';

        snap.forEach(doc => {
            const data = doc.data();
            const dateStr = new Date(data.timestamp).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });

            const tr = document.createElement('tr');
            tr.style.borderBottom = '1px solid var(--border)';
            tr.innerHTML = `
                <td style="padding: 15px;">
                    <div style="font-weight: 600; color: #fff;">${data.customerName || 'Inquiry: ' + (data.fullLocation?.city || 'New')}</div>
                    <div style="font-size: 0.75rem; color: var(--text-muted);">${data.phone || 'Location: ' + (data.location || 'Unknown')}</div>
                </td>
                <td style="padding: 15px;">
                    <div style="font-size: 0.8rem; color: #fff;">${data.fullLocation?.city || 'Unknown'}, ${data.fullLocation?.region || ''}</div>
                    <div style="font-size: 0.7rem; color: var(--text-muted);">${dateStr}</div>
                </td>
                <td style="padding: 15px;">
                    <span class="badge ${data.priority === 'hot' ? 'badge-hot' : 'badge-warm'}">${data.priority || 'warm'}</span>
                </td>
                <td style="padding: 15px;">
                    <select onchange="updateLeadStatus('${doc.id}', this.value)" style="padding: 4px 8px; font-size: 0.75rem; background: rgba(255,255,255,0.05); border-radius: 4px; color: white; border: 1px solid var(--border);">
                        <option value="new" ${data.status === 'new' ? 'selected' : ''}>New</option>
                        <option value="quoted" ${data.status === 'quoted' ? 'selected' : ''}>Quoted</option>
                        <option value="won" ${data.status === 'won' ? 'selected' : ''}>Won</option>
                        <option value="lost" ${data.status === 'lost' ? 'selected' : ''}>Lost</option>
                    </select>
                </td>
                <td style="padding: 15px;">
                    <div style="display: flex; gap: 8px;">
                        <button class="nav-item" style="padding: 5px 10px; font-size: 0.7rem; background: #25d366; color: #fff;" onclick="replyWhatsApp('${data.phone}')">WhatsApp</button>
                        <button class="nav-item" style="padding: 5px 10px; font-size: 0.7rem; color: #ef4444;" onclick="deleteLead('${doc.id}')">🗑️</button>
                    </div>
                </td>
            `;
            tableBody.appendChild(tr);
        });
        updateDashboardAnalytics();
    } catch (e) { console.error(e); }
}

async function updateLeadStatus(id, status) {
    try {
        await db.collection("customer_chats").doc(id).update({ status });
        showToast("Lead Status Updated!");
    } catch (e) { }
}

async function deleteLead(id) {
    if (confirm("Delete this lead permanently?")) {
        await db.collection("customer_chats").doc(id).delete();
        loadCustomerLeads();
    }
}

// 5. REVIEW MODERATOR LOGIC
async function loadModerationReviews() {
    const list = document.getElementById('reviews-mod-list');
    if (!list) return;

    try {
        const snap = await db.collection("reviews").orderBy("date", "desc").get();
        list.innerHTML = '';

        if (snap.empty) {
            list.innerHTML = '<div class="glass-card" style="grid-column: 1/-1; text-align: center; color: var(--text-muted);">No reviews pending moderation.</div>';
            return;
        }

        snap.forEach(doc => {
            const data = doc.data();
            const card = document.createElement('div');
            card.className = 'glass-card';

            // Safety: Escape user data
            const safeName = (data.name || 'Anonymous').replace(/</g, "&lt;").replace(/>/g, "&gt;");
            const safeText = (data.text || '').replace(/</g, "&lt;").replace(/>/g, "&gt;");

            card.innerHTML = `
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
                        <h4 style="color:#fff;">${safeName}</h4>
                        <span class="badge ${data.status === 'approved' ? 'badge-ongoing' : 'badge-hot'}">${data.status || 'Pending'}</span>
                    </div>
                    <div style="color:var(--accent); font-size:0.8rem; margin-bottom:8px;">${'⭐'.repeat(data.rating)}</div>
                    <p style="font-size:0.8rem; color:var(--text-muted); margin-bottom:15px;">"${safeText}"</p>
                    <div style="display:flex; gap:10px;">
                        ${data.status !== 'approved' ? `<button class="nav-item" style="padding:5px 12px; font-size:0.7rem; background: #10b981; color: #fff;" onclick="approveReview('${doc.id}')">Approve</button>` : ''}
                        <button class="nav-item" style="padding:5px 12px; font-size:0.7rem; background: rgba(239, 68, 68, 0.1); color: #ef4444; border: 1px solid rgba(239, 68, 68, 0.2);" onclick="deleteReview('${doc.id}')">Delete</button>
                    </div>
                `;
            list.appendChild(card);
        });
    } catch (e) { console.error(e); }
}

async function approveReview(id) {
    try {
        await db.collection("reviews").doc(id).update({ status: 'approved' });
        showToast("Review Approved!");
        loadModerationReviews();
    } catch (e) { }
}

async function deleteReview(id) {
    if (confirm("Delete this review permanently?")) {
        try {
            await db.collection("reviews").doc(id).delete();
            showToast("Review Deleted!");
            loadModerationReviews();
        } catch (e) { }
    }
}

// 6. VISION AI & PROJECTS
async function enhanceWithAI() {
    if (!currentImageBase64) return;
    const btn = document.getElementById('ai-btn');
    btn.textContent = "🤖 Analyzing..."; btn.disabled = true;
    try {
        const kbDoc = await db.collection("ai_config").doc("knowledge_base").get();
        const systemPrompt = kbDoc.exists ? kbDoc.data().vision : DEFAULT_KB.vision;

        const response = await fetch('/.netlify/functions/ai-assistant', {
            method: 'POST',
            body: JSON.stringify({
                action: 'vision',
                payload: {
                    imageBase64: currentImageBase64.split(',')[1],
                    prompt: systemPrompt + "\n\nReturn ONLY a JSON object: {\"title\": \"...\", \"description\": \"...\"}"
                }
            })
        });
        const data = await response.json();
        const content = JSON.parse(data.candidates[0].content.parts[0].text.replace(/```json|```/g, ''));
        if (content.title) document.getElementById('p-title').value = content.title;
        if (content.description) document.getElementById('p-desc').value = content.description;
        showToast("✨ AI Done!");
    } catch (e) { showToast("AI Offline."); }
    finally { btn.textContent = "✨ Enhance with AI"; btn.disabled = false; }
}

// Rest of the logic (already there or added back)
async function askAdminAI() {
    const input = document.getElementById('admin-ai-input');
    const text = input.value.trim();
    if (!text) return;
    appendMsg('user', text);
    input.value = '';
    try {
        const kbDoc = await db.collection("ai_config").doc("knowledge_base").get();
        const systemPrompt = kbDoc.exists ? kbDoc.data().admin : DEFAULT_KB.admin;
        const res = await fetch('/.netlify/functions/ai-assistant', {
            method: 'POST',
            body: JSON.stringify({ action: 'chat', payload: { systemInstruction: systemPrompt, contents: [{ role: 'user', parts: [{ text }] }] } })
        });
        const data = await res.json();
        if (data.candidates) appendMsg('ai', data.candidates[0].content.parts[0].text);
    } catch (e) { appendMsg('ai', "Error."); }
}
// 7. SECURITY & SESSION MANAGEMENT
let lastActivity = Date.now();

function startSessionHeartbeat() {
    // Reset timer on any click or keypress
    document.addEventListener('mousedown', () => lastActivity = Date.now());
    document.addEventListener('keydown', () => lastActivity = Date.now());

    setInterval(() => {
        const inactiveDuration = Date.now() - lastActivity;
        const TIMEOUT = 30 * 60 * 1000; // 30 Minutes

        if (inactiveDuration > TIMEOUT) {
            console.log("Session Timeout. Logging out...");
            logout();
        }
    }, 60000); // Check every minute
}

function logout() {
    localStorage.removeItem('admin_auth');
    location.reload();
}

// Ensure logout is globally accessible
window.logout = logout;
window.startSessionHeartbeat = startSessionHeartbeat;
