// ============================================================
//  AUTH ROUTE — JWT-based login/signup
// ============================================================
const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');

// In-memory user store (replace with database in production)
const users = new Map();

// Seed a demo user
const demoHash = bcrypt.hashSync('demo123', 10);
users.set('demo@dermai.app', {
  id: uuidv4(),
  email: 'demo@dermai.app',
  firstName: 'Alex',
  lastName: 'Chen',
  passwordHash: demoHash,
  skinTone: 'Type III',
  plan: 'Pro',
  createdAt: new Date().toISOString(),
  scanCount: 12
});

const JWT_SECRET = process.env.JWT_SECRET || 'dermai_dev_secret_2024';

function signToken(user) {
  return jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });
}

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email and password required' });

    const user = users.get(email.toLowerCase().trim());
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) return res.status(401).json({ error: 'Invalid credentials' });

    const token = signToken(user);
    const { passwordHash, ...safeUser } = user;

    res.json({ success: true, token, user: safeUser });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/auth/signup
router.post('/signup', async (req, res) => {
  try {
    const { email, password, firstName, lastName, skinTone } = req.body;
    if (!email || !password || !firstName) return res.status(400).json({ error: 'Required fields missing' });
    if (password.length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters' });

    const key = email.toLowerCase().trim();
    if (users.has(key)) return res.status(409).json({ error: 'Email already registered' });

    const passwordHash = await bcrypt.hash(password, 10);
    const user = {
      id: uuidv4(),
      email: key,
      firstName,
      lastName: lastName || '',
      passwordHash,
      skinTone: skinTone || 'Type I',
      plan: 'Free',
      createdAt: new Date().toISOString(),
      scanCount: 0
    };
    users.set(key, user);

    const token = signToken(user);
    const { passwordHash: _, ...safeUser } = user;
    res.status(201).json({ success: true, token, user: safeUser });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/auth/google (demo — accepts any Google token)
router.post('/google', (req, res) => {
  const { name, email } = req.body;
  const googleEmail = email || 'google@dermai.app';
  const displayName = name || 'Google User';
  const firstName = displayName.split(' ')[0];

  let user = users.get(googleEmail);
  if (!user) {
    user = {
      id: uuidv4(),
      email: googleEmail,
      firstName,
      lastName: displayName.split(' ').slice(1).join(' '),
      passwordHash: '',
      skinTone: 'Type II',
      plan: 'Free',
      createdAt: new Date().toISOString(),
      scanCount: 0
    };
    users.set(googleEmail, user);
  }

  const token = signToken(user);
  const { passwordHash, ...safeUser } = user;
  res.json({ success: true, token, user: safeUser });
});

// GET /api/auth/me (validate token)
router.get('/me', (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: 'No token' });
    const token = authHeader.split(' ')[1];
    const payload = jwt.verify(token, JWT_SECRET);
    const user = users.get(payload.email);
    if (!user) return res.status(404).json({ error: 'User not found' });
    const { passwordHash, ...safeUser } = user;
    res.json({ user: safeUser });
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
});

module.exports = router;
