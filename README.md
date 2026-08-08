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

**1. Add your API key**

Open `.env.local` and paste an AI Gateway key:

```
AI_GATEWAY_API_KEY=your_key_here
```

Get one free at <https://vercel.com/dashboard> → **AI Gateway** → **API Keys**.
The key works for Claude, GPT and Gemini through one endpoint.

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

## Changing the model

The model is one line in [`src/lib/tutor.ts`](src/lib/tutor.ts):

```ts
export const MODEL = "anthropic/claude-sonnet-5";
```

Any AI Gateway model id works, e.g. `openai/gpt-5.4-mini` or
`google/gemini-3-flash`. A smaller model is cheaper and faster on the call;
a bigger one gives better corrections.

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
