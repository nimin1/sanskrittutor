"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ErrorMessage } from "@/components/ErrorMessage";
import { IconTrash } from "@/components/Icons";
import type { StudySession } from "@/lib/db";
import { deleteAllSessions, deleteSession, getSessions } from "@/lib/db";
import { ml } from "@/lib/i18n/ml";

export default function HistoryPage() {
  const [sessions, setSessions] = useState<StudySession[]>([]);
  const [error, setError] = useState("");

  useEffect(() => { loadSessions(); }, []);

  async function loadSessions() {
    try { setSessions(await getSessions()); }
    catch { setError(ml.errors.network); }
  }

  async function removeAll() {
    if (!confirm(ml.history.deleteAllConfirm)) return;
    await deleteAllSessions();
    await loadSessions();
  }

  async function removeSession(id: string) {
    if (!confirm(ml.history.deleteOneConfirm)) return;
    await deleteSession(id);
    await loadSessions();
  }

  const grouped = useMemo(() => groupByDay(sessions), [sessions]);

  return (
    <>
      <header className="page-head">
        <div className="kicker">{ml.history.kicker}</div>
        <h1 className="headline">{ml.history.title}</h1>
        <p className="lede">{ml.history.subtitle}</p>
        <div className="page-head__rule" />
      </header>

      <ErrorMessage message={error} />

      {sessions.length === 0 ? (
        <div className="empty">
          <div className="empty__title">{ml.history.empty}</div>
          <div className="empty__hint">{ml.history.emptyHint}</div>
        </div>
      ) : (
        <>
          {grouped.map(([label, items], gi) => {
            let index = items.length;
            return (
              <section className="history-group" key={label}>
                <header className="history-group__head">
                  <span className="history-group__date">{label}</span>
                  <span className="history-group__count">{ml.history.sessionCount(items.length)}</span>
                </header>
                <div>
                  {items.map((session) => {
                    const num = index--; // descending count, oldest gets 1 within day
                    void gi;
                    return (
                      <Entry
                        key={session.id}
                        session={session}
                        index={num}
                        onDelete={() => removeSession(session.id)}
                      />
                    );
                  })}
                </div>
              </section>
            );
          })}

          <div style={{ marginTop: 24 }}>
            <button className="btn btn--danger" onClick={removeAll}>
              <IconTrash size={16} /> {ml.history.deleteHistory}
            </button>
          </div>
        </>
      )}
    </>
  );
}

function Entry({
  session, index, onDelete,
}: {
  session: StudySession;
  index: number;
  onDelete: () => void;
}) {
  const time = new Date(session.updatedAt).toLocaleTimeString("ml-IN", {
    hour: "numeric", minute: "2-digit",
  });
  const msgCount = session.messages.length;
  const quizCount = session.quizAttempts?.length ?? 0;

  return (
    <div className="entry">
      <span className="entry__num">{String(index).padStart(2, "0")}</span>
      <div className="entry__body">
        <Link href={`/history/${session.id}`} className="entry__title">
          {session.title || ml.history.fallbackTitle}
        </Link>
        <div className="entry__meta">
          <span>{time}</span>
          <span>·</span>
          <span>{ml.history.messageCount(msgCount)}</span>
          {quizCount > 0 ? (
            <>
              <span>·</span>
              <span className="entry__meta-tag">{ml.history.quizCount(quizCount)}</span>
            </>
          ) : null}
        </div>
      </div>
      <div className="entry__actions">
        <button
          type="button"
          className="btn btn--sm btn--ghost btn--icon"
          onClick={onDelete}
          aria-label={ml.common.delete}
          title={ml.common.delete}
        >
          <IconTrash size={14} />
        </button>
      </div>
    </div>
  );
}

function groupByDay(sessions: StudySession[]): Array<[string, StudySession[]]> {
  const groups = new Map<string, StudySession[]>();
  for (const session of sessions) {
    const label = dayLabel(session.createdAt);
    groups.set(label, [...(groups.get(label) || []), session]);
  }
  return Array.from(groups.entries());
}

function dayLabel(value: string): string {
  const date = new Date(value);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  if (date.toDateString() === today.toDateString()) return ml.history.today;
  if (date.toDateString() === yesterday.toDateString()) return ml.history.yesterday;
  return date.toLocaleDateString("ml-IN", { day: "numeric", month: "long", year: "numeric" });
}
