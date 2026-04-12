# Phase 2 — Questionnaires Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the full quiz creation and editing experience — admin dashboard lists quizzes, create/edit quiz with questions (7 types), drag-to-reorder, quiz settings, preview mode, and publish with shareable link + QR code.

**Architecture:** Server components for data fetching (admin dashboard, quiz editor page), client components for interactive UI (question editor, drag & drop, settings form). Supabase for CRUD operations via RLS. New shadcn/ui components added as needed (dialog, select, switch, textarea, dropdown-menu, tabs). @dnd-kit for drag-and-drop reordering. qrcode library for QR generation.

**Tech Stack:** Next.js 16 (App Router), TypeScript, Tailwind CSS v4, shadcn/ui, @dnd-kit/core + @dnd-kit/sortable, qrcode, Supabase (existing)

---

## File Structure

```
src/
├── app/(admin)/admin/
│   ├── page.tsx                              MODIFY — Quiz list dashboard with FAB
│   ├── quiz/
│   │   ├── new/page.tsx                      CREATE — Create quiz form
│   │   └── [id]/
│   │       ├── edit/page.tsx                 CREATE — Quiz editor (questions)
│   │       └── settings/page.tsx             CREATE — Quiz settings
├── components/
│   ├── ui/
│   │   ├── dialog.tsx                        CREATE — shadcn dialog
│   │   ├── select.tsx                        CREATE — shadcn select
│   │   ├── switch.tsx                        CREATE — shadcn switch
│   │   ├── textarea.tsx                      CREATE — shadcn textarea
│   │   ├── dropdown-menu.tsx                 CREATE — shadcn dropdown menu
│   │   ├── tabs.tsx                          CREATE — shadcn tabs
│   │   └── badge.tsx                         CREATE — shadcn badge
│   └── quiz/
│       ├── quiz-card.tsx                     CREATE — Quiz card for dashboard list
│       ├── question-editor.tsx               CREATE — Add/edit a question (form)
│       ├── question-list.tsx                 CREATE — Sortable list of questions
│       ├── question-item.tsx                 CREATE — Single question in list (draggable)
│       ├── question-type-picker.tsx          CREATE — Type selector when adding question
│       ├── options-editor-mcq.tsx            CREATE — MCQ options editor
│       ├── options-editor-true-false.tsx     CREATE — True/false options editor
│       ├── options-editor-free-text.tsx      CREATE — Free text config
│       ├── options-editor-drag-order.tsx     CREATE — Drag order items editor
│       ├── options-editor-matching.tsx       CREATE — Matching pairs editor
│       ├── options-editor-scale.tsx          CREATE — Scale config editor
│       ├── quiz-settings-form.tsx            CREATE — Settings form component
│       ├── quiz-preview.tsx                  CREATE — Preview modal
│       ├── quiz-publish-dialog.tsx           CREATE — Publish dialog with link + QR
│       └── question-preview.tsx              CREATE — Render a question in preview mode
├── lib/
│   └── types/
│       └── database.ts                       MODIFY — Refine Question options/answer types
```

---

### Task 1: Install dependencies

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Install @dnd-kit and qrcode**

```bash
npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities qrcode
npm install -D @types/qrcode
```

- [ ] **Step 2: Add shadcn components**

```bash
npx shadcn@latest add dialog select switch textarea dropdown-menu tabs badge
```

- [ ] **Step 3: Verify build**

Run: `./node_modules/.bin/next build`
Expected: Build succeeds with 0 errors.

- [ ] **Step 4: Commit**

```bash
git add package.json package-lock.json src/components/ui/
git commit -m "feat: add dnd-kit, qrcode, and shadcn components for Phase 2"
```

---

### Task 2: Refine Question types

**Files:**
- Modify: `src/lib/types/database.ts`

- [ ] **Step 1: Update Question interface with typed options**

Replace the `Question` interface and add supporting types in `src/lib/types/database.ts`:

```typescript
// Add after QuestionType definition

export interface McqOption {
  id: string;
  text: string;
}

export interface MatchingPair {
  id: string;
  left: string;
  right: string;
}

export interface ScaleConfig {
  min: number;
  max: number;
  minLabel: string;
  maxLabel: string;
  step: number;
}

// Replace Question interface
export interface Question {
  id: string;
  quiz_id: string;
  type: QuestionType;
  content: string;
  media_url: string | null;
  options: McqOption[] | MatchingPair[] | ScaleConfig | string[] | null;
  correct_answer: string | string[] | number | null;
  feedback: string | null;
  points: number;
  order: number;
}
```

Type mapping per question type:
- `mcq_single`: options = `McqOption[]`, correct_answer = `string` (option id)
- `mcq_multiple`: options = `McqOption[]`, correct_answer = `string[]` (option ids)
- `true_false`: options = `null`, correct_answer = `string` ("true" | "false")
- `free_text`: options = `null`, correct_answer = `string` (expected answer or null for open)
- `drag_order`: options = `string[]` (items in correct order), correct_answer = `null`
- `matching`: options = `MatchingPair[]`, correct_answer = `null` (order in options IS the answer)
- `scale`: options = `ScaleConfig`, correct_answer = `number`

- [ ] **Step 2: Add a default QuizSettings constant**

Add at the bottom of `src/lib/types/database.ts`:

```typescript
export const DEFAULT_QUIZ_SETTINGS: QuizSettings = {
  time_limit: null,
  passing_score: null,
  show_feedback: false,
  shuffle_questions: false,
  shuffle_answers: false,
  allow_back_navigation: true,
  error_message: null,
  entry_form_fields: [],
  max_attempts: null,
};
```

- [ ] **Step 3: Verify build**

Run: `./node_modules/.bin/next build`
Expected: Build succeeds.

- [ ] **Step 4: Commit**

```bash
git add src/lib/types/database.ts
git commit -m "feat: add typed question options and default quiz settings"
```

---

### Task 3: Quiz card component

**Files:**
- Create: `src/components/quiz/quiz-card.tsx`

- [ ] **Step 1: Create quiz-card component**

Create `src/components/quiz/quiz-card.tsx`:

```tsx
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
```

- [ ] **Step 2: Verify build**

Run: `./node_modules/.bin/next build`
Expected: Build succeeds.

- [ ] **Step 3: Commit**

```bash
git add src/components/quiz/quiz-card.tsx
git commit -m "feat: add quiz card component for dashboard list"
```

---

### Task 4: Admin dashboard with quiz list + FAB

**Files:**
- Modify: `src/app/(admin)/admin/page.tsx`

- [ ] **Step 1: Rewrite admin dashboard**

Replace the content of `src/app/(admin)/admin/page.tsx`:

```tsx
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { QuizCard } from "@/components/quiz/quiz-card";

export default async function AdminDashboard() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: quizzes } = await supabase
    .from("quizzes")
    .select("*, questions(count)")
    .eq("admin_id", user!.id)
    .order("updated_at", { ascending: false });

  return (
    <div className="px-4 pt-6">
      <div className="mb-1 text-xs font-semibold uppercase tracking-wider text-accent-blue">
        Mes Questionnaires
      </div>
      <h1 className="text-2xl font-bold text-text-primary">Dashboard</h1>

      {quizzes && quizzes.length > 0 ? (
        <div className="mt-6 space-y-3">
          {quizzes.map((quiz) => (
            <QuizCard
              key={quiz.id}
              quiz={quiz}
              questionCount={quiz.questions?.[0]?.count ?? 0}
            />
          ))}
        </div>
      ) : (
        <div className="mt-6 rounded-card bg-surface p-6 border border-border-default shadow-card text-center">
          <p className="text-text-secondary">Aucun questionnaire pour le moment.</p>
          <p className="mt-1 text-sm text-text-secondary">
            Appuyez sur + pour creer votre premier quiz.
          </p>
        </div>
      )}

      {/* FAB */}
      <Link
        href="/admin/quiz/new"
        className="fixed bottom-24 right-4 flex h-14 w-14 items-center justify-center rounded-fab bg-accent-blue text-background shadow-fab hover:bg-accent-blue-secondary transition-colors"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
      </Link>
    </div>
  );
}
```

- [ ] **Step 2: Verify build**

Run: `./node_modules/.bin/next build`
Expected: Build succeeds, `/admin` route is dynamic (ƒ).

- [ ] **Step 3: Commit**

```bash
git add src/app/\(admin\)/admin/page.tsx
git commit -m "feat: admin dashboard with quiz list and FAB button"
```

---

### Task 5: Create quiz page

**Files:**
- Create: `src/app/(admin)/admin/quiz/new/page.tsx`

- [ ] **Step 1: Create the new quiz page**

Create `src/app/(admin)/admin/quiz/new/page.tsx`:

```tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DEFAULT_QUIZ_SETTINGS } from "@/lib/types/database";

export default function NewQuizPage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;

    setLoading(true);
    setError(null);

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      setError("Non authentifie");
      setLoading(false);
      return;
    }

    const { data, error: insertError } = await supabase
      .from("quizzes")
      .insert({
        admin_id: user.id,
        title: title.trim(),
        description: description.trim() || null,
        settings: DEFAULT_QUIZ_SETTINGS,
      })
      .select("id")
      .single();

    if (insertError) {
      setError(insertError.message);
      setLoading(false);
      return;
    }

    router.push(`/admin/quiz/${data.id}/edit`);
  }

  return (
    <div className="px-4 pt-6">
      <h1 className="text-2xl font-bold text-text-primary mb-6">
        Nouveau questionnaire
      </h1>
      <Card className="bg-surface border-border-default shadow-card">
        <CardHeader>
          <CardTitle className="text-lg text-text-primary">Informations</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title" className="text-text-primary">Titre</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ex: Quiz sur la securite informatique"
                required
                className="bg-background border-border-default text-text-primary placeholder:text-text-secondary"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description" className="text-text-primary">
                Description (optionnelle)
              </Label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Decrivez votre questionnaire..."
                rows={3}
                className="flex w-full rounded-lg border border-border-default bg-background px-3 py-2 text-sm text-text-primary placeholder:text-text-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-blue"
              />
            </div>
            {error && <p className="text-sm text-red-400">{error}</p>}
            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                className="flex-1 rounded-badge border-border-default text-text-primary"
              >
                Annuler
              </Button>
              <Button
                type="submit"
                disabled={loading || !title.trim()}
                className="flex-1 rounded-badge bg-accent-blue hover:bg-accent-blue-secondary text-background font-semibold"
              >
                {loading ? "Creation..." : "Creer"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
```

- [ ] **Step 2: Verify build**

Run: `./node_modules/.bin/next build`
Expected: `/admin/quiz/new` appears in routes.

- [ ] **Step 3: Commit**

```bash
git add src/app/\(admin\)/admin/quiz/
git commit -m "feat: add create quiz page"
```

---

### Task 6: Question type picker

**Files:**
- Create: `src/components/quiz/question-type-picker.tsx`

- [ ] **Step 1: Create the type picker component**

Create `src/components/quiz/question-type-picker.tsx`:

```tsx
"use client";

import type { QuestionType } from "@/lib/types/database";

const questionTypes: { type: QuestionType; label: string; description: string }[] = [
  { type: "mcq_single", label: "QCM choix unique", description: "Une seule bonne reponse" },
  { type: "mcq_multiple", label: "QCM choix multiple", description: "Plusieurs bonnes reponses" },
  { type: "true_false", label: "Vrai / Faux", description: "Question binaire" },
  { type: "free_text", label: "Texte libre", description: "Reponse ouverte" },
  { type: "drag_order", label: "Ordonner", description: "Remettre dans l'ordre" },
  { type: "matching", label: "Association", description: "Relier les paires" },
  { type: "scale", label: "Echelle", description: "Note sur une echelle" },
];

interface QuestionTypePickerProps {
  onSelect: (type: QuestionType) => void;
  onCancel: () => void;
}

export function QuestionTypePicker({ onSelect, onCancel }: QuestionTypePickerProps) {
  return (
    <div className="space-y-2">
      <h3 className="text-sm font-semibold text-text-primary mb-3">
        Type de question
      </h3>
      <div className="grid grid-cols-1 gap-2">
        {questionTypes.map(({ type, label, description }) => (
          <button
            key={type}
            onClick={() => onSelect(type)}
            className="flex flex-col items-start rounded-card border border-border-default bg-surface p-3 text-left hover:border-accent-blue transition-colors"
          >
            <span className="text-sm font-medium text-text-primary">{label}</span>
            <span className="text-xs text-text-secondary">{description}</span>
          </button>
        ))}
      </div>
      <button
        onClick={onCancel}
        className="mt-2 text-sm text-text-secondary hover:text-text-primary"
      >
        Annuler
      </button>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/quiz/question-type-picker.tsx
git commit -m "feat: add question type picker component"
```

---

### Task 7: Options editors for all 7 question types

**Files:**
- Create: `src/components/quiz/options-editor-mcq.tsx`
- Create: `src/components/quiz/options-editor-true-false.tsx`
- Create: `src/components/quiz/options-editor-free-text.tsx`
- Create: `src/components/quiz/options-editor-drag-order.tsx`
- Create: `src/components/quiz/options-editor-matching.tsx`
- Create: `src/components/quiz/options-editor-scale.tsx`

- [ ] **Step 1: Create MCQ options editor**

Create `src/components/quiz/options-editor-mcq.tsx`:

```tsx
"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import type { McqOption } from "@/lib/types/database";

interface McqOptionsEditorProps {
  options: McqOption[];
  correctAnswer: string | string[];
  multiple: boolean;
  onChange: (options: McqOption[], correctAnswer: string | string[]) => void;
}

export function McqOptionsEditor({
  options,
  correctAnswer,
  multiple,
  onChange,
}: McqOptionsEditorProps) {
  function addOption() {
    const newOption: McqOption = {
      id: crypto.randomUUID(),
      text: "",
    };
    onChange([...options, newOption], correctAnswer);
  }

  function updateOption(id: string, text: string) {
    onChange(
      options.map((o) => (o.id === id ? { ...o, text } : o)),
      correctAnswer
    );
  }

  function removeOption(id: string) {
    const newOptions = options.filter((o) => o.id !== id);
    if (multiple) {
      const arr = Array.isArray(correctAnswer) ? correctAnswer : [];
      onChange(newOptions, arr.filter((a) => a !== id));
    } else {
      onChange(newOptions, correctAnswer === id ? "" : correctAnswer);
    }
  }

  function toggleCorrect(id: string) {
    if (multiple) {
      const arr = Array.isArray(correctAnswer) ? correctAnswer : [];
      const newAnswer = arr.includes(id)
        ? arr.filter((a) => a !== id)
        : [...arr, id];
      onChange(options, newAnswer);
    } else {
      onChange(options, id);
    }
  }

  const correctIds = multiple
    ? (Array.isArray(correctAnswer) ? correctAnswer : [])
    : [correctAnswer];

  return (
    <div className="space-y-2">
      <p className="text-xs text-text-secondary">
        {multiple
          ? "Cochez toutes les bonnes reponses"
          : "Cochez la bonne reponse"}
      </p>
      {options.map((option) => (
        <div key={option.id} className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => toggleCorrect(option.id)}
            className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-${multiple ? "sm" : "full"} border ${
              correctIds.includes(option.id)
                ? "border-accent-blue bg-accent-blue"
                : "border-border-default"
            } transition-colors`}
          >
            {correctIds.includes(option.id) && (
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            )}
          </button>
          <Input
            value={option.text}
            onChange={(e) => updateOption(option.id, e.target.value)}
            placeholder="Texte de l'option"
            className="flex-1 bg-background border-border-default text-text-primary text-sm"
          />
          {options.length > 2 && (
            <button
              type="button"
              onClick={() => removeOption(option.id)}
              className="text-text-secondary hover:text-red-400"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          )}
        </div>
      ))}
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={addOption}
        className="text-xs border-border-default text-text-secondary"
      >
        + Ajouter une option
      </Button>
    </div>
  );
}
```

- [ ] **Step 2: Create true/false editor**

Create `src/components/quiz/options-editor-true-false.tsx`:

```tsx
"use client";

interface TrueFalseEditorProps {
  correctAnswer: string;
  onChange: (correctAnswer: string) => void;
}

export function TrueFalseEditor({ correctAnswer, onChange }: TrueFalseEditorProps) {
  return (
    <div className="space-y-2">
      <p className="text-xs text-text-secondary">Selectionnez la bonne reponse</p>
      <div className="flex gap-3">
        {[
          { value: "true", label: "Vrai" },
          { value: "false", label: "Faux" },
        ].map(({ value, label }) => (
          <button
            key={value}
            type="button"
            onClick={() => onChange(value)}
            className={`flex-1 rounded-badge border p-3 text-center text-sm font-medium transition-colors ${
              correctAnswer === value
                ? "border-accent-blue bg-accent-blue/10 text-accent-blue"
                : "border-border-default text-text-secondary hover:border-border-strong"
            }`}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Create free text editor**

Create `src/components/quiz/options-editor-free-text.tsx`:

```tsx
"use client";

import { Input } from "@/components/ui/input";

interface FreeTextEditorProps {
  correctAnswer: string;
  onChange: (correctAnswer: string) => void;
}

export function FreeTextEditor({ correctAnswer, onChange }: FreeTextEditorProps) {
  return (
    <div className="space-y-2">
      <p className="text-xs text-text-secondary">
        Reponse attendue (laisser vide pour une question ouverte sans correction automatique)
      </p>
      <Input
        value={correctAnswer}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Reponse attendue (optionnel)"
        className="bg-background border-border-default text-text-primary text-sm"
      />
    </div>
  );
}
```

- [ ] **Step 4: Create drag order editor**

Create `src/components/quiz/options-editor-drag-order.tsx`:

```tsx
"use client";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface DragOrderEditorProps {
  items: string[];
  onChange: (items: string[]) => void;
}

export function DragOrderEditor({ items, onChange }: DragOrderEditorProps) {
  function addItem() {
    onChange([...items, ""]);
  }

  function updateItem(index: number, value: string) {
    const newItems = [...items];
    newItems[index] = value;
    onChange(newItems);
  }

  function removeItem(index: number) {
    onChange(items.filter((_, i) => i !== index));
  }

  return (
    <div className="space-y-2">
      <p className="text-xs text-text-secondary">
        Entrez les elements dans l&apos;ordre correct. Ils seront melanges pour le participant.
      </p>
      {items.map((item, index) => (
        <div key={index} className="flex items-center gap-2">
          <span className="text-xs text-text-secondary w-5 shrink-0">{index + 1}.</span>
          <Input
            value={item}
            onChange={(e) => updateItem(index, e.target.value)}
            placeholder={`Element ${index + 1}`}
            className="flex-1 bg-background border-border-default text-text-primary text-sm"
          />
          {items.length > 2 && (
            <button
              type="button"
              onClick={() => removeItem(index)}
              className="text-text-secondary hover:text-red-400"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          )}
        </div>
      ))}
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={addItem}
        className="text-xs border-border-default text-text-secondary"
      >
        + Ajouter un element
      </Button>
    </div>
  );
}
```

- [ ] **Step 5: Create matching pairs editor**

Create `src/components/quiz/options-editor-matching.tsx`:

```tsx
"use client";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import type { MatchingPair } from "@/lib/types/database";

interface MatchingEditorProps {
  pairs: MatchingPair[];
  onChange: (pairs: MatchingPair[]) => void;
}

export function MatchingEditor({ pairs, onChange }: MatchingEditorProps) {
  function addPair() {
    onChange([...pairs, { id: crypto.randomUUID(), left: "", right: "" }]);
  }

  function updatePair(id: string, side: "left" | "right", value: string) {
    onChange(pairs.map((p) => (p.id === id ? { ...p, [side]: value } : p)));
  }

  function removePair(id: string) {
    onChange(pairs.filter((p) => p.id !== id));
  }

  return (
    <div className="space-y-2">
      <p className="text-xs text-text-secondary">
        Definissez les paires. L&apos;ordre sera melange pour le participant.
      </p>
      {pairs.map((pair) => (
        <div key={pair.id} className="flex items-center gap-2">
          <Input
            value={pair.left}
            onChange={(e) => updatePair(pair.id, "left", e.target.value)}
            placeholder="Element gauche"
            className="flex-1 bg-background border-border-default text-text-primary text-sm"
          />
          <span className="text-text-secondary text-xs">→</span>
          <Input
            value={pair.right}
            onChange={(e) => updatePair(pair.id, "right", e.target.value)}
            placeholder="Element droit"
            className="flex-1 bg-background border-border-default text-text-primary text-sm"
          />
          {pairs.length > 2 && (
            <button
              type="button"
              onClick={() => removePair(pair.id)}
              className="text-text-secondary hover:text-red-400"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          )}
        </div>
      ))}
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={addPair}
        className="text-xs border-border-default text-text-secondary"
      >
        + Ajouter une paire
      </Button>
    </div>
  );
}
```

- [ ] **Step 6: Create scale editor**

Create `src/components/quiz/options-editor-scale.tsx`:

```tsx
"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { ScaleConfig } from "@/lib/types/database";

interface ScaleEditorProps {
  config: ScaleConfig;
  correctAnswer: number | null;
  onChange: (config: ScaleConfig, correctAnswer: number | null) => void;
}

export function ScaleEditor({ config, correctAnswer, onChange }: ScaleEditorProps) {
  function updateConfig(field: keyof ScaleConfig, value: string | number) {
    onChange({ ...config, [field]: value }, correctAnswer);
  }

  return (
    <div className="space-y-3">
      <p className="text-xs text-text-secondary">Configurez l&apos;echelle de notation</p>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label className="text-xs text-text-secondary">Min</Label>
          <Input
            type="number"
            value={config.min}
            onChange={(e) => updateConfig("min", parseInt(e.target.value) || 0)}
            className="bg-background border-border-default text-text-primary text-sm"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs text-text-secondary">Max</Label>
          <Input
            type="number"
            value={config.max}
            onChange={(e) => updateConfig("max", parseInt(e.target.value) || 10)}
            className="bg-background border-border-default text-text-primary text-sm"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs text-text-secondary">Label min</Label>
          <Input
            value={config.minLabel}
            onChange={(e) => updateConfig("minLabel", e.target.value)}
            placeholder="Ex: Pas du tout"
            className="bg-background border-border-default text-text-primary text-sm"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs text-text-secondary">Label max</Label>
          <Input
            value={config.maxLabel}
            onChange={(e) => updateConfig("maxLabel", e.target.value)}
            placeholder="Ex: Tout a fait"
            className="bg-background border-border-default text-text-primary text-sm"
          />
        </div>
      </div>
      <div className="space-y-1">
        <Label className="text-xs text-text-secondary">Bonne reponse (optionnel)</Label>
        <Input
          type="number"
          value={correctAnswer ?? ""}
          onChange={(e) =>
            onChange(config, e.target.value ? parseInt(e.target.value) : null)
          }
          placeholder="Laisser vide si pas de bonne reponse"
          className="bg-background border-border-default text-text-primary text-sm"
        />
      </div>
    </div>
  );
}
```

- [ ] **Step 7: Verify build**

Run: `./node_modules/.bin/next build`
Expected: Build succeeds.

- [ ] **Step 8: Commit**

```bash
git add src/components/quiz/options-editor-*.tsx
git commit -m "feat: add options editors for all 7 question types"
```

---

### Task 8: Question editor component

**Files:**
- Create: `src/components/quiz/question-editor.tsx`

- [ ] **Step 1: Create the question editor**

Create `src/components/quiz/question-editor.tsx`:

```tsx
"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { McqOptionsEditor } from "./options-editor-mcq";
import { TrueFalseEditor } from "./options-editor-true-false";
import { FreeTextEditor } from "./options-editor-free-text";
import { DragOrderEditor } from "./options-editor-drag-order";
import { MatchingEditor } from "./options-editor-matching";
import { ScaleEditor } from "./options-editor-scale";
import type { QuestionType, McqOption, MatchingPair, ScaleConfig } from "@/lib/types/database";

interface QuestionData {
  content: string;
  type: QuestionType;
  options: McqOption[] | MatchingPair[] | ScaleConfig | string[] | null;
  correct_answer: string | string[] | number | null;
  feedback: string;
  points: number;
}

function getDefaultData(type: QuestionType): QuestionData {
  const base = { content: "", feedback: "", points: 1 };
  switch (type) {
    case "mcq_single":
      return {
        ...base, type,
        options: [
          { id: crypto.randomUUID(), text: "" },
          { id: crypto.randomUUID(), text: "" },
        ] as McqOption[],
        correct_answer: "",
      };
    case "mcq_multiple":
      return {
        ...base, type,
        options: [
          { id: crypto.randomUUID(), text: "" },
          { id: crypto.randomUUID(), text: "" },
        ] as McqOption[],
        correct_answer: [] as string[],
      };
    case "true_false":
      return { ...base, type, options: null, correct_answer: "true" };
    case "free_text":
      return { ...base, type, options: null, correct_answer: "" };
    case "drag_order":
      return { ...base, type, options: ["", ""] as string[], correct_answer: null };
    case "matching":
      return {
        ...base, type,
        options: [
          { id: crypto.randomUUID(), left: "", right: "" },
          { id: crypto.randomUUID(), left: "", right: "" },
        ] as MatchingPair[],
        correct_answer: null,
      };
    case "scale":
      return {
        ...base, type,
        options: { min: 1, max: 10, minLabel: "", maxLabel: "", step: 1 } as ScaleConfig,
        correct_answer: null,
      };
  }
}

interface QuestionEditorProps {
  type: QuestionType;
  initialData?: QuestionData;
  onSave: (data: QuestionData) => void;
  onCancel: () => void;
  saving?: boolean;
}

export function QuestionEditor({
  type,
  initialData,
  onSave,
  onCancel,
  saving = false,
}: QuestionEditorProps) {
  const [data, setData] = useState<QuestionData>(
    initialData ?? getDefaultData(type)
  );

  function handleSave() {
    if (!data.content.trim()) return;
    onSave(data);
  }

  return (
    <Card className="bg-surface border-border-default shadow-card">
      <CardContent className="p-4 space-y-4">
        {/* Question content */}
        <div className="space-y-2">
          <Label className="text-text-primary text-sm">Enonce de la question</Label>
          <Input
            value={data.content}
            onChange={(e) => setData({ ...data, content: e.target.value })}
            placeholder="Saisissez votre question..."
            className="bg-background border-border-default text-text-primary"
          />
        </div>

        {/* Type-specific options */}
        {(type === "mcq_single" || type === "mcq_multiple") && (
          <McqOptionsEditor
            options={data.options as McqOption[]}
            correctAnswer={data.correct_answer as string | string[]}
            multiple={type === "mcq_multiple"}
            onChange={(options, correctAnswer) =>
              setData({ ...data, options, correct_answer: correctAnswer })
            }
          />
        )}

        {type === "true_false" && (
          <TrueFalseEditor
            correctAnswer={data.correct_answer as string}
            onChange={(correctAnswer) =>
              setData({ ...data, correct_answer: correctAnswer })
            }
          />
        )}

        {type === "free_text" && (
          <FreeTextEditor
            correctAnswer={data.correct_answer as string}
            onChange={(correctAnswer) =>
              setData({ ...data, correct_answer: correctAnswer })
            }
          />
        )}

        {type === "drag_order" && (
          <DragOrderEditor
            items={data.options as string[]}
            onChange={(items) => setData({ ...data, options: items })}
          />
        )}

        {type === "matching" && (
          <MatchingEditor
            pairs={data.options as MatchingPair[]}
            onChange={(pairs) => setData({ ...data, options: pairs })}
          />
        )}

        {type === "scale" && (
          <ScaleEditor
            config={data.options as ScaleConfig}
            correctAnswer={data.correct_answer as number | null}
            onChange={(config, correctAnswer) =>
              setData({ ...data, options: config, correct_answer: correctAnswer })
            }
          />
        )}

        {/* Feedback */}
        <div className="space-y-2">
          <Label className="text-text-secondary text-xs">
            Feedback (optionnel — affiche apres la reponse)
          </Label>
          <Input
            value={data.feedback}
            onChange={(e) => setData({ ...data, feedback: e.target.value })}
            placeholder="Explication de la bonne reponse..."
            className="bg-background border-border-default text-text-primary text-sm"
          />
        </div>

        {/* Points */}
        <div className="space-y-2">
          <Label className="text-text-secondary text-xs">Points</Label>
          <Input
            type="number"
            min={1}
            value={data.points}
            onChange={(e) =>
              setData({ ...data, points: Math.max(1, parseInt(e.target.value) || 1) })
            }
            className="w-20 bg-background border-border-default text-text-primary text-sm"
          />
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            className="flex-1 rounded-badge border-border-default text-text-primary"
          >
            Annuler
          </Button>
          <Button
            type="button"
            onClick={handleSave}
            disabled={saving || !data.content.trim()}
            className="flex-1 rounded-badge bg-accent-blue hover:bg-accent-blue-secondary text-background font-semibold"
          >
            {saving ? "Enregistrement..." : "Enregistrer"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export type { QuestionData };
```

- [ ] **Step 2: Verify build**

Run: `./node_modules/.bin/next build`
Expected: Build succeeds.

- [ ] **Step 3: Commit**

```bash
git add src/components/quiz/question-editor.tsx
git commit -m "feat: add question editor component with all 7 type editors"
```

---

### Task 9: Question item + sortable list with drag & drop

**Files:**
- Create: `src/components/quiz/question-item.tsx`
- Create: `src/components/quiz/question-list.tsx`

- [ ] **Step 1: Create question item (draggable)**

Create `src/components/quiz/question-item.tsx`:

```tsx
"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { Question, QuestionType } from "@/lib/types/database";

const typeLabels: Record<QuestionType, string> = {
  mcq_single: "QCM unique",
  mcq_multiple: "QCM multiple",
  true_false: "Vrai/Faux",
  free_text: "Texte libre",
  drag_order: "Ordonner",
  matching: "Association",
  scale: "Echelle",
};

interface QuestionItemProps {
  question: Question;
  index: number;
  onEdit: () => void;
  onDelete: () => void;
}

export function QuestionItem({ question, index, onEdit, onDelete }: QuestionItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: question.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-3 rounded-card border border-border-default bg-surface p-3"
    >
      {/* Drag handle */}
      <button
        {...attributes}
        {...listeners}
        className="shrink-0 cursor-grab touch-none text-text-secondary hover:text-text-primary"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
          <circle cx="9" cy="6" r="1.5" />
          <circle cx="15" cy="6" r="1.5" />
          <circle cx="9" cy="12" r="1.5" />
          <circle cx="15" cy="12" r="1.5" />
          <circle cx="9" cy="18" r="1.5" />
          <circle cx="15" cy="18" r="1.5" />
        </svg>
      </button>

      {/* Content */}
      <button onClick={onEdit} className="flex-1 min-w-0 text-left">
        <div className="flex items-center gap-2">
          <span className="text-xs text-text-secondary">{index + 1}.</span>
          <span className="text-sm font-medium text-text-primary truncate">
            {question.content || "Question sans titre"}
          </span>
        </div>
        <div className="mt-1 flex items-center gap-2">
          <span className="text-xs text-text-secondary">
            {typeLabels[question.type]}
          </span>
          <span className="text-xs text-text-secondary">
            · {question.points} pt{question.points > 1 ? "s" : ""}
          </span>
        </div>
      </button>

      {/* Delete */}
      <button
        onClick={onDelete}
        className="shrink-0 text-text-secondary hover:text-red-400"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="3 6 5 6 21 6" />
          <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" />
          <path d="M10 11v6" />
          <path d="M14 11v6" />
        </svg>
      </button>
    </div>
  );
}
```

- [ ] **Step 2: Create question list (sortable container)**

Create `src/components/quiz/question-list.tsx`:

```tsx
"use client";

import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { QuestionItem } from "./question-item";
import type { Question } from "@/lib/types/database";

interface QuestionListProps {
  questions: Question[];
  onReorder: (oldIndex: number, newIndex: number) => void;
  onEdit: (question: Question) => void;
  onDelete: (questionId: string) => void;
}

export function QuestionList({
  questions,
  onReorder,
  onEdit,
  onDelete,
}: QuestionListProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = questions.findIndex((q) => q.id === active.id);
    const newIndex = questions.findIndex((q) => q.id === over.id);
    onReorder(oldIndex, newIndex);
  }

  if (questions.length === 0) {
    return (
      <div className="rounded-card border border-border-default bg-surface p-6 text-center">
        <p className="text-text-secondary text-sm">Aucune question.</p>
        <p className="text-text-secondary text-xs mt-1">
          Appuyez sur + pour ajouter une question.
        </p>
      </div>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext
        items={questions.map((q) => q.id)}
        strategy={verticalListSortingStrategy}
      >
        <div className="space-y-2">
          {questions.map((question, index) => (
            <QuestionItem
              key={question.id}
              question={question}
              index={index}
              onEdit={() => onEdit(question)}
              onDelete={() => onDelete(question.id)}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}
```

- [ ] **Step 3: Verify build**

Run: `./node_modules/.bin/next build`
Expected: Build succeeds.

- [ ] **Step 4: Commit**

```bash
git add src/components/quiz/question-item.tsx src/components/quiz/question-list.tsx
git commit -m "feat: add sortable question list with drag & drop"
```

---

### Task 10: Quiz editor page

**Files:**
- Create: `src/app/(admin)/admin/quiz/[id]/edit/page.tsx`

- [ ] **Step 1: Create the quiz editor page**

Create `src/app/(admin)/admin/quiz/[id]/edit/page.tsx`:

```tsx
"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { arrayMove } from "@dnd-kit/sortable";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { QuestionList } from "@/components/quiz/question-list";
import { QuestionEditor, type QuestionData } from "@/components/quiz/question-editor";
import { QuestionTypePicker } from "@/components/quiz/question-type-picker";
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
  }, [quizId, supabase]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  async function handleAddQuestion(data: QuestionData) {
    setSaving(true);
    const { error } = await supabase.from("questions").insert({
      quiz_id: quizId,
      type: data.type,
      content: data.content,
      options: data.options,
      correct_answer: data.correct_answer,
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
        options: data.options,
        correct_answer: data.correct_answer,
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

      // Update order in DB
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

    // Update order in DB
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
      {/* Header */}
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

      {/* Content */}
      {editorState === "list" && (
        <>
          <QuestionList
            questions={questions}
            onReorder={handleReorder}
            onEdit={startEdit}
            onDelete={handleDeleteQuestion}
          />

          {/* Add question FAB */}
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
    </div>
  );
}
```

- [ ] **Step 2: Verify build**

Run: `./node_modules/.bin/next build`
Expected: `/admin/quiz/[id]/edit` appears in routes.

- [ ] **Step 3: Commit**

```bash
git add src/app/\(admin\)/admin/quiz/
git commit -m "feat: add quiz editor page with question CRUD and drag-to-reorder"
```

---

### Task 11: Quiz settings page

**Files:**
- Create: `src/components/quiz/quiz-settings-form.tsx`
- Create: `src/app/(admin)/admin/quiz/[id]/settings/page.tsx`

- [ ] **Step 1: Create settings form component**

Create `src/components/quiz/quiz-settings-form.tsx`:

```tsx
"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { QuizSettings } from "@/lib/types/database";

interface QuizSettingsFormProps {
  settings: QuizSettings;
  onChange: (settings: QuizSettings) => void;
}

export function QuizSettingsForm({ settings, onChange }: QuizSettingsFormProps) {
  function update(field: keyof QuizSettings, value: unknown) {
    onChange({ ...settings, [field]: value });
  }

  return (
    <div className="space-y-6">
      {/* Timer */}
      <div className="space-y-2">
        <Label className="text-text-primary text-sm">Temps limite (minutes)</Label>
        <Input
          type="number"
          min={0}
          value={settings.time_limit ?? ""}
          onChange={(e) =>
            update("time_limit", e.target.value ? parseInt(e.target.value) : null)
          }
          placeholder="Aucune limite"
          className="bg-background border-border-default text-text-primary"
        />
      </div>

      {/* Passing score */}
      <div className="space-y-2">
        <Label className="text-text-primary text-sm">Seuil de reussite (%)</Label>
        <Input
          type="number"
          min={0}
          max={100}
          value={settings.passing_score ?? ""}
          onChange={(e) =>
            update("passing_score", e.target.value ? parseInt(e.target.value) : null)
          }
          placeholder="Pas de seuil"
          className="bg-background border-border-default text-text-primary"
        />
      </div>

      {/* Max attempts */}
      <div className="space-y-2">
        <Label className="text-text-primary text-sm">Nombre max de tentatives</Label>
        <Input
          type="number"
          min={1}
          value={settings.max_attempts ?? ""}
          onChange={(e) =>
            update("max_attempts", e.target.value ? parseInt(e.target.value) : null)
          }
          placeholder="Illimite"
          className="bg-background border-border-default text-text-primary"
        />
      </div>

      {/* Toggles */}
      {[
        { key: "show_feedback" as const, label: "Afficher le feedback par question" },
        { key: "shuffle_questions" as const, label: "Melanger l'ordre des questions" },
        { key: "shuffle_answers" as const, label: "Melanger l'ordre des reponses" },
        { key: "allow_back_navigation" as const, label: "Autoriser le retour en arriere" },
      ].map(({ key, label }) => (
        <button
          key={key}
          type="button"
          onClick={() => update(key, !settings[key])}
          className="flex w-full items-center justify-between rounded-card border border-border-default bg-surface p-3"
        >
          <span className="text-sm text-text-primary">{label}</span>
          <div
            className={`h-6 w-11 rounded-full transition-colors ${
              settings[key] ? "bg-accent-blue" : "bg-[#333]"
            } relative`}
          >
            <div
              className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-transform ${
                settings[key] ? "translate-x-5" : "translate-x-0.5"
              }`}
            />
          </div>
        </button>
      ))}

      {/* Error message */}
      <div className="space-y-2">
        <Label className="text-text-primary text-sm">Message d&apos;erreur custom</Label>
        <Input
          value={settings.error_message ?? ""}
          onChange={(e) =>
            update("error_message", e.target.value || null)
          }
          placeholder="Message par defaut"
          className="bg-background border-border-default text-text-primary"
        />
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Create settings page**

Create `src/app/(admin)/admin/quiz/[id]/settings/page.tsx`:

```tsx
"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { QuizSettingsForm } from "@/components/quiz/quiz-settings-form";
import { QuizPublishDialog } from "@/components/quiz/quiz-publish-dialog";
import type { Quiz, QuizSettings } from "@/lib/types/database";

export default function QuizSettingsPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const quizId = params.id;

  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [settings, setSettings] = useState<QuizSettings | null>(null);
  const [saving, setSaving] = useState(false);
  const [showPublish, setShowPublish] = useState(false);
  const [loading, setLoading] = useState(true);

  const supabase = createClient();

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from("quizzes")
        .select("*")
        .eq("id", quizId)
        .single();

      if (data) {
        setQuiz(data);
        setSettings(data.settings);
      }
      setLoading(false);
    }
    load();
  }, [quizId, supabase]);

  async function handleSave() {
    if (!settings) return;
    setSaving(true);

    await supabase
      .from("quizzes")
      .update({ settings })
      .eq("id", quizId);

    setSaving(false);
    router.push(`/admin/quiz/${quizId}/edit`);
  }

  async function handlePublish() {
    await supabase
      .from("quizzes")
      .update({ status: "published" })
      .eq("id", quizId);

    setQuiz((q) => (q ? { ...q, status: "published" } : null));
    setShowPublish(true);
  }

  async function handleUnpublish() {
    await supabase
      .from("quizzes")
      .update({ status: "draft" })
      .eq("id", quizId);

    setQuiz((q) => (q ? { ...q, status: "draft" } : null));
  }

  async function handleDelete() {
    if (!confirm("Supprimer ce questionnaire ?")) return;

    await supabase.from("quizzes").delete().eq("id", quizId);
    router.push("/admin");
  }

  if (loading) {
    return (
      <div className="px-4 pt-6">
        <p className="text-text-secondary">Chargement...</p>
      </div>
    );
  }

  if (!quiz || !settings) {
    return (
      <div className="px-4 pt-6">
        <p className="text-text-secondary">Quiz introuvable.</p>
      </div>
    );
  }

  return (
    <div className="px-4 pt-6 pb-32">
      <button
        onClick={() => router.push(`/admin/quiz/${quizId}/edit`)}
        className="text-xs text-accent-blue hover:text-accent-blue-light mb-1 inline-block"
      >
        ← Retour a l&apos;editeur
      </button>
      <h1 className="text-xl font-bold text-text-primary mb-6">Parametres</h1>

      <Card className="bg-surface border-border-default shadow-card mb-6">
        <CardHeader>
          <CardTitle className="text-lg text-text-primary">Configuration</CardTitle>
        </CardHeader>
        <CardContent>
          <QuizSettingsForm settings={settings} onChange={setSettings} />
        </CardContent>
      </Card>

      {/* Save */}
      <Button
        onClick={handleSave}
        disabled={saving}
        className="w-full rounded-badge bg-accent-blue hover:bg-accent-blue-secondary text-background font-semibold mb-4"
      >
        {saving ? "Enregistrement..." : "Enregistrer les parametres"}
      </Button>

      {/* Publish / Unpublish */}
      <Card className="bg-surface border-border-default shadow-card mb-4">
        <CardContent className="p-4">
          <h3 className="text-sm font-semibold text-text-primary mb-2">Publication</h3>
          {quiz.status === "published" ? (
            <div className="space-y-2">
              <p className="text-xs text-text-secondary">Ce quiz est publie et accessible.</p>
              <div className="flex gap-2">
                <Button
                  onClick={() => setShowPublish(true)}
                  variant="outline"
                  size="sm"
                  className="rounded-badge border-border-default text-text-primary"
                >
                  Voir le lien
                </Button>
                <Button
                  onClick={handleUnpublish}
                  variant="outline"
                  size="sm"
                  className="rounded-badge border-border-default text-status-draft"
                >
                  Depublier
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-xs text-text-secondary">Publiez pour generer un lien partageable.</p>
              <Button
                onClick={handlePublish}
                size="sm"
                className="rounded-badge bg-accent-blue hover:bg-accent-blue-secondary text-background font-semibold"
              >
                Publier
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete */}
      <Card className="bg-surface border-red-400/20 shadow-card">
        <CardContent className="p-4">
          <h3 className="text-sm font-semibold text-red-400 mb-2">Zone de danger</h3>
          <Button
            onClick={handleDelete}
            variant="outline"
            size="sm"
            className="rounded-badge border-red-400/30 text-red-400 hover:bg-red-400/10"
          >
            Supprimer ce questionnaire
          </Button>
        </CardContent>
      </Card>

      {/* Publish dialog */}
      {showPublish && (
        <QuizPublishDialog
          quizId={quizId}
          quizTitle={quiz.title}
          onClose={() => setShowPublish(false)}
        />
      )}
    </div>
  );
}
```

- [ ] **Step 3: Verify build**

Run: `./node_modules/.bin/next build`
Expected: Build succeeds (will fail until Task 12 creates QuizPublishDialog — do both tasks together).

- [ ] **Step 4: Commit** (after Task 12)

---

### Task 12: Publish dialog with link + QR code

**Files:**
- Create: `src/components/quiz/quiz-publish-dialog.tsx`

- [ ] **Step 1: Create the publish dialog**

Create `src/components/quiz/quiz-publish-dialog.tsx`:

```tsx
"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import QRCode from "qrcode";

interface QuizPublishDialogProps {
  quizId: string;
  quizTitle: string;
  onClose: () => void;
}

export function QuizPublishDialog({
  quizId,
  quizTitle,
  onClose,
}: QuizPublishDialogProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [copied, setCopied] = useState(false);

  const quizUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/q/${quizId}`
      : `/q/${quizId}`;

  useEffect(() => {
    if (canvasRef.current) {
      QRCode.toCanvas(canvasRef.current, quizUrl, {
        width: 200,
        margin: 2,
        color: { dark: "#f0f0f0", light: "#0D0D0F" },
      });
    }
  }, [quizUrl]);

  async function copyLink() {
    await navigator.clipboard.writeText(quizUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-sm rounded-card bg-surface border border-border-default shadow-card p-6">
        <h2 className="text-lg font-bold text-text-primary text-center mb-1">
          Quiz publie
        </h2>
        <p className="text-xs text-text-secondary text-center mb-4">
          {quizTitle}
        </p>

        {/* QR Code */}
        <div className="flex justify-center mb-4">
          <canvas ref={canvasRef} />
        </div>

        {/* Link */}
        <div className="flex items-center gap-2 rounded-lg border border-border-default bg-background p-2 mb-4">
          <span className="flex-1 text-xs text-text-secondary truncate">
            {quizUrl}
          </span>
          <Button
            onClick={copyLink}
            size="sm"
            variant="outline"
            className="shrink-0 rounded-badge border-border-default text-text-primary text-xs"
          >
            {copied ? "Copie !" : "Copier"}
          </Button>
        </div>

        <Button
          onClick={onClose}
          className="w-full rounded-badge bg-accent-blue hover:bg-accent-blue-secondary text-background font-semibold"
        >
          Fermer
        </Button>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify build**

Run: `./node_modules/.bin/next build`
Expected: Build succeeds, all new routes appear.

- [ ] **Step 3: Commit Tasks 11 + 12**

```bash
git add src/components/quiz/quiz-settings-form.tsx src/components/quiz/quiz-publish-dialog.tsx src/app/\(admin\)/admin/quiz/
git commit -m "feat: add quiz settings, publish/unpublish, and QR code dialog"
```

---

### Task 13: Quiz preview

**Files:**
- Create: `src/components/quiz/question-preview.tsx`
- Create: `src/components/quiz/quiz-preview.tsx`

- [ ] **Step 1: Create question preview renderer**

Create `src/components/quiz/question-preview.tsx`:

```tsx
"use client";

import { useState } from "react";
import type { Question, QuestionType, McqOption, ScaleConfig, MatchingPair } from "@/lib/types/database";

interface QuestionPreviewProps {
  question: Question;
  index: number;
  total: number;
}

export function QuestionPreview({ question, index, total }: QuestionPreviewProps) {
  const [selectedAnswer, setSelectedAnswer] = useState<unknown>(null);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-xs text-text-secondary">
          Question {index + 1} / {total}
        </span>
        <span className="text-xs text-text-secondary">
          {question.points} pt{question.points > 1 ? "s" : ""}
        </span>
      </div>

      <h2 className="text-lg font-semibold text-text-primary">
        {question.content}
      </h2>

      {/* MCQ Single / Multiple */}
      {(question.type === "mcq_single" || question.type === "mcq_multiple") && (
        <div className="space-y-2">
          {(question.options as McqOption[]).map((opt) => {
            const isSelected = question.type === "mcq_multiple"
              ? (selectedAnswer as string[] || []).includes(opt.id)
              : selectedAnswer === opt.id;

            return (
              <button
                key={opt.id}
                onClick={() => {
                  if (question.type === "mcq_multiple") {
                    const arr = (selectedAnswer as string[]) || [];
                    setSelectedAnswer(
                      arr.includes(opt.id)
                        ? arr.filter((id) => id !== opt.id)
                        : [...arr, opt.id]
                    );
                  } else {
                    setSelectedAnswer(opt.id);
                  }
                }}
                className={`w-full text-left rounded-card border p-3 text-sm transition-colors ${
                  isSelected
                    ? "border-accent-blue bg-accent-blue/10 text-text-primary"
                    : "border-border-default text-text-secondary hover:border-border-strong"
                }`}
              >
                {opt.text}
              </button>
            );
          })}
        </div>
      )}

      {/* True / False */}
      {question.type === "true_false" && (
        <div className="flex gap-3">
          {["Vrai", "Faux"].map((label, i) => {
            const value = i === 0 ? "true" : "false";
            return (
              <button
                key={value}
                onClick={() => setSelectedAnswer(value)}
                className={`flex-1 rounded-card border p-3 text-center text-sm font-medium transition-colors ${
                  selectedAnswer === value
                    ? "border-accent-blue bg-accent-blue/10 text-accent-blue"
                    : "border-border-default text-text-secondary"
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>
      )}

      {/* Free text */}
      {question.type === "free_text" && (
        <textarea
          value={(selectedAnswer as string) || ""}
          onChange={(e) => setSelectedAnswer(e.target.value)}
          placeholder="Votre reponse..."
          rows={3}
          className="w-full rounded-lg border border-border-default bg-background px-3 py-2 text-sm text-text-primary placeholder:text-text-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-blue"
        />
      )}

      {/* Drag order (simplified as numbered list in preview) */}
      {question.type === "drag_order" && (
        <div className="space-y-2">
          {(question.options as string[]).map((item, i) => (
            <div
              key={i}
              className="flex items-center gap-2 rounded-card border border-border-default p-3"
            >
              <span className="text-xs text-text-secondary">{i + 1}.</span>
              <span className="text-sm text-text-primary">{item}</span>
            </div>
          ))}
          <p className="text-xs text-text-secondary italic">
            (Les elements seront melanges et deplacables dans la version finale)
          </p>
        </div>
      )}

      {/* Matching (simplified display) */}
      {question.type === "matching" && (
        <div className="space-y-2">
          {(question.options as MatchingPair[]).map((pair) => (
            <div
              key={pair.id}
              className="flex items-center gap-2 rounded-card border border-border-default p-3"
            >
              <span className="text-sm text-text-primary flex-1">{pair.left}</span>
              <span className="text-text-secondary">→</span>
              <span className="text-sm text-text-primary flex-1">{pair.right}</span>
            </div>
          ))}
          <p className="text-xs text-text-secondary italic">
            (Les paires seront melangees dans la version finale)
          </p>
        </div>
      )}

      {/* Scale */}
      {question.type === "scale" && (() => {
        const config = question.options as ScaleConfig;
        return (
          <div className="space-y-2">
            <div className="flex justify-between text-xs text-text-secondary">
              <span>{config.minLabel || config.min}</span>
              <span>{config.maxLabel || config.max}</span>
            </div>
            <input
              type="range"
              min={config.min}
              max={config.max}
              step={config.step}
              value={(selectedAnswer as number) ?? config.min}
              onChange={(e) => setSelectedAnswer(parseInt(e.target.value))}
              className="w-full accent-accent-blue"
            />
            <div className="text-center text-sm text-text-primary">
              {(selectedAnswer as number) ?? config.min}
            </div>
          </div>
        );
      })()}
    </div>
  );
}
```

- [ ] **Step 2: Create quiz preview modal**

Create `src/components/quiz/quiz-preview.tsx`:

```tsx
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { QuestionPreview } from "./question-preview";
import type { Question } from "@/lib/types/database";

interface QuizPreviewProps {
  title: string;
  questions: Question[];
  onClose: () => void;
}

export function QuizPreview({ title, questions, onClose }: QuizPreviewProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  if (questions.length === 0) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
        <div className="w-full max-w-sm rounded-card bg-surface border border-border-default p-6 text-center">
          <p className="text-text-secondary">Aucune question a previsualiser.</p>
          <Button onClick={onClose} className="mt-4 rounded-badge bg-accent-blue text-background">
            Fermer
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-background">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border-default px-4 py-3">
        <span className="text-sm font-semibold text-text-primary">{title}</span>
        <button
          onClick={onClose}
          className="text-text-secondary hover:text-text-primary"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>

      {/* Progress */}
      <div className="h-1 bg-[#222]">
        <div
          className="h-full bg-accent-blue transition-all"
          style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
        />
      </div>

      {/* Question */}
      <div className="flex-1 overflow-auto px-4 py-6">
        <QuestionPreview
          question={questions[currentIndex]}
          index={currentIndex}
          total={questions.length}
        />
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between border-t border-border-default px-4 py-3">
        <Button
          variant="outline"
          size="sm"
          disabled={currentIndex === 0}
          onClick={() => setCurrentIndex(currentIndex - 1)}
          className="rounded-badge border-border-default text-text-primary"
        >
          Precedent
        </Button>
        <span className="text-xs text-text-secondary">
          {currentIndex + 1} / {questions.length}
        </span>
        {currentIndex < questions.length - 1 ? (
          <Button
            size="sm"
            onClick={() => setCurrentIndex(currentIndex + 1)}
            className="rounded-badge bg-accent-blue text-background"
          >
            Suivant
          </Button>
        ) : (
          <Button
            size="sm"
            onClick={onClose}
            className="rounded-badge bg-accent-blue text-background"
          >
            Terminer
          </Button>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Add preview button to quiz editor page**

In `src/app/(admin)/admin/quiz/[id]/edit/page.tsx`, add the import and preview state:

After existing imports, add:
```tsx
import { QuizPreview } from "@/components/quiz/quiz-preview";
```

Add state in the component:
```tsx
const [showPreview, setShowPreview] = useState(false);
```

Add the preview button next to "Parametres" in the header:
```tsx
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
```

Add the preview modal before the closing `</div>` of the component:
```tsx
{showPreview && (
  <QuizPreview
    title={quiz.title}
    questions={questions}
    onClose={() => setShowPreview(false)}
  />
)}
```

- [ ] **Step 4: Verify build**

Run: `./node_modules/.bin/next build`
Expected: Build succeeds with 0 errors.

- [ ] **Step 5: Commit**

```bash
git add src/components/quiz/question-preview.tsx src/components/quiz/quiz-preview.tsx src/app/\(admin\)/admin/quiz/
git commit -m "feat: add quiz preview mode with question navigation"
```

---

### Task 14: Final build verification and cleanup

- [ ] **Step 1: Full build check**

Run: `./node_modules/.bin/next build`
Expected: Build succeeds. Routes should include:

```
○ /
○ /_not-found
ƒ /admin
ƒ /admin/pages
ƒ /admin/profile
ƒ /admin/stats
○ /auth/login
○ /auth/register
ƒ /admin/quiz/new
ƒ /admin/quiz/[id]/edit
ƒ /admin/quiz/[id]/settings
ƒ /manager
ƒ /manager/content
ƒ /manager/stats
ƒ /manager/users
ƒ /p/[id]
ƒ /q/[id]
```

- [ ] **Step 2: Lint check**

Run: `npx next lint`
Expected: No errors (warnings acceptable).

- [ ] **Step 3: Final commit if any files were adjusted**

```bash
git add -A
git commit -m "chore: Phase 2 cleanup and final verification"
```
