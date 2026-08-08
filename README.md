# Speak English with Sara — Live English Tutor Dashboard

An English speaking + grammar practice dashboard for Urdu speakers. You talk,
an AI teacher called **Sara** listens, replies out loud like a phone call, and
shows every mistake with the reason in Roman Urdu.

## What is inside

| Page | What it does |
| --- | --- |
| `/` Dashboard | Your level, language for explanations, practice topic, and your stats. |
| `/call` **Live Call** | A real call: you speak into the mic, Sara answers with her voice. Corrections appear under each thing you said. Optional camera self-view. |
| `/chat` **Chat** | Type (or dictate) your English and get correction + natural version + a reply. Optional read-aloud. |
| `/grammar` **Grammar Check** | Paste an email or paragraph. Get it corrected, explained, scored, plus vocabulary upgrades. |
| `/progress` **Progress** | Practice minutes, day streak, average score, a 14-day chart, and a notebook of mistakes you repeat. |

11 practice topics: free talk, introduce yourself, job interview, IELTS
speaking, shopping, doctor, restaurant, customer support call, office meetings,
travel/airport, grammar drills.

## Setup

**1. Add your Claude API key**

Open `.env.local` and paste your key:

```
ANTHROPIC_API_KEY=sk-ant-your-key-here
```

Get one at <https://console.anthropic.com> → **API Keys**.

**2. Run it**

```bash
npm install
npm run dev
```

Open <http://localhost:3000>.

## Important: use Chrome or Edge

The live call uses the browser's built-in speech recognition and speech
synthesis, so **nothing extra is installed and voice costs nothing**. This
needs **Google Chrome** or **Microsoft Edge** on desktop, or Chrome on Android.

- Firefox cannot listen to the microphone — the typing box still works.
- Allow the microphone when the browser asks. If you block it by mistake, click
  the padlock 🔒 in the address bar and allow it again.
- The camera button is optional; the call works fine with audio only.

## How the live call works

1. Press **Start call**. Sara greets you out loud.
2. Speak normally. When you stop for 1–2 seconds, your sentence is sent.
3. Sara replies with her voice, and your corrections appear on screen.
4. Press **I'm done talking** to send immediately, **Mute** to pause the mic,
   **End call** to finish and save the session.

Speaking speed and Sara's voice can be changed in the sidebar — slow her down
if she talks too fast.

## Cost and changing the model

The model is one line in [`src/lib/model.ts`](src/lib/model.ts):

```ts
export const MODEL = anthropic("claude-haiku-4-5");
```

Haiku 4.5 is the cheapest and fastest Claude model, and it answers without a
thinking pause — which is what keeps a live call feeling like a real
conversation.

| Model id | Price per 1M tokens (in / out) | Roughly what $5 buys |
| --- | --- | --- |
| `claude-haiku-4-5` | $1 / $5 | ~1,200 messages |
| `claude-sonnet-5` | $2 / $10 (intro, until 31 Aug 2026) | ~600 messages |
| `claude-opus-5` | $5 / $25 | ~250 messages |

Swap the id to trade cost for teaching quality. Note that Opus 5 thinks before
answering by default, which adds a noticeable pause on the call — it suits the
Grammar Check page better than the live call.

Track your spend at <https://console.anthropic.com> → **Usage**.

## Your data

Settings, session history and the mistake notebook live in your browser's
`localStorage`. There is no database and no login, so nothing leaves your
computer except the sentences sent to the model for correction.

## Deploying

```bash
npm i -g vercel
vercel
vercel env add AI_GATEWAY_API_KEY
vercel --prod
```

The microphone needs HTTPS, which Vercel gives you automatically. On
`localhost` it works without HTTPS.

## Tech

Next.js 16 (App Router) · React 19 · Tailwind CSS 4 · AI SDK v7 via Vercel AI
Gateway · Web Speech API for voice.
