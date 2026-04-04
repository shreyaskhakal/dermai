// ============================================================
//  CHAT ROUTE — Real Gemini AI contextual skin assistant
// ============================================================
const express = require('express');
const router = express.Router();

const GEMINI_URL = 'https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent';

async function callGeminiChat(systemPrompt, userMessage) {
  const fetch = require('node-fetch');
  const key = process.env.GEMINI_API_KEY;

  if (!key || key === 'your_gemini_api_key_here') {
    throw new Error('GEMINI_API_KEY not configured');
  }

  const response = await fetch(`${GEMINI_URL}?key=${key}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [
        { role: 'user', parts: [{ text: systemPrompt + '\n\nUser question: ' + userMessage }] }
      ],
      generationConfig: { temperature: 0.4, maxOutputTokens: 800 }
    })
  });

  if (!response.ok) throw new Error(`Gemini API ${response.status}`);
  const data = await response.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text || 'No response generated.';
}

// POST /api/chat/message
router.post('/message', async (req, res) => {
  try {
    const { message, conditionId, conditionName, conditionContext } = req.body;
    if (!message) return res.status(400).json({ error: 'Message required' });

    const systemPrompt = `You are DermAI, a practical skin health assistant. The user has been diagnosed with: ${conditionName || conditionId || 'a skin condition'}.

${conditionContext ? `Condition context: ${JSON.stringify(conditionContext)}` : ''}

Rules:
- Give direct, actionable advice — not vague generalities
- Always end with a concrete "Next step" the user can take TODAY
- Be honest: if something requires a doctor, say so clearly
- Keep response under 250 words
- Use markdown formatting (bold, bullet points)
- Include a relevant emoji at the start
- NEVER fabricate medical facts`;

    const aiResponse = await callGeminiChat(systemPrompt, message);

    res.json({ success: true, response: aiResponse, timestamp: new Date().toISOString() });
  } catch (err) {
    console.error('Chat error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
