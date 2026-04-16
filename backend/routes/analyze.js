// ============================================================
//  ANALYZE ROUTE — Real Gemini Vision AI Analysis
//  All results come directly from Gemini — no fake/hardcoded picks
// ============================================================
const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');

const GEMINI_KEY = () => process.env.GEMINI_API_KEY;
const GEMINI_URL = 'https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent';

// In-memory scan history store (keyed by userId)
const { historyStore: scanHistory } = require('../data/store');

// ── Gemini prompt — HAM10000 / ISIC Classification Framework ─
// HAM10000 = Human Against Machine with 10000 training images
// ISIC = International Skin Imaging Collaboration dataset
const SYSTEM_PROMPT = `You are DermAI, an expert AI dermatologist assistant trained on dermatoscopy principles aligned with the HAM10000 and ISIC (International Skin Imaging Collaboration) datasets.

PRIMARY CLASSIFICATION: Use the official HAM10000/ISIC 7-class taxonomy when applicable:
  mel   — Melanoma (malignant melanocytic lesion) [high-risk]
  nv    — Melanocytic Nevi (benign common moles) [low-risk]
  bcc   — Basal Cell Carcinoma [high-risk]
  akiec — Actinic Keratoses / Bowenoid (Intraepithelial Carcinoma) [high-risk]
  bkl   — Benign Keratosis-like (solar lentigo, seborrheic keratosis, lichen-planus like keratosis) [medium-risk]
  df    — Dermatofibroma [medium-risk]
  vasc  — Vascular Lesions (angiomas, angiokeratomas, pyogenic granulomas) [medium-risk]

For non-lesion conditions (eczema, psoriasis, acne, fungal infections, rosacea, hives, etc.) that fall outside HAM10000 scope, classify using standard dermatology — set isicClass to "non-isic".

RULES:
- Use HAM10000 benchmark confidence ranges: mel=77%, nv=92%, bcc=81%, akiec=69%, bkl=79%, df=73%, vasc=84% — use these as realistic reference ceilings
- emergencyLevel="high" for mel, bcc, akiec — dermatologist required urgently
- emergencyLevel="medium" for df, vasc, bkl
- emergencyLevel="low" for nv and benign inflammatory/infectious conditions
- Include the ISIC class in medicalName (e.g., "Melanoma [HAM10000: mel]") when applicable
- Be medically accurate — real clinical terminology only
- Never fabricate; if image quality is poor, say so in warning

Return ONLY valid JSON (no markdown, no extra text):
{
  "conditionName": "string",
  "medicalName": "string (include HAM10000 class if applicable, e.g. Melanoma [HAM10000: mel])",
  "isicClass": "mel|nv|bcc|akiec|bkl|df|vasc|non-isic",
  "category": "string",
  "confidence": number,
  "emergencyLevel": "low"|"medium"|"high",
  "description": "string",
  "warning": "string",
  "causes": ["string","string","string"],
  "symptoms": ["string","string","string"],
  "triggers": ["string","string","string"],
  "alternatives": [
    {"name":"string","pct":number},
    {"name":"string","pct":number},
    {"name":"string","pct":number}
  ],
  "actionPlan": [
    {"urgency":"urgent","title":"string","desc":"string","tag":"now"},
    {"urgency":"today","title":"string","desc":"string","tag":"today"},
    {"urgency":"ongoing","title":"string","desc":"string","tag":"week"},
    {"urgency":"ongoing","title":"string","desc":"string","tag":"ongoing"}
  ],
  "products": [
    {"icon":"emoji","name":"string","type":"string","desc":"string"},
    {"icon":"emoji","name":"string","type":"string","desc":"string"},
    {"icon":"emoji","name":"string","type":"string","desc":"string"}
  ],
  "avoidList": [
    {"icon":"emoji","name":"string","reason":"string","severity":"HIGH"|"MEDIUM"|"LOW"},
    {"icon":"emoji","name":"string","reason":"string","severity":"HIGH"|"MEDIUM"|"LOW"},
    {"icon":"emoji","name":"string","reason":"string","severity":"HIGH"|"MEDIUM"|"LOW"}
  ],
  "timeline": [
    {"period":"string","title":"string","desc":"string","status":"active"},
    {"period":"string","title":"string","desc":"string","status":"future"},
    {"period":"string","title":"string","desc":"string","status":"future"},
    {"period":"string","title":"string","desc":"string","status":"future"}
  ],
  "doctorNote": "string",
  "disclaimer": "This AI analysis follows the HAM10000/ISIC classification framework but is NOT a clinical diagnosis. Always consult a qualified dermatologist. HAM10000 model benchmark accuracy by class: mel=77%, nv=92%, bcc=81%, akiec=69%, bkl=79%, df=73%, vasc=84%."
}`;

// ── Call Gemini API ──────────────────────────────────────────
async function callGemini(parts, retries = 3) {
  const fetch = require('node-fetch');
  const key = GEMINI_KEY();

  if (!key || key === 'your_gemini_api_key_here') {
    throw new Error('GEMINI_API_KEY not configured. Please add your Gemini API key to the .env file.');
  }

  const payload = {
    contents: [{ parts }],
    generationConfig: {
      temperature: 0.2,
      topP: 0.8,
      maxOutputTokens: 4096
    },
    safetySettings: [
      { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
      { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
      { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
      { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' }
    ]
  };

  for (let attempt = 0; attempt < retries; attempt++) {
    const response = await fetch(`${GEMINI_URL}?key=${key}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const err = await response.text();
      // Retry on 503 (Service Unavailable) or 429 (Too Many Requests)
      if ((response.status === 503 || response.status === 429) && attempt < retries - 1) {
        const delay = Math.pow(2, attempt + 1) * 1000; // 2s, 4s...
        console.warn(`Gemini API busy (Status ${response.status}). Retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
      
      if (response.status === 503) {
        throw new Error('The AI model is currently experiencing high demand. Please try again in a few moments.');
      } else if (response.status === 429) {
        throw new Error('Too many requests to the AI model. Please wait a moment and try again.');
      }
      throw new Error(`Gemini API error ${response.status}: ${err}`);
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) throw new Error('Empty response from Gemini');

    // Strip markdown code fences if present
    const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

    try {
      return JSON.parse(cleaned);
    } catch (e) {
      throw new Error('Gemini returned invalid JSON: ' + cleaned.substring(0, 200));
    }
  }
}

// ── POST /api/analyze/image ─────────────────────────────────
router.post('/image', async (req, res) => {
  try {
    const { imageBase64, skinTone, userId } = req.body;
    if (!imageBase64) return res.status(400).json({ error: 'No image provided' });

    // Extract mime type and pure base64
    let mimeType = 'image/jpeg';
    let pureBase64 = imageBase64;
    if (imageBase64.startsWith('data:')) {
      const [header, data] = imageBase64.split(',');
      mimeType = header.match(/data:(.*);base64/)?.[1] || 'image/jpeg';
      pureBase64 = data;
    }

    const parts = [
      { text: SYSTEM_PROMPT + `\n\nSkin tone: ${skinTone || 'Not specified'}\nTask: Analyze this skin image and return JSON only.` },
      { inlineData: { mimeType, data: pureBase64 } }
    ];

    const result = await callGemini(parts);
    const analysisId = uuidv4();
    const timestamp = new Date().toISOString();

    // Store in history
    if (userId) {
      const history = scanHistory.get(userId) || [];
      history.unshift({
        id: analysisId,
        conditionName: result.conditionName,
        confidence: result.confidence,
        emergencyLevel: result.emergencyLevel,
        timestamp,
        method: 'IMAGE_UPLOAD'
      });
      scanHistory.set(userId, history.slice(0, 20));
    }

    res.json({ success: true, result: { ...result, analysisId, timestamp, method: 'IMAGE_UPLOAD', skinTone } });
  } catch (err) {
    console.error('Image analyze error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ── POST /api/analyze/symptoms ──────────────────────────────
router.post('/symptoms', async (req, res) => {
  try {
    const { symptoms, skinTone, userId } = req.body;
    if (!symptoms || symptoms.trim().length < 10) {
      return res.status(400).json({ error: 'Please describe your symptoms in more detail (at least 10 characters)' });
    }

    const parts = [
      {
        text: SYSTEM_PROMPT +
          `\n\nSkin tone: ${skinTone || 'Not specified'}` +
          `\nSymptom description: "${symptoms}"` +
          `\nTask: Based on the symptom description above, analyze the likely skin condition and return JSON only.`
      }
    ];

    const result = await callGemini(parts);
    const analysisId = uuidv4();
    const timestamp = new Date().toISOString();

    if (userId) {
      const history = scanHistory.get(userId) || [];
      history.unshift({
        id: analysisId,
        conditionName: result.conditionName,
        confidence: result.confidence,
        emergencyLevel: result.emergencyLevel,
        timestamp,
        method: 'SYMPTOM_DESCRIPTION'
      });
      scanHistory.set(userId, history.slice(0, 20));
    }

    res.json({ success: true, result: { ...result, analysisId, timestamp, method: 'SYMPTOM_DESCRIPTION', skinTone } });
  } catch (err) {
    console.error('Symptom analyze error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ── GET /api/analyze/history/:userId ───────────────────────
router.get('/history/:userId', (req, res) => {
  const history = scanHistory.get(req.params.userId) || [];
  res.json({ success: true, history });
});

module.exports = router;
