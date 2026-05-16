"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ChatTranscript } from "@/components/ChatTranscript";
import { IconArrowLeft, IconTrash } from "@/components/Icons";
import type { StudySession } from "@/lib/db";
import { deleteSession, getSession } from "@/lib/db";
import { ml } from "@/lib/i18n/ml";

export default function HistoryDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [session, setSession] = useState<StudySession | null>(null);

  useEffect(() => {
    if (!params.id) return;
    getSession(params.id).then((value) => setSession(value || null));
  }, [params.id]);

  async function remove() {
    if (!params.id || !confirm(ml.history.deleteOneConfirm)) return;
    await deleteSession(params.id);
    router.push("/history");
  }

  if (!session) {
    return (
      <>
        <Link href="/history" className="btn btn--ghost btn--sm" style={{ marginBottom: 20 }}>
          <IconArrowLeft size={14} /> {ml.history.title}
        </Link>
        <div className="empty">
          <div className="empty__title">{ml.history.empty}</div>
        </div>
      </>
    );
  }

  const updated = new Date(session.updatedAt);
  const dateLabel = updated.toLocaleDateString("ml-IN", {
    day: "numeric", month: "long", year: "numeric",
  });
  const timeLabel = updated.toLocaleTimeString("ml-IN", {
    hour: "numeric", minute: "2-digit",
  });

  return (
    <>
      <Link href="/history" className="btn btn--ghost btn--sm" style={{ marginBottom: 20 }}>
        <IconArrowLeft size={14} /> {ml.history.title}
      </Link>

      <header className="page-head">
        <div className="kicker">{dateLabel} · {timeLabel}</div>
        <h1 className="headline">{session.title || ml.history.fallbackTitle}</h1>
        <div className="page-head__rule" />
      </header>

      <div className="stack stack--lg">
        {session.imageThumbnail ? (
          <figure className="figure">
            <img className="figure__img" src={session.imageThumbnail} alt={ml.snap.title} />
          </figure>
        ) : null}

        <section>
          <div className="section-eyebrow">{ml.history.transcript}</div>
          <ChatTranscript messages={session.messages} />
        </section>

        {session.quizAttempts?.length ? (
          <section>
            <div className="section-eyebrow">
              {ml.history.quizzes} · {session.quizAttempts.length}
            </div>
            <div className="stack">
              {session.quizAttempts.map((attempt, i) => (
                <article className="quiz" key={attempt.id} style={{ padding: 22 }}>
                  <div className="quiz__kicker">
                    {String(i + 1).padStart(2, "0")} · {ml.history.quizzes}
                  </div>
                  <p className="quiz__question" style={{ fontSize: 18, marginBottom: 16 }}>
                    {attempt.question}
                  </p>
                  <div className="stack stack--sm">
                    <div>
                      <div className="meta" style={{ marginBottom: 4 }}>നിങ്ങളുടെ ഉത്തരം</div>
                      <p style={{ color: "var(--ink-2)", fontStyle: "italic", paddingLeft: 14, borderLeft: "2px solid var(--rule-strong)" }}>
                        {attempt.userAnswer}
                      </p>
                    </div>
                    <div>
                      <div className="meta" style={{ marginBottom: 4 }}>ഗുരുവിന്റെ പ്രതികരണം</div>
                      <p style={{ color: "var(--ink)" }}>{attempt.aiFeedback}</p>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </section>
        ) : null}

        <div>
          <button className="btn btn--danger" onClick={remove}>
            <IconTrash size={16} /> {ml.common.delete}
          </button>
        </div>
      </div>
    </>
  );
}
