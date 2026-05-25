"use client";

import { useRef, useState } from "react";
import { ChatTranscript } from "@/components/ChatTranscript";
import { ErrorMessage } from "@/components/ErrorMessage";
import {
  IconBook, IconCheck, IconLightbulb, IconQuiz, IconRefresh, IconSend,
} from "@/components/Icons";
import { MalayalamTextInput } from "@/components/MalayalamTextInput";
import { PhotoEditor } from "@/components/PhotoEditor";
import { PhotoPreview } from "@/components/PhotoPreview";
import { QuizCard } from "@/components/QuizCard";
import { VoiceInput } from "@/components/VoiceInput";
import type { TutorMessage } from "@/lib/ai/types";
import { primeAudio } from "@/lib/audio/sharedAudio";
import type { QuizAttempt, StudySession, TutorChatMessage } from "@/lib/db";
import { saveSession } from "@/lib/db";
import { compressImage } from "@/lib/image/compressImage";
import { ml } from "@/lib/i18n/ml";

export default function SnapPage() {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [editorSrc, setEditorSrc] = useState("");
  const [previewUrl, setPreviewUrl] = useState("");
  const [imageBase64, setImageBase64] = useState("");
  const [thumbnailUrl, setThumbnailUrl] = useState("");
  const [messages, setMessages] = useState<TutorChatMessage[]>([]);
  const [quizAttempts, setQuizAttempts] = useState<QuizAttempt[]>([]);
  const [question, setQuestion] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [sessionId, setSessionId] = useState("");
  const [quizQuestion, setQuizQuestion] = useState("");
  const [quizFeedback, setQuizFeedback] = useState("");
  const [autoSpeakId, setAutoSpeakId] = useState<string | null>(null);

  async function handleFile(file?: File) {
    if (!file) return;
    setError("");
    setMessages([]);
    setQuizAttempts([]);
    setQuizQuestion("");
    setQuizFeedback("");
    setPreviewUrl("");
    setImageBase64("");
    setThumbnailUrl("");
    /* Send the freshly captured photo into the editor first.
       compressImage happens after the user confirms their crop/edits. */
    setEditorSrc(URL.createObjectURL(file));
  }

  async function confirmEdit(edited: Blob) {
    try {
      const file = new File([edited], "edited.jpg", { type: edited.type || "image/jpeg" });
      const objectUrl = URL.createObjectURL(edited);
      setPreviewUrl(objectUrl);
      setEditorSrc("");
      const compressed = await compressImage(file);
      setImageBase64(compressed.base64);
      setThumbnailUrl(compressed.thumbnailUrl);
      setSessionId(crypto.randomUUID());
    } catch {
      setError(ml.snap.photoUnclear);
    }
  }

  function cancelEdit() {
    setEditorSrc("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function readPage() {
    if (!imageBase64) return;
    primeAudio();
    await askTutor({
      userText: "ഈ പേജ് വായിച്ച് മലയാളത്തിൽ ലളിതമായി വിശദീകരിക്കൂ.",
      imageBase64,
      nextMessages: [],
    });
  }

  async function sendFollowUp(text = question) {
    if (!text.trim()) return;
    primeAudio();
    const userMessage = makeMessage("user", text.trim());
    const nextMessages = [...messages, userMessage];
    setMessages(nextMessages);
    setQuestion("");
    await askTutor({ userText: text.trim(), imageBase64, nextMessages });
  }

  async function startQuiz() {
    setQuizFeedback("");
    setQuizQuestion("");
    await askTutor({
      userText: ml.snap.quizInstruction,
      imageBase64,
      nextMessages: messages,
      onText: setQuizQuestion,
      saveAsMessage: false,
    });
  }

  async function submitQuizAnswer(answer: string) {
    if (!quizQuestion.trim()) return;
    setQuizFeedback("");
    const prompt = `ചോദ്യം: ${quizQuestion}\nവിദ്യാർത്ഥിയുടെ ഉത്തരം: ${answer}\nഇത് ശരിയാണോ എന്ന് മലയാളത്തിൽ ഒറ്റവരിയിൽ വിശദീകരിച്ച് പ്രോത്സാഹിപ്പിക്കുക.`;
    let feedback = "";
    await askTutor({
      userText: prompt,
      imageBase64,
      nextMessages: messages,
      onText: (text) => { feedback = text; setQuizFeedback(text); },
      saveAsMessage: false,
    });
    const attempt: QuizAttempt = {
      id: crypto.randomUUID(),
      question: quizQuestion,
      userAnswer: answer,
      aiFeedback: feedback,
      createdAt: new Date().toISOString(),
    };
    const nextAttempts = [...quizAttempts, attempt];
    setQuizAttempts(nextAttempts);
    await persist(messages, nextAttempts);
  }

  async function askTutor({
    userText, imageBase64: image, nextMessages, onText, saveAsMessage = true,
  }: {
    userText: string;
    imageBase64?: string;
    nextMessages: TutorChatMessage[];
    onText?: (text: string) => void;
    saveAsMessage?: boolean;
  }) {
    setBusy(true);
    setError("");
    let assistantText = "";
    const assistantMessage = makeMessage("assistant", "");
    if (saveAsMessage) {
      setMessages([...nextMessages, assistantMessage]);
      setAutoSpeakId(null);
    }

    try {
      const response = await fetch("/api/tutor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userText, imageBase64: image, history: toTutorHistory(nextMessages) }),
      });
      if (!response.ok || !response.body) throw new Error("Tutor API failed.");
      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        assistantText += decoder.decode(value, { stream: true });
        if (onText) onText(assistantText);
        if (saveAsMessage) setMessages([...nextMessages, { ...assistantMessage, content: assistantText }]);
      }

      if (saveAsMessage) {
        const finalMessages = [...nextMessages, { ...assistantMessage, content: assistantText }];
        setMessages(finalMessages);
        if (assistantText.trim()) setAutoSpeakId(assistantMessage.id);
        await persist(finalMessages, quizAttempts);
      }
    } catch {
      setError(ml.errors.aiFailed);
    } finally {
      setBusy(false);
    }
  }

  async function persist(nextMessages: TutorChatMessage[], nextAttempts: QuizAttempt[]) {
    if (nextMessages.length === 0) return;
    const now = new Date().toISOString();
    const session: StudySession = {
      id: sessionId || crypto.randomUUID(),
      createdAt: nextMessages[0]?.createdAt || now,
      updatedAt: now,
      title: nextMessages.find((m) => m.role === "assistant")?.content.slice(0, 60) || ml.history.fallbackTitle,
      imageThumbnail: thumbnailUrl,
      messages: nextMessages,
      quizAttempts: nextAttempts,
    };
    setSessionId(session.id);
    try { await saveSession(session); } catch { setError(ml.errors.saveFailed); }
  }

  function resetPage() {
    setEditorSrc("");
    setPreviewUrl("");
    setImageBase64("");
    setThumbnailUrl("");
    setMessages([]);
    setQuizAttempts([]);
    setQuestion("");
    setError("");
    setQuizQuestion("");
    setQuizFeedback("");
    setSessionId("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  const editing = Boolean(editorSrc);
  const hasPreview = Boolean(previewUrl);
  const hasResponse = messages.length > 0;

  return (
    <>
      <header className="page-head">
        <div className="kicker">{ml.snap.kicker}</div>
        <h1 className="headline">{ml.snap.title}</h1>
        <p className="lede">{ml.snap.subtitle}</p>
        <div className="page-head__rule" />
      </header>

      <div className="stack stack--lg">
        {editing ? (
          <section className="stack stack--sm">
            <div className="section-eyebrow">{ml.snap.editor.title}</div>
            <p className="meta">{ml.snap.editor.hint}</p>
            <PhotoEditor
              src={editorSrc}
              onConfirm={confirmEdit}
              onCancel={cancelEdit}
              busy={busy}
            />
          </section>
        ) : !hasPreview ? (
          <label className="capture">
            <span className="capture__mark"><IconBook size={26} /></span>
            <span>
              <span className="capture__title">{ml.snap.dropTitle}</span>
              <div className="capture__hint">{ml.snap.dropHint}</div>
            </span>
            <span className="capture__cue">{ml.snap.captureCue}</span>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              aria-label={ml.snap.dropTitle}
              onChange={(e) => handleFile(e.target.files?.[0])}
            />
          </label>
        ) : (
          <>
            <PhotoPreview src={previewUrl} alt={ml.snap.title} />
            <div className="row" style={{ gap: 12 }}>
              <button className="btn btn--primary" style={{ flex: 2 }} disabled={busy || !imageBase64} onClick={readPage}>
                <IconCheck size={16} /> {ml.snap.readPage}
              </button>
              <button className="btn btn--secondary" style={{ flex: 1 }} disabled={busy} onClick={resetPage}>
                <IconRefresh size={16} /> {ml.snap.retake}
              </button>
            </div>
          </>
        )}

        <ErrorMessage message={error} />

        {busy && !quizQuestion ? (
          <div className="thinking"><span className="thinking__pen" aria-hidden /> {ml.snap.reading}</div>
        ) : null}

        {hasResponse ? <ChatTranscript messages={messages} autoSpeakMessageId={autoSpeakId} /> : null}

        {hasResponse ? (
          <section>
            <div className="quick-actions">
              <div className="quick-actions__label">{ml.snap.actionsLabel}</div>
              <button className="quick-link" disabled={busy} onClick={startQuiz}>
                <IconQuiz size={14} /> {ml.snap.quizMe}
              </button>
              <button className="quick-link" disabled={busy} onClick={() => sendFollowUp("കൂടുതൽ ലളിതമായി പറയാമോ?")}>
                <IconLightbulb size={14} /> {ml.snap.askMore}
              </button>
              <button className="quick-link" disabled={busy} onClick={() => sendFollowUp("മനസ്സിലായി. ഇനി ഒരു ചെറിയ ചോദ്യം ചോദിക്കൂ.")}>
                <IconCheck size={14} /> {ml.snap.understood}
              </button>
              <button className="quick-link" disabled={busy} onClick={() => sendFollowUp("മനസ്സിലായില്ല. കൂടുതൽ ലളിതമായി വിശദീകരിക്കൂ.")}>
                <IconRefresh size={14} /> {ml.snap.notUnderstood}
              </button>
            </div>

            {quizQuestion ? (
              <div style={{ marginTop: 24 }}>
                <QuizCard question={quizQuestion} busy={busy} feedback={quizFeedback} onSubmit={submitQuizAnswer} />
              </div>
            ) : null}

            <section style={{ marginTop: 32 }} className="stack">
              <div className="section-eyebrow">{ml.snap.followUpLabel}</div>
              <VoiceInput onText={setQuestion} />
              <MalayalamTextInput
                value={question}
                onChange={setQuestion}
                placeholder={ml.snap.questionPlaceholder}
              />
              <div className="row" style={{ gap: 12 }}>
                <button className="btn btn--primary" style={{ flex: 1 }} disabled={busy || !question.trim()} onClick={() => sendFollowUp()}>
                  <IconSend size={16} /> {ml.common.send}
                </button>
                <button className="btn btn--ghost" disabled={busy} onClick={resetPage}>
                  {ml.snap.newPage}
                </button>
              </div>
            </section>
          </section>
        ) : null}
      </div>
    </>
  );
}

function makeMessage(role: "user" | "assistant", content: string): TutorChatMessage {
  return { id: crypto.randomUUID(), role, type: "text", content, createdAt: new Date().toISOString() };
}
function toTutorHistory(messages: TutorChatMessage[]): TutorMessage[] {
  return messages.map((m) => ({ role: m.role, content: m.content }));
}
