"use client";

import { useState } from "react";
import { ChatTranscript } from "@/components/ChatTranscript";
import { ErrorMessage } from "@/components/ErrorMessage";
import { IconPlus, IconSend } from "@/components/Icons";
import { LoadingMessage } from "@/components/LoadingMessage";
import { VoiceInput } from "@/components/VoiceInput";
import type { TutorMessage } from "@/lib/ai/types";
import type { TutorChatMessage } from "@/lib/db";
import { ml } from "@/lib/i18n/ml";

export default function AskPage() {
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState<TutorChatMessage[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function sendQuestion() {
    const text = question.trim();
    if (!text) return;
    const userMessage = makeMessage("user", text);
    const assistantMessage = makeMessage("assistant", "");
    const nextMessages = [...messages, userMessage];
    setMessages([...nextMessages, assistantMessage]);
    setQuestion("");
    setBusy(true);
    setError("");

    try {
      const response = await fetch("/api/tutor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userText: text, history: toTutorHistory(messages) }),
      });
      if (!response.ok || !response.body) throw new Error("Tutor API failed.");
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let assistantText = "";
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        assistantText += decoder.decode(value, { stream: true });
        setMessages([...nextMessages, { ...assistantMessage, content: assistantText }]);
      }
    } catch {
      setError(ml.errors.aiFailed);
    } finally {
      setBusy(false);
    }
  }

  function askAnother() {
    setQuestion("");
    setMessages([]);
    setError("");
  }

  return (
    <>
      <header className="page-head">
        <div className="kicker">{ml.ask.kicker}</div>
        <h1 className="headline">{ml.ask.title}</h1>
        <p className="lede">{ml.ask.subtitle}</p>
        <div className="page-head__rule" />
      </header>

      <div className="stack stack--md">
        <VoiceInput onText={setQuestion} />
        <textarea
          className="field field--textarea"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder={ml.ask.placeholder}
        />
        <button className="btn btn--primary" disabled={busy || !question.trim()} onClick={sendQuestion}>
          <IconSend size={16} /> {ml.common.send}
        </button>
      </div>

      <div style={{ marginTop: 32 }} className="stack stack--lg">
        <ErrorMessage message={error} />
        {busy ? <LoadingMessage message={ml.common.pleaseWait} /> : null}
        <ChatTranscript messages={messages} />
        {messages.length > 0 && !busy ? (
          <button className="btn btn--ghost btn--sm" onClick={askAnother}>
            <IconPlus size={14} /> {ml.ask.another}
          </button>
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
