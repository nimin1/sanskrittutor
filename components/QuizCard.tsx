"use client";

import { useState } from "react";
import { IconCheck, IconSend } from "@/components/Icons";
import { VoiceInput } from "@/components/VoiceInput";
import { ml } from "@/lib/i18n/ml";

export function QuizCard({
  question, busy, feedback, onSubmit,
}: {
  question: string;
  busy: boolean;
  feedback: string;
  onSubmit: (answer: string) => void;
}) {
  const [answer, setAnswer] = useState("");

  function submit() {
    if (!answer.trim()) return;
    onSubmit(answer.trim());
    setAnswer("");
  }

  return (
    <article className="quiz">
      <div className="quiz__kicker">{ml.history.quizzes}</div>
      <p className="quiz__question">{question}</p>
      <div className="stack stack--md">
        <VoiceInput onText={setAnswer} />
        <textarea
          className="field field--textarea"
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          placeholder="ഉത്തരം ഇവിടെ എഴുതുക..."
        />
        <button className="btn btn--primary btn--block" disabled={busy || !answer.trim()} onClick={submit}>
          <IconSend size={16} /> {ml.common.send}
        </button>
        {feedback ? (
          <div className="alert alert--success">
            <IconCheck size={18} />
            <span>{feedback}</span>
          </div>
        ) : null}
      </div>
    </article>
  );
}
