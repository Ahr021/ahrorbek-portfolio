const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const https = require('https');

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

// Helper function to escape HTML special characters for Telegram HTML parse_mode
function escapeHtml(text) {
  if (!text) return '';
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// Send Telegram notification via Bot API
function sendTelegramNotification(contactData) {
  return new Promise((resolve) => {
    const token = process.env.TELEGRAM_BOT_TOKEN || '8718392320:AAHu1UFPv5Au4GOuIOFfiStZLyti9tzwtTU';
    const chatId = process.env.TELEGRAM_CHAT_ID || '5128235242';

    if (!token || !chatId) {
      console.warn('[Telegram Bot] TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID is missing. Skipping Telegram notification.');
      return resolve({ success: false, reason: 'Environment variables missing' });
    }

    const { name, email, phone, message, timestamp } = contactData;

    const safeName = escapeHtml(name);
    const safeEmail = escapeHtml(email);
    const safePhone = escapeHtml(phone || 'Not provided');
    const safeMessage = escapeHtml(message);
    const safeTimestamp = escapeHtml(timestamp || new Date().toISOString());

    const htmlMessage = [
      `<b>📬 New Contact Form Submission</b>\n`,
      `👤 <b>Name:</b> ${safeName}`,
      `📧 <b>Email:</b> ${safeEmail}`,
      `📞 <b>Phone:</b> ${safePhone}`,
      `🕒 <b>Timestamp:</b> <code>${safeTimestamp}</code>\n`,
      `💬 <b>Message:</b>`,
      `${safeMessage}`
    ].join('\n');

    const postData = JSON.stringify({
      chat_id: chatId,
      text: htmlMessage,
      parse_mode: 'HTML'
    });

    const options = {
      hostname: 'api.telegram.org',
      port: 443,
      path: `/bot${token}/sendMessage`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          console.log('[Telegram Bot] Notification sent successfully.');
          resolve({ success: true, body });
        } else {
          console.error(`[Telegram Bot] Error (${res.statusCode}):`, body);
          resolve({ success: false, statusCode: res.statusCode, body });
        }
      });
    });

    req.on('error', (err) => {
      console.error('[Telegram Bot] HTTPS request error:', err.message);
      resolve({ success: false, error: err.message });
    });

    req.write(postData);
    req.end();
  });
}

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

app.post('/api/contact', contactRateLimiter, async (req, res) => {
  const { name, email, phone, message } = req.body || {};

  const trimmedName = typeof name === 'string' ? name.trim() : '';
  const trimmedEmail = typeof email === 'string' ? email.trim() : '';
  const trimmedPhone = typeof phone === 'string' ? phone.trim() : '';
  const trimmedMessage = typeof message === 'string' ? message.trim() : '';

  if (!trimmedName || !trimmedEmail || !trimmedMessage) {
    return res.status(400).json({ success: false, error: 'Please provide non-empty name, email, and message.' });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(trimmedEmail)) {
    return res.status(400).json({ success: false, error: 'Please provide a valid email address.' });
  }

  if (trimmedPhone) {
    const digitsOnly = trimmedPhone.replace(/\D/g, '');
    const phoneRegex = /^\+?[0-9\s\-\(\)\.]{7,25}$/;
    if (!phoneRegex.test(trimmedPhone) || digitsOnly.length < 7 || digitsOnly.length > 15) {
      return res.status(400).json({ success: false, error: 'Please provide a valid phone number.' });
    }
  }

  if (trimmedName.length > 100 || trimmedEmail.length > 255 || trimmedPhone.length > 50 || trimmedMessage.length > 5000) {
    return res.status(400).json({ success: false, error: 'Input exceeds maximum allowed length.' });
  }

  const timestamp = new Date().toISOString();

  console.log(`[Contact Form Ingestion] From: ${trimmedName} <${trimmedEmail}> (Phone: ${trimmedPhone || 'N/A'})`);
  console.log(`[Message]: ${trimmedMessage}`);

  // Send notification to Telegram
  await sendTelegramNotification({
    name: trimmedName,
    email: trimmedEmail,
    phone: trimmedPhone,
    message: trimmedMessage,
    timestamp
  });

  res.json({
    success: true,
    message: 'Thank you for reaching out! Ahrorbek will get back to you shortly.',
    timestamp
  });
});

// Fallback to index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`⚡ Ahrorbek Tulkinov Portfolio Server running on http://localhost:${PORT}`);
});
