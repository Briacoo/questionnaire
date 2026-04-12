"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { arrayMove } from "@dnd-kit/sortable";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { QuestionList } from "@/components/quiz/question-list";
import { QuestionEditor, type QuestionData } from "@/components/quiz/question-editor";
import { QuestionTypePicker } from "@/components/quiz/question-type-picker";
import { QuizPreview } from "@/components/quiz/quiz-preview";
import type { Quiz, Question, QuestionType } from "@/lib/types/database";
import Link from "next/link";

type EditorState = "list" | "pick-type" | "add" | "edit";

export default function QuizEditPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const quizId = params.id;

  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [editorState, setEditorState] = useState<EditorState>("list");
  const [selectedType, setSelectedType] = useState<QuestionType | null>(null);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showPreview, setShowPreview] = useState(false);

  const supabase = createClient();

  const loadData = useCallback(async () => {
    const [quizRes, questionsRes] = await Promise.all([
      supabase.from("quizzes").select("*").eq("id", quizId).single(),
      supabase
        .from("questions")
        .select("*")
        .eq("quiz_id", quizId)
        .order("order", { ascending: true }),
    ]);

    if (quizRes.data) setQuiz(quizRes.data);
    if (questionsRes.data) setQuestions(questionsRes.data);
    setLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quizId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  async function handleAddQuestion(data: QuestionData) {
    setSaving(true);
    const { error } = await supabase.from("questions").insert({
      quiz_id: quizId,
      type: data.type,
      content: data.content,
      options: data.options ?? [],
      correct_answer: data.correct_answer ?? [],
      feedback: data.feedback || null,
      points: data.points,
      order: questions.length,
    });

    if (!error) {
      await loadData();
      setEditorState("list");
      setSelectedType(null);
    }
    setSaving(false);
  }

  async function handleEditQuestion(data: QuestionData) {
    if (!editingQuestion) return;
    setSaving(true);
    const { error } = await supabase
      .from("questions")
      .update({
        content: data.content,
        options: data.options ?? [],
        correct_answer: data.correct_answer ?? [],
        feedback: data.feedback || null,
        points: data.points,
      })
      .eq("id", editingQuestion.id);

    if (!error) {
      await loadData();
      setEditorState("list");
      setEditingQuestion(null);
    }
    setSaving(false);
  }

  async function handleDeleteQuestion(questionId: string) {
    const { error } = await supabase
      .from("questions")
      .delete()
      .eq("id", questionId);

    if (!error) {
      const reordered = questions
        .filter((q) => q.id !== questionId)
        .map((q, i) => ({ ...q, order: i }));
      setQuestions(reordered);

      for (const q of reordered) {
        await supabase.from("questions").update({ order: q.order }).eq("id", q.id);
      }
    }
  }

  async function handleReorder(oldIndex: number, newIndex: number) {
    const reordered = arrayMove(questions, oldIndex, newIndex).map((q, i) => ({
      ...q,
      order: i,
    }));
    setQuestions(reordered);

    for (const q of reordered) {
      await supabase.from("questions").update({ order: q.order }).eq("id", q.id);
    }
  }

  function startEdit(question: Question) {
    setEditingQuestion(question);
    setSelectedType(question.type);
    setEditorState("edit");
  }

  if (loading) {
    return (
      <div className="px-4 pt-6">
        <p className="text-text-secondary">Chargement...</p>
      </div>
    );
  }

  if (!quiz) {
    return (
      <div className="px-4 pt-6">
        <p className="text-text-secondary">Quiz introuvable.</p>
      </div>
    );
  }

  return (
    <div className="px-4 pt-6 pb-32">
      <div className="flex items-center justify-between mb-6">
        <div>
          <button
            onClick={() => router.push("/admin")}
            className="text-xs text-accent-blue hover:text-accent-blue-light mb-1 inline-block"
          >
            ← Retour
          </button>
          <h1 className="text-xl font-bold text-text-primary">{quiz.title}</h1>
          <p className="text-xs text-text-secondary mt-0.5">
            {questions.length} question{questions.length !== 1 ? "s" : ""}
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowPreview(true)}
            className="rounded-badge border-border-default text-text-primary"
          >
            Preview
          </Button>
          <Link href={`/admin/quiz/${quizId}/settings`}>
            <Button
              variant="outline"
              size="sm"
              className="rounded-badge border-border-default text-text-primary"
            >
              Parametres
            </Button>
          </Link>
        </div>
      </div>

      {editorState === "list" && (
        <>
          <QuestionList
            questions={questions}
            onReorder={handleReorder}
            onEdit={startEdit}
            onDelete={handleDeleteQuestion}
          />

          <button
            onClick={() => setEditorState("pick-type")}
            className="fixed bottom-24 right-4 flex h-14 w-14 items-center justify-center rounded-fab bg-accent-blue text-background shadow-fab hover:bg-accent-blue-secondary transition-colors"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
          </button>
        </>
      )}

      {editorState === "pick-type" && (
        <QuestionTypePicker
          onSelect={(type) => {
            setSelectedType(type);
            setEditorState("add");
          }}
          onCancel={() => setEditorState("list")}
        />
      )}

      {editorState === "add" && selectedType && (
        <QuestionEditor
          type={selectedType}
          onSave={handleAddQuestion}
          onCancel={() => {
            setEditorState("list");
            setSelectedType(null);
          }}
          saving={saving}
        />
      )}

      {editorState === "edit" && editingQuestion && selectedType && (
        <QuestionEditor
          type={selectedType}
          initialData={{
            content: editingQuestion.content,
            type: editingQuestion.type,
            options: editingQuestion.options,
            correct_answer: editingQuestion.correct_answer,
            feedback: editingQuestion.feedback ?? "",
            points: editingQuestion.points,
          }}
          onSave={handleEditQuestion}
          onCancel={() => {
            setEditorState("list");
            setEditingQuestion(null);
          }}
          saving={saving}
        />
      )}

      {showPreview && (
        <QuizPreview
          title={quiz.title}
          questions={questions}
          onClose={() => setShowPreview(false)}
        />
      )}
    </div>
  );
}
