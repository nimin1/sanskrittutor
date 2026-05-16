"use client";

import { useState } from "react";
import { IconCheck, IconCopy } from "@/components/Icons";
import { SpeakButton } from "@/components/SpeakButton";
import type { TutorChatMessage } from "@/lib/db";
import { ml } from "@/lib/i18n/ml";

export function ChatTranscript({ messages }: { messages: TutorChatMessage[] }) {
  if (messages.length === 0) return null;

  function spokenText(content: string) {
    const match = content.match(/<speak>([\s\S]*?)<\/speak>/i);
    return match ? match[1].trim() : content;
  }
  function displayText(content: string) {
    return content.replace(/<\/?speak>/gi, "");
  }

  return (
    <div className="chat">
      {messages.map((message) => (
        <Turn
          key={message.id}
          message={message}
          body={displayText(message.content)}
          speak={spokenText(message.content)}
        />
      ))}
    </div>
  );
}

function Turn({
  message,
  body,
  speak,
}: {
  message: TutorChatMessage;
  body: string;
  speak: string;
}) {
  const [copied, setCopied] = useState(false);
  const isUser = message.role === "user";

  async function copy() {
    try {
      await navigator.clipboard.writeText(body);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch { /* ignore */ }
  }

  return (
    <article className={`turn ${isUser ? "turn--user" : "turn--assistant"}`}>
      <header className="turn__label">
        <span className="turn__role">{isUser ? "ചോദ്യം" : "ഉത്തരം"}</span>
        <span className="turn__rule" aria-hidden />
      </header>
      <div className="turn__body">{body}</div>
      {!isUser && body ? (
        <div className="turn__actions">
          <SpeakButton text={speak} />
          <button className="btn btn--sm btn--ghost" type="button" onClick={copy}>
            {copied ? <IconCheck size={14} /> : <IconCopy size={14} />}
            {copied ? ml.common.copied : ml.common.copy}
          </button>
        </div>
      ) : null}
    </article>
  );
}
