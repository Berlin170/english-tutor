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
| `/tenses` **Tenses** | All 12 English tenses explained in Roman Urdu, each with a practice quiz. |
| `/story` **Story Reader** | Pick a topic and get a graded story set in Pakistan, with a Roman Urdu glossary, 5 questions and a grammar note. |
| `/progress` **Progress** | Practice minutes, day streak, average score, a 14-day chart, and a notebook of mistakes you repeat. |

11 practice topics: free talk, introduce yourself, job interview, IELTS
speaking, shopping, doctor, restaurant, customer support call, office meetings,
travel/airport, grammar drills.

## Setup

**1. Add your Claude API key**

Copy `.env.example` to `.env.local` and paste your key:

```
ANTHROPIC_API_KEY=sk-ant-your-key-here
```

Get one at <https://console.anthropic.com> → **API Keys**. This powers the
call, the chat and the grammar check.

**2. Add your Gonka key (only for the Story Reader)**

```
GONKA_BASE_URL=https://<your-project>.supabase.co/functions/v1/gonka
GONKA_API_KEY=sk-your-gonka-key
```

Both values are on the dashboard at <https://gonka-api.org/dashboard>. Skip
this and everything still works except `/story`, which will show an error.

**3. Run it**

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

## Why the Story Reader uses a different provider

A story plus its glossary and questions is a few thousand tokens every time it
is read, which is the one place in this app where the per-token price actually
matters. So `/story` alone talks to **Gonka**, an OpenAI-compatible endpoint
where the balance is measured in hundreds of millions of tokens. Everything
else stays on Claude, where the low latency and reliable JSON are worth paying
for. The split lives in [`src/lib/gonka.ts`](src/lib/gonka.ts); nothing there
touches `model.ts`.

The trade is speed and reliability:

- One story takes **2 to 4 minutes**. That is the model, not your connection.
- Gonka sometimes finishes having sent nothing back, and the page asks you to
  press the button again. Roughly one attempt in three.
- The route asks Gonka to stream even though you receive one finished story.
  Gonka drops any request that has sent no bytes for 150 seconds, so a single
  blocking call never completed. Do not change this back.
- `MAX_STORY_TOKENS` is 8000 because the model spends its own tokens thinking
  before it writes, and a smaller budget cuts the JSON off mid-object.

Of the two models Gonka offers, only **Kimi K2.6** honours the JSON format.
MiniMax M2.7 writes its reasoning into the message body and is no faster.

## Your data

Settings, session history and the mistake notebook live in your browser's
`localStorage`. There is no database and no login, so nothing leaves your
computer except the sentences sent to the model for correction.

## Deploying

```bash
npm i -g vercel
vercel
vercel env add ANTHROPIC_API_KEY production
vercel env add GONKA_BASE_URL production
vercel env add GONKA_API_KEY production
vercel --prod
```

Repeat the three `env add` lines for `preview` and `development` if you want
branch deploys and `vercel dev` to work too. Environment variables are only
picked up by the **next** deployment, so run `vercel --prod` after adding them.

The microphone needs HTTPS, which Vercel gives you automatically. On
`localhost` it works without HTTPS.

## Tech

Next.js 16 (App Router) · React 19 · Tailwind CSS 4 · AI SDK v7 talking to
Anthropic directly, plus an OpenAI-compatible provider for stories · Web
Speech API for voice.

The AI Gateway is deliberately not used: it refuses every request until a card
is on file, and this project is meant to run on prepaid credit alone.
