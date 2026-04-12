// ============================================================
//  DermAI — Express Backend Server
// ============================================================
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const path = require('path');
const rateLimit = require('express-rate-limit');

const app = express();
const PORT = process.env.PORT || 3001;

// ── Middleware ──────────────────────────────────────────────
app.use(cors({ origin: '*' }));
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));

// Rate limiting
const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 100 });
app.use('/api/', limiter);

// Serve static files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use(express.static(path.join(__dirname, '../frontend')));

// ── Routes ──────────────────────────────────────────────────
app.use('/api/auth', require('./routes/auth'));
app.use('/api/analyze', require('./routes/analyze'));
app.use('/api/chat', require('./routes/chat'));
app.use('/api/doctors', require('./routes/doctors'));
app.use('/api/history', require('./routes/history'));

// ── Public Config ───────────────────────────────────────────
app.get('/api/config', (req, res) => {
  res.json({
    firebaseConfig: {
      apiKey: process.env.FIREBASE_API_KEY || '',
      authDomain: process.env.FIREBASE_AUTH_DOMAIN || '',
      projectId: process.env.FIREBASE_PROJECT_ID || '',
      storageBucket: process.env.FIREBASE_STORAGE_BUCKET || '',
      messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID || '',
      appId: process.env.FIREBASE_APP_ID || '',
      measurementId: process.env.FIREBASE_MEASUREMENT_ID || ''
    }
  });
});

// ── Health Check ────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'DermAI Backend',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    features: {
      imageAnalysis: true,
      chatAssistant: true,
      googleMaps: !!process.env.GOOGLE_MAPS_API_KEY,
      geminiAI: !!process.env.GEMINI_API_KEY
    }
  });
});

// ── Start ────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n  ✦ DermAI Backend running at http://localhost:${PORT}`);
  console.log(`  ✦ Health: http://localhost:${PORT}/api/health`);
  console.log(`  ✦ Gemini AI: ${process.env.GEMINI_API_KEY ? '✅ Connected' : '⚠️  No API key (mock mode)'}`);
  console.log(`  ✦ Google Maps: ${process.env.GOOGLE_MAPS_API_KEY ? '✅ Connected' : '⚠️  No API key (demo mode)'}\n`);
});

module.exports = app;
