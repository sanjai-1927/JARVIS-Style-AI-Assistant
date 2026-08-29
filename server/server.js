/**
 * ARIA backend proxy.
 *
 * Purpose: hold the LLM API key server-side (never in browser JS) and
 * expose a single POST /api/chat endpoint that the front end calls.
 * Also serves the static front end (index.html) so `npm start` is the
 * only command needed.
 *
 * Supports two providers via PROVIDER env var: "anthropic" (default) or
 * "openai". Only one API key is required, matching whichever provider
 * you choose.
 */
require('dotenv').config();
const express = require('express');
const path = require('path');

const app = express();
app.use(express.json({ limit: '1mb' }));

const PORT = process.env.PORT || 3000;
const PROVIDER = (process.env.PROVIDER || 'anthropic').toLowerCase();

const ARIA_SYSTEM_PROMPT = `You are ARIA, the voice assistant behind a JARVIS-inspired holographic HUD interface.
Reply concisely and conversationally — your replies are spoken aloud via text-to-speech and shown in a
compact on-screen log, so avoid markdown, bullet lists, headers, or long paragraphs. Prefer 1-3 sentences
unless the user clearly wants more detail. Keep a composed, capable, slightly dry tone (think: a calm
ship's-computer voice), without being a caricature of it.`;

/**
 * Normalizes the front end's history array (list of {role, content} pairs,
 * role is "user" or "assistant") into whatever shape each provider expects.
 */
async function callAnthropic(message, history) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY is not set');

  const messages = [...history, { role: 'user', content: message }];

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: process.env.ANTHROPIC_MODEL || 'claude-sonnet-5',
      max_tokens: 300,
      system: ARIA_SYSTEM_PROMPT,
      messages,
    }),
  });

  if (!res.ok) {
    const errBody = await res.text().catch(() => '');
    throw new Error(`Anthropic API error ${res.status}: ${errBody}`);
  }

  const data = await res.json();
  const textBlock = (data.content || []).find((b) => b.type === 'text');
  if (!textBlock) throw new Error('Anthropic response had no text content');
  return textBlock.text.trim();
}

async function callOpenAI(message, history) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error('OPENAI_API_KEY is not set');

  const messages = [
    { role: 'system', content: ARIA_SYSTEM_PROMPT },
    ...history,
    { role: 'user', content: message },
  ];

  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      max_tokens: 300,
      messages,
    }),
  });

  if (!res.ok) {
    const errBody = await res.text().catch(() => '');
    throw new Error(`OpenAI API error ${res.status}: ${errBody}`);
  }

  const data = await res.json();
  const text = data.choices?.[0]?.message?.content;
  if (!text) throw new Error('OpenAI response had no message content');
  return text.trim();
}

app.post('/api/chat', async (req, res) => {
  const { message, history } = req.body || {};

  if (typeof message !== 'string' || !message.trim()) {
    return res.status(400).json({ error: 'message is required' });
  }
  const safeHistory = Array.isArray(history)
    ? history.filter(
        (m) => m && (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string'
      )
    : [];

  try {
    const reply =
      PROVIDER === 'openai'
        ? await callOpenAI(message, safeHistory)
        : await callAnthropic(message, safeHistory);
    res.json({ reply });
  } catch (err) {
    console.error('[ARIA backend] chat error:', err.message);
    res.status(502).json({ error: 'Upstream model call failed. See server logs.' });
  }
});

// Serve the front end (index.html lives one directory up from /server)
app.use(express.static(path.join(__dirname, '..')));

app.listen(PORT, () => {
  console.log(`ARIA backend running on http://localhost:${PORT}  (provider: ${PROVIDER})`);
});
