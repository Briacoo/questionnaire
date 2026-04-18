import { createClient } from "@/lib/supabase/server";
import { QuizPlayer } from "@/components/quiz/quiz-player";

export default async function QuizPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const [quizRes, questionsRes] = await Promise.all([
    supabase
      .from("quizzes")
      .select("*")
      .eq("id", id)
      .eq("status", "published")
      .single(),
    supabase
      .from("questions")
      .select("*")
      .eq("quiz_id", id)
      .order("order", { ascending: true }),
  ]);

  if (!quizRes.data) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-text-primary">
            Quiz introuvable
          </h1>
          <p className="mt-2 text-text-secondary">
            Ce quiz n&apos;existe pas ou n&apos;est pas encore publie.
          </p>
        </div>
      </div>
    );
  }

  if (!questionsRes.data || questionsRes.data.length === 0) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-text-primary">
            {quizRes.data.title}
          </h1>
          <p className="mt-2 text-text-secondary">
            Ce quiz ne contient aucune question.
          </p>
        </div>
      </div>
    );
  }

  return (
    <QuizPlayer
      quiz={quizRes.data}
      questions={questionsRes.data}
    />
  );
}
