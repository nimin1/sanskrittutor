"use client";

import { Fragment, useState } from "react";
import { IconCheck, IconCopy, IconInfo, IconWarning } from "@/components/Icons";
import { SpeakButton } from "@/components/SpeakButton";
import type { TutorChatMessage } from "@/lib/db";
import { ml } from "@/lib/i18n/ml";

export function ChatTranscript({
  messages,
  autoSpeakMessageId,
}: {
  messages: TutorChatMessage[];
  autoSpeakMessageId?: string | null;
}) {
  if (messages.length === 0) return null;

  function spokenText(content: string) {
    // Speak the entire answer. Older messages may still contain <speak> tags
    // from the previous prompt design — strip them so they aren't read aloud.
    const stripped = content.replace(/<\/?speak>/gi, "");
    return stripUncertaintyTags(stripped).trim();
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
          autoSpeak={!!autoSpeakMessageId && message.id === autoSpeakMessageId}
        />
      ))}
    </div>
  );
}

/* ── Uncertainty parsing ─────────────────────────────────────
   The tutor wraps hedged claims in 「ഉറപ്പില്ല: ...」 and full
   refusals in 「അറിയില്ല」. We split the text into segments and
   render each kind with a distinct visual treatment, so the
   learner instantly sees what the AI is sure vs. unsure about.
   ────────────────────────────────────────────────────────── */
type Segment =
  | { kind: "text"; text: string }
  | { kind: "uncertain"; text: string }
  | { kind: "unknown"; text: string };

const UNCERTAIN_RE = /「ഉറപ്പില്ല\s*:?\s*([\s\S]*?)」/g;
const UNKNOWN_RE = /「അറിയില്ല」\s*([^\n「]*)/g;

function parseSegments(content: string): Segment[] {
  const markers: Array<{ start: number; end: number; seg: Segment }> = [];
  for (const m of content.matchAll(UNCERTAIN_RE)) {
    markers.push({
      start: m.index ?? 0,
      end: (m.index ?? 0) + m[0].length,
      seg: { kind: "uncertain", text: (m[1] || "").trim() },
    });
  }
  for (const m of content.matchAll(UNKNOWN_RE)) {
    markers.push({
      start: m.index ?? 0,
      end: (m.index ?? 0) + m[0].length,
      seg: { kind: "unknown", text: (m[1] || "").trim() },
    });
  }
  markers.sort((a, b) => a.start - b.start);

  const segments: Segment[] = [];
  let cursor = 0;
  for (const { start, end, seg } of markers) {
    if (start > cursor) {
      const text = content.slice(cursor, start).trim();
      if (text) segments.push({ kind: "text", text });
    }
    segments.push(seg);
    cursor = end;
  }
  if (cursor < content.length) {
    const text = content.slice(cursor).trim();
    if (text) segments.push({ kind: "text", text });
  }
  return segments.length > 0 ? segments : [{ kind: "text", text: content }];
}

function stripUncertaintyTags(content: string): string {
  return content
    .replace(UNCERTAIN_RE, (_, inner) => inner)
    .replace(UNKNOWN_RE, "")
    .replace(/\s{2,}/g, " ");
}

function Turn({
  message,
  body,
  speak,
  autoSpeak,
}: {
  message: TutorChatMessage;
  body: string;
  speak: string;
  autoSpeak: boolean;
}) {
  const [copied, setCopied] = useState(false);
  const isUser = message.role === "user";
  const segments = isUser ? null : parseSegments(body);

  async function copy() {
    try {
      await navigator.clipboard.writeText(stripUncertaintyTags(body));
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
      <div className="turn__body">
        {segments
          ? segments.map((seg, i) => <SegmentView key={i} segment={seg} />)
          : body}
      </div>
      {!isUser && body ? (
        <div className="turn__actions">
          <SpeakButton text={speak} autoPlay={autoSpeak} />
          <button className="btn btn--sm btn--ghost" type="button" onClick={copy}>
            {copied ? <IconCheck size={14} /> : <IconCopy size={14} />}
            {copied ? ml.common.copied : ml.common.copy}
          </button>
        </div>
      ) : null}
    </article>
  );
}

function SegmentView({ segment }: { segment: Segment }) {
  if (segment.kind === "uncertain") {
    return (
      <span className="hedge hedge--uncertain" role="note" aria-label="AI is not fully certain">
        <IconInfo size={14} />
        <span className="hedge__label">{ml.trust.uncertainLabel}</span>
        <span className="hedge__text">{segment.text}</span>
      </span>
    );
  }
  if (segment.kind === "unknown") {
    return (
      <div className="hedge hedge--unknown" role="note" aria-label="AI does not know the answer">
        <IconWarning size={16} />
        <div>
          <div className="hedge__label">{ml.trust.unknownLabel}</div>
          {segment.text ? <div className="hedge__text">{segment.text}</div> : null}
        </div>
      </div>
    );
  }
  return <Fragment>{segment.text + " "}</Fragment>;
}
