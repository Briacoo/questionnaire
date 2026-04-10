# Questionnaire Platform — Design Spec

## Overview

Plateforme web (PWA) de creation de questionnaires en ligne, mobile first. Destinee a la formation en entreprise et a un usage generaliste. Les admins creent des questionnaires et des pages de revision, les users y accedent via lien ou QR code, les managers supervisent la plateforme.

## Stack technique

- **Frontend** : Next.js 14+ (App Router), TypeScript, Tailwind CSS, shadcn/ui, Framer Motion
- **Backend/BDD** : Supabase (PostgreSQL, Auth, Storage, Row Level Security)
- **Hebergement** : Vercel (free tier)
- **PWA** : next-pwa (manifest, service worker, installable)
- **Architecture** : Monolithe Next.js, routes groupees par role

## Roles

| Role | Description | Acces |
|------|-------------|-------|
| Manager | Super-admin plateforme. Voit tout, modere, gere les comptes | `/manager/*` |
| Admin | Createur de contenu. Cree ses quiz, pages, voit ses stats | `/admin/*` |
| User | Anonyme. Accede aux quiz/pages via lien ou QR code | `/q/*`, `/p/*` |

## Routes

```
/                          Landing page
/auth/login                Connexion (pseudo + mot de passe)
/auth/register             Inscription admin (pseudo unique + mot de passe)

/admin                     Dashboard admin (mes quiz, mes pages)
/admin/quiz/new            Creer un questionnaire
/admin/quiz/[id]/edit      Editer un questionnaire
/admin/quiz/[id]/settings  Parametres du quiz
/admin/quiz/[id]/stats     Statistiques du questionnaire
/admin/pages/new           Creer une page de revision
/admin/pages/[id]/edit     Editeur de blocs (CMS)

/manager                   Dashboard manager (stats plateforme)
/manager/users             Gestion des comptes admin
/manager/content           Moderation questionnaires et pages
/manager/stats             Stats globales plateforme

/q/[id]                    Passer un questionnaire (public)
/q/[id]/result             Resultat apres soumission
/p/[id]                    Page de revision (public)
```

### Layouts (Next.js App Router)

- `(auth)` : layout minimaliste centre
- `(admin)` : bottom nav mobile (Quiz, Pages, Stats, Profil)
- `(manager)` : bottom nav mobile (Dashboard, Users, Contenu, Stats)
- `(public)` : layout leger, navbar + footer app

## Modele de donnees

### profiles

| Colonne | Type | Notes |
|---------|------|-------|
| id | uuid PK | = auth.user.id (Supabase Auth) |
| pseudo | text UNIQUE | Not null |
| role | enum | 'admin' ou 'manager' |
| avatar_url | text | Nullable |
| created_at | timestamptz | |

Les mots de passe sont geres par Supabase Auth dans `auth.users` (table systeme chiffree). La table `profiles` ne stocke que les infos metier.

### quizzes

| Colonne | Type | Notes |
|---------|------|-------|
| id | uuid PK | |
| admin_id | FK profiles | |
| title | text | |
| description | text | Nullable |
| cover_image_url | text | Photo de couverture optionnelle |
| status | enum | 'draft', 'published', 'archived' |
| settings | jsonb | Voir detail ci-dessous |
| created_at | timestamptz | |
| updated_at | timestamptz | |

### quiz settings (JSONB dans quizzes.settings)

| Champ | Type | Notes |
|-------|------|-------|
| time_limit | int nullable | Minutes. Null = pas de limite |
| passing_score | int nullable | 0-100. Null = pas de seuil |
| show_feedback | bool | Afficher feedback par question |
| shuffle_questions | bool | Melanger l'ordre des questions |
| shuffle_answers | bool | Melanger l'ordre des reponses |
| allow_back_navigation | bool | Autoriser le retour a la question precedente |
| error_message | text nullable | Message custom quand le user se trompe |
| entry_form_fields | json array | Ex: ["firstName", "lastName"] |
| max_attempts | int nullable | Null = illimite |

### questions

| Colonne | Type | Notes |
|---------|------|-------|
| id | uuid PK | |
| quiz_id | FK quizzes | |
| type | enum | 'mcq_single', 'mcq_multiple', 'true_false', 'free_text', 'drag_order', 'matching', 'scale' |
| content | text | Enonce de la question |
| media_url | text nullable | Image/video jointe |
| options | jsonb | Choix, paires, echelle selon le type |
| correct_answer | jsonb | Reponse(s) correcte(s) |
| feedback | text nullable | Explication specifique a cette question |
| points | int | Default 1 |
| order | int | Position dans le quiz |

Le systeme de types de questions est extensible : ajouter un nouveau type = ajouter une valeur a l'enum + un composant `QuestionRenderer` correspondant.

### submissions

| Colonne | Type | Notes |
|---------|------|-------|
| id | uuid PK | |
| quiz_id | FK quizzes | |
| participant_name | text nullable | Nom/prenom si formulaire d'entree |
| participant_info | jsonb | Champs custom du formulaire |
| score | float | |
| passed | bool nullable | Null si pas de seuil defini |
| started_at | timestamptz | |
| completed_at | timestamptz | |
| time_spent | int | Secondes |

### answers

| Colonne | Type | Notes |
|---------|------|-------|
| id | uuid PK | |
| submission_id | FK submissions | |
| question_id | FK questions | |
| response | jsonb | La reponse donnee |
| is_correct | bool | |
| time_spent | int | Secondes sur cette question |

### pages

| Colonne | Type | Notes |
|---------|------|-------|
| id | uuid PK | |
| admin_id | FK profiles | |
| quiz_id | FK quizzes nullable | Quiz associe (optionnel) |
| title | text | |
| slug | text UNIQUE | Pour l'URL /p/[slug] |
| blocks | jsonb | Arbre de blocs (voir structure) |
| status | enum | 'draft', 'published' |
| created_at | timestamptz | |
| updated_at | timestamptz | |

### Storage (Supabase Storage)

Bucket `media` pour les images, videos, PDFs uploades par les admins.

### Structure des blocs (pages.blocks)

Arbre JSON. Chaque bloc a un id, un type, des props, et optionnellement des children (imbrication).

```json
[
  {
    "id": "block-1",
    "type": "section",
    "props": { "background": "#1A1A1F" },
    "children": [
      { "id": "block-2", "type": "heading", "props": { "level": 2, "text": "Introduction" } },
      { "id": "block-3", "type": "text", "props": { "content": "Bienvenue..." } },
      { "id": "block-4", "type": "image", "props": { "url": "...", "caption": "..." } }
    ]
  },
  {
    "id": "block-5",
    "type": "carousel",
    "props": { "images": ["url1", "url2"] }
  }
]
```

Types de blocs disponibles :
- heading (H1, H2, H3)
- text (paragraphe, rich text basique)
- image (avec legende optionnelle)
- video (embed YouTube/Vimeo ou upload)
- pdf (viewer integre)
- section (conteneur qui regroupe d'autres blocs)
- separator (ligne horizontale)
- alert (encadre colore pour info importante)
- list (a puces / numerotee)
- button
- carousel
- banner (image/video pleine largeur)

Extensible : ajouter un type = ajouter un composant `BlockRenderer`.

## Permissions (Row Level Security)

| Table | Admin | Manager | Public (anonyme) |
|-------|-------|---------|-------------------|
| profiles | Lire/modifier le sien | Lire/modifier/supprimer tous | Non |
| quizzes | CRUD sur les siens | CRUD sur tous | Lire si published |
| questions | CRUD sur ses quiz | CRUD sur tous | Lire si quiz published |
| submissions | Lire celles de ses quiz | Lire toutes | Creer (soumettre) |
| answers | Lire celles de ses quiz | Lire toutes | Creer (soumettre) |
| pages | CRUD sur les siennes | CRUD sur toutes | Lire si published |

Middleware Next.js :
- `/admin/*` verifie role admin ou manager
- `/manager/*` verifie role manager uniquement
- `/q/*` et `/p/*` acces libre, pas d'auth requise

## Design System — Dark Liquid

| Token | Valeur |
|-------|--------|
| Background | #0D0D0F |
| Surface (cartes) | #1A1A1F |
| Text primary | #f0f0f0 |
| Text secondary | #666666 |
| Accent primary | #7BA7CC |
| Accent secondary | #5B8DB8 |
| Accent light | #A8C4E0 |
| Border radius cards | 12px |
| Border radius badges/buttons | 8px |
| Border radius FAB | 14px |
| Borders | rgba(123, 167, 204, 0.08) a rgba(123, 167, 204, 0.15) |
| Shadows | Subtiles, noires rgba(0,0,0,0.3) |
| Icons | SVG stroke 1.8px, pas d'emoji |
| Status published | bg rgba(123,167,204,0.15), text #7BA7CC |
| Status draft | bg rgba(196,139,60,0.15), text #C48B3C |

Approche mobile first. Styles de base = mobile, breakpoints `md:` et `lg:` pour desktop.

## Flux utilisateur

### Admin — Creer un questionnaire

1. Dashboard, bouton "+", formulaire titre + description + photo de couverture optionnelle
2. Editeur de questions : ajouter une par une, choisir le type, long press + drag pour reordonner
3. Settings : timer, seuil, feedback par question, formulaire d'entree, autoriser/interdire retour arriere, message d'erreur custom
4. Preview : tester le quiz comme un user
5. Publier : lien unique + QR code via menu contextuel (trois points)

### Admin — Creer une page de revision

1. Dashboard, onglet Pages, bouton "+"
2. Associer a un quiz (optionnel)
3. Editeur de blocs : ajouter/imbriquer, long press + drag pour reordonner
4. Preview
5. Publier : lien unique + QR code

### User — Passer un questionnaire

1. Scan QR code ou clic lien, arrive sur /q/[id]
2. Page d'accueil : titre, description, nombre de questions, duree estimee
3. Si formulaire d'entree active : saisir nom/prenom
4. Questions une par une (swipe ou bouton suivant), retour arriere selon config
5. Timer visible si active
6. Soumission, calcul du score
7. Page resultat : score, reussite/echec si seuil, feedback par question si active

### Manager

1. Dashboard : stats globales (nombre d'admins, de quiz, de passages)
2. Gestion comptes : liste des admins, supprimer/suspendre
3. Moderation : voir tous les quiz et pages, supprimer si necessaire

## Architecture technique

### Structure du projet

```
src/
  app/
    (auth)/              login, register
    (admin)/             dashboard, quiz editor, page editor, stats
    (manager)/           gestion plateforme
    (public)/            /q/[id], /p/[id]
    layout.tsx           root layout (PWA manifest, fonts)
    page.tsx             landing page
  components/
    ui/                  shadcn/ui customises (dark theme)
    quiz/                QuestionCard, Timer, ProgressBar...
    editor/              BlockRenderer, BlockToolbar, DragHandle...
    stats/               graphiques et tableaux
  lib/
    supabase/            client, server, middleware helpers
    types/               types TypeScript (Quiz, Question, Block, etc.)
    utils/               QR code gen, scoring, export CSV/PDF
  hooks/                 useQuiz, useBlocks, useStats...
  styles/
    globals.css          Tailwind config, variables CSS dark theme
```

### Composants cles

| Composant | Role |
|-----------|------|
| QuizEditor | Creer/editer les questions, long press + drag pour reordonner |
| QuestionRenderer | Affiche une question selon son type (MCQ, drag, matching...) |
| BlockEditor | Editeur CMS, empiler/imbriquer des blocs, long press + drag |
| BlockRenderer | Affiche un bloc selon son type (titre, image, carousel...) |
| StatsBoard | Dashboard graphiques |
| QRGenerator | Genere le QR code a la volee |
| Timer | Compte a rebours configurable |
| ScoreCard | Affichage du resultat avec feedback |

### Librairies

| Librairie | Usage |
|-----------|-------|
| @dnd-kit/core | Drag-and-drop (questions + blocs) |
| recharts | Graphiques stats |
| qrcode | Generation QR |
| jspdf | Export PDF |
| papaparse | Export CSV |
| framer-motion | Animations liquid UI |
| next-pwa | Configuration PWA |

## Phases de livraison

### Phase 1 — Fondations

- Setup Next.js + Tailwind + shadcn/ui (dark theme)
- Supabase : BDD, auth, storage
- Design system : composants de base, theme Dark Liquid
- Layout mobile first (navbar, bottom nav, structure de routes)
- Auth : inscription/connexion (pseudo unique + mot de passe)
- PWA : manifest, service worker

### Phase 2 — Questionnaires

- CRUD quiz (creer, editer, supprimer, archiver)
- Editeur de questions (tous les types : QCM, vrai/faux, libre, drag-order, matching, scale)
- Long press + drag pour reordonner
- Settings par quiz (timer, seuil, feedback par question, formulaire d'entree, retour arriere, message d'erreur)
- Preview mode
- Publication + lien unique + QR code

### Phase 3 — Passage et Resultats

- Page publique /q/[id] : accueil du quiz
- Formulaire d'entree conditionnel
- Moteur de quiz (navigation question par question, swipe, timer)
- Calcul de score + soumission
- Page resultat (score, reussite/echec, feedback par question)
- Stockage des submissions/answers en BDD

### Phase 4 — Statistiques

- Dashboard stats par quiz (participants, score moyen, taux reussite)
- Stats par question (taux bonne reponse, reponses frequentes, temps moyen)
- Stats par participant (si formulaire d'entree)
- Courbe de progression dans le temps
- Export CSV / PDF

### Phase 5 — Panel Manager

- Dashboard manager (stats globales plateforme)
- Gestion des comptes admin (liste, suspendre, supprimer)
- Moderation contenu (quiz + pages)

### Phase 6 — CMS / Editeur de pages

- Editeur de blocs (titre, texte, image, video, PDF, section, bouton, carousel, banniere)
- Imbrication de blocs (sections contenant d'autres blocs)
- Long press + drag pour reordonner
- Preview + publication
- Lien unique + QR code
- Association quiz vers page
