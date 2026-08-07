const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Simple in-memory rate limiter for contact endpoint
const contactRateLimitMap = new Map();
const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const MAX_CONTACT_REQUESTS = 5;

const contactRateLimiter = (req, res, next) => {
  const clientIp = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';
  const now = Date.now();
  const windowStart = now - RATE_LIMIT_WINDOW_MS;

  let timestamps = contactRateLimitMap.get(clientIp) || [];
  timestamps = timestamps.filter(ts => ts > windowStart);

  if (timestamps.length >= MAX_CONTACT_REQUESTS) {
    return res.status(429).json({
      success: false,
      error: 'Too many contact form submissions from this IP. Please try again later.'
    });
  }

  timestamps.push(now);
  contactRateLimitMap.set(clientIp, timestamps);
  next();
};

// Load CV Data
const getData = () => {
  const raw = fs.readFileSync(path.join(__dirname, 'data', 'cvData.json'), 'utf-8');
  return JSON.parse(raw);
};

// API Endpoints
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    status: 'OK',
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

app.get('/api/cv/download', (req, res) => {
  const cvPath = path.join(__dirname, 'Linkedin CV.pdf');
  if (!fs.existsSync(cvPath)) {
    return res.status(404).json({ success: false, error: 'CV file not found.' });
  }
  res.download(cvPath, 'Linkedin CV.pdf');
});

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

app.post('/api/contact', contactRateLimiter, (req, res) => {
  const { name, email, message } = req.body || {};

  const trimmedName = typeof name === 'string' ? name.trim() : '';
  const trimmedEmail = typeof email === 'string' ? email.trim() : '';
  const trimmedMessage = typeof message === 'string' ? message.trim() : '';

  if (!trimmedName || !trimmedEmail || !trimmedMessage) {
    return res.status(400).json({ success: false, error: 'Please provide non-empty name, email, and message.' });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(trimmedEmail)) {
    return res.status(400).json({ success: false, error: 'Please provide a valid email address.' });
  }

  if (trimmedName.length > 100 || trimmedEmail.length > 255 || trimmedMessage.length > 5000) {
    return res.status(400).json({ success: false, error: 'Input exceeds maximum allowed length.' });
  }

  console.log(`[Contact Form Ingestion] From: ${trimmedName} <${trimmedEmail}>`);
  console.log(`[Message]: ${trimmedMessage}`);

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
