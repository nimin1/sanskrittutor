"use client";

import { useCallback, useRef } from "react";
import type { StudySession, TutorChatMessage } from "@/lib/db";
import { saveSession } from "@/lib/db";
import { ml } from "@/lib/i18n/ml";

/* Owns the lifecycle of a chat-shaped StudySession in IndexedDB.
   sessionId lives in a ref so consecutive persist() calls within one
   conversation update the same record without depending on React's
   render cycle. */
export function useChatSession() {
  const sessionIdRef = useRef("");

  const persist = useCallback(async (messages: TutorChatMessage[]): Promise<void> => {
    if (messages.length === 0) return;
    const last = messages[messages.length - 1];
    if (last.role === "assistant" && !last.content.trim()) return;

    if (!sessionIdRef.current) sessionIdRef.current = crypto.randomUUID();
    const now = new Date().toISOString();
    const firstUserMsg = messages.find((m) => m.role === "user")?.content.trim();
    const session: StudySession = {
      id: sessionIdRef.current,
      createdAt: messages[0]?.createdAt || now,
      updatedAt: now,
      title: firstUserMsg?.slice(0, 60) || ml.history.fallbackTitle,
      messages,
    };
    await saveSession(session);
  }, []);

  const reset = useCallback(() => {
    sessionIdRef.current = "";
  }, []);

  return { persist, reset };
}
