# Sanskrit Tutor App

A Malayalam-first AI Sanskrit tutor for an older learner preparing for a Sanskrit exam.

## Core Features

- Snap a Sanskrit textbook page and get a Malayalam explanation
- Ask doubts by voice or text
- Get small quizzes from the current page
- Revisit past lessons
- Local-first history in IndexedDB

## Tech Stack

- Next.js App Router
- TypeScript
- Browser IndexedDB
- AI provider adapter
- Browser Speech APIs
- PWA manifest

## Development

```bash
npm install
npm run dev
```

Then open `http://localhost:3000`.

## Environment Variables

Copy `.env.example` to `.env.local` and fill in your provider key.

```env
AI_PROVIDER=gemini
AI_MODEL=gemini-2.5-flash
AI_API_KEY=
AI_BASE_URL=
```

For OpenAI-compatible APIs, set:

```env
AI_PROVIDER=openai-compatible
AI_MODEL=your-model
AI_BASE_URL=https://api.openai.com/v1
AI_API_KEY=
```

For DeepSeek, set:

```env
AI_PROVIDER=deepseek
AI_MODEL=deepseek-chat
AI_BASE_URL=https://api.deepseek.com
AI_API_KEY=your_deepseek_api_key
```

DeepSeek is wired through its OpenAI-compatible chat completions API. Use it for text doubts and follow-up tutoring. The photo-reading flow still needs a vision-capable model; if DeepSeek vision is not available on your account/model, use Gemini or another vision provider for `Snap & Explain`.

## Product Principle

The AI should behave like a patient Malayalam-speaking Sanskrit teacher, not a generic chatbot.
