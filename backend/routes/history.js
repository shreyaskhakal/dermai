// ============================================================
//  HISTORY ROUTE — Scan history management
// ============================================================
const express = require('express');
const router = express.Router();

// Shared storage (in production, use a real database)
const { historyStore } = require('../data/store');

// GET /api/history/:userId
router.get('/:userId', (req, res) => {
  const history = historyStore.get(req.params.userId) || historyStore.get('demo') || [];
  res.json({ success: true, history, total: history.length });
});

// DELETE /api/history/:userId/:scanId
router.delete('/:userId/:scanId', (req, res) => {
  const { userId, scanId } = req.params;
  const history = historyStore.get(userId) || [];
  const updated = history.filter(h => h.id !== scanId);
  historyStore.set(userId, updated);
  res.json({ success: true, deleted: scanId });
});

module.exports = router;
