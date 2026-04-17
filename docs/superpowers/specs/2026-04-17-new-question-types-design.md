# New Question Types — Design Spec

## Context

The quiz platform currently supports 7 question types: `mcq_single`, `mcq_multiple`, `true_false`, `free_text`, `drag_order`, `matching`, `scale`. A brewery (Little Atlantique Brewery) uses the platform to train employees on beer knowledge, keg operations, pouring techniques, etc. The current types lack visual/interactive engagement for hands-on training scenarios.

## Scope

Add 5 new question types + a cross-cutting `partial_scoring` feature. No refactoring of existing architecture — new types integrate into the current switch/case pattern.

---

## New Question Types

### 1. Image MCQ (`image_mcq`)

Show an image and let the participant choose among text or image options.

**Use case:** "Quelle biere est-ce ?" with a photo, or "Identifie cette piece" with image choices.

**Admin editor:**
- Image principale uploaded via `media_url` (existing field)
- Options: list of `ImageMcqOption` — each has text + optional image URL
- Admin checks the correct option(s)
- If multiple correct answers → behaves like `mcq_multiple`

**Player rendering:**
- Image displayed prominently at top
- Options as clickable cards: image thumbnail (if present) + text label
- Grid layout: 2 columns on desktop, 1 on mobile

**Types:**
```typescript
interface ImageMcqOption {
  id: string;
  text: string;
  imageUrl: string | null;
}
// Question.options: ImageMcqOption[]
// Question.correct_answer: string | string[]  (option id(s))
```

**Scoring:** Same as `mcq_single`/`mcq_multiple`. Supports `partial_scoring` when multiple correct answers.

---

### 2. Hotspot (`hotspot`)

Click on the correct zone of an image.

**Use case:** "Cliquez sur la vanne de sortie de biere" on a keg system diagram.

**Admin editor:**
- Upload image via `media_url`
- Click on the image to place a point → stores (x, y) as percentage of image dimensions
- Slider to set tolerance radius (% of image width), default 5%
- Can place multiple correct zones (e.g., "click on any of the cast iron columns")
- Visual preview: circles drawn on image showing zones

**Player rendering:**
- Image displayed, clickable
- On click: marker appears at click position
- Can re-click to move the marker before submitting
- Single click expected (not multi-click)

**Types:**
```typescript
interface HotspotZone {
  x: number;       // 0-100, % from left
  y: number;       // 0-100, % from top
  radius: number;  // tolerance radius, % of image width
}
// Question.options: null
// Question.correct_answer: HotspotZone[]
```

**Scoring:** Correct if the click falls within the radius of at least one zone. Distance calculated as Euclidean distance in percentage space. Supports `partial_scoring` when multiple zones exist (not applicable for single-zone — it's binary).

---

### 3. Categorize (`categorize`)

Sort items into categories by drag & drop.

**Use case:** "Classe ces bieres : Ale ou Lager ?", "Fermentation haute ou basse ?"

**Admin editor:**
- Define 2-4 categories with labels (e.g., "Ale", "Lager")
- Add items to sort (e.g., "Wipe Out", "Winch", "Sainte Barbe")
- Assign each item to its correct category via dropdown

**Player rendering:**
- Categories displayed as columns/zones (side by side on desktop, stacked on mobile)
- Items listed in a shuffled pool at the top/center
- Drag & drop items into categories
- Mobile fallback: tap item then tap target category
- Uses `@dnd-kit` (already in project)

**Types:**
```typescript
interface CategorizeConfig {
  categories: { id: string; label: string }[];
  items: { id: string; text: string }[];
}
// Question.options: CategorizeConfig
// Question.correct_answer: Record<string, string>  // { itemId: categoryId }
```

**Scoring:** With `partial_scoring`: proportional (4/6 correct = 66% of points). Without: all-or-nothing.

---

### 4. Numeric (`numeric`)

Enter a number with tolerance range.

**Use case:** "A quelle temperature doit fermenter une Ale ?", "Combien d'IBU pour l'Exocet ?"

**Admin editor:**
- Correct value input (number)
- Tolerance input (±number), default 0
- Optional unit label (e.g., "°C", "IBU", "%", "L", "g")

**Player rendering:**
- Number input field with unit displayed next to it
- Triggers numeric keyboard on mobile (`inputMode="decimal"`)

**Types:**
```typescript
interface NumericConfig {
  correctValue: number;
  tolerance: number;
  unit: string | null;
}
// Question.options: NumericConfig
// Question.correct_answer: number
```

**Scoring:** Correct if `|userAnswer - correctValue| <= tolerance`. Binary (no partial scoring).

---

### 5. Video Choice (`video_choice`)

Watch multiple short video clips and select the correct one.

**Use case:** "Parmi ces 3 videos de tirage, laquelle montre la bonne technique ?"

**Admin editor:**
- Add 2-4 video options
- Each video: upload file OR paste YouTube/Vimeo URL (auto-detect provider)
- Label for each video (default: "Video A", "Video B", etc.)
- Check the correct video(s)

**Player rendering:**
- Grid of video players (2 columns desktop, 1 mobile)
- Each video has play/pause controls
- Click/tap on a video card to select it (highlighted border)
- Can change selection before submitting
- YouTube/Vimeo: embedded iframe player
- Upload: native `<video>` element

**Types:**
```typescript
interface VideoChoiceOption {
  id: string;
  label: string;
  url: string;
  provider: "upload" | "youtube" | "vimeo";
}
// Question.options: VideoChoiceOption[]
// Question.correct_answer: string | string[]  (option id(s))
```

**Scoring:** Same as `mcq_single`/`mcq_multiple`. Supports `partial_scoring` when multiple correct answers.

---

## Cross-Cutting: Partial Scoring

**New field on `Question`:**
```typescript
partial_scoring: boolean;  // default: false
```

**Per-question toggle**, visible only on types that support it:
- `mcq_multiple` (existing)
- `matching` (existing)
- `drag_order` (existing)
- `categorize` (new)
- `hotspot` (new, multi-zone only)
- `image_mcq` (new, multi-answer only)
- `video_choice` (new, multi-answer only)

**Scoring logic per type:**
- `mcq_multiple` / `image_mcq` / `video_choice`: correct_count / total_correct_count
- `matching` / `categorize`: correct_pairs / total_pairs
- `drag_order`: correct_positions / total_positions
- `hotspot` (multi): not applicable (single click → binary per zone)

**Database:** Add `partial_scoring boolean DEFAULT false` column to `questions` table.

---

## Updated QuestionType Union

```typescript
export type QuestionType =
  | "mcq_single"
  | "mcq_multiple"
  | "true_false"
  | "free_text"
  | "drag_order"
  | "matching"
  | "scale"
  | "image_mcq"      // new
  | "hotspot"         // new
  | "categorize"      // new
  | "numeric"         // new
  | "video_choice";   // new
```

---

## Files to Modify

1. **`src/lib/types/database.ts`** — Add types, interfaces, update `QuestionType`, add `partial_scoring` to `Question`
2. **`src/components/quiz/question-type-picker.tsx`** — Add 5 new entries with icons/descriptions
3. **`src/components/quiz/question-preview.tsx`** — Add rendering for 5 new types
4. **`src/components/quiz/quiz-player.tsx`** — Add `checkAnswer()` logic for 5 new types + partial scoring
5. **New files — Options editors:**
   - `src/components/quiz/options-editor-image-mcq.tsx`
   - `src/components/quiz/options-editor-hotspot.tsx`
   - `src/components/quiz/options-editor-categorize.tsx`
   - `src/components/quiz/options-editor-numeric.tsx`
   - `src/components/quiz/options-editor-video-choice.tsx`
6. **`src/app/(admin)/admin/quiz/[id]/edit/page.tsx`** — Wire up new editors + partial_scoring toggle
7. **`src/components/quiz/question-item.tsx`** — Add labels for new types
8. **Supabase migration** — `ALTER TABLE questions ADD COLUMN partial_scoring boolean DEFAULT false`

## Storage

Image and video uploads use the existing `page-images` Supabase storage bucket (or a new `quiz-media` bucket if separation is preferred).
