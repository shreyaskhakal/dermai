const fetch = require('node-fetch');
require('dotenv').config({ path: './.env' });

async function listModels() {
  const key = process.env.GEMINI_API_KEY;
  if (!key) {
    console.error('No API key found in backend/.env');
    return;
  }
  const url = `https://generativelanguage.googleapis.com/v1/models?key=${key}`;
  try {
    const response = await fetch(url);
    const data = await response.json();
    console.log(JSON.stringify(data, null, 2));
  } catch (err) {
    console.error('Error fetching models:', err);
  }
}

listModels();
