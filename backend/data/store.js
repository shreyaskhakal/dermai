// ============================================================
//  Shared Data Store
// ============================================================

const historyStore = new Map();

// Seed demo history
const demoHistory = [
  {
    id: 'h1', conditionId: 'eczema', conditionName: 'Eczema',
    confidence: 91, emergencyLevel: 'low', emoji: '🔴',
    timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    method: 'IMAGE_UPLOAD'
  },
  {
    id: 'h2', conditionId: 'acne', conditionName: 'Acne',
    confidence: 87, emergencyLevel: 'low', emoji: '🟡',
    timestamp: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    method: 'IMAGE_UPLOAD'
  },
  {
    id: 'h3', conditionId: 'rosacea', conditionName: 'Rosacea',
    confidence: 79, emergencyLevel: 'low', emoji: '🌸',
    timestamp: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000).toISOString(),
    method: 'SYMPTOM_DESCRIPTION'
  },
  {
    id: 'h4', conditionId: 'ringworm', conditionName: 'Ringworm',
    confidence: 84, emergencyLevel: 'low', emoji: '🟤',
    timestamp: new Date(Date.now() - 35 * 24 * 60 * 60 * 1000).toISOString(),
    method: 'IMAGE_UPLOAD'
  }
];
historyStore.set('demo', demoHistory);

module.exports = {
  historyStore
};
