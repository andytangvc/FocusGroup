// ============================================================================
//  Study Chat  -  a shared Claude chat access point for research participants.
//
//  What this file does (the "back end" / brains of the site):
//    1. Serves the participant chat page and the admin log-viewer page.
//    2. Takes chat messages from participants, sends them to Claude (Anthropic),
//       and sends the reply back.
//    3. Saves EVERY message (participant + Claude) to a log file so you can
//       review all conversations in one place.
//
//  You should not need to edit this file. All the settings you might want to
//  change (your API key, a password, the model, etc.) live in a separate file
//  called ".env"  -  see README.md for instructions.
// ============================================================================

require('dotenv').config();
const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(express.json({ limit: '1mb' }));
app.use(express.static(path.join(__dirname, 'public')));

// ---- Settings (read from the .env file) ------------------------------------
const PORT = process.env.PORT || 3000;
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;   // your secret Claude key
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'changeme'; // log-page password
const MODEL = process.env.MODEL || 'claude-haiku-4-5';     // which Claude model
const MAX_TOKENS = Number(process.env.MAX_TOKENS) || 2048; // max length of each reply
const SYSTEM_PROMPT = process.env.SYSTEM_PROMPT || 'You are a helpful assistant.';

// Where the conversation logs are saved (one line per message).
const LOG_FILE = path.join(__dirname, 'logs.jsonl');

// ---- Helper: save one message to the log file ------------------------------
function logMessage(entry) {
  const line = JSON.stringify(entry) + '\n';
  fs.appendFile(LOG_FILE, line, (err) => {
    if (err) console.error('Could not write to log file:', err);
  });
}

// ============================================================================
//  PARTICIPANT CHAT ENDPOINT
//  The chat page sends messages here; we forward them to Claude and reply.
// ============================================================================
app.post('/api/chat', async (req, res) => {
  try {
    if (!ANTHROPIC_API_KEY) {
      return res.status(500).json({ error: 'The site owner has not set a Claude API key yet.' });
    }

    const participantId = (req.body.participantId || 'unknown').toString().slice(0, 100);
    const history = Array.isArray(req.body.messages) ? req.body.messages : [];

    // The newest participant message is the last item they sent.
    const lastUserMessage = history[history.length - 1];
    if (lastUserMessage && lastUserMessage.role === 'user') {
      logMessage({
        time: new Date().toISOString(),
        participantId,
        role: 'user',
        content: lastUserMessage.content
      });
    }

    // Claude keeps the system instruction (which shapes its behavior) in its own
    // separate field, and just the back-and-forth turns in "messages".
    const messagesForClaude = history.map((m) => ({ role: m.role, content: m.content }));

    const claudeResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: MAX_TOKENS,
        system: SYSTEM_PROMPT,
        messages: messagesForClaude
      })
    });

    if (!claudeResponse.ok) {
      const errText = await claudeResponse.text();
      console.error('Claude error:', errText);
      return res.status(502).json({ error: 'The AI service returned an error. Check your API key and billing.' });
    }

    const data = await claudeResponse.json();
    // Claude's answer comes back as a list of content blocks; join the text ones.
    const reply = Array.isArray(data.content)
      ? data.content.filter((b) => b.type === 'text').map((b) => b.text).join('') || '(no reply)'
      : '(no reply)';

    // Save Claude's reply to the log too.
    logMessage({
      time: new Date().toISOString(),
      participantId,
      role: 'assistant',
      content: reply
    });

    res.json({ reply });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Something went wrong on the server.' });
  }
});

// ============================================================================
//  ADMIN ENDPOINTS  (protected by the password in your .env file)
// ============================================================================

// Check the password sent by the admin page.
function checkPassword(req) {
  const provided = req.headers['x-admin-password'] || req.query.password;
  return provided === ADMIN_PASSWORD;
}

// Return all logged messages as a list.
app.get('/api/logs', (req, res) => {
  if (!checkPassword(req)) {
    return res.status(401).json({ error: 'Wrong password.' });
  }
  if (!fs.existsSync(LOG_FILE)) {
    return res.json({ logs: [] });
  }
  const lines = fs.readFileSync(LOG_FILE, 'utf8').split('\n').filter(Boolean);
  const logs = lines.map((l) => {
    try { return JSON.parse(l); } catch { return null; }
  }).filter(Boolean);
  res.json({ logs });
});

// Download all logs as a spreadsheet-friendly CSV file.
app.get('/api/logs.csv', (req, res) => {
  if (!checkPassword(req)) {
    return res.status(401).send('Wrong password.');
  }
  let rows = [['time', 'participantId', 'role', 'content']];
  if (fs.existsSync(LOG_FILE)) {
    const lines = fs.readFileSync(LOG_FILE, 'utf8').split('\n').filter(Boolean);
    for (const l of lines) {
      try {
        const e = JSON.parse(l);
        rows.push([e.time, e.participantId, e.role, e.content]);
      } catch { /* skip bad line */ }
    }
  }
  // Turn the rows into CSV text, safely quoting each cell.
  const csv = rows.map((r) =>
    r.map((cell) => '"' + String(cell).replace(/"/g, '""') + '"').join(',')
  ).join('\n');
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="chat-logs.csv"');
  res.send(csv);
});

// ---- Start the server ------------------------------------------------------
app.listen(PORT, () => {
  console.log(`\nStudy Chat is running!`);
  console.log(`  Participant page:  http://localhost:${PORT}/`);
  console.log(`  Admin log viewer:  http://localhost:${PORT}/admin.html`);
  console.log(`  Model in use:      ${MODEL}`);
  if (!ANTHROPIC_API_KEY) {
    console.log(`\n  WARNING: No ANTHROPIC_API_KEY set yet. Chats will not work until you add one.`);
  }
});
