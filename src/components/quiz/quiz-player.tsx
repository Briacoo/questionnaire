"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { QuestionPreview } from "./question-preview";
import { Button } from "@/components/ui/button";
import type { Quiz, Question } from "@/lib/types/database";
import { DEFAULT_QUIZ_SETTINGS } from "@/lib/types/database";

interface QuizPlayerProps {
  quiz: Quiz;
  questions: Question[];
}

type PlayerState = "intro" | "playing" | "finished";

export function QuizPlayer({ quiz: rawQuiz, questions }: QuizPlayerProps) {
  // Merge settings with defaults for backward compatibility
  const quiz = useMemo(
    () => ({ ...rawQuiz, settings: { ...DEFAULT_QUIZ_SETTINGS, ...rawQuiz.settings } }),
    [rawQuiz]
  );
  const [state, setState] = useState<PlayerState>("intro");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, unknown>>({});
  const [startedAt] = useState(() => new Date().toISOString());
  const [score, setScore] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [timeLeft, setTimeLeft] = useState<number | null>(
    quiz.settings.time_limit ? quiz.settings.time_limit * 60 : null
  );

  const [displayQuestions] = useState(() =>
    quiz.settings.shuffle_questions
      ? [...questions].sort(() => Math.random() - 0.5)
      : questions
  );

  const checkAnswer = useCallback((q: Question, userAnswer: unknown): boolean => {
    if (!userAnswer) return false;
    const correct = q.correct_answer;

    if (q.type === "mcq_single" || q.type === "true_false") {
      return String(userAnswer) === String(correct);
    } else if (q.type === "mcq_multiple") {
      const ua = (Array.isArray(userAnswer) ? userAnswer : []).sort();
      const ca = (Array.isArray(correct) ? correct : []).sort();
      return JSON.stringify(ua) === JSON.stringify(ca);
    } else if (q.type === "free_text") {
      return String(userAnswer ?? "").trim().toLowerCase() ===
        String(correct ?? "").trim().toLowerCase();
    } else if (q.type === "scale") {
      return Number(userAnswer) === Number(correct);
    } else if (q.type === "drag_order") {
      // Compare arrays element by element
      const ua = Array.isArray(userAnswer) ? userAnswer : [];
      const ca = Array.isArray(correct) ? correct : [];
      return JSON.stringify(ua) === JSON.stringify(ca);
    } else if (q.type === "matching") {
      // Compare objects: { leftId: rightValue }
      const ua = (userAnswer && typeof userAnswer === "object" && !Array.isArray(userAnswer)) ? userAnswer : {};
      const ca = (correct && typeof correct === "object" && !Array.isArray(correct)) ? correct : {};
      return JSON.stringify(
        Object.entries(ua as Record<string, string>).sort()
      ) === JSON.stringify(
        Object.entries(ca as Record<string, string>).sort()
      );
    }
    return false;
  }, []);

  const handleSubmit = useCallback(async () => {
    setSubmitting(true);
    const supabase = createClient();

    let totalScore = 0;
    const totalPoints = displayQuestions.reduce((s, q) => s + q.points, 0);

    for (const q of displayQuestions) {
      if (checkAnswer(q, answers[q.id])) {
        totalScore += q.points;
      }
    }

    const scorePercent = totalPoints > 0 ? Math.round((totalScore / totalPoints) * 100) : 0;
    const passed = quiz.settings.passing_score
      ? scorePercent >= quiz.settings.passing_score
      : null;

    const { data: submission } = await supabase
      .from("submissions")
      .insert({
        quiz_id: quiz.id,
        participant_name: null,
        participant_info: {},
        score: scorePercent,
        passed,
        started_at: startedAt,
        completed_at: new Date().toISOString(),
        time_spent: Math.round(
          (Date.now() - new Date(startedAt).getTime()) / 1000
        ),
      })
      .select("id")
      .single();

    if (submission) {
      const answerRows = displayQuestions.map((q) => ({
        submission_id: submission.id,
        question_id: q.id,
        response: answers[q.id] ?? null,
        is_correct: checkAnswer(q, answers[q.id]),
        time_spent: 0,
      }));

      await supabase.from("answers").insert(answerRows);
    }

    setScore(scorePercent);
    setState("finished");
    setSubmitting(false);
  }, [answers, displayQuestions, quiz, startedAt, checkAnswer]);

  // Timer - submit is called from the interval callback (not effect body)
  const handleSubmitRef = useRef(handleSubmit);
  useEffect(() => {
    handleSubmitRef.current = handleSubmit;
  }, [handleSubmit]);

  useEffect(() => {
    if (state !== "playing" || timeLeft === null) return;
    if (timeLeft <= 0) return;
    const timer = setInterval(() => {
      setTimeLeft((t) => {
        if (t !== null && t <= 1) {
          // Use setTimeout to call submit outside of setState
          setTimeout(() => handleSubmitRef.current(), 0);
          return 0;
        }
        return t !== null ? t - 1 : null;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [state, timeLeft]);

  function formatTime(seconds: number) {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  }

  // INTRO SCREEN
  if (state === "intro") {
    return (
      <div className="flex h-dvh items-center justify-center bg-background p-4">
        <div className="w-full max-w-md text-center space-y-6">
          <h1 className="text-3xl font-bold text-text-primary">{quiz.title}</h1>
          {quiz.description && (
            <p className="text-text-secondary">{quiz.description}</p>
          )}
          <div className="space-y-2 text-sm text-text-secondary">
            <p>{displayQuestions.length} question{displayQuestions.length > 1 ? "s" : ""}</p>
            {quiz.settings.time_limit && (
              <p>Temps limite : {quiz.settings.time_limit} min</p>
            )}
            {quiz.settings.passing_score && (
              <p>Score minimum : {quiz.settings.passing_score}%</p>
            )}
          </div>
          <Button
            onClick={() => setState("playing")}
            className="rounded-badge bg-accent-blue hover:bg-accent-blue-secondary text-background font-semibold px-8 py-3 text-lg"
          >
            Commencer
          </Button>
        </div>
      </div>
    );
  }

  // FINISHED SCREEN
  if (state === "finished") {
    const passed = quiz.settings.passing_score
      ? (score ?? 0) >= quiz.settings.passing_score
      : null;

    return (
      <div className="flex h-dvh items-center justify-center bg-background p-4">
        <div className="w-full max-w-md text-center space-y-6">
          <div className="text-6xl">{passed === false ? "😔" : "🎉"}</div>
          <h1 className="text-3xl font-bold text-text-primary">
            {passed === false ? "Dommage !" : "Termine !"}
          </h1>
          <div className="rounded-card border border-border-default bg-surface p-6">
            <p className="text-5xl font-bold text-accent-blue">{score}%</p>
            <p className="text-sm text-text-secondary mt-2">Score obtenu</p>
            {quiz.settings.passing_score && (
              <p className={`text-sm mt-1 ${passed ? "text-green-400" : "text-red-400"}`}>
                {passed ? "Reussi" : "Non reussi"} (minimum {quiz.settings.passing_score}%)
              </p>
            )}
          </div>
          {quiz.settings.allow_restart && (
            <Button
              onClick={() => window.location.reload()}
              variant="outline"
              className="rounded-badge border-border-default text-text-primary"
            >
              Recommencer
            </Button>
          )}
        </div>
      </div>
    );
  }

  // PLAYING SCREEN
  const currentQuestion = displayQuestions[currentIndex];
  const canGoBack = quiz.settings.allow_back_navigation && currentIndex > 0;
  const isLast = currentIndex === displayQuestions.length - 1;
  const currentAnswer = answers[currentQuestion.id];
  const hasAnswered = currentAnswer !== undefined && currentAnswer !== null && currentAnswer !== "";
  const requireAnswer = quiz.settings.require_answer;

  return (
    <div className="flex h-dvh flex-col bg-background">
      {/* Header */}
      <div className="border-b border-border-default px-4 py-3">
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold text-text-primary truncate max-w-[60%]">
            {quiz.title}
          </span>
          {timeLeft !== null && (
            <span className={`text-sm font-mono ${timeLeft < 60 ? "text-red-400" : "text-text-secondary"}`}>
              {formatTime(timeLeft)}
            </span>
          )}
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-1 bg-[#222]">
        <div
          className="h-full bg-accent-blue transition-all duration-300"
          style={{ width: `${((currentIndex + 1) / displayQuestions.length) * 100}%` }}
        />
      </div>

      {/* Question */}
      <div className="flex-1 overflow-y-auto px-4 py-6">
        <QuestionPreview
          question={currentQuestion}
          index={currentIndex}
          total={displayQuestions.length}
          selectedAnswer={answers[currentQuestion.id]}
          onAnswerChange={(answer) =>
            setAnswers((prev) => ({ ...prev, [currentQuestion.id]: answer }))
          }
        />
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between border-t border-border-default px-4 py-3">
        <Button
          variant="outline"
          size="sm"
          disabled={!canGoBack}
          onClick={() => setCurrentIndex(currentIndex - 1)}
          className="rounded-badge border-border-default text-text-primary"
        >
          Precedent
        </Button>
        <span className="text-xs text-text-secondary">
          {currentIndex + 1} / {displayQuestions.length}
        </span>
        {isLast ? (
          <Button
            size="sm"
            onClick={handleSubmit}
            disabled={submitting || (requireAnswer && !hasAnswered)}
            className="rounded-badge bg-accent-blue text-background font-semibold"
          >
            {submitting ? "Envoi..." : "Terminer"}
          </Button>
        ) : (
          <Button
            size="sm"
            onClick={() => setCurrentIndex(currentIndex + 1)}
            disabled={requireAnswer && !hasAnswered}
            className="rounded-badge bg-accent-blue text-background"
          >
            Suivant
          </Button>
        )}
      </div>
    </div>
  );
}
