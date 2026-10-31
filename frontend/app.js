// ============================================================
//  DermAI — Frontend Application Logic
//  All API calls go to the Node.js backend (port 3001)
// ============================================================

const API = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
  ? 'http://localhost:3001/api'
  : '/api';

// ── App State ────────────────────────────────────────────────
const state = {
  user: null,
  token: null,
  currentPage: 'home',
  lastResult: null,
  scanHistory: [],
  chatCount: 0,
  uploadedImage: null,
  cameraStream: null,
  facingMode: 'environment',
  skinTone: 'Type I',
  isDark: false,
  userLocation: null,          // { lat, lng, displayName, source }
  nearbyClinics: [],           // fetched clinic list
  selectedClinic: null,        // clinic object chosen for appointment
  searchRadius: 10000,         // default 10km (in meters)
  clinicSortBy: 'distance',    // distance | rating | name
  selectedTimeSlot: '10:30 AM',
  appointments: []             // saved appointment requests
};

// ── Init ─────────────────────────────────────────────────────
let authProvider;
let analytics;
window.addEventListener('DOMContentLoaded', async () => {
  // Fetch Config
  try {
    const configRes = await fetch(`${API}/config`);
    const configData = await configRes.json();
    if (typeof firebase !== 'undefined' && configData.firebaseConfig && configData.firebaseConfig.apiKey) {
      firebase.initializeApp(configData.firebaseConfig);
      authProvider = new firebase.auth.GoogleAuthProvider();
      if (firebase.analytics) {
        analytics = firebase.analytics();
      }
    }
  } catch (e) {
    console.warn("Firebase config fetch or init error:", e);
  }

  window.addEventListener('popstate', (e) => {
    if (e.state && e.state.page) showPage(e.state.page, false);
    else showPage(window.location.hash.replace('#', '') || 'home', false);
  });
  setTimeout(() => {
    const loader = document.getElementById('loader');
    loader.style.opacity = '0';
    setTimeout(() => loader.classList.add('hidden'), 500);
  }, 1600);

  // Check saved session
  const savedToken = localStorage.getItem('dermai_token');
  const savedUser = localStorage.getItem('dermai_user');
  if (savedToken && savedUser) {
    try {
      state.token = savedToken;
      state.user = JSON.parse(savedUser);
      enterApp();
    } catch (e) {
      console.warn('Failed to restore session:', e);
      localStorage.removeItem('dermai_token');
      localStorage.removeItem('dermai_user');
    }
  }

  // Restore settings
  const savedTheme = localStorage.getItem('dermai_theme');
  if (savedTheme === 'dark') { 
    document.body.classList.add('dark'); 
    state.isDark = true; 
  } else {
    document.body.classList.remove('dark'); 
    state.isDark = false; 
  }
  syncThemeToggle();
  const savedTone = localStorage.getItem('dermai_skintone');
  if (savedTone) state.skinTone = savedTone;
});

// ── Auth ─────────────────────────────────────────────────────
async function doLogin() {
  const email = document.getElementById('loginEmail').value.trim();
  const pass = document.getElementById('loginPass').value;
  if (!email || !pass) return showToast('Enter email and password', '⚠️');
  const btn = document.getElementById('loginBtn');
  btn.disabled = true; btn.textContent = 'Signing in...';
  try {
    const r = await fetch(`${API}/auth/login`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password: pass })
    });
    const d = await r.json();
    if (!r.ok) {
      showToast(d.error || 'Login failed', '❌');
      btn.disabled = false; btn.textContent = 'Sign In →';
      return;
    }
    if (!d.token || !d.user) {
      showToast('Invalid server response. Please try again.', '❌');
      btn.disabled = false; btn.textContent = 'Sign In →';
      return;
    }
    state.token = d.token;
    state.user = d.user;
    localStorage.setItem('dermai_token', d.token);
    localStorage.setItem('dermai_user', JSON.stringify(d.user));
    showToast(`Welcome back, ${d.user.firstName || 'User'}!`, '✅');
    enterApp();
  } catch (err) {
    console.error('Login error:', err);
    showToast('Cannot connect to server. Is the backend running?', '❌');
  }
  finally { btn.disabled = false; btn.textContent = 'Sign In →'; }
}

async function doSignup() {
  const first = document.getElementById('signupFirst').value.trim();
  const last = document.getElementById('signupLast').value.trim();
  const email = document.getElementById('signupEmail').value.trim();
  const pass = document.getElementById('signupPass').value;
  const tone = getSelectedSkinTone('signupSkinTones');
  if (!first || !email || !pass) return showToast('Fill in all required fields', '⚠️');
  if (pass.length < 6) return showToast('Password must be at least 6 characters', '⚠️');
  const consentBox = document.getElementById('signupConsent');
  if (consentBox && !consentBox.checked) return showToast('Please agree to the Privacy Policy to continue', '🛡️');
  const btn = document.getElementById('signupBtn');
  btn.disabled = true; btn.textContent = 'Creating...';
  try {
    const r = await fetch(`${API}/auth/signup`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password: pass, firstName: first, lastName: last, skinTone: tone })
    });
    const d = await r.json();
    if (!r.ok) { showToast(d.error || 'Signup failed', '❌'); return; }
    state.token = d.token; state.user = d.user;
    localStorage.setItem('dermai_token', d.token);
    localStorage.setItem('dermai_user', JSON.stringify(d.user));
    enterApp();
  } catch { showToast('Cannot connect to server', '❌'); }
  finally { btn.disabled = false; btn.textContent = 'Create Account →'; }
}

async function googleLogin() {
  let fallbackMode = false;
  if (typeof firebase === 'undefined' || !firebase.apps.length) {
    console.warn('Firebase not configured. Falling back to mock login.');
    showToast('Real Google Sign-In needs config. Using demo bypass...', 'ℹ️');
    fallbackMode = true;
  }
  
  let name = 'Demo User';
  let email = 'demo@dermai.app';

  if (!fallbackMode) {
    try {
      const result = await firebase.auth().signInWithPopup(authProvider);
      name = result.user.displayName || name;
      email = result.user.email || email;
    } catch (e) {
      console.warn('Popup failed or cancelled. Falling back to mock login.', e);
      showToast('Popup failed. Using demo bypass...', 'ℹ️');
      fallbackMode = true;
    }
  }

  try {
    const r = await fetch(`${API}/auth/google`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email })
    });
    const d = await r.json();
    if (!r.ok) { showToast('Google login backend failed', '❌'); return; }
    state.token = d.token; state.user = d.user;
    localStorage.setItem('dermai_token', d.token);
    localStorage.setItem('dermai_user', JSON.stringify(d.user));
    enterApp();
  } catch (e) { console.error(e); showToast('Cannot connect to server', '❌'); }
}

function doLogout() {
  state.token = null; state.user = null; state.lastResult = null;
  localStorage.removeItem('dermai_token'); localStorage.removeItem('dermai_user');
  document.getElementById('mainApp').classList.add('hidden');
  document.getElementById('authWrap').classList.remove('hidden');
  document.getElementById('loginPage').classList.remove('hidden');
  document.getElementById('signupPage').classList.add('hidden');
  showToast('Signed out successfully', '👋');
}

function enterApp() {
  document.getElementById('authWrap').classList.add('hidden');
  document.getElementById('mainApp').classList.remove('hidden');
  const name = state.user?.firstName || 'User';
  document.getElementById('heroTitle').textContent = `Good day, ${name}!`;
  document.getElementById('userName').textContent = `${state.user?.firstName || ''} ${state.user?.lastName || ''}`.trim();
  document.getElementById('userAvatar').textContent = (state.user?.firstName?.[0] || 'U').toUpperCase();
  loadHistory();
  const initialPage = window.location.hash.replace('#', '') || 'home';
  showPage(initialPage);
}

function showLogin() { document.getElementById('loginPage').classList.remove('hidden'); document.getElementById('signupPage').classList.add('hidden'); }
function showSignup() { document.getElementById('signupPage').classList.remove('hidden'); document.getElementById('loginPage').classList.add('hidden'); }
function togglePass(id) { const el = document.getElementById(id); el.type = el.type === 'password' ? 'text' : 'password'; }

// ── Navigation ───────────────────────────────────────────────
function showPage(page, updateHistory = true) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  const pg = document.getElementById(`page-${page}`);
  if (pg) pg.classList.add('active');
  const nav = document.getElementById(`nav-${page}`);
  if (nav) nav.classList.add('active');
  state.currentPage = page;
  if (updateHistory) {
    history.pushState({ page }, '', `#${page}`);
  }
  const titles = {
    home: 'Dashboard',
    scan: 'Scan Skin',
    assistant: 'AI Assistant',
    results: 'Results',
    doctors: 'Dermatologists',
    appointment: 'Book Appointment',
    history: 'History',
    settings: 'Settings',
    privacy: 'Data Privacy'
  };
  document.getElementById('pageTitle').textContent = titles[page] || page;
  if (page === 'doctors') loadDoctors();
  if (page === 'appointment') prepareAppointmentPage();
  if (page === 'history') renderHistory();
  if (page === 'assistant') checkAssistantState();
  // Close sidebar on mobile
  if (window.innerWidth <= 768) document.getElementById('sidebar').classList.remove('open');
}

function toggleSidebar() { document.getElementById('sidebar').classList.toggle('open'); }

// ── Skin Tone ────────────────────────────────────────────────
function selectSkinTone(el, groupId) {
  document.querySelectorAll(`#${groupId} .skin-tone`).forEach(t => t.classList.remove('selected'));
  el.classList.add('selected');
  state.skinTone = el.getAttribute('data-label') || 'Type I';
  localStorage.setItem('dermai_skintone', state.skinTone);
}
function getSelectedSkinTone(groupId) {
  const sel = document.querySelector(`#${groupId} .skin-tone.selected`);
  return sel ? sel.getAttribute('data-label') : 'Type I';
}

// ── Scan Mode (legacy stub) ──────────────────────────────────
function setScanMode() {} // Replaced by unified composer
function clearUpload() { removeComposerImage(); }

// ── Unified Scan Composer ────────────────────────────────────
let composerImage = null;

function autoResizeComposer(el) {
  el.style.height = 'auto';
  el.style.height = Math.min(el.scrollHeight, 220) + 'px';
}

function toggleAttachMenu() {
  const popup = document.getElementById('attachPopup');
  const btn = document.getElementById('composerPlusBtn');
  const isOpen = !popup.classList.contains('hidden');
  popup.classList.toggle('hidden', isOpen);
  btn.classList.toggle('active', !isOpen);
  if (!isOpen) {
    setTimeout(() => document.addEventListener('click', closeAttachOnOutside, { once: true }), 10);
  }
}
function closeAttachOnOutside(e) {
  const wrap = document.getElementById('composerAttachWrap');
  if (wrap && !wrap.contains(e.target)) {
    document.getElementById('attachPopup')?.classList.add('hidden');
    document.getElementById('composerPlusBtn')?.classList.remove('active');
  }
}

function openComposerGallery() {
  document.getElementById('attachPopup')?.classList.add('hidden');
  document.getElementById('composerPlusBtn')?.classList.remove('active');
  document.getElementById('composerFileInput').click();
}
function handleComposerFile(e) {
  const file = e.target.files[0];
  if (!file) return;
  if (!file.type.startsWith('image/')) return showToast('Please select an image file', '⚠️');
  if (file.size > 15 * 1024 * 1024) return showToast('Image too large. Max 15MB', '⚠️');
  const reader = new FileReader();
  reader.onload = (ev) => attachComposerImage(ev.target.result);
  reader.readAsDataURL(file);
  e.target.value = '';
}

function openComposerCamera() {
  document.getElementById('attachPopup')?.classList.add('hidden');
  document.getElementById('composerPlusBtn')?.classList.remove('active');
  document.getElementById('cameraModal')?.classList.remove('hidden');
  startCamera();
}
function closeCameraModal() {
  document.getElementById('cameraModal')?.classList.add('hidden');
  stopCamera();
}
function captureComposerPhoto() {
  const video = document.getElementById('cameraFeed');
  const canvas = document.getElementById('captureCanvas');
  canvas.width = video.videoWidth || 640;
  canvas.height = video.videoHeight || 480;
  canvas.getContext('2d').drawImage(video, 0, 0);
  const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
  closeCameraModal();
  attachComposerImage(dataUrl);
  showToast('Photo captured!', '📸');
}

function attachComposerImage(dataUrl) {
  composerImage = dataUrl;
  state.uploadedImage = dataUrl;
  const thumb = document.getElementById('composerThumb');
  if (thumb) thumb.src = dataUrl;
  document.getElementById('composerImagePreview')?.classList.remove('hidden');
  document.getElementById('composerHint').textContent = '🖼️ Photo ready · add context or send now';
  showToast('Photo attached!', '✅');
}
function removeComposerImage() {
  composerImage = null;
  state.uploadedImage = null;
  document.getElementById('composerImagePreview')?.classList.add('hidden');
  const thumb = document.getElementById('composerThumb');
  if (thumb) thumb.src = '';
  const hint = document.getElementById('composerHint');
  if (hint) hint.textContent = 'Type symptoms · attach photo · or both';
}

function startVoiceComposer() {
  if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
    return showToast('Voice not supported in this browser', '⚠️');
  }
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  const rec = new SR();
  rec.lang = 'en-US'; rec.interimResults = false;
  const btn = document.getElementById('composerVoiceBtn');
  btn?.classList.add('listening');
  showToast('Listening… speak now', '🎤');
  rec.onresult = (e) => {
    const transcript = e.results[0][0].transcript;
    const ta = document.getElementById('composerText');
    ta.value += (ta.value ? ' ' : '') + transcript;
    autoResizeComposer(ta);
    showToast('Got it!', '✅');
  };
  rec.onerror = () => showToast('Voice input failed', '❌');
  rec.onend = () => btn?.classList.remove('listening');
  rec.start();
}

async function sendAnalysis() {
  const text = (document.getElementById('composerText')?.value || '').trim();
  const hasImage = !!composerImage;
  const hasText = text.length >= 5;

  if (!hasImage && !hasText) {
    return showToast('Describe symptoms or attach a photo to start', '🔬');
  }

  const btn = document.getElementById('composerSendBtn');
  btn.disabled = true;
  showAnalyzing();

  try {
    stepProgress(1);
    let r;

    if (hasImage) {
      r = await fetch(`${API}/analyze/image`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: composerImage,
          skinTone: state.skinTone,
          userId: state.user?.id,
          additionalContext: hasText ? text : undefined
        })
      });
    } else {
      r = await fetch(`${API}/analyze/symptoms`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ symptoms: text, skinTone: state.skinTone, userId: state.user?.id })
      });
    }

    stepProgress(2);
    const d = await r.json();

    if (!r.ok) {
      hideAnalyzing();
      if (d.error?.includes('GEMINI_API_KEY')) showApiKeyWarning();
      else showToast(d.error || 'Analysis failed', '❌');
      btn.disabled = false;
      return;
    }

    stepProgress(3); await sleep(400); stepProgress(4); await sleep(400);
    hideAnalyzing();
    btn.disabled = false;

    state.lastResult = { ...d.result, previewImage: hasImage ? composerImage : null };
    saveResultToHistory(d.result);
    renderResults(d.result, hasImage ? composerImage : null);
    showPage('results');
    showToast('Analysis complete!', '✅');

    // Reset composer
    const ta = document.getElementById('composerText');
    if (ta) { ta.value = ''; autoResizeComposer(ta); }
    removeComposerImage();

  } catch (err) {
    hideAnalyzing();
    btn.disabled = false;
    showToast('Cannot connect to backend server', '❌');
  }
}

// Legacy wrappers (called from dashboard quick scan buttons)
function analyzeImage() { sendAnalysis(); }
function analyzeSymptoms() { sendAnalysis(); }

// ── Upload & File Handling ───────────────────────────────────
function handleDrop(e) {
  e.preventDefault();
  document.getElementById('uploadZone').classList.remove('dragover');
  const file = e.dataTransfer.files[0];
  if (file) processImageFile(file);
}
function handleFileUpload(e) { const file = e.target.files[0]; if (file) processImageFile(file); }

function processImageFile(file) {
  if (!file.type.startsWith('image/')) return showToast('Please upload an image file', '⚠️');
  if (file.size > 15 * 1024 * 1024) return showToast('Image too large. Max 15MB', '⚠️');
  const reader = new FileReader();
  reader.onload = (e) => {
    state.uploadedImage = e.target.result;
    const img = document.getElementById('previewImg');
    img.src = e.target.result; img.style.display = 'block';
    document.getElementById('analyzeBtn').classList.remove('hidden');
    document.getElementById('uploadZone').style.display = 'none';
    showToast('Photo ready! Click Analyze to start', '✅');
  };
  reader.readAsDataURL(file);
}

function clearUpload() {
  state.uploadedImage = null;
  document.getElementById('previewImg').style.display = 'none';
  document.getElementById('previewImg').src = '';
  document.getElementById('analyzeBtn').classList.add('hidden');
  document.getElementById('uploadZone').style.display = '';
  document.getElementById('fileInput').value = '';
}

// ── Camera ───────────────────────────────────────────────────
async function startCamera() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: state.facingMode } });
    state.cameraStream = stream;
    document.getElementById('cameraFeed').srcObject = stream;
  } catch (err) {
    showToast('Camera access denied or not available', '❌');
    setScanMode('upload');
  }
}
function stopCamera() {
  if (state.cameraStream) { state.cameraStream.getTracks().forEach(t => t.stop()); state.cameraStream = null; }
}
function switchCamera() {
  state.facingMode = state.facingMode === 'environment' ? 'user' : 'environment';
  stopCamera(); startCamera();
}
function capturePhoto() {
  const video = document.getElementById('cameraFeed');
  const canvas = document.getElementById('captureCanvas');
  canvas.width = video.videoWidth; canvas.height = video.videoHeight;
  canvas.getContext('2d').drawImage(video, 0, 0);
  state.uploadedImage = canvas.toDataURL('image/jpeg', 0.9);
  stopCamera();
  setScanMode('upload');
  const img = document.getElementById('previewImg');
  img.src = state.uploadedImage; img.style.display = 'block';
  document.getElementById('analyzeBtn').classList.remove('hidden');
  document.getElementById('uploadZone').style.display = 'none';
  showToast('Photo captured! Click Analyze to start', '📸');
}

// ── AI Analysis ──────────────────────────────────────────────
async function analyzeImage() {
  if (!state.uploadedImage) return showToast('No image to analyze', '⚠️');
  showAnalyzing();
  try {
    stepProgress(1);
    const r = await fetch(`${API}/analyze/image`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ imageBase64: state.uploadedImage, skinTone: state.skinTone, userId: state.user?.id })
    });
    stepProgress(2);
    const d = await r.json();
    if (!r.ok) {
      hideAnalyzing();
      if (d.error?.includes('GEMINI_API_KEY')) showApiKeyWarning();
      else showToast(d.error || 'Analysis failed', '❌');
      return;
    }
    stepProgress(3); await sleep(400); stepProgress(4); await sleep(400);
    hideAnalyzing();
    state.lastResult = { ...d.result, previewImage: state.uploadedImage };
    saveResultToHistory(d.result);
    renderResults(d.result, state.uploadedImage);
    showPage('results');
    showToast('Analysis complete!', '✅');
  } catch (err) {
    hideAnalyzing();
    showToast('Cannot connect to backend server', '❌');
  }
}

async function analyzeSymptoms() {
  const symptoms = document.getElementById('symptomDesc').value.trim();
  if (symptoms.length < 10) return showToast('Please describe your symptoms in more detail', '⚠️');
  showAnalyzing();
  try {
    stepProgress(1);
    const r = await fetch(`${API}/analyze/symptoms`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ symptoms, skinTone: state.skinTone, userId: state.user?.id })
    });
    stepProgress(2);
    const d = await r.json();
    if (!r.ok) {
      hideAnalyzing();
      if (d.error?.includes('GEMINI_API_KEY')) showApiKeyWarning();
      else showToast(d.error || 'Analysis failed', '❌');
      return;
    }
    stepProgress(3); await sleep(400); stepProgress(4); await sleep(400);
    hideAnalyzing();
    state.lastResult = d.result;
    saveResultToHistory(d.result);
    renderResults(d.result, null);
    showPage('results');
    showToast('Analysis complete!', '✅');
  } catch (err) {
    hideAnalyzing();
    showToast('Cannot connect to backend server', '❌');
  }
}

function showApiKeyWarning() {
  document.getElementById('apiKeyWarning')?.classList.remove('hidden');
  showToast('Server missing Gemini API Key. Contact administrator.', '⚙️');
}

// ── Analyzing Overlay ────────────────────────────────────────
function showAnalyzing() {
  document.getElementById('analyzingOverlay').classList.remove('hidden');
  document.querySelectorAll('.analyzing-step').forEach(s => { s.classList.remove('active', 'done'); });
  document.getElementById('step1').classList.add('active');
}
function hideAnalyzing() { document.getElementById('analyzingOverlay').classList.add('hidden'); }
let stepTimer = null;
function stepProgress(n) {
  for (let i = 1; i < n; i++) {
    const el = document.getElementById(`step${i}`);
    if (el) { el.classList.remove('active'); el.classList.add('done'); el.querySelector('.step-icon').textContent = '✅'; }
  }
  const active = document.getElementById(`step${n}`);
  if (active) { active.classList.add('active'); active.querySelector('.step-icon').textContent = '⏳'; }
}
function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

// ── Render Results ───────────────────────────────────────────
function renderResults(result, imageData) {
  document.getElementById('noResults').classList.add('hidden');
  const wrap = document.getElementById('resultContent');
  wrap.classList.remove('hidden');

  const emergencyClass = result.emergencyLevel === 'high' ? 'emergency-high' : result.emergencyLevel === 'medium' ? 'emergency-med' : 'emergency-low';
  const emergencyLabel = result.emergencyLevel === 'high' ? '🚨 HIGH RISK' : result.emergencyLevel === 'medium' ? '⚠️ MODERATE' : '✅ LOW RISK';
  const confidence = result.confidence || 0;
  const confColor = confidence >= 85 ? '#32D74B' : confidence >= 70 ? '#D4AF37' : '#FF9F0A';
  const strokeOffset = 251 - (251 * confidence / 100);

  const imageHtml = imageData
    ? `<div class="result-image-wrap"><img src="${imageData}" alt="Scan"></div>`
    : `<div class="result-image-placeholder">${result.emergencyLevel === 'high' ? '🔴' : '🔬'}</div>`;

  // Alternatives
  const altHtml = (result.alternatives || result.similarConditions || []).map(a =>
    `<div class="similar-item">
      <div style="flex:1"><div style="font-size:.85rem;font-weight:600;margin-bottom:6px">${a.name}</div>
      <div class="similar-bar"><div class="similar-fill" style="width:${a.pct}%"></div></div></div>
      <div class="similar-pct">${a.pct}%</div>
    </div>`
  ).join('');

  // Info items
  const infoItems = [
    { label: 'Medical Name', value: result.medicalName || '—' },
    { label: 'Category', value: result.category || '—' },
    { label: 'Method', value: result.method === 'IMAGE_UPLOAD' ? '📷 Photo Upload' : '🎙️ Symptom Description' },
    { label: 'Skin Tone', value: result.skinTone || state.skinTone }
  ];

  // Causes & symptoms
  const causesList = (result.causes || []).map(c => `<li style="font-size:.82rem;color:var(--text2);padding:2px 0">${c}</li>`).join('');
  const symptomsList = (result.symptoms || []).map(s => `<span style="display:inline-block;background:var(--card2);border:1px solid var(--border);border-radius:6px;padding:3px 10px;font-size:.75rem;margin:3px">${s}</span>`).join('');

  wrap.innerHTML = `
    <div class="result-wrap">
      ${result.emergencyLevel === 'high' ? `<div class="warning-card high" style="margin-bottom:20px"><div style="font-size:1.5rem">🚨</div><div><div style="font-weight:700;color:var(--danger);margin-bottom:4px">URGENT MEDICAL ATTENTION REQUIRED</div><div style="font-size:.85rem;color:var(--text2)">${result.warning || ''}</div></div></div>` : ''}
      <div class="result-header">
        ${imageHtml}
        <div class="result-info">
          <div class="result-name">${result.conditionName || 'Unknown Condition'}</div>
          <div class="result-category">${result.medicalName || ''} · ${result.category || ''}</div>
          <span class="emergency-badge ${emergencyClass}">${emergencyLabel}</span>
        </div>
      </div>

      <div class="confidence-ring">
        <svg class="ring-svg" viewBox="0 0 100 100">
          <circle class="ring-bg" cx="50" cy="50" r="40"/>
          <circle class="ring-fill" cx="50" cy="50" r="40" stroke="${confColor}" stroke-dashoffset="${strokeOffset}"/>
          <text x="50" y="55" text-anchor="middle" font-size="18" font-weight="900" fill="${confColor}" font-family="Montserrat">${confidence}%</text>
        </svg>
        <div class="confidence-text">
          <h3>AI Confidence Score</h3>
          <p>Based on ${result.method === 'IMAGE_UPLOAD' ? 'visual image analysis' : 'symptom description analysis'} by Gemini Vision AI</p>
          <p style="margin-top:6px;font-size:.75rem;color:#555">⚠️ Not a medical diagnosis. Consult a dermatologist.</p>
        </div>
      </div>

      ${result.warning && result.emergencyLevel !== 'high' ? `<div class="warning-card"><div style="font-size:1.2rem">⚠️</div><div style="font-size:.85rem">${result.warning}</div></div>` : ''}

      <div class="info-grid">${infoItems.map(i => `<div class="info-item"><div class="info-label">${i.label}</div><div class="info-value">${i.value}</div></div>`).join('')}</div>

      <div class="card mb-16">
        <div class="section-title"><span>📝</span> About this Condition</div>
        <p style="font-size:.88rem;color:var(--text2);line-height:1.65;margin-bottom:14px">${result.description || ''}</p>
        ${causesList ? `<div style="font-weight:700;font-size:.8rem;margin-bottom:8px;font-family:var(--font2);letter-spacing:.5px;text-transform:uppercase">Common Causes</div><ul style="padding-left:16px;margin-bottom:14px">${causesList}</ul>` : ''}
        ${symptomsList ? `<div style="font-weight:700;font-size:.8rem;margin-bottom:8px;font-family:var(--font2);letter-spacing:.5px;text-transform:uppercase">Key Symptoms</div><div>${symptomsList}</div>` : ''}
      </div>

      ${altHtml ? `<div class="card mb-16"><div class="section-title"><span>🔍</span> Other Possibilities</div><div class="similar-list">${altHtml}</div></div>` : ''}

      ${result.doctorNote ? `<div class="card mb-16" style="border-left:3px solid var(--accent)"><div style="font-weight:700;margin-bottom:6px;font-family:var(--font2);font-size:.85rem;letter-spacing:.5px">🩺 WHEN TO SEE A DOCTOR</div><div style="font-size:.85rem;color:var(--text2);line-height:1.55">${result.doctorNote}</div></div>` : ''}

      <div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:20px">
        <button class="btn btn-primary" onclick="showPage('assistant');checkAssistantState()" style="width:auto">💊 View Full Solution Plan</button>
        <button class="btn btn-ghost" onclick="bookAppointment(this)" style="width:auto">📅 Book Appointment</button>
        <button class="btn btn-ghost" onclick="showPage('doctors')" style="width:auto">📍 Find Dermatologist</button>
        <button class="btn btn-secondary" onclick="showPage('scan')" style="width:auto">🔄 New Scan</button>
      </div>

      ${result.disclaimer ? `<div style="margin-top:16px;font-size:.75rem;color:#444;line-height:1.5;padding:12px;border-radius:10px;background:var(--card2);border:1px solid var(--border)">${result.disclaimer}</div>` : ''}
    </div>`;

  // Populate assistant
  populateAssistant(result);
  updateStats();
  
  // Track Analytics
  if (typeof firebase !== 'undefined' && firebase.analytics) {
    try {
      const region = Intl.DateTimeFormat().resolvedOptions().timeZone || 'Unknown';
      firebase.analytics().logEvent('scan_completed', { 
        region: region,
        method: result.method || 'unknown',
        emergencyLevel: result.emergencyLevel || 'low'
      });
    } catch(e) { console.warn('Analytics error', e) }
  }
}

// ── Booking Logic ────────────────────────────────────────────
async function bookAppointment(btn) {
  // If a clinic was already selected, navigate directly to appointment page
  if (state.selectedClinic) {
    showPage('appointment');
    return;
  }

  // If clinics are already loaded near active location, select nearest
  if (state.nearbyClinics && state.nearbyClinics.length > 0) {
    openAppointmentBooking(state.nearbyClinics[0]);
    return;
  }

  const ogText = btn ? btn.innerHTML : null;
  if (btn) {
    btn.innerText = 'Locating nearest clinic...';
    btn.disabled = true;
  }

  // If geolocation available, detect location first
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          try {
            const geoRes = await fetch(`${API}/location/reverse-geocode?lat=${lat}&lng=${lng}`);
            const geoData = await geoRes.json();
            if (geoData.success && geoData.location) {
              state.userLocation = {
                lat, lng,
                displayName: geoData.location.formattedAddress || `${geoData.location.city || 'Your Area'}, ${geoData.location.state || ''}`,
                source: 'gps'
              };
            }
          } catch (e) {
            state.userLocation = { lat, lng, displayName: `Coordinates: ${lat.toFixed(3)}, ${lng.toFixed(3)}`, source: 'gps' };
          }

          const res = await fetch(`${API}/doctors/nearest?lat=${lat}&lng=${lng}&radius=${state.searchRadius}`);
          const data = await res.json();
          if (btn) { btn.innerHTML = ogText; btn.disabled = false; }

          if (data.success && data.doctor) {
            openAppointmentBooking(data.doctor);
          } else {
            showToast('No nearby clinic found in direct radius. Please select a city on Dermatologists page.', 'ℹ️');
            showPage('doctors');
          }
        } catch (e) {
          if (btn) { btn.innerHTML = ogText; btn.disabled = false; }
          showToast('Could not find nearest clinic. Opening clinic directory...', '⚠️');
          showPage('doctors');
        }
      },
      (err) => {
        if (btn) { btn.innerHTML = ogText; btn.disabled = false; }
        showToast('Please select your location to discover nearby clinics and book.', '📍');
        showPage('doctors');
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 300000 }
    );
  } else {
    if (btn) { btn.innerHTML = ogText; btn.disabled = false; }
    showToast('Please choose your city to view nearby doctors', '📍');
    showPage('doctors');
  }
}

// ── Assistant / Solution Plan ────────────────────────────────
function checkAssistantState() {
  if (state.lastResult) {
    document.getElementById('assistantNoScan').classList.add('hidden');
    document.getElementById('assistantMain').classList.remove('hidden');
  } else {
    document.getElementById('assistantNoScan').classList.remove('hidden');
    document.getElementById('assistantMain').classList.add('hidden');
  }
}

function populateAssistant(result) {
  const name = result.conditionName || 'your condition';
  const conf = result.confidence || 0;
  document.getElementById('bannerCondition').textContent = `${name} Detected`;
  document.getElementById('bannerConf').textContent = `${conf}%`;
  document.getElementById('bannerEmoji').textContent = result.emergencyLevel === 'high' ? '🚨' : conf >= 85 ? '✅' : '⚠️';

  // Action Plan
  const steps = result.actionPlan || [];
  document.getElementById('actionPlanContent').innerHTML = steps.length
    ? steps.map((s, i) => `
      <div class="action-step ${s.urgency}">
        <div class="step-num">${i + 1}</div>
        <div class="step-body">
          <div class="step-title">${s.title}</div>
          <div class="step-desc">${s.desc}</div>
          <span class="step-tag tag-${s.tag}">${s.tag.toUpperCase()}</span>
        </div>
      </div>`).join('')
    : '<div style="color:var(--text2);font-size:.9rem">No action plan generated.</div>';

  // Products
  const products = result.products || [];
  document.getElementById('productsContent').innerHTML = products.length
    ? products.map(p => `
      <div class="product-card">
        <div class="product-icon">${p.icon || '🧴'}</div>
        <div>
          <div class="product-type">${p.type}</div>
          <div class="product-name">${p.name}</div>
          <div class="product-desc">${p.desc}</div>
        </div>
      </div>`).join('')
    : '<div style="color:var(--text2);font-size:.9rem">No product recommendations generated.</div>';

  // Avoid list
  const avoids = result.avoidList || [];
  document.getElementById('avoidContent').innerHTML = avoids.length
    ? avoids.map(a => `
      <div class="avoid-card">
        <div class="avoid-icon">${a.icon || '🚫'}</div>
        <div>
          <div class="avoid-name">${a.name}</div>
          <div class="avoid-reason">${a.reason}</div>
        </div>
        <span class="avoid-badge">${a.severity}</span>
      </div>`).join('')
    : '<div style="color:var(--text2);font-size:.9rem">No avoid list generated.</div>';

  // Timeline
  const timeline = result.timeline || [];
  document.getElementById('timelineContent').innerHTML = timeline.length
    ? `<div class="timeline">${timeline.map(t => `
      <div class="timeline-item">
        <div class="timeline-dot ${t.status}"></div>
        <div class="tl-period">${t.period}</div>
        <div class="tl-title">${t.title}</div>
        <div class="tl-desc">${t.desc}</div>
      </div>`).join('')}</div>`
    : '<div style="color:var(--text2);font-size:.9rem">No timeline generated.</div>';

  // Quick prompts for chat
  const prompts = ['Can I go swimming?', 'What cream should I buy?', 'How long to heal?', 'Is it contagious?', 'What foods to avoid?'];
  document.getElementById('contextPrompts').innerHTML = prompts.map(p =>
    `<button class="quick-prompt" onclick="useQuickPrompt('${p}')">${p}</button>`
  ).join('');
}

function switchSolTab(btn, tab) {
  document.querySelectorAll('.sol-tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.sol-panel').forEach(p => p.classList.add('hidden'));
  btn.classList.add('active');
  document.getElementById(`sol-${tab}`)?.classList.remove('hidden');
}

// ── AI Chat ──────────────────────────────────────────────────
function useQuickPrompt(text) {
  document.getElementById('chatInput').value = text;
  sendChat();
}

async function sendChat() {
  const input = document.getElementById('chatInput');
  const msg = input.value.trim();
  if (!msg) return;
  input.value = '';
  appendMsg(msg, 'user');
  const typingId = appendTyping();
  state.chatCount++;
  document.getElementById('statChats').textContent = state.chatCount;
  try {
    const r = await fetch(`${API}/chat/message`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: msg,
        conditionId: state.lastResult?.conditionId,
        conditionName: state.lastResult?.conditionName,
        conditionContext: state.lastResult ? { description: state.lastResult.description, emergencyLevel: state.lastResult.emergencyLevel } : null
      })
    });
    const d = await r.json();
    removeTyping(typingId);
    if (!r.ok) { appendMsg('Sorry, AI chat is unavailable right now. Check your API key in Settings.', 'ai'); return; }
    appendMsg(d.response || 'No response.', 'ai');
  } catch {
    removeTyping(typingId);
    appendMsg('Cannot connect to backend. Make sure the server is running.', 'ai');
  }
}

function appendMsg(text, role) {
  const msgs = document.getElementById('chatMessages');
  const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const div = document.createElement('div');
  div.className = `msg msg-${role}`;
  if (role === 'ai') {
    div.innerHTML = `<div class="ai-avatar">🧠</div><div><div class="msg-bubble">${text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\n/g, '<br>')}</div><div class="msg-time">${time}</div></div>`;
  } else {
    div.innerHTML = `<div><div class="msg-bubble">${text}</div><div class="msg-time" style="text-align:right">${time}</div></div>`;
  }
  msgs.appendChild(div);
  msgs.scrollTop = msgs.scrollHeight;
}

function appendTyping() {
  const msgs = document.getElementById('chatMessages');
  const id = 'typing-' + Date.now();
  msgs.innerHTML += `<div class="msg msg-ai" id="${id}"><div class="ai-avatar">🧠</div><div class="msg-bubble"><div class="typing-dots"><div class="typing-dot"></div><div class="typing-dot"></div><div class="typing-dot"></div></div></div></div>`;
  msgs.scrollTop = msgs.scrollHeight;
  return id;
}
function removeTyping(id) { document.getElementById(id)?.remove(); }

// ── Voice Input ──────────────────────────────────────────────
function startVoiceInput(targetId) {
  if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
    return showToast('Voice input not supported in this browser', '⚠️');
  }
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  const rec = new SR();
  rec.lang = 'en-US'; rec.interimResults = false;
  const btn = document.getElementById('voiceSymptomBtn');
  btn?.classList.add('listening');
  rec.onresult = (e) => { document.getElementById(targetId).value += (document.getElementById(targetId).value ? ' ' : '') + e.results[0][0].transcript; };
  rec.onerror = () => showToast('Voice input failed', '❌');
  rec.onend = () => btn?.classList.remove('listening');
  rec.start();
}

function startVoiceChat() {
  if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
    return showToast('Voice not supported', '⚠️');
  }
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  const rec = new SR();
  rec.lang = 'en-US'; rec.interimResults = false;
  const btn = document.getElementById('voiceChatBtn');
  btn.classList.add('listening');
  rec.onresult = (e) => { document.getElementById('chatInput').value = e.results[0][0].transcript; sendChat(); };
  rec.onerror = () => showToast('Voice input failed', '❌');
  rec.onend = () => btn.classList.remove('listening');
  rec.start();
}

// ── Doctors / Maps / Dynamic Location ─────────────────────────

async function loadDoctors() {
  // If user already has an active location, query for clinics immediately
  if (state.userLocation && state.userLocation.lat && state.userLocation.lng) {
    updateLocationBannerUI();
    fetchClinicsNearLocation(state.userLocation.lat, state.userLocation.lng);
    return;
  }

  // Attempt auto-detection via GPS
  detectUserLocation();
}

function updateLocationBannerUI() {
  const display = document.getElementById('currentLocationDisplay');
  const badge = document.getElementById('locationBadge');
  const sub = document.getElementById('currentLocationSub');
  if (!display) return;

  if (state.userLocation) {
    display.textContent = state.userLocation.displayName || 'Selected Location';
    if (sub) {
      sub.textContent = `Coordinates: ${state.userLocation.lat.toFixed(4)}, ${state.userLocation.lng.toFixed(4)}`;
    }
    if (badge) {
      if (state.userLocation.source === 'gps') {
        badge.className = 'location-badge badge-gps';
        badge.textContent = '📍 GPS Detected';
      } else if (state.userLocation.source === 'preset') {
        badge.className = 'location-badge badge-city';
        badge.textContent = `📍 ${state.userLocation.name || 'Quick Location'}`;
      } else {
        badge.className = 'location-badge badge-city';
        badge.textContent = '🔍 Searched Location';
      }
    }
  } else {
    display.textContent = 'Location not detected — Please select or search';
    if (badge) {
      badge.className = 'location-badge badge-warning';
      badge.textContent = '⚠️ Location Required';
    }
    if (sub) {
      sub.textContent = 'Click "Auto-Detect (GPS)", select a quick city chip, or enter your city above.';
    }
  }
}

function detectUserLocation() {
  const display = document.getElementById('currentLocationDisplay');
  const badge = document.getElementById('locationBadge');
  const sub = document.getElementById('currentLocationSub');

  if (display) display.textContent = 'Detecting your GPS location...';
  if (badge) {
    badge.className = 'location-badge';
    badge.textContent = '⏳ Locating...';
  }
  if (sub) sub.textContent = 'Querying browser Geolocation API...';

  if (!navigator.geolocation) {
    showToast('Geolocation not supported by this browser. Please search or select a city below.', '⚠️');
    renderLocationRequiredState();
    return;
  }

  navigator.geolocation.getCurrentPosition(
    async (pos) => {
      const { latitude: lat, longitude: lng, accuracy } = pos.coords;
      let displayName = `Lat: ${lat.toFixed(3)}, Lng: ${lng.toFixed(3)}`;

      try {
        const geoRes = await fetch(`${API}/location/reverse-geocode?lat=${lat}&lng=${lng}`);
        const geoData = await geoRes.json();
        if (geoData.success && geoData.location) {
          displayName = geoData.location.formattedAddress || `${geoData.location.city || ''}, ${geoData.location.state || ''}`.trim() || displayName;
        }
      } catch (e) {
        console.warn('Reverse geocode error:', e);
      }

      state.userLocation = {
        lat,
        lng,
        displayName,
        accuracy,
        source: 'gps'
      };

      updateLocationBannerUI();
      showToast(`Location detected: ${displayName}`, '📍');
      fetchClinicsNearLocation(lat, lng);
    },
    (err) => {
      console.warn('Geolocation error:', err);
      state.userLocation = null;
      updateLocationBannerUI();
      renderLocationRequiredState(err.code === 1 ? 'Location permission was denied.' : 'Unable to retrieve your GPS location.');
      showToast('Location permission denied or unavailable. Please pick a city.', 'ℹ️');
    },
    { enableHighAccuracy: true, timeout: 10000, maximumAge: 300000 }
  );
}

function renderLocationRequiredState(msg = 'Please select a location to view nearby verified dermatologists.') {
  const list = document.getElementById('clinicList');
  const countBadge = document.getElementById('clinicCountBadge');
  if (countBadge) countBadge.textContent = 'Location required';
  if (list) {
    list.innerHTML = `
      <div class="empty-state" style="padding:40px 20px">
        <div class="empty-icon" style="font-size:2.5rem">📍</div>
        <div style="font-weight:700;font-size:1.1rem;margin:10px 0 6px;color:var(--text)">Choose Your Location</div>
        <div class="empty-sub" style="max-width:440px;margin:0 auto 16px">${msg} Click one of the quick locations or enter any city or town in the search bar above.</div>
        <div style="display:flex;gap:8px;justify-content:center;flex-wrap:wrap">
          <button class="btn btn-primary" onclick="setQuickLocation('Talegaon Dabhade', 18.7337, 73.6728, 'Talegaon Dabhade, Pune, Maharashtra')" style="width:auto">📍 Talegaon Dabhade</button>
          <button class="btn btn-ghost" onclick="setQuickLocation('Pune', 18.5204, 73.8567, 'Pune, Maharashtra, India')" style="width:auto">📍 Pune</button>
          <button class="btn btn-ghost" onclick="setQuickLocation('Mumbai', 19.0760, 72.8777, 'Mumbai, Maharashtra, India')" style="width:auto">📍 Mumbai</button>
          <button class="btn btn-ghost" onclick="setQuickLocation('Bengaluru', 12.9716, 77.5946, 'Bengaluru, Karnataka, India')" style="width:auto">📍 Bengaluru</button>
        </div>
      </div>`;
  }
}

function setQuickLocation(name, lat, lng, address) {
  state.userLocation = {
    name,
    lat,
    lng,
    displayName: address || `${name}, India`,
    source: 'preset'
  };
  const searchInput = document.getElementById('clinicSearch');
  if (searchInput) searchInput.value = name;

  // Highlight active chip
  document.querySelectorAll('.location-chip').forEach(chip => {
    if (chip.textContent.includes(name)) {
      chip.classList.add('active');
    } else {
      chip.classList.remove('active');
    }
  });

  updateLocationBannerUI();
  showToast(`Location set to ${name}`, '📍');
  fetchClinicsNearLocation(lat, lng);
}

function setSearchRadius(radiusMeters) {
  state.searchRadius = radiusMeters;
  ['rad-5', 'rad-10', 'rad-20'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.classList.remove('active');
  });
  if (radiusMeters === 5000 && document.getElementById('rad-5')) document.getElementById('rad-5').classList.add('active');
  if (radiusMeters === 10000 && document.getElementById('rad-10')) document.getElementById('rad-10').classList.add('active');
  if (radiusMeters === 20000 && document.getElementById('rad-20')) document.getElementById('rad-20').classList.add('active');

  if (state.userLocation && state.userLocation.lat && state.userLocation.lng) {
    fetchClinicsNearLocation(state.userLocation.lat, state.userLocation.lng);
  }
}

async function searchClinics() {
  const input = document.getElementById('clinicSearch');
  const query = (input ? input.value : '').trim();
  if (!query) {
    showToast('Please enter a city, town, or area to search', '⚠️');
    return;
  }

  showToast(`Searching for "${query}"...`, '🔍');
  const list = document.getElementById('clinicList');
  if (list) {
    list.innerHTML = `<div class="empty-state" style="padding:40px 20px"><div class="empty-icon" style="font-size:2rem">⏳</div><div class="empty-sub">Searching for location coordinates and dermatologists in "${escapeHtml(query)}"...</div></div>`;
  }

  try {
    // 1. Forward-geocode query to obtain real coordinates
    const geoRes = await fetch(`${API}/location/search?q=${encodeURIComponent(query)}`);
    const geoData = await geoRes.json();

    if (geoData.success && geoData.location) {
      const { lat, lng, formattedAddress } = geoData.location;
      state.userLocation = {
        name: query,
        lat,
        lng,
        displayName: formattedAddress || query,
        source: 'search'
      };
      updateLocationBannerUI();
      fetchClinicsNearLocation(lat, lng);
    } else {
      // Direct clinic query fallback
      const r = await fetch(`${API}/doctors/nearby?query=${encodeURIComponent(query)}&radius=${state.searchRadius}`);
      const d = await r.json();
      state.nearbyClinics = d.doctors || [];
      if (state.nearbyClinics.length > 0 && state.nearbyClinics[0].lat && state.nearbyClinics[0].lng) {
        state.userLocation = {
          name: query,
          lat: state.nearbyClinics[0].lat,
          lng: state.nearbyClinics[0].lng,
          displayName: query,
          source: 'search'
        };
        updateLocationBannerUI();
      }
      sortAndRenderClinics();
    }
  } catch (err) {
    console.error('Search error:', err);
    showToast('Search failed. Please try again.', '❌');
    renderLocationRequiredState();
  }
}

async function fetchClinicsNearLocation(lat, lng) {
  const countBadge = document.getElementById('clinicCountBadge');
  if (countBadge) countBadge.textContent = 'Searching...';

  // Update map link / iframe
  updateMapDisplay(lat, lng);

  try {
    const r = await fetch(`${API}/doctors/nearby?lat=${lat}&lng=${lng}&radius=${state.searchRadius}`);
    const d = await r.json();
    state.nearbyClinics = d.doctors || [];
    sortAndRenderClinics();

    const stat = document.getElementById('statDoctors');
    if (stat) stat.textContent = state.nearbyClinics.length;
  } catch (err) {
    console.error('Fetch clinics error:', err);
    state.nearbyClinics = [];
    sortAndRenderClinics();
  }
}

function updateMapDisplay(lat, lng) {
  const mapsKey = localStorage.getItem('dermai_mapskey');
  const iframe = document.getElementById('mapIframe');
  const placeholder = document.getElementById('mapPlaceholder');
  const mapLink = document.getElementById('mapLink');
  const openBtn = document.getElementById('openMapsBtn');
  const mapsUrl = `https://www.google.com/maps/search/dermatologist/@${lat},${lng},14z`;

  if (openBtn) openBtn.href = mapsUrl;

  if (mapsKey && mapsKey !== 'your_google_maps_api_key_here' && iframe && placeholder) {
    iframe.src = `https://www.google.com/maps/embed/v1/search?key=${mapsKey}&q=dermatologist&center=${lat},${lng}&zoom=14`;
    iframe.classList.remove('hidden');
    placeholder.classList.add('hidden');
  } else if (placeholder) {
    if (mapLink) mapLink.classList.remove('hidden');
    placeholder.innerHTML = `
      <div style="text-align:center;padding:30px 20px">
        <div style="font-size:2.2rem;margin-bottom:8px">🗺️</div>
        <div style="font-weight:700;font-size:0.95rem;margin-bottom:4px;color:var(--text)">Live Interactive Map Available</div>
        <div style="font-size:0.8rem;color:var(--text2);margin-bottom:12px;max-width:360px;margin-left:auto;margin-right:auto">
          Explore all skin specialists and dermatology clinics near your active location on Google Maps.
        </div>
        <a href="${mapsUrl}" target="_blank" rel="noopener noreferrer" class="btn btn-primary" style="width:auto;font-size:0.8rem;display:inline-flex;align-items:center;gap:6px">
          📍 Open in Google Maps ↗
        </a>
      </div>`;
  }
}

function sortAndRenderClinics() {
  const select = document.getElementById('sortClinicsSelect');
  const sortBy = select ? select.value : (state.clinicSortBy || 'distance');
  state.clinicSortBy = sortBy;

  let clinics = [...(state.nearbyClinics || [])];

  if (sortBy === 'distance') {
    clinics.sort((a, b) => (parseFloat(a.distanceKm) || 999) - (parseFloat(b.distanceKm) || 999));
  } else if (sortBy === 'rating') {
    clinics.sort((a, b) => (b.rating || 0) - (a.rating || 0));
  } else if (sortBy === 'name') {
    clinics.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
  }

  renderDoctors(clinics);
}

function renderDoctors(doctors) {
  const list = document.getElementById('clinicList');
  const countBadge = document.getElementById('clinicCountBadge');
  if (!list) return;

  if (!doctors || !doctors.length) {
    if (countBadge) countBadge.textContent = '0 clinics found';
    const locName = state.userLocation ? (state.userLocation.displayName || state.userLocation.name || 'your area') : 'this location';
    const currentRadiusKm = Math.round(state.searchRadius / 1000);
    list.innerHTML = `
      <div class="empty-state" style="padding:40px 20px">
        <div class="empty-icon" style="font-size:2.2rem">🏥</div>
        <div style="font-weight:700;font-size:1.05rem;margin:10px 0 6px;color:var(--text)">No Clinics Found Within ${currentRadiusKm} km</div>
        <div class="empty-sub" style="max-width:440px;margin:0 auto 16px">
          We could not find dermatology clinics within ${currentRadiusKm} km of <strong>${escapeHtml(locName)}</strong>.
        </div>
        <div style="display:flex;gap:10px;justify-content:center;flex-wrap:wrap">
          <button class="btn btn-primary" onclick="setSearchRadius(20000)" style="width:auto">Expand Radius to 20 km</button>
          <button class="btn btn-ghost" onclick="setQuickLocation('Pune', 18.5204, 73.8567, 'Pune, Maharashtra, India')" style="width:auto">Search Pune (Nearby Metro)</button>
          <a href="https://www.google.com/maps/search/dermatologist+near+${encodeURIComponent(locName)}" target="_blank" rel="noopener noreferrer" class="btn btn-secondary" style="width:auto">Search on Google Maps ↗</a>
        </div>
      </div>`;
    return;
  }

  if (countBadge) {
    const radiusKm = Math.round(state.searchRadius / 1000);
    countBadge.textContent = `${doctors.length} clinic${doctors.length > 1 ? 's' : ''} found within ${radiusKm} km`;
  }

  list.innerHTML = doctors.map((d, index) => {
    const ratingStars = '⭐'.repeat(Math.min(5, Math.max(1, Math.floor(d.rating || 4.5))));
    const distanceDisplay = d.distance || (d.distanceKm ? `${d.distanceKm} km away` : '');
    const mapUrl = d.mapUrl || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent((d.name || '') + ' ' + (d.address || ''))}`;
    const escapedName = escapeHtml(d.name || 'Dermatology Clinic');
    const escapedAddr = escapeHtml(d.address || 'Address not listed');
    const phone = d.phone || '+91 20 2740 0000';
    const isOpen = d.isOpen !== false;

    return `
      <div class="enhanced-clinic-card" onclick="openAppointmentBookingByIndex(${index})">
        <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:12px;margin-bottom:8px">
          <div style="display:flex;align-items:center;gap:10px;min-width:0">
            <div class="clinic-avatar-badge">${d.icon || '🏥'}</div>
            <div style="min-width:0">
              <div class="clinic-title">${escapedName}</div>
              <div class="clinic-specialty">${escapeHtml(d.doctorName ? `Dr. ${d.doctorName} • Dermatologist` : 'Skin Specialist & Dermatology Clinic')}</div>
            </div>
          </div>
          ${distanceDisplay ? `<div class="clinic-distance-badge">🚗 ${distanceDisplay}</div>` : ''}
        </div>

        <div class="clinic-address-row">
          <span>📍</span>
          <span>${escapedAddr}</span>
        </div>

        <div class="clinic-meta-row">
          <div class="clinic-rating-box">
            <span>${ratingStars}</span>
            <span style="font-weight:700;color:var(--text)">${d.rating || '4.5'}</span>
            <span style="color:var(--text2)">(${d.reviewCount || '50+'} reviews)</span>
          </div>
          ${isOpen ? '<span class="status-badge status-open">● OPEN NOW</span>' : '<span class="status-badge status-closed">● CLOSED</span>'}
          <span class="verified-pill">✓ Verified Partner</span>
        </div>

        ${d.tags && d.tags.length ? `
          <div class="clinic-tags-row">
            ${d.tags.map(t => `<span class="clinic-feature-tag">${escapeHtml(t)}</span>`).join('')}
          </div>` : ''
        }

        <div class="clinic-action-footer" onclick="event.stopPropagation()">
          <button class="btn btn-primary" onclick="openAppointmentBookingByIndex(${index})" style="width:auto;padding:8px 16px;font-size:0.82rem">
            📅 Book Appointment
          </button>
          <a href="${mapUrl}" target="_blank" rel="noopener noreferrer" class="btn btn-ghost" style="width:auto;padding:8px 14px;font-size:0.82rem;display:inline-flex;align-items:center;gap:4px">
            🗺️ Directions ↗
          </a>
          <a href="tel:${phone.replace(/[^0-9+]/g, '')}" class="btn btn-ghost" style="width:auto;padding:8px 12px;font-size:0.82rem;display:inline-flex;align-items:center;gap:4px">
            📞 ${escapeHtml(phone)}
          </a>
        </div>
      </div>`;
  }).join('');
}

function openAppointmentBookingByIndex(index) {
  if (state.nearbyClinics && state.nearbyClinics[index]) {
    openAppointmentBooking(state.nearbyClinics[index]);
  }
}

function openAppointmentBooking(clinic) {
  if (!clinic) return;
  state.selectedClinic = clinic;
  showPage('appointment');
  populateAppointmentPage(clinic);
}

function prepareAppointmentPage() {
  if (!state.selectedClinic) {
    if (state.nearbyClinics && state.nearbyClinics.length > 0) {
      state.selectedClinic = state.nearbyClinics[0];
    }
  }
  populateAppointmentPage(state.selectedClinic);
}

function populateAppointmentPage(clinic) {
  const container = document.getElementById('appointmentClinicDetails');
  const formWrap = document.getElementById('appointmentFormWrap');
  const confirmWrap = document.getElementById('appointmentConfirmationWrap');

  if (confirmWrap) confirmWrap.classList.add('hidden');
  if (formWrap) formWrap.classList.remove('hidden');

  if (!clinic) {
    if (container) {
      container.innerHTML = `
        <div style="text-align:center;padding:24px 16px">
          <div style="font-size:2rem;margin-bottom:8px">🏥</div>
          <div style="font-weight:700;font-size:1rem;margin-bottom:4px;color:var(--text)">No Clinic Selected</div>
          <div style="font-size:0.82rem;color:var(--text2);margin-bottom:12px">
            Please select a verified dermatologist or skin clinic near your location.
          </div>
          <button class="btn btn-primary" onclick="showPage('doctors')" style="width:auto">Browse Nearby Clinics →</button>
        </div>`;
    }
    return;
  }

  const mapUrl = clinic.mapUrl || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(clinic.name + ' ' + (clinic.address || ''))}`;
  const phone = clinic.phone || '+91 20 2740 0000';
  const ratingStars = '⭐'.repeat(Math.min(5, Math.max(1, Math.floor(clinic.rating || 4.5))));
  const distanceStr = clinic.distance || (clinic.distanceKm ? `${clinic.distanceKm} km away` : '');

  if (container) {
    container.innerHTML = `
      <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:12px;margin-bottom:10px;flex-wrap:wrap">
        <div>
          <div style="font-size:0.75rem;color:var(--accent);font-weight:700;text-transform:uppercase;letter-spacing:0.5px">Selected Clinic / Specialist</div>
          <div style="font-size:1.15rem;font-weight:700;color:var(--text);margin-top:2px">${escapeHtml(clinic.name)}</div>
          <div style="font-size:0.82rem;color:var(--text2);margin-top:2px">${escapeHtml(clinic.doctorName ? `Dr. ${clinic.doctorName}` : 'Chief Dermatologist')} • Verified Dermatology Partner</div>
        </div>
        ${distanceStr ? `<div class="clinic-distance-badge" style="font-size:0.8rem">🚗 ${distanceStr}</div>` : ''}
      </div>

      <div style="font-size:0.84rem;color:var(--text);margin-bottom:8px;display:flex;align-items:center;gap:6px">
        <span>📍</span>
        <span>${escapeHtml(clinic.address || 'Address provided on confirmation')}</span>
      </div>

      <div style="display:flex;align-items:center;gap:12px;font-size:0.8rem;color:var(--text2);flex-wrap:wrap">
        <span>${ratingStars} <strong>${clinic.rating || '4.5'}</strong> (${clinic.reviewCount || '50+'} reviews)</span>
        <span>•</span>
        <a href="tel:${phone.replace(/[^0-9+]/g, '')}" style="color:var(--accent);font-weight:600">📞 ${escapeHtml(phone)}</a>
        <span>•</span>
        <a href="${mapUrl}" target="_blank" rel="noopener noreferrer" style="color:var(--text2);text-decoration:underline">View on Map ↗</a>
      </div>`;
  }

  // Pre-fill patient details if available
  const nameInput = document.getElementById('aptPatientName');
  const dateInput = document.getElementById('aptPreferredDate');
  const notesInput = document.getElementById('aptConcernNotes');

  if (nameInput && !nameInput.value) {
    if (state.user && state.user.firstName) {
      nameInput.value = `${state.user.firstName || ''} ${state.user.lastName || ''}`.trim();
    }
  }

  // Pre-fill tomorrow's date
  if (dateInput && !dateInput.value) {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    dateInput.value = tomorrow.toISOString().split('T')[0];
    dateInput.min = new Date().toISOString().split('T')[0];
  }

  // Pre-fill concern notes with scan findings if available
  if (notesInput && !notesInput.value && state.lastResult) {
    const cond = state.lastResult.conditionName || 'Skin Condition';
    const conf = state.lastResult.confidence ? Math.round(state.lastResult.confidence * 100) : null;
    notesInput.value = `DermAI Scan Referral: Detected ${cond}${conf ? ` (${conf}% confidence)` : ''}. Patient requesting professional dermatological evaluation.`;
  }
}

function selectTimeSlot(el, time) {
  document.querySelectorAll('.apt-time-chip').forEach(c => c.classList.remove('selected'));
  if (el) el.classList.add('selected');
  state.selectedTimeSlot = time;
}

function confirmAppointmentRequest() {
  const clinic = state.selectedClinic;
  if (!clinic) {
    showToast('Please select a clinic first', '⚠️');
    showPage('doctors');
    return;
  }

  const name = (document.getElementById('aptPatientName')?.value || '').trim();
  const phone = (document.getElementById('aptPatientPhone')?.value || '').trim();
  const date = document.getElementById('aptPreferredDate')?.value || '';
  const mode = document.getElementById('aptConsultMode')?.value || 'in_clinic';
  const notes = (document.getElementById('aptConcernNotes')?.value || '').trim();
  const timeSlot = state.selectedTimeSlot || '10:30 AM';

  if (!name) {
    showToast('Please enter the patient full name', '⚠️');
    document.getElementById('aptPatientName')?.focus();
    return;
  }
  if (!phone || phone.length < 7) {
    showToast('Please enter a valid contact phone number', '⚠️');
    document.getElementById('aptPatientPhone')?.focus();
    return;
  }
  if (!date) {
    showToast('Please select your preferred appointment date', '⚠️');
    return;
  }

  const refCode = `DERM-APT-${Math.floor(1000 + Math.random() * 9000)}`;
  const appointment = {
    id: 'apt_' + Date.now(),
    refCode,
    clinicName: clinic.name,
    clinicAddress: clinic.address,
    clinicPhone: clinic.phone || '+91 20 2740 0000',
    doctorName: clinic.doctorName || null,
    patientName: name,
    patientPhone: phone,
    date,
    timeSlot,
    consultMode: mode === 'in_clinic' ? 'In-Clinic Consultation' : 'Telehealth Video Consultation',
    notes,
    condition: state.lastResult?.conditionName || null,
    createdAt: new Date().toISOString()
  };

  // Save to state and localStorage
  const savedApts = JSON.parse(localStorage.getItem('dermai_appointments') || '[]');
  savedApts.unshift(appointment);
  localStorage.setItem('dermai_appointments', JSON.stringify(savedApts));
  state.appointments = savedApts;

  // Render confirmation card
  const formWrap = document.getElementById('appointmentFormWrap');
  const confirmWrap = document.getElementById('appointmentConfirmationWrap');
  if (formWrap) formWrap.classList.add('hidden');

  const cleanPhone = (clinic.phone || '+91 20 2740 0000').replace(/[^0-9+]/g, '');
  const mapUrl = clinic.mapUrl || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(clinic.name + ' ' + (clinic.address || ''))}`;

  if (confirmWrap) {
    confirmWrap.classList.remove('hidden');
    confirmWrap.innerHTML = `
      <div class="apt-success-card">
        <div style="font-size:2.8rem;margin-bottom:8px">🎉</div>
        <div style="font-size:1.35rem;font-weight:700;color:var(--text);font-family:var(--font2);margin-bottom:4px">
          Appointment Request Confirmed!
        </div>
        <div style="font-size:0.88rem;color:var(--text2);margin-bottom:16px">
          Your priority consultation referral has been generated for <strong>${escapeHtml(clinic.name)}</strong>.
        </div>

        <div class="apt-ref-badge">
          REFERRAL ID: ${refCode}
        </div>

        <div class="apt-summary-table">
          <div class="apt-summary-row">
            <span class="apt-summary-label">Clinic / Specialist</span>
            <span class="apt-summary-value">${escapeHtml(clinic.name)}</span>
          </div>
          <div class="apt-summary-row">
            <span class="apt-summary-label">Address</span>
            <span class="apt-summary-value">${escapeHtml(clinic.address || 'Local Clinic')}</span>
          </div>
          <div class="apt-summary-row">
            <span class="apt-summary-label">Patient Name</span>
            <span class="apt-summary-value">${escapeHtml(name)}</span>
          </div>
          <div class="apt-summary-row">
            <span class="apt-summary-label">Scheduled Date & Time</span>
            <span class="apt-summary-value">${date} at ${timeSlot}</span>
          </div>
          <div class="apt-summary-row">
            <span class="apt-summary-label">Consultation Mode</span>
            <span class="apt-summary-value">${appointment.consultMode}</span>
          </div>
          <div class="apt-summary-row">
            <span class="apt-summary-label">Clinic Contact</span>
            <span class="apt-summary-value"><a href="tel:${cleanPhone}" style="color:var(--accent);font-weight:700">📞 ${escapeHtml(clinic.phone || '+91 20 2740 0000')}</a></span>
          </div>
          ${notes ? `
          <div class="apt-summary-row">
            <span class="apt-summary-label">Referral Notes</span>
            <span class="apt-summary-value" style="font-style:italic;color:var(--text2)">${escapeHtml(notes)}</span>
          </div>` : ''}
        </div>

        <div style="font-size:0.8rem;color:var(--text2);background:var(--card);padding:12px;border-radius:8px;margin-bottom:20px;border:1px solid var(--border);text-align:left">
          💡 <strong>Next Step:</strong> Tap below to call the clinic reception to confirm arrival or present your <strong>Referral ID (${refCode})</strong> at reception.
        </div>

        <div style="display:flex;gap:10px;justify-content:center;flex-wrap:wrap">
          <a href="tel:${cleanPhone}" class="btn btn-primary" style="width:auto;display:inline-flex;align-items:center;gap:6px">
            📞 Call Clinic Reception Now
          </a>
          <a href="${mapUrl}" target="_blank" rel="noopener noreferrer" class="btn btn-ghost" style="width:auto;display:inline-flex;align-items:center;gap:6px">
            🗺️ Open Directions
          </a>
          <button class="btn btn-ghost" onclick="showPage('doctors')" style="width:auto">
            📍 Browse Other Clinics
          </button>
          <button class="btn btn-secondary" onclick="showPage('results')" style="width:auto">
            ◧ Back to Results
          </button>
        </div>
      </div>`;
  }

  showToast(`Appointment referral generated (${refCode})!`, '✅');
}

function openClinic(url) {
  if (url && url !== '#') window.open(url, '_blank');
}

function openGoogleMaps() {
  if (state.userLocation && state.userLocation.lat && state.userLocation.lng) {
    window.open(`https://www.google.com/maps/search/dermatologist/@${state.userLocation.lat},${state.userLocation.lng},14z`, '_blank');
  } else {
    window.open('https://www.google.com/maps/search/dermatologist+near+me', '_blank');
  }
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// ── History ──────────────────────────────────────────────────
function saveResultToHistory(result) {
  const entry = {
    id: result.analysisId || Date.now().toString(),
    conditionName: result.conditionName || 'Unknown',
    confidence: result.confidence || 0,
    emergencyLevel: result.emergencyLevel || 'low',
    timestamp: result.timestamp || new Date().toISOString(),
    method: result.method || 'IMAGE_UPLOAD'
  };
  state.scanHistory.unshift(entry);
  state.scanHistory = state.scanHistory.slice(0, 20);
  localStorage.setItem('dermai_history', JSON.stringify(state.scanHistory));
  updateStats();
}

async function loadHistory() {
  // Load from localStorage first
  const local = localStorage.getItem('dermai_history');
  if (local) state.scanHistory = JSON.parse(local);

  // Try to fetch from server
  if (state.user?.id) {
    try {
      const r = await fetch(`${API}/history/${state.user.id}`, { headers: { Authorization: `Bearer ${state.token}` } });
      const d = await r.json();
      if (d.history?.length) {
        // Merge server history
        state.scanHistory = d.history;
        localStorage.setItem('dermai_history', JSON.stringify(state.scanHistory));
      }
    } catch { /* use local */ }
  }
  updateStats();
  renderHistory();
}

function renderHistory() {
  const grid = document.getElementById('historyGrid');
  if (!state.scanHistory.length) {
    grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1;padding:60px 20px">
      <div class="empty-icon">📋</div>
      <div class="empty-title">No History Yet</div>
      <div class="empty-sub">Your scan results will appear here after your first analysis</div>
      <button class="btn btn-primary" style="width:auto;margin-top:16px" onclick="showPage('scan')">Start Scanning</button>
    </div>`;
    return;
  }
  grid.innerHTML = state.scanHistory.map(h => {
    const date = new Date(h.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    const confColor = h.confidence >= 85 ? 'var(--safe)' : h.confidence >= 70 ? 'var(--accent)' : 'var(--warn)';
    const icon = h.emergencyLevel === 'high' ? '🔴' : h.emergencyLevel === 'medium' ? '🟠' : '🟢';
    return `<div class="history-card" onclick="viewHistoryResult('${h.id}')">
      <div class="history-img">${icon}</div>
      <div class="history-body">
        <div class="history-name">${h.conditionName}</div>
        <div class="history-date">${date} · ${h.method === 'IMAGE_UPLOAD' ? '📷' : '🎙️'}</div>
        <div class="history-conf">
          <div class="conf-bar"><div class="conf-fill" style="width:${h.confidence}%;background:${confColor}"></div></div>
          <span style="font-size:.78rem;font-weight:700;color:${confColor}">${h.confidence}%</span>
        </div>
      </div>
    </div>`;
  }).join('');
}

function viewHistoryResult(id) {
  const entry = state.scanHistory.find(h => h.id === id);
  if (!entry) return;
  showToast('Viewing past result', '📋');
  // If it matches the last result, show it
  if (state.lastResult?.analysisId === id) { showPage('results'); return; }
  showToast('Full result details not cached. Run a new scan for complete plan.', 'ℹ️');
}

function exportHistory() {
  if (!state.scanHistory.length) return showToast('No history to export', '⚠️');
  const lines = ['DermAI Scan History Export', '='.repeat(40), ''];
  state.scanHistory.forEach((h, i) => {
    lines.push(`${i + 1}. ${h.conditionName}`);
    lines.push(`   Date: ${new Date(h.timestamp).toLocaleString()}`);
    lines.push(`   Confidence: ${h.confidence}%`);
    lines.push(`   Risk Level: ${h.emergencyLevel.toUpperCase()}`);
    lines.push('');
  });
  lines.push('Disclaimer: This data is from AI analysis and is not a medical diagnosis.');
  const blob = new Blob([lines.join('\n')], { type: 'text/plain' });
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
  a.download = 'DermAI_History.txt'; a.click();
  showToast('History exported!', '📤');
}

// ── Stats ────────────────────────────────────────────────────
function updateStats() {
  document.getElementById('statScans').textContent = state.scanHistory.length;
  if (state.lastResult) {
    document.getElementById('statConf').textContent = `${state.lastResult.confidence}%`;
    // Update last scan card
    const card = document.getElementById('lastScanPreview');
    const el = state.lastResult.emergencyLevel;
    const cls = el === 'high' ? 'emergency-high' : el === 'medium' ? 'emergency-med' : 'emergency-low';
    const label = el === 'high' ? '🚨 HIGH RISK' : el === 'medium' ? '⚠️ MODERATE' : '✅ LOW RISK';
    card.innerHTML = `<div style="display:flex;align-items:center;gap:14px">
      <div style="font-size:2.5rem;flex-shrink:0">🔬</div>
      <div>
        <div style="font-weight:700;margin-bottom:3px">${state.lastResult.conditionName}</div>
        <div style="font-size:.75rem;color:var(--text2);margin-bottom:6px">Confidence: ${state.lastResult.confidence}%</div>
        <span class="emergency-badge ${cls}">${label}</span>
      </div>
    </div>
    <button class="btn btn-ghost" style="width:100%;margin-top:12px;font-size:.8rem" onclick="showPage('results')">View Full Results →</button>`;
  }
}

// ── Settings ─────────────────────────────────────────────────
function saveGeminiKey() {
  const key = document.getElementById('geminiKeyInput').value.trim();
  if (!key) return showToast('Enter a valid API key', '⚠️');
  // Store in .env via fetch (demo: just save to localStorage for display)
  localStorage.setItem('dermai_geminikey', key);
  document.getElementById('apiStatus').innerHTML = '<div class="alert-card alert-warn" style="margin-top:8px">⚠️ For security, add this key to your <code>backend/.env</code> file as <code>GEMINI_API_KEY=your_key</code> then restart the server.</div>';
  showToast('Key saved! Restart the backend server.', '✅');
}

function saveMapsKey() {
  const key = document.getElementById('mapsKeyInput').value.trim();
  if (!key) return showToast('Enter a valid API key', '⚠️');
  localStorage.setItem('dermai_mapskey', key);
  showToast('Maps key saved!', '✅');
}

function saveProfile() {
  const name = document.getElementById('profileNameInput').value.trim();
  if (name && state.user) {
    state.user.firstName = name.split(' ')[0]; state.user.lastName = name.split(' ').slice(1).join(' ');
    localStorage.setItem('dermai_user', JSON.stringify(state.user));
    document.getElementById('userName').textContent = name;
    document.getElementById('heroTitle').textContent = `Good day, ${state.user.firstName}!`;
  }
  const tone = getSelectedSkinTone('settingsSkinTones');
  state.skinTone = tone; localStorage.setItem('dermai_skintone', tone);
  showToast('Profile saved!', '✅');
}

// ── Theme ────────────────────────────────────────────────────
function toggleTheme() {
  state.isDark = !state.isDark;
  document.body.classList.toggle('dark', state.isDark);
  localStorage.setItem('dermai_theme', state.isDark ? 'dark' : 'light');
  syncThemeToggle();
}
function syncThemeToggle() {
  const t = document.getElementById('themeToggle');
  if (!t) return;
  if (state.isDark) t.classList.add('on'); else t.classList.remove('on');
}

// ── Toast ────────────────────────────────────────────────────
let toastTimer = null;
function showToast(msg, icon = 'ℹ️') {
  const toast = document.getElementById('toast');
  document.getElementById('toastMsg').textContent = `${icon} ${msg}`;
  toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), 3500);
}

// ── Help & Guide Modal ───────────────────────────────────────
function toggleHelpModal() {
  const modal = document.getElementById('helpModalOverlay');
  if (modal) {
    if (modal.classList.contains('hidden')) {
      modal.classList.remove('hidden');
    } else {
      modal.classList.add('hidden');
    }
  }
}

// ── Cookie Consent Banner ────────────────────────────────────
function initConsentBanner() {
  const consent = localStorage.getItem('dermai_consent');
  if (!consent) {
    setTimeout(() => {
      document.getElementById('consentBanner')?.classList.remove('hidden');
    }, 2000);
  }
}
function acceptConsent() {
  localStorage.setItem('dermai_consent', JSON.stringify({ level: 'all', timestamp: new Date().toISOString() }));
  hideConsentBanner();
  showToast('All cookies accepted', '✅');
}
function acceptEssentialOnly() {
  localStorage.setItem('dermai_consent', JSON.stringify({ level: 'essential', timestamp: new Date().toISOString() }));
  hideConsentBanner();
  showToast('Essential cookies only — analytics disabled', '🍪');
}
function hideConsentBanner() {
  const banner = document.getElementById('consentBanner');
  if (banner) { banner.style.animation = 'none'; banner.style.transform = 'translateY(100%)'; banner.style.opacity = '0'; setTimeout(() => banner.classList.add('hidden'), 400); }
}

// ── Data Privacy Actions ─────────────────────────────────────
function downloadMyData() {
  const data = {
    exportDate: new Date().toISOString(),
    platform: 'DermAI',
    user: state.user || null,
    scanHistory: state.scanHistory || [],
    preferences: {
      theme: localStorage.getItem('dermai_theme') || 'light',
      skinTone: localStorage.getItem('dermai_skintone') || 'Type I',
      consent: JSON.parse(localStorage.getItem('dermai_consent') || 'null')
    },
    stats: {
      totalScans: state.scanHistory.length,
      chatCount: state.chatCount
    }
  };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `DermAI_MyData_${new Date().toISOString().slice(0,10)}.json`;
  a.click();
  URL.revokeObjectURL(a.href);
  showToast('Your data has been exported!', '📥');
}

function deleteMyData() {
  const confirmed = confirm(
    '⚠️ DELETE ALL DATA\n\nThis will permanently erase:\n• Scan history\n• Saved preferences\n• API keys stored in browser\n• Theme and skin tone settings\n\nYou will be signed out. This cannot be undone.\n\nAre you sure?'
  );
  if (!confirmed) return;
  // Clear all DermAI localStorage keys
  const keysToRemove = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith('dermai_')) keysToRemove.push(key);
  }
  keysToRemove.forEach(k => localStorage.removeItem(k));
  // Also attempt server-side deletion
  if (state.user?.id && state.token) {
    fetch(`${API}/privacy/delete-data`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${state.token}` },
      body: JSON.stringify({ userId: state.user.id })
    }).catch(() => {});
  }
  state.scanHistory = [];
  state.lastResult = null;
  state.chatCount = 0;
  showToast('All your data has been deleted', '🗑️');
  setTimeout(() => doLogout(), 1200);
}

function revokeConsent() {
  const confirmed = confirm(
    '⚠️ REVOKE CONSENT\n\nThis will:\n• Delete all your stored data\n• Sign you out of DermAI\n• Remove your privacy consent\n\nYou can re-consent when you sign up again.\n\nProceed?'
  );
  if (!confirmed) return;
  // Remove everything
  const keysToRemove = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith('dermai_')) keysToRemove.push(key);
  }
  keysToRemove.forEach(k => localStorage.removeItem(k));
  state.scanHistory = [];
  state.lastResult = null;
  state.chatCount = 0;
  showToast('Consent revoked. All data deleted.', '🚫');
  setTimeout(() => doLogout(), 1200);
}

function showPrivacyPreview() {
  alert(
    'DermAI Privacy Policy Summary\n\n' +
    '• We collect your name, email, skin images, and symptom descriptions for AI analysis only.\n' +
    '• Images are processed by Google Gemini AI in real-time and are NOT stored after analysis.\n' +
    '• Scan history is stored locally in your browser — not on our servers.\n' +
    '• Location data is used only for finding dermatologists and is never tracked.\n' +
    '• We NEVER sell, share, or monetize your health data.\n' +
    '• You can download or delete all your data at any time from the Data Privacy page.\n\n' +
    'Full details available in the app under Data Privacy.'
  );
}

// Init consent banner on page load
window.addEventListener('DOMContentLoaded', () => { setTimeout(initConsentBanner, 100); });

// ── Custom Translate UI ──────────────────────────────────────
let googleLangs = [];
let translateReady = false;

function toggleCustomTranslate() {
  const dropdown = document.getElementById('customTranslateDropdown');
  dropdown.classList.toggle('hidden');
  
  // If opening and not ready, try to load
  if (!dropdown.classList.contains('hidden')) {
    document.getElementById('translateSearch').focus();
    if (!translateReady) {
      loadGoogleLanguages();
    }
  }
}

// Close dropdown when clicking outside
document.addEventListener('click', (e) => {
  const wrapper = document.getElementById('customTranslateWrapper');
  if (wrapper && !wrapper.contains(e.target)) {
    document.getElementById('customTranslateDropdown')?.classList.add('hidden');
  }
});

function loadGoogleLanguages() {
  const select = document.querySelector('.goog-te-combo');
  if (!select) {
    // If not injected yet, wait a bit
    setTimeout(loadGoogleLanguages, 500);
    return;
  }
  
  if (select.options.length === 0) {
    setTimeout(loadGoogleLanguages, 500);
    return;
  }
  
  googleLangs = [];
  Array.from(select.options).forEach(opt => {
    if (opt.value) { // Skip default empty/placeholder option
      googleLangs.push({ code: opt.value, name: opt.text });
    }
  });
  
  if (googleLangs.length > 0) {
    translateReady = true;
    renderLanguages(googleLangs);
  }
}

function renderLanguages(langs) {
  const list = document.getElementById('translateList');
  if (!list) return;
  
  if (langs.length === 0) {
    list.innerHTML = '<div class="translate-loading">No languages found</div>';
    return;
  }
  
  // Get current active language if any
  const select = document.querySelector('.goog-te-combo');
  const activeCode = select ? select.value : '';

  list.innerHTML = langs.map(l => `
    <div class="translate-item ${l.code === activeCode ? 'active' : ''}" onclick="selectLanguage('${l.code}', '${l.name}')">
      <span>${l.name}</span>
      ${l.code === activeCode ? '<span>✓</span>' : ''}
    </div>
  `).join('');
}

function filterLanguages(query) {
  if (!translateReady) return;
  const q = query.toLowerCase();
  const filtered = googleLangs.filter(l => l.name.toLowerCase().includes(q));
  renderLanguages(filtered);
}

function selectLanguage(code, name) {
  const select = document.querySelector('.goog-te-combo');
  if (select) {
    select.value = code;
    select.dispatchEvent(new Event('change'));
    showToast(`Translated to ${name}`, '🌐');
  }
  document.getElementById('customTranslateDropdown').classList.add('hidden');
  
  // Update UI active state
  setTimeout(() => filterLanguages(document.getElementById('translateSearch').value), 100);
}
