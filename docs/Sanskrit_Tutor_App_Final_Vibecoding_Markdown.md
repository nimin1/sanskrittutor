# Sanskrit Tutor App — Final End-to-End Vibecoding Document

## 1. Product Name

**Working name:** Sanskrit Tutor App  
**Malayalam app name:** സംസ്കൃതം ഗുരു  
**Purpose:** A Malayalam-first, camera-first AI Sanskrit tutor for a 69-year-old learner preparing for a Sanskrit exam.

---

## 2. Product Vision

Build a calm, simple, Malayalam-first AI tutor that helps an older learner study Sanskrit from her actual textbook pages.

The app should not behave like a generic chatbot. It should behave like a patient teacher.

The learner can:

1. Take a photo of a Sanskrit textbook page.
2. Get a structured Malayalam explanation.
3. Ask follow-up doubts by voice or text.
4. Get small quizzes from the same page.
5. Revisit previous lessons easily.

The app should feel simple enough that she can use it every day without help.

---

## 3. Core Product Insight

The problem is not that AI cannot answer Sanskrit questions.

The problem is that generic chatbots are not designed to teach an older Malayalam-speaking learner in a structured, patient, page-grounded way.

This app constrains the AI into a mentor role:

- Malayalam-first
- Camera-first
- Voice-friendly
- Page-grounded
- Structured explanations
- Honest uncertainty
- Small learning loops
- No unnecessary features

---

## 4. Target User

### Primary User

A 69-year-old native Malayalam speaker preparing for a Sanskrit exam.

### User Characteristics

- Native language: Malayalam
- Comfortable reading Malayalam
- Comfortable listening to Malayalam explanations
- Limited typing speed on phone, especially in Malayalam script
- Can use WhatsApp, take photos, tap buttons
- Uses smartphone daily
- Will likely study 30–60 minutes per day
- Needs calm, respectful, structured explanations
- May feel frustrated if the app is cluttered, fast, or unpredictable

### User Goal

Pass her Sanskrit exam by understanding:

- Shlokas
- Word meanings
- Vibhakti
- Sandhi
- Samasa
- Sentence structure
- Basic grammar rules
- Exam-style questions

---

## 5. Product Principles

1. **Malayalam first**  
   Every UI label, AI reply, error message, and help text should be Malayalam by default.

2. **One thing per screen**  
   Avoid clutter. Each screen should have one obvious primary action.

3. **Big buttons, big fonts**  
   Minimum font size should be 20px. Primary buttons should be large and easy to tap.

4. **Voice is first-class**  
   Typing Malayalam on a phone is hard for many older users. Voice input should be available wherever questions can be asked.

5. **The AI is a mentor, not a chatbot**  
   It should teach patiently, step by step, without dumping long answers.

6. **The photo is the learning context**  
   When a page is photographed, the AI should explain that page first instead of giving generic Sanskrit knowledge.

7. **Honest uncertainty**  
   If the AI is not sure, it should say so. It should never invent grammar rules, sutras, or meanings.

8. **Calm over clever**  
   The app should feel like a quiet study companion, not a flashy AI product.

9. **Small learning loops**  
   Explain, check understanding, quiz, revise.

10. **Build for one real user first**  
   Do not add features that do not help the primary learner.

---

## 6. MVP Scope

The MVP has four core flows:

1. **Snap & Explain**
2. **Ask a Doubt**
3. **Quiz Me**
4. **History**

---

## 7. Out of Scope for MVP

Do not build these in v1:

- Login/signup
- Multiple users
- Paid plans
- Subscriptions
- Ads
- Social sharing
- Leaderboards
- Whole textbook upload
- Teacher dashboard
- Native Android/iOS app
- Handwriting recognition
- Complex analytics
- Multi-language support beyond Malayalam-first usage
- Gamification
- AI avatar
- Complex spaced repetition engine

---

## 8. Core User Flows

### 8.1 Home Screen

The home screen should have only three large buttons.

#### Buttons

1. **പേജ് ഫോട്ടോ എടുക്കുക** — Snap a page
2. **സംശയം ചോദിക്കുക** — Ask a doubt
3. **പഴയ പാഠങ്ങൾ** — Past lessons

#### UX Requirements

- Buttons stacked vertically
- Each button at least 80px tall
- Large icon + Malayalam label
- Base font size: 20px
- High contrast
- Lots of whitespace
- No menu bar in MVP
- No hidden actions
- No tiny icon-only buttons

---

### 8.2 Snap & Explain Flow

#### Flow

1. User taps **പേജ് ഫോട്ടോ എടുക്കുക**
2. Camera opens
3. User takes photo of textbook page
4. App shows photo confirmation screen
5. User chooses:
   - **വായിക്കുക** — Read this page
   - **വീണ്ടും എടുക്കുക** — Retake photo
6. App shows loading state:
   - **വായിക്കുന്നു... കുറച്ച് സമയം കാത്തിരിക്കൂ**
7. AI streams Malayalam explanation
8. App shows follow-up actions:
   - **എനിക്ക് ക്വിസ് ചെയ്യൂ**
   - **കൂടുതൽ സംശയം ചോദിക്കുക**
   - **മനസ്സിലായി**
   - **മനസ്സിലായില്ല**

#### Important UX Decision

Do not send the photo immediately after capture.

Older users should be able to confirm the photo before the AI processes it.

---

### 8.3 Ask a Doubt Flow

#### Flow

1. User taps **സംശയം ചോദിക്കുക**
2. Screen shows:
   - Large microphone button
   - Text input as fallback
   - Send button
3. User speaks or types question
4. If voice is used:
   - App shows recognized text
   - User can confirm before sending
5. AI replies in Malayalam
6. User can listen to the answer using speaker button

#### Example Questions

- ഈ ശ്ലോകത്തിന്റെ അർത്ഥം എന്താണ്?
- വിഭക്തി എന്നത് എന്താണ്?
- രാമഃ പഠതി — ഇതിൽ കർത്താവ് ഏതാണ്?
- സമാസം എങ്ങനെ തിരിച്ചറിയാം?
- ഈ വാക്കിന്റെ മലയാളം അർത്ഥം എന്താണ്?

---

### 8.4 Conversation Continuation Flow

When a photo is already in context:

- Follow-up questions should refer to the same page.
- User should not need to re-upload the image.
- A visible **പുതിയ പേജ്** button should reset the context.

#### Example

User takes photo of a shloka page.

AI explains it.

User asks:

> ഇതിൽ ദ്വിതീയാ വിഭക്തി എവിടെയാണ്?

The AI should answer based on the photographed page.

---

### 8.5 Quiz Me Flow

#### Flow

1. AI completes an explanation
2. User taps **എനിക്ക് ക്വിസ് ചെയ്യൂ**
3. AI generates 3–5 questions from the current page/topic
4. Questions are shown one at a time
5. User answers by voice or text
6. AI gives:
   - Correct/incorrect feedback
   - One-line explanation
   - Encouragement

#### Quiz Types

Use a mix of:

- Word meaning
- Identify vibhakti
- Complete the shloka
- Simple translation
- Identify subject/object
- Match Sanskrit word to Malayalam meaning
- Choose correct grammar explanation

#### Quiz UX

Avoid showing all questions at once.

Show one question at a time to reduce cognitive load.

---

### 8.6 History Flow

#### Flow

1. User taps **പഴയ പാഠങ്ങൾ**
2. App shows sessions grouped by date
3. User taps a past lesson
4. App shows:
   - Photo thumbnail if available
   - AI explanation
   - Follow-up questions
   - Quiz questions and answers

#### MVP Search

Search by date is enough.

No tags needed in v1.

---

## 9. Elderly-Friendly UX Requirements

### 9.1 Visual Design

- Base font size: 20px
- Optional large mode: 24px
- High contrast text
- Avoid grey-on-grey text
- Avoid tiny icons
- Avoid floating menus
- Avoid dense paragraphs
- Use short sections
- Use generous line spacing
- Use a calm background
- Avoid bright distracting colors

### 9.2 Touch Targets

- Minimum touch target: 48px
- Preferred primary button height: 72–80px
- Important buttons should have both icon and label
- Avoid placing buttons too close together

### 9.3 Reading Experience

AI answers should be structured like this:

1. Short summary
2. Word-by-word meaning if shloka is involved
3. Grammar point
4. Simple example
5. Gentle next step

Avoid long lecture-style responses.

### 9.4 Voice Interaction

Voice input should not auto-submit.

Correct flow:

1. User taps microphone
2. App listens
3. App shows recognized Malayalam text
4. User taps send

This prevents wrong speech recognition from creating confusing answers.

### 9.5 Clear States

Every important state should be visible:

- Listening
- Processing
- Reading photo
- Speaking
- Error
- Saved
- Not saved
- Offline
- Photo unclear

---

## 10. Malayalam UI Labels

Use these as initial labels. Have a native Malayalam reader review before final release.

| English | Malayalam |
|---|---|
| Snap a page | പേജ് ഫോട്ടോ എടുക്കുക |
| Ask a doubt | സംശയം ചോദിക്കുക |
| Past lessons | പഴയ പാഠങ്ങൾ |
| Read this page | ഈ പേജ് വായിക്കുക |
| Retake photo | വീണ്ടും ഫോട്ടോ എടുക്കുക |
| New page | പുതിയ പേജ് |
| Quiz me | എനിക്ക് ക്വിസ് ചെയ്യൂ |
| Ask more | കൂടുതൽ ചോദിക്കുക |
| I understood | മനസ്സിലായി |
| I did not understand | മനസ്സിലായില്ല |
| Send | അയക്കുക |
| Speak | പറയുക |
| Listen | കേൾക്കുക |
| Stop | നിർത്തുക |
| Reading | വായിക്കുന്നു... |
| Listening | ഞാൻ കേൾക്കുന്നു... |
| Please wait | കുറച്ച് സമയം കാത്തിരിക്കൂ |
| Try again | വീണ്ടും ശ്രമിക്കുക |
| Photo unclear | ഫോട്ടോ വ്യക്തമായില്ല |
| Delete history | പഴയ പഠനങ്ങൾ നീക്കം ചെയ്യുക |
| Today | ഇന്ന് |
| Yesterday | ഇന്നലെ |

---

## 11. Malayalam Font and Rendering Requirements

Malayalam rendering is a first-class product requirement.

Use:

- `Noto Sans Malayalam`
- Fallback: system Malayalam font

### CSS Recommendation

```css
html {
  font-family: "Noto Sans Malayalam", system-ui, sans-serif;
  font-size: 20px;
}

body {
  line-height: 1.7;
}
```

### Testing Required

Test Malayalam rendering on:

- iPhone Safari
- iPhone installed PWA mode
- Android Chrome
- Android installed PWA mode
- Desktop Chrome

### Important

Do not hardcode Malayalam text directly across random components.

Use a central localization file:

```ts
// lib/i18n/ml.ts

export const ml = {
  home: {
    snap: "പേജ് ഫോട്ടോ എടുക്കുക",
    ask: "സംശയം ചോദിക്കുക",
    history: "പഴയ പാഠങ്ങൾ",
  },
};
```

---

## 12. Recommended Technical Architecture

### 12.1 MVP Stack

| Layer | Choice |
|---|---|
| Frontend | Next.js 14+ App Router |
| Language | TypeScript |
| Styling | Tailwind CSS |
| App type | Progressive Web App |
| AI API route | Next.js API route |
| AI provider | Provider abstraction with model router |
| Storage v1 | IndexedDB/local-first |
| Storage v2 | Supabase optional |
| Hosting | Vercel |
| Voice input | Browser Web Speech API |
| Voice output | Browser SpeechSynthesis API |
| Optional TTS fallback | ElevenLabs or other Malayalam-capable TTS |

---

### 12.2 Key Architecture Decision

Start local-first with IndexedDB.

For one user, local-first is simpler and more private.

Use Supabase only when you need:

- Cross-device sync
- Backup
- Remote access
- Analytics
- Multi-user support

---

### 12.3 High-Level Data Flow

#### Snap & Explain

```text
User takes photo
→ App shows confirmation
→ User taps "Read this page"
→ Browser compresses image
→ Frontend sends image + history to /api/tutor
→ API route calls selected AI provider
→ AI streams Malayalam explanation
→ Frontend renders answer
→ Session saved to IndexedDB
```

#### Ask a Doubt

```text
User speaks/types question
→ App shows recognized text
→ User confirms
→ Frontend sends question + optional page context to /api/tutor
→ AI streams answer
→ App saves Q/A to IndexedDB
```

---

### 12.4 AI Provider Abstraction

Do not tightly couple the app to one model.

Create a provider adapter.

#### Environment Variables

```env
AI_PROVIDER=gemini
AI_MODEL=gemini-2.5-flash
AI_BASE_URL=
AI_API_KEY=

NEXT_PUBLIC_APP_NAME=സംസ്കൃതം ഗുരു
```

#### Provider Interface

```ts
export type TutorMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

export type TutorRequest = {
  userText?: string;
  imageBase64?: string;
  history: TutorMessage[];
};

export interface TutorModelProvider {
  streamTutorResponse(input: TutorRequest): AsyncIterable<string>;
}
```

#### Supported Providers

Start with one provider, but design for swapping:

- Gemini
- OpenAI
- Anthropic
- DeepSeek if vision + Malayalam quality is validated

---

## 13. Model Selection Strategy

Do not choose the model only based on price.

For this app, the model must be good at:

1. Reading Sanskrit/Devanagari from photos
2. Reading Malayalam from photos
3. Explaining Sanskrit grammar correctly
4. Replying naturally in Malayalam
5. Following short structured teaching style
6. Saying “I am not sure” when uncertain

### Model Evaluation Before Building

Before coding the full app, test 5–10 real textbook page photos with candidate models.

For each model, score:

| Criteria | Score 1–5 |
|---|---|
| Reads photo correctly | |
| Handles Devanagari | |
| Handles Malayalam | |
| Gives correct Sanskrit explanation | |
| Gives clear Malayalam explanation | |
| Avoids hallucination | |
| Follows mentor style | |
| Response speed | |
| Cost | |

Pick the default model after testing.

---

## 14. OCR Strategy

For MVP, you may send the image directly to a vision model.

But do not assume this is enough long term.

### Recommended v1

```text
Image → Vision model → Explanation
```

### Recommended v2

```text
Image
→ OCR or vision extraction
→ Extracted Sanskrit/Malayalam text
→ AI explanation based on extracted text
→ Store extracted text with session
```

### Why Store Extracted Text?

It helps debug:

- Did the model misread the page?
- Or did it read correctly but explain incorrectly?

---

## 15. Data Model

### 15.1 Local IndexedDB Schema

Use Dexie.js or a simple IndexedDB wrapper.

#### Session

```ts
export type StudySession = {
  id: string;
  createdAt: string;
  updatedAt: string;
  title?: string;
  imageBlob?: Blob;
  imageThumbnail?: Blob;
  extractedText?: string;
  messages: TutorChatMessage[];
  quizAttempts?: QuizAttempt[];
};
```

#### Message

```ts
export type TutorChatMessage = {
  id: string;
  role: "user" | "assistant";
  type: "text" | "image" | "quiz" | "system";
  content: string;
  createdAt: string;
};
```

#### Quiz Attempt

```ts
export type QuizAttempt = {
  id: string;
  question: string;
  userAnswer: string;
  aiFeedback: string;
  isCorrect?: boolean;
  createdAt: string;
};
```

---

### 15.2 Optional Supabase Schema for v2

```sql
create table sessions (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  title text,
  image_url text,
  extracted_text text,
  transcript jsonb not null
);
```

---

## 16. Privacy Requirements

Even though this is a family/personal app, privacy matters.

### Requirements

- Do not expose API keys in browser
- All AI calls must go through server API routes
- Do not log full images in server logs
- Do not log full prompts/responses in production
- Provide “Delete all history”
- Make it clear that photos are sent to the selected AI provider
- Do not upload private documents unrelated to study
- Store locally by default
- Compress images before storing

### Delete History Flow

Add a settings or history action:

**പഴയ പഠനങ്ങൾ നീക്കം ചെയ്യുക**

Confirmation:

**എല്ലാ പഴയ പഠനങ്ങളും നീക്കം ചെയ്യണോ? ഇത് തിരികെ ലഭിക്കില്ല.**

Buttons:

- നീക്കം ചെയ്യുക
- വേണ്ട

---

## 17. Error States

Build these from the start.

| Scenario | Malayalam Message | Recovery Action |
|---|---|---|
| Photo unclear | ഫോട്ടോ വ്യക്തമായില്ല. നല്ല വെളിച്ചത്തിൽ വീണ്ടും എടുക്കൂ. | Retake photo |
| Network error | ഇന്റർനെറ്റ് പ്രശ്നം ഉണ്ടായി. വീണ്ടും ശ്രമിക്കൂ. | Try again |
| AI failed | ഇപ്പോൾ ഉത്തരം നൽകാൻ കഴിഞ്ഞില്ല. വീണ്ടും ശ്രമിക്കാം. | Retry |
| Voice not supported | ഈ ബ്രൗസറിൽ ശബ്ദം ഉപയോഗിക്കാൻ കഴിയുന്നില്ല. ടൈപ്പ് ചെയ്യാം. | Show text input |
| TTS not available | വായിച്ച് കേൾപ്പിക്കാൻ ഇപ്പോൾ കഴിയുന്നില്ല. | Hide speaker |
| History save failed | ഈ പാഠം സേവ് ചെയ്യാൻ കഴിഞ്ഞില്ല. | Retry save |
| No history | പഴയ പാഠങ്ങൾ ഒന്നും ഇല്ല. | Go to home |
| AI unsure | എനിക്ക് ഉറപ്പില്ല. ഇത് ടീച്ചറോട് കൂടി പരിശോധിക്കുന്നത് നല്ലതാണ്. | Ask teacher |

---

## 18. AI Tutor System Prompt

Use this as the main system prompt.

Store it in:

```text
/lib/prompts/sanskritTutor.ts
```

```text
You are a patient, respectful Sanskrit tutor for a 69-year-old Malayalam-speaking learner preparing for a Sanskrit exam.

Your role is not to behave like a generic chatbot. Your role is to behave like a calm Malayalam-speaking teacher.

ALWAYS:
- Reply in Malayalam unless the learner explicitly asks for another language.
- Use warm, respectful, simple Malayalam.
- Keep answers short and structured.
- Teach step by step.
- Use large conceptual chunks, not dense paragraphs.
- Avoid overwhelming the learner.
- End with a gentle next step such as:
  "ഇത് മനസ്സിലായോ?"
  "കൂടുതൽ ലളിതമായി പറയണോ?"
  "ഞാൻ ഒരു ചെറിയ ക്വിസ് ചോദിക്കട്ടേ?"

WHEN A PHOTO IS PROVIDED:
- Treat the photo as the main learning context.
- Explain only what is visible or reasonably clear from the page.
- If text is unclear, say the photo is unclear and ask for a better photo.
- Do not invent content that is not visible.
- If the learner asks a follow-up question, answer using the same page context.

WHEN EXPLAINING A SHLOKA:
- Show the Sanskrit text if clear.
- Give Malayalam transliteration when useful.
- Break important words one by one.
- Explain word meaning in Malayalam.
- Explain the overall meaning in simple Malayalam.
- Mention grammar only if it helps the learner.

WHEN EXPLAINING GRAMMAR:
- Name the grammar concept clearly.
- Explain it in plain Malayalam.
- Give one simple example.
- Do not give long theory unless asked.
- If you are not sure, say:
  "എനിക്ക് ഉറപ്പില്ല. ഇത് ടീച്ചറോട് കൂടി പരിശോധിക്കുന്നത് നല്ലതാണ്."

WHEN ASKED TO QUIZ:
- Generate 3 to 5 questions from the most recent page or topic.
- Ask one question at a time if the UI supports it.
- Mix easy question types:
  - word meaning
  - identify vibhakti
  - simple translation
  - complete the shloka
  - identify subject/object
- After the learner answers, give:
  - whether it is correct
  - one-line explanation
  - encouragement

NEVER:
- Guess.
- Invent Panini sutra numbers.
- Invent Sanskrit rules.
- Pretend to read unclear text.
- Use English unless the learner uses English first.
- Give long lectures.
- Sound impatient.
- Talk down to the learner.
- Mention that you are an AI unless needed.

REMEMBER:
The learner is intelligent and motivated. She may only need a slower, clearer explanation. Treat her with dignity and patience.
```

---

## 19. AI Response Format Guidance

For explanations, ask the model to follow this structure:

```text
1. ഈ ഭാഗം എന്തിനെ കുറിച്ചാണ്
2. പ്രധാന വാക്കുകൾ
3. ലളിതമായ അർത്ഥം
4. വ്യാകരണ സൂചന
5. ചെറിയ ചോദ്യം / അടുത്ത പടി
```

For unclear photos:

```text
ഫോട്ടോയിൽ ചില ഭാഗങ്ങൾ വ്യക്തമായി കാണുന്നില്ല.
ദയവായി നല്ല വെളിച്ചത്തിൽ പേജ് വീണ്ടും ഫോട്ടോ എടുക്കാമോ?
```

For uncertainty:

```text
ഇവിടെ എനിക്ക് പൂർണ്ണ ഉറപ്പില്ല.
ഇത് ടീച്ചറോട് കൂടി പരിശോധിക്കുന്നത് നല്ലതാണ്.
```

---

## 20. Golden Test Plan

Before handing the app to the learner, create a golden test set.

### Test Set

- 10 real textbook photos
- 10 common Sanskrit grammar questions
- 10 shloka meaning questions
- 5 unclear/blurry photos
- 5 voice questions in Malayalam

### Evaluation Criteria

| Test | Expected Result |
|---|---|
| Clear textbook photo | Correctly identifies visible content |
| Shloka page | Gives word-by-word meaning |
| Grammar question | Explains simply and accurately |
| Blurry photo | Asks for retake instead of guessing |
| Follow-up question | Uses same page context |
| Quiz request | Generates questions from current page |
| Malayalam speech | Captures usable text |
| Long answer risk | Keeps response short |
| Unknown rule | Says not sure |
| History | Saves and restores session |

---

## 21. Success Criteria

### Product Success

The app is successful if:

- She uses it 10 out of 14 days
- She can complete Snap → Explain without help
- She prefers it over generic chatbot usage for textbook study
- She feels explanations are clear
- She does not feel the app is guessing
- She can revisit past lessons
- She can take quizzes without confusion

### Learning Success

The app is helping if:

- She remembers more vocabulary
- She understands shlokas better
- She gets more quiz answers correct over time
- She feels more confident before the exam

### Technical Success

The system is working if:

- Page explanation streams reliably
- Malayalam text renders correctly
- Voice input works acceptably
- History saves correctly
- API key is never exposed
- App works as PWA on her phone
- Errors are recoverable

---

# 22. End-to-End Build Roadmap

## Phase 0 — Model and UX Validation

### Goal

Validate the riskiest assumptions before building the app.

### Tasks

1. Collect 5–10 real Sanskrit textbook page photos.
2. Test with 2–3 candidate AI models.
3. Compare Malayalam explanation quality.
4. Compare Sanskrit grammar accuracy.
5. Test Malayalam voice input on the target phone.
6. Confirm exam board/syllabus.
7. Confirm whether user prefers:
   - text only
   - voice only
   - both
8. Confirm preferred font size.

### Exit Criteria

- Default AI model selected
- Target phone browser confirmed
- Malayalam voice input acceptable or fallback decided
- Exam context known
- Real page photos tested

---

## Phase 1 — Project Setup

### Goal

Create the base Next.js PWA project.

### Tasks

1. Create Next.js app with TypeScript and Tailwind.
2. Set up app folder structure.
3. Add Malayalam font.
4. Add base layout.
5. Add localization file.
6. Add environment variable structure.
7. Add placeholder home page.
8. Push to GitHub.
9. Deploy to Vercel.

### Exit Criteria

- App runs locally
- App deploys on Vercel
- Malayalam text renders correctly
- Home screen placeholder works

---

## Phase 2 — Home Screen

### Goal

Build simple three-button home screen.

### Tasks

1. Add three large buttons.
2. Add Malayalam labels.
3. Add routing to:
   - `/snap`
   - `/ask`
   - `/history`
4. Ensure mobile-first layout.
5. Test touch targets.

### Exit Criteria

- User can navigate to three core flows
- No clutter
- Buttons are large and readable

---

## Phase 3 — Snap & Confirm Photo

### Goal

Allow user to take a photo and confirm before processing.

### Tasks

1. Add camera input.
2. Capture image from phone.
3. Show image preview.
4. Add “Read this page” button.
5. Add “Retake photo” button.
6. Compress image before API call.
7. Store image in page state.

### Exit Criteria

- Camera opens on phone
- Photo preview is clear
- User can retake photo
- User can confirm photo

---

## Phase 4 — AI Tutor API

### Goal

Create server-side AI streaming endpoint.

### Tasks

1. Create `/api/tutor/route.ts`.
2. Accept:
   - user text
   - image base64
   - conversation history
3. Add provider abstraction.
4. Add selected provider implementation.
5. Add system prompt.
6. Stream response to frontend.
7. Add Malayalam error handling.

### Exit Criteria

- API streams Malayalam response
- API key stays server-side
- Errors return Malayalam message
- Provider can be swapped through environment variables

---

## Phase 5 — Render Explanation

### Goal

Show streamed explanation in readable Malayalam.

### Tasks

1. Send confirmed photo to API.
2. Show loading state.
3. Render streamed AI output.
4. Show action buttons after response:
   - Quiz me
   - Ask more
   - I understood
   - I did not understand
5. Save conversation in state.

### Exit Criteria

- User gets explanation from photo
- Response appears progressively
- UI remains readable
- Follow-up actions appear

---

## Phase 6 — Follow-Up Questions

### Goal

Allow user to ask questions about the same page.

### Tasks

1. Add text input below explanation.
2. Add send button.
3. Send full session history to API.
4. Preserve image context.
5. Add “New page” button to reset.

### Exit Criteria

- Follow-up question works
- AI remembers current page context
- User can reset to new page

---

## Phase 7 — Voice Input

### Goal

Allow Malayalam voice input.

### Tasks

1. Add microphone button.
2. Use Web Speech API.
3. Set language to `ml-IN`.
4. Show listening state.
5. Show recognized text before sending.
6. Let user edit recognized text.
7. Handle unsupported browser gracefully.

### Exit Criteria

- User can speak Malayalam question
- Recognized text appears
- User confirms before sending
- Fallback text input works

---

## Phase 8 — Voice Output

### Goal

Allow user to listen to AI answers.

### Tasks

1. Add speaker button near AI replies.
2. Use browser SpeechSynthesis.
3. Select Malayalam voice if available.
4. Add stop button while speaking.
5. Hide or disable if not supported.

### Exit Criteria

- AI answer can be read aloud
- User can stop playback
- Unsupported TTS does not break app

---

## Phase 9 — Ask a Doubt Page

### Goal

Build standalone doubt asking flow without photo.

### Tasks

1. Create `/ask` page.
2. Add voice/text question input.
3. Reuse same tutor API.
4. Render answer.
5. Add speaker button.
6. Add “Ask another doubt” action.

### Exit Criteria

- User can ask general Sanskrit doubt
- AI replies in Malayalam
- Voice input works if supported

---

## Phase 10 — Quiz Mode

### Goal

Generate small quizzes from current material.

### Tasks

1. Add “Quiz me” button.
2. Send current context to AI with quiz instruction.
3. Ask for 3–5 questions.
4. Render one question at a time.
5. Capture answer by voice or text.
6. Send answer for evaluation.
7. Show feedback and encouragement.
8. Save quiz attempt.

### Exit Criteria

- Quiz uses current page/topic
- Questions are simple
- Feedback is clear
- User can continue to next question

---

## Phase 11 — Local History

### Goal

Save and revisit study sessions.

### Tasks

1. Add IndexedDB with Dexie.
2. Save session with:
   - date
   - title
   - photo thumbnail
   - transcript
   - quiz attempts
3. Build `/history` page.
4. Group sessions by date.
5. Add session detail view.
6. Add delete session.
7. Add delete all history.

### Exit Criteria

- Sessions save locally
- User can open past lesson
- User can delete history
- App does not require login

---

## Phase 12 — PWA Setup

### Goal

Make app installable on phone.

### Tasks

1. Add manifest.
2. Add app icon.
3. Add theme color.
4. Add iOS PWA meta tags.
5. Test “Add to Home Screen”.
6. Confirm app opens like standalone app.

### Exit Criteria

- App installs on phone
- App icon appears
- App opens without browser chrome where supported

---

## Phase 13 — Polish and Real User Testing

### Goal

Watch the real user use the app and fix friction.

### Tasks

1. Give app to user without explaining too much.
2. Watch where she hesitates.
3. Note confusing labels.
4. Note font/readability issues.
5. Note voice issues.
6. Note photo capture issues.
7. Simplify screens.
8. Print one-page Malayalam usage guide.

### Exit Criteria

- User can complete core flows independently
- No major confusion
- App feels calm and reliable

---

# 23. Vibecoding Prompts

Use these prompts one at a time in Claude Code, Cursor, Windsurf, or another coding agent.

Do not paste all prompts at once.

After each prompt:

1. Review code.
2. Run app.
3. Test manually.
4. Commit working changes.
5. Then move to the next prompt.

---

## Prompt 1 — Create Project

```text
Create a new Next.js app called sanskrit-tutor using TypeScript, Tailwind CSS, and the App Router.

Requirements:
- Use a clean mobile-first layout.
- Configure Tailwind.
- Add a base app layout.
- Add support for Malayalam-friendly font rendering using Noto Sans Malayalam if possible.
- Set default base font size to 20px.
- Create a simple home page placeholder with the Malayalam title "സംസ്കൃതം ഗുരു".
- Keep code simple and production-readable.
- Do not add authentication.
- Do not add external database yet.

After creating the project, explain the folder structure and how to run it locally.
```

---

## Prompt 2 — Add Localization File

```text
Add a Malayalam localization file at /lib/i18n/ml.ts.

It should export all Malayalam UI labels used by the app.

Include labels for:
- Home
- Snap a page
- Ask a doubt
- Past lessons
- Read this page
- Retake photo
- New page
- Quiz me
- Ask more
- I understood
- I did not understand
- Send
- Speak
- Listen
- Stop
- Reading
- Listening
- Try again
- Photo unclear
- Delete history
- Today
- Yesterday

Refactor the home page to use this localization file instead of hardcoded labels.
```

---

## Prompt 3 — Build Home Screen

```text
Build the main home screen for the Sanskrit Tutor app.

Requirements:
- Three large stacked buttons:
  1. പേജ് ഫോട്ടോ എടുക്കുക
  2. സംശയം ചോദിക്കുക
  3. പഴയ പാഠങ്ങൾ
- Each button should be at least 80px tall.
- Use large readable Malayalam text.
- Add simple icons if available, but every icon must have text.
- Route buttons to:
  - /snap
  - /ask
  - /history
- Mobile-first design.
- High contrast.
- Calm visual style.
- No clutter.
```

---

## Prompt 4 — Build Snap Page with Camera Input

```text
Create /app/snap/page.tsx.

Requirements:
- Show title in Malayalam.
- Add a large camera input:
  <input type="file" accept="image/*" capture="environment" />
- When user selects/takes a photo, show a preview.
- Do not send the photo immediately.
- Show two large buttons after preview:
  - ഈ പേജ് വായിക്കുക
  - വീണ്ടും ഫോട്ടോ എടുക്കുക
- Add a "Back to home" link.
- Keep the page mobile-first and elderly-friendly.
- Use 20px+ font size and large touch targets.
```

---

## Prompt 5 — Add Image Compression Utility

```text
Create a utility at /lib/image/compressImage.ts.

Requirements:
- Accept an image File.
- Resize/compress it in the browser.
- Return base64 string and a thumbnail URL.
- Limit max width to around 1400px.
- Use JPEG quality around 0.75.
- Handle errors safely.
- Keep the function typed with TypeScript.

Use this utility in the snap page before sending the image to the API.
```

---

## Prompt 6 — Create AI Provider Types

```text
Create /lib/ai/types.ts.

Define:
- TutorMessage
- TutorRequest
- TutorModelProvider

TutorRequest should support:
- userText?: string
- imageBase64?: string
- history: TutorMessage[]

TutorModelProvider should expose:
- streamTutorResponse(input: TutorRequest): AsyncIterable<string>

Keep the interface provider-neutral so we can swap Gemini, OpenAI, Anthropic, or DeepSeek later.
```

---

## Prompt 7 — Add Tutor System Prompt

```text
Create /lib/prompts/sanskritTutor.ts.

Export a constant SANSKRIT_TUTOR_SYSTEM_PROMPT.

Use this prompt exactly:

[PASTE THE SYSTEM PROMPT FROM SECTION 18 OF THIS DOCUMENT]

Also export a helper function that builds model messages from:
- system prompt
- conversation history
- latest user text
- optional image

Keep it provider-neutral as much as possible.
```

---

## Prompt 8 — Create AI Provider Adapter

```text
Create an AI provider adapter structure.

Requirements:
- Read AI_PROVIDER, AI_MODEL, AI_API_KEY, and AI_BASE_URL from environment variables.
- Create /lib/ai/index.ts that exports getTutorProvider().
- Create one initial provider implementation.
- Keep the provider easy to replace later.
- Do not expose API keys to the browser.
- If provider is missing or misconfigured, throw a clear server-side error.
```

---

## Prompt 9 — Build Tutor API Route

```text
Create /app/api/tutor/route.ts.

Requirements:
- Accept POST JSON:
  {
    userText?: string,
    imageBase64?: string,
    history: [...]
  }
- Use getTutorProvider() to stream a tutor response.
- Return a streaming text response.
- Handle errors with a simple Malayalam error message:
  "ഇപ്പോൾ ഉത്തരം നൽകാൻ കഴിഞ്ഞില്ല. വീണ്ടും ശ്രമിക്കൂ."
- Do not log image base64.
- Do not expose API key.
```

---

## Prompt 10 — Connect Snap Page to Tutor API

```text
Connect /app/snap/page.tsx to /api/tutor.

Requirements:
- When user taps "ഈ പേജ് വായിക്കുക", compress image and send it to the API.
- Show loading state: "വായിക്കുന്നു... കുറച്ച് സമയം കാത്തിരിക്കൂ"
- Stream and render the AI response as it arrives.
- Keep response text large and readable.
- After response completes, show action buttons:
  - എനിക്ക് ക്വിസ് ചെയ്യൂ
  - കൂടുതൽ ചോദിക്കുക
  - മനസ്സിലായി
  - മനസ്സിലായില്ല
- Store conversation in React state.
- Handle API errors with Malayalam message.
```

---

## Prompt 11 — Add Follow-Up Questions on Snap Page

```text
Add follow-up Q&A to the snap page.

Requirements:
- After explanation, show a text input and send button.
- User can ask a follow-up question about the same page.
- Send the current conversation history to /api/tutor.
- Preserve page context.
- Show user question and AI answer in the transcript.
- Add a "പുതിയ പേജ്" button that clears image, response, and history.
```

---

## Prompt 12 — Add Voice Input Component

```text
Create a reusable VoiceInput component.

Requirements:
- Use Web Speech API / webkitSpeechRecognition.
- Set language to ml-IN.
- Show "ഞാൻ കേൾക്കുന്നു..." while listening.
- Return recognized text to parent component.
- Do not auto-submit recognized text.
- Let the user review/edit before sending.
- If browser does not support speech recognition, show a Malayalam fallback message and keep text input usable.
- Make the microphone button large and easy to tap.
```

---

## Prompt 13 — Use Voice Input in Snap Page

```text
Use the VoiceInput component in the snap page follow-up question area.

Requirements:
- Place microphone button next to the text input.
- When speech is recognized, fill the input.
- User must tap send manually.
- Ensure this works in mobile layout.
- Keep all labels in Malayalam.
```

---

## Prompt 14 — Build Ask a Doubt Page

```text
Create /app/ask/page.tsx.

Requirements:
- User can ask a Sanskrit doubt without taking a photo.
- Provide a large text input.
- Provide Malayalam voice input using VoiceInput component.
- Send question to /api/tutor.
- Stream Malayalam response.
- Show response in large readable text.
- Add "Ask another doubt" action.
- Add back to home link.
- Reuse existing tutor API and system prompt.
```

---

## Prompt 15 — Add Text-to-Speech Component

```text
Create a reusable SpeakButton component.

Requirements:
- Use window.speechSynthesis.
- Try to select a Malayalam voice if available.
- Speak the provided Malayalam text.
- Show stop button while speaking.
- If speech synthesis is unavailable, hide the button or show graceful fallback.
- Keep button large enough for older users.
- Use this component next to AI replies.
```

---

## Prompt 16 — Add Quiz Mode

```text
Add quiz mode to the snap page.

Requirements:
- When user taps "എനിക്ക് ക്വിസ് ചെയ്യൂ", send current context to /api/tutor with instruction:
  "ഇപ്പോൾ പഠിച്ച ഭാഗത്തിൽ നിന്ന് 3 ലളിതമായ ചോദ്യങ്ങൾ ചോദിക്കൂ."
- Render quiz questions one at a time.
- Allow user to answer with text or voice.
- Send each answer back to the AI for evaluation.
- Show whether the answer is correct.
- Show one-line Malayalam explanation.
- Encourage the learner respectfully.
- Save quiz attempts in page state.
```

---

## Prompt 17 — Add IndexedDB Local Storage

```text
Add local-first history using IndexedDB.

Use Dexie.js if appropriate.

Requirements:
- Create /lib/db.ts.
- Store study sessions with:
  - id
  - createdAt
  - updatedAt
  - title
  - image thumbnail if available
  - messages/transcript
  - quiz attempts
- Save a session after AI explanation and after follow-up updates.
- Do not use Supabase yet.
- Keep all data local to the browser.
```

---

## Prompt 18 — Build History Page

```text
Create /app/history/page.tsx.

Requirements:
- Read sessions from IndexedDB.
- Group sessions by date.
- Show Malayalam date labels.
- Show lesson title or fallback title.
- Show thumbnail if available.
- Let user tap a session to view full transcript.
- Show empty state:
  "പഴയ പാഠങ്ങൾ ഒന്നും ഇല്ല."
- Add delete session option.
- Add delete all history option with confirmation.
- Keep UX simple and elderly-friendly.
```

---

## Prompt 19 — Add PWA Support

```text
Add Progressive Web App support.

Requirements:
- Add manifest.json.
- App name: സംസ്കൃതം ഗുരു
- Short name: സംസ്കൃതം
- Add theme color.
- Add app icons.
- Add iOS meta tags for Add to Home Screen.
- Ensure app works well in mobile Safari and Chrome.
- Do not add unnecessary service worker complexity unless needed.
```

---

## Prompt 20 — Add Final Polish and Accessibility Pass

```text
Do a final UX and accessibility polish pass.

Requirements:
- Ensure every button has Malayalam text.
- Ensure all important touch targets are large.
- Ensure base font is at least 20px.
- Ensure high contrast.
- Ensure no screen has too many choices.
- Add clear loading, listening, speaking, and error states.
- Ensure API errors show Malayalam recovery messages.
- Ensure photo unclear flow exists.
- Ensure "new page" reset is clear.
- Ensure history delete has confirmation.
- Ensure app can be used without login.
- Keep the design calm, simple, and respectful.
```

---

# 24. Suggested File Structure

```text
sanskrit-tutor/
  app/
    api/
      tutor/
        route.ts
    ask/
      page.tsx
    history/
      page.tsx
      [id]/
        page.tsx
    snap/
      page.tsx
    globals.css
    layout.tsx
    page.tsx

  components/
    HomeButton.tsx
    VoiceInput.tsx
    SpeakButton.tsx
    LoadingMessage.tsx
    ErrorMessage.tsx
    PhotoPreview.tsx
    ChatTranscript.tsx
    QuizCard.tsx

  lib/
    ai/
      index.ts
      types.ts
      providers/
        gemini.ts
        openaiCompatible.ts
    db.ts
    i18n/
      ml.ts
    image/
      compressImage.ts
    prompts/
      sanskritTutor.ts
    utils.ts

  public/
    manifest.json
    icons/
      icon-192.png
      icon-512.png

  .env.local
  package.json
  README.md
```

---

# 25. Manual QA Checklist

## Home

- [ ] Malayalam title renders correctly
- [ ] Three buttons are visible
- [ ] Buttons are large enough
- [ ] Buttons route correctly
- [ ] Page has no clutter

## Snap

- [ ] Camera opens on phone
- [ ] Photo preview works
- [ ] Retake works
- [ ] Read page works
- [ ] Loading state appears
- [ ] AI response streams
- [ ] Malayalam text is readable
- [ ] Follow-up question works
- [ ] New page resets context

## Voice

- [ ] Microphone button appears
- [ ] Listening state appears
- [ ] Malayalam speech becomes text
- [ ] Text can be edited
- [ ] Text is not auto-sent
- [ ] Unsupported browser fallback works

## AI

- [ ] Answers in Malayalam
- [ ] Does not give long lectures
- [ ] Explains shlokas step by step
- [ ] Says not sure when uncertain
- [ ] Does not invent rules
- [ ] Asks for better photo if unclear

## Quiz

- [ ] Quiz uses current page
- [ ] Questions are simple
- [ ] One question shown at a time
- [ ] Answer feedback works
- [ ] Encouragement is respectful

## History

- [ ] Session saves
- [ ] Session opens
- [ ] Sessions grouped by date
- [ ] Empty state works
- [ ] Delete session works
- [ ] Delete all confirmation works

## PWA

- [ ] Manifest exists
- [ ] App installs on phone
- [ ] Icon appears
- [ ] App opens correctly
- [ ] Malayalam still renders in installed mode

## Security

- [ ] API key not visible in browser
- [ ] Image base64 not logged
- [ ] Full prompts not logged in production
- [ ] Delete history works

---

# 26. README Starter

````md
# Sanskrit Tutor App

A Malayalam-first AI Sanskrit tutor for an older learner preparing for a Sanskrit exam.

## Core Features

- Snap a Sanskrit textbook page and get Malayalam explanation
- Ask doubts by voice or text
- Get small quizzes from the current page
- Revisit past lessons
- Local-first history

## Tech Stack

- Next.js
- TypeScript
- Tailwind CSS
- IndexedDB
- AI provider adapter
- Browser Speech APIs
- PWA

## Development

```bash
npm install
npm run dev
```

## Environment Variables

```env
AI_PROVIDER=
AI_MODEL=
AI_API_KEY=
AI_BASE_URL=
```

## Product Principle

The AI should behave like a patient Malayalam-speaking Sanskrit teacher, not a generic chatbot.
````

---

# 27. Final Build Philosophy

Build the smallest version that helps the learner study one page better.

Do not chase features.

The app should first become excellent at this loop:

```text
Take photo
→ Explain simply in Malayalam
→ Answer follow-up doubt
→ Ask 3 questions
→ Save lesson
```

Once this loop feels reliable, the app is already valuable.

The best version of this app is not the most feature-rich version.

The best version is the one she opens every morning without thinking.
