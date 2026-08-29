# ARIA — Voice HUD Assistant

A single-file, JARVIS-inspired voice assistant with a holographic HUD interface. It runs entirely client-side in the browser: no backend, no build step, no dependencies beyond web fonts.

![status](https://img.shields.io/badge/status-demo-4fd8e8) ![license](https://img.shields.io/badge/license-MIT-informational)

## Features

- **Holographic HUD** — animated concentric rings, a reactive core, corner brackets, and a scanline overlay built with plain CSS and SVG.
- **Voice input** — uses the Web Speech API (`SpeechRecognition`) for live speech-to-text, with an interim transcript shown as you talk.
- **Voice output** — uses `speechSynthesis` for spoken replies, with a voice picker that prefers deeper-sounding system voices.
- **Real audio-reactive core** — while listening, the mic's live amplitude (via `AudioContext` + `AnalyserNode`) drives the core's pulse and an on-screen waveform, rather than a canned animation.
- **Lightweight emotional intelligence** — a small keyword-based sentiment engine (positive / empathetic / urgent / neutral) that shifts the HUD's accent color and the tone of ARIA's replies.
- **Text fallback** — a text input works identically to voice, so the assistant is fully usable in browsers without `SpeechRecognition` support (e.g. Firefox), with an on-screen notice when that happens.
- **System log & vitals panel** — session timer, mic level meter, sentiment gauge, and exchange counter alongside a scrolling conversation log.

## What this is (and isn't)

This is a **front-end interaction demo**. Responses come from a small built-in intent library plus sentiment-aware fallbacks — there is no connected language model or internet access. It's meant as a polished starting point for:

- Wiring up a real backend or LLM API in place of `craftResponse()`
- A voice-UI prototype or portfolio piece
- Learning how the Web Speech API and Web Audio API fit together

## Running it

No build step needed.

```bash
# Just open it
open index.html          # macOS
start index.html         # Windows

# Or serve it locally (recommended — some browsers restrict
# microphone access on file:// URLs)
python3 -m http.server 8080
# then visit http://localhost:8080
```

**Browser support:** Chrome and Edge have full support for both speech recognition and synthesis. Safari supports synthesis but has limited recognition support. Firefox does not currently support `SpeechRecognition` — ARIA automatically falls back to text-only mode with a banner notice.

Microphone access requires either `https://` or `localhost` — browsers block `getUserMedia` on plain `file://` pages in some cases.

## Customizing

| What | Where |
|---|---|
| Personality / canned responses | `INTENTS` array in the `<script>` block |
| Sentiment keywords | `LEXICON` object |
| Color themes per mood | `MOODS` object (CSS custom properties) |
| Assistant name / labels | `.brand` markup near the top of `<body>` |
| Voice selection order | `pickVoice()` |

To connect a real model, replace the body of `craftResponse()` with a `fetch()` call to your API of choice, keeping the `{ text, sent }` return shape (or compute `sent` however you like) so the HUD's mood and log still update correctly.

## Project structure

```
.
├── index.html   # the entire application
├── README.md
└── LICENSE
```

## License

MIT — see [LICENSE](./LICENSE).
