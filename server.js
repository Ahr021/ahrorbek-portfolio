const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Load CV Data
const getData = () => {
  const raw = fs.readFileSync(path.join(__dirname, 'data', 'cvData.json'), 'utf-8');
  return JSON.parse(raw);
};

// API Endpoints
app.get('/api/all', (req, res) => {
  try {
    const data = getData();
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get('/api/profile', (req, res) => {
  try {
    const data = getData();
    res.json({ success: true, profile: data.profile });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get('/api/metrics', (req, res) => {
  try {
    const data = getData();
    res.json({ success: true, metrics: data.metrics });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get('/api/experience', (req, res) => {
  try {
    const data = getData();
    res.json({ success: true, experience: data.experience });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get('/api/education', (req, res) => {
  try {
    const data = getData();
    res.json({ success: true, education: data.education });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get('/api/skills', (req, res) => {
  try {
    const data = getData();
    res.json({ success: true, skills: data.skills, languages: data.languages });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/contact', (req, res) => {
  const { name, email, message } = req.body;
  if (!name || !email || !message) {
    return res.status(400).json({ success: false, error: 'Please provide name, email, and message.' });
  }

  console.log(`[Contact Form Ingestion] From: ${name} <${email}>`);
  console.log(`[Message]: ${message}`);

  res.json({
    success: true,
    message: 'Thank you for reaching out! Ahrorbek will get back to you shortly.',
    timestamp: new Date().toISOString()
  });
});

// Fallback to index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`⚡ Ahrorbek Tulkinov Portfolio Server running on http://localhost:${PORT}`);
});
