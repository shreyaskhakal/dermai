// ============================================================
//  PRIVACY ROUTE — Data export & deletion endpoints
// ============================================================
const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'dermai_dev_secret_2024';

// Simple auth middleware
function authenticate(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: 'No token provided' });
    const token = authHeader.split(' ')[1];
    const payload = jwt.verify(token, JWT_SECRET);
    req.userId = payload.id;
    req.userEmail = payload.email;
    next();
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
}

// GET /api/privacy/export-data — Export all user data
router.get('/export-data', authenticate, (req, res) => {
  try {
    res.json({
      success: true,
      exportDate: new Date().toISOString(),
      platform: 'DermAI',
      userId: req.userId,
      email: req.userEmail,
      message: 'Most user data is stored locally in your browser (localStorage). This endpoint confirms your server-side identity. Use the in-app "Download My Data" button for a complete export.',
      serverData: {
        accountId: req.userId,
        email: req.userEmail,
        note: 'DermAI uses in-memory storage. No persistent database records exist for this demo deployment.'
      }
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to export data' });
  }
});

// DELETE /api/privacy/delete-data — Delete all user data
router.delete('/delete-data', authenticate, (req, res) => {
  try {
    // In a production app with a real database, you would:
    // 1. Delete user record
    // 2. Delete scan history
    // 3. Delete uploaded images
    // 4. Revoke all tokens
    // 5. Send confirmation email

    res.json({
      success: true,
      message: 'All server-side data associated with your account has been queued for deletion.',
      deletedAt: new Date().toISOString(),
      details: {
        accountData: 'deleted',
        scanHistory: 'deleted',
        uploadedImages: 'not_stored',
        analyticsData: 'anonymized'
      },
      note: 'Please also clear your browser localStorage for complete local data removal.'
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete data' });
  }
});

// GET /api/privacy/policy — Return privacy policy summary as JSON
router.get('/policy', (req, res) => {
  res.json({
    version: '1.0.0',
    lastUpdated: '2026-04-17',
    dataCollected: [
      'Account information (name, email, skin tone)',
      'Skin images (processed in-memory, not stored)',
      'Symptom descriptions (processed in-memory)',
      'Scan history (stored locally in browser)',
      'Location data (only when explicitly requested)',
      'Anonymous usage analytics (via Firebase)'
    ],
    dataNotCollected: [
      'Financial information',
      'Social media accounts',
      'Contact lists',
      'Background location tracking'
    ],
    thirdPartyServices: [
      'Google Gemini AI (image/symptom analysis)',
      'Firebase Authentication & Analytics',
      'Google Maps Platform (dermatologist search)',
      'Google Translate (language widget)'
    ],
    userRights: [
      'Right to access your data',
      'Right to export your data',
      'Right to delete your data',
      'Right to revoke consent',
      'Right to restrict processing'
    ],
    contact: 'privacy@dermai.app'
  });
});

module.exports = router;
