"use client";

import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import type { Quiz } from "@/lib/types/database";

const statusStyles = {
  draft: "bg-status-draft-bg text-status-draft",
  published: "bg-status-published-bg text-status-published",
  archived: "bg-[rgba(100,100,100,0.15)] text-[#888]",
};

const statusLabels = {
  draft: "Brouillon",
  published: "Publie",
  archived: "Archive",
};

interface QuizCardProps {
  quiz: Quiz;
  questionCount?: number;
}

export function QuizCard({ quiz, questionCount = 0 }: QuizCardProps) {
  return (
    <Link href={`/admin/quiz/${quiz.id}/edit`}>
      <Card className="bg-surface border-border-default shadow-card hover:border-border-strong transition-colors">
        <CardContent className="p-4">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-text-primary truncate">
                {quiz.title}
              </h3>
              {quiz.description && (
                <p className="mt-1 text-sm text-text-secondary line-clamp-2">
                  {quiz.description}
                </p>
              )}
              <div className="mt-2 flex items-center gap-2">
                <span
                  className={`inline-flex items-center rounded-badge px-2 py-0.5 text-xs font-medium ${statusStyles[quiz.status]}`}
                >
                  {statusLabels[quiz.status]}
                </span>
                <span className="text-xs text-text-secondary">
                  {questionCount} question{questionCount !== 1 ? "s" : ""}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
