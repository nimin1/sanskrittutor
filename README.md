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
DEEPSEEK_API_KEY=
SARVAM_API_KEY=
GEMINI_API_KEY=
OPENAI_API_KEY=
```

The app uses a capability router:

- Sarvam first for Malayalam speech-to-text, OCR/document extraction, and Malayalam text-to-speech.
- Gemini as fallback for OCR and speech-to-text.
- DeepSeek first for normal Sanskrit tutoring responses.
- OpenAI as fallback for transcription, OCR/vision, tutor responses, and TTS.

Useful optional overrides:

```env
DEEPSEEK_MODEL=deepseek-chat
SARVAM_STT_MODEL=saaras:v3
SARVAM_TTS_MODEL=bulbul:v3
SARVAM_TTS_SPEAKER=kavitha
GEMINI_OCR_MODEL=gemini-2.5-flash-lite
TRANSCRIBE_MODEL=gemini-2.5-flash
OPENAI_TRANSCRIBE_MODEL=gpt-4o-mini-transcribe
OPENAI_VISION_MODEL=gpt-4o-mini
OPENAI_TUTOR_MODEL=gpt-4o-mini
OPENAI_TTS_MODEL=gpt-4o-mini-tts
```

Photo reading is OCR-first: the app extracts text from the image, then asks DeepSeek to teach from that extracted Sanskrit text. This keeps image-provider usage lower and makes fallbacks easier.

## Product Principle

The AI should behave like a patient Malayalam-speaking Sanskrit teacher, not a generic chatbot.
