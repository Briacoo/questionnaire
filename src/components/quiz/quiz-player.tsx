"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { QuestionPreview } from "./question-preview";
import { Button } from "@/components/ui/button";
import type { Quiz, Question, McqOption, MatchingPair } from "@/lib/types/database";
import { DEFAULT_QUIZ_SETTINGS } from "@/lib/types/database";

function formatCorrectAnswer(question: Question): string | null {
  const correct = question.correct_answer;
  if (correct === null || correct === undefined) return null;

  switch (question.type) {
    case "mcq_single": {
      const options = question.options as McqOption[] | null;
      const opt = options?.find((o) => o.id === String(correct));
      return opt ? opt.text : String(correct);
    }
    case "mcq_multiple": {
      const options = question.options as McqOption[] | null;
      const ids = Array.isArray(correct) ? correct : [];
      const texts = ids.map((id) => options?.find((o) => o.id === id)?.text ?? id);
      return texts.join(", ");
    }
    case "true_false":
      return String(correct) === "true" ? "Vrai" : "Faux";
    case "free_text":
      return String(correct);
    case "scale":
      return String(correct);
    case "drag_order": {
      const items = Array.isArray(correct) ? correct : [];
      return items.map((item, i) => `${i + 1}. ${item}`).join("\n");
    }
    case "matching": {
      const pairs = correct as Record<string, string> | null;
      if (!pairs) return null;
      const options = question.options as MatchingPair[] | null;
      return Object.entries(pairs)
        .map(([leftId, rightVal]) => {
          const pair = options?.find((p) => p.id === leftId);
          return `${pair?.left ?? leftId} → ${rightVal}`;
        })
        .join("\n");
    }
    default:
      return String(correct);
  }
}

interface QuizPlayerProps {
  quiz: Quiz;
  questions: Question[];
  isPreview?: boolean;
  onClose?: () => void;
}

type PlayerState = "intro" | "playing" | "finished";

export function QuizPlayer({ quiz: rawQuiz, questions, isPreview = false, onClose }: QuizPlayerProps) {
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
  const [showingFeedback, setShowingFeedback] = useState(false);
  const [feedbackCorrect, setFeedbackCorrect] = useState(false);
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
      const ua = Array.isArray(userAnswer) ? userAnswer : [];
      const ca = Array.isArray(correct) ? correct : [];
      return JSON.stringify(ua) === JSON.stringify(ca);
    } else if (q.type === "matching") {
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

    let totalScore = 0;
    const totalPoints = displayQuestions.reduce((s, q) => s + q.points, 0);

    for (const q of displayQuestions) {
      if (checkAnswer(q, answers[q.id])) {
        totalScore += q.points;
      }
    }

    const scorePercent = totalPoints > 0 ? Math.round((totalScore / totalPoints) * 100) : 0;

    // Save to BDD only if NOT in preview mode
    if (!isPreview) {
      const supabase = createClient();
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
    }

    setScore(scorePercent);
    setState("finished");
    setSubmitting(false);
  }, [answers, displayQuestions, quiz, startedAt, checkAnswer, isPreview]);

  // Timer
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

  function handleNext() {
    const currentQuestion = displayQuestions[currentIndex];
    const userAnswer = answers[currentQuestion.id];

    // If feedback is enabled, show feedback screen before moving on
    if (quiz.settings.show_feedback && !showingFeedback) {
      const isCorrect = checkAnswer(currentQuestion, userAnswer);
      setFeedbackCorrect(isCorrect);
      setShowingFeedback(true);
      return;
    }

    // Move to next question (or submit if last)
    setShowingFeedback(false);
    const isLast = currentIndex === displayQuestions.length - 1;
    if (isLast) {
      handleSubmit();
    } else {
      setCurrentIndex(currentIndex + 1);
    }
  }

  function handlePrevious() {
    setShowingFeedback(false);
    setCurrentIndex(currentIndex - 1);
  }

  // Preview close button helper
  const previewCloseButton = isPreview && onClose ? (
    <Button
      onClick={onClose}
      variant="outline"
      className="rounded-badge border-border-default text-text-primary"
    >
      Fermer la preview
    </Button>
  ) : null;

  // Preview banner
  const previewBanner = isPreview ? (
    <div className="absolute top-0 left-0 right-0 bg-accent-blue/20 text-accent-blue text-xs text-center py-1 font-semibold z-10">
      MODE PREVIEW
    </div>
  ) : null;

  // INTRO SCREEN
  if (state === "intro") {
    return (
      <div className="relative flex h-dvh items-center justify-center bg-background p-4">
        {previewBanner}
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
          {previewCloseButton}
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
      <div className="relative flex h-dvh items-center justify-center bg-background p-4">
        {previewBanner}
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
          {quiz.settings.allow_restart && !isPreview && (
            <Button
              onClick={() => window.location.reload()}
              variant="outline"
              className="rounded-badge border-border-default text-text-primary"
            >
              Recommencer
            </Button>
          )}
          {previewCloseButton}
        </div>
      </div>
    );
  }

  // PLAYING SCREEN
  const currentQuestion = displayQuestions[currentIndex];
  const canGoBack = quiz.settings.allow_back_navigation && currentIndex > 0 && !showingFeedback;
  const isLast = currentIndex === displayQuestions.length - 1;
  const currentAnswer = answers[currentQuestion.id];
  const hasAnswered = currentAnswer !== undefined && currentAnswer !== null && currentAnswer !== "";
  const requireAnswer = quiz.settings.require_answer;

  return (
    <div className="relative flex h-full flex-col bg-background overflow-hidden">
      {previewBanner}
      {/* Header */}
      <div className={`shrink-0 border-b border-border-default px-4 py-3 ${isPreview ? "mt-6" : ""}`}>
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
      <div className="shrink-0 h-1 bg-[#222]">
        <div
          className="h-full bg-accent-blue transition-all duration-300"
          style={{ width: `${((currentIndex + 1) / displayQuestions.length) * 100}%` }}
        />
      </div>

      {/* Question or Feedback */}
      <div className="flex-1 overflow-y-auto px-4 py-6">
        {showingFeedback ? (
          <div className="max-w-md mx-auto space-y-4">
            <div className={`rounded-card border p-4 ${feedbackCorrect ? "border-green-500/30 bg-green-500/10" : "border-red-500/30 bg-red-500/10"}`}>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xl">{feedbackCorrect ? "✅" : "❌"}</span>
                <span className={`font-semibold ${feedbackCorrect ? "text-green-400" : "text-red-400"}`}>
                  {feedbackCorrect ? "Bonne reponse !" : "Mauvaise reponse"}
                </span>
              </div>
              {!feedbackCorrect && (() => {
                const correctText = formatCorrectAnswer(currentQuestion);
                return correctText ? (
                  <div className="mt-3 pt-3 border-t border-border-default">
                    <p className="text-xs text-text-secondary mb-1">La bonne reponse etait :</p>
                    <p className="text-sm text-text-primary whitespace-pre-line">{correctText}</p>
                  </div>
                ) : null;
              })()}
              {currentQuestion.feedback && (
                <div className="mt-3 pt-3 border-t border-border-default">
                  <p className="text-text-secondary text-sm">{currentQuestion.feedback}</p>
                </div>
              )}
            </div>
          </div>
        ) : (
          <QuestionPreview
            question={currentQuestion}
            index={currentIndex}
            total={displayQuestions.length}
            selectedAnswer={answers[currentQuestion.id]}
            onAnswerChange={(answer) =>
              setAnswers((prev) => ({ ...prev, [currentQuestion.id]: answer }))
            }
          />
        )}
      </div>

      {/* Navigation */}
      <div className="shrink-0 flex items-center justify-between border-t border-border-default px-4 py-3">
        <Button
          variant="outline"
          size="sm"
          disabled={!canGoBack}
          onClick={handlePrevious}
          className="rounded-badge border-border-default text-text-primary"
        >
          Precedent
        </Button>
        <span className="text-xs text-text-secondary">
          {currentIndex + 1} / {displayQuestions.length}
        </span>
        {showingFeedback ? (
          <Button
            size="sm"
            onClick={handleNext}
            className="rounded-badge bg-accent-blue text-background"
          >
            {isLast ? "Terminer" : "Suivant"}
          </Button>
        ) : isLast ? (
          <Button
            size="sm"
            onClick={handleNext}
            disabled={submitting || (requireAnswer && !hasAnswered)}
            className="rounded-badge bg-accent-blue text-background font-semibold"
          >
            {submitting ? "Envoi..." : "Terminer"}
          </Button>
        ) : (
          <Button
            size="sm"
            onClick={handleNext}
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
