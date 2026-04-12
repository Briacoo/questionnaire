# UX Fixes — Login persistence, QR dashboard, Mobile quiz layout

**Date:** 2026-04-12
**Scope:** 3 modifications indépendantes sur l'app existante

---

## 1. Login "Rester connecté"

**Objectif:** Éviter la déconnexion automatique sauf si l'utilisateur le souhaite.

**Mécanisme:**
- Checkbox "Rester connecté" dans `login-form.tsx`, coché par défaut
- Si décoché: stocker `sessionOnly=true` dans `sessionStorage`
- Dans `useAuth` hook, au mount: si `sessionOnly` absent de `sessionStorage` ET absent de `localStorage` → `signOut()` automatique (navigateur fermé sans "rester connecté")
- Si coché: stocker `persistSession=true` dans `localStorage` → session survit aux fermetures de navigateur

**Fichiers modifiés:**
- `src/components/auth/login-form.tsx` — ajout checkbox + logique de stockage
- `src/hooks/use-auth.ts` — vérification au mount

---

## 2. QR code dans le dashboard quiz

**Objectif:** Permettre l'accès rapide au QR code depuis la liste des quiz sans aller dans les settings.

**Comportement:**
- Bouton icône QR code sur chaque `QuizCard`
- `e.stopPropagation()` pour ne pas naviguer vers l'édition au clic
- **Quiz publié** → dialog avec QR code + bouton "Copier le lien"
- **Quiz non publié** → dialog "Ce quiz n'est pas publié" + boutons "Annuler" / "Publier"
  - Clic "Publier" → update statut `published` dans Supabase → affiche QR code automatiquement

**Fichiers modifiés:**
- `src/components/quiz/quiz-card.tsx` — ajout bouton QR
- Nouveau: `src/components/quiz/qr-code-dialog.tsx` — dialog réutilisable (QR code + copier lien + logique publish)

**Dépendances:** `qrcode` (déjà installé)

---

## 3. Quiz client mobile — Layout fixe

**Objectif:** Sur mobile web, les boutons navigation (Suivant/Retour) doivent être visibles sans scroller.

**Approche:**
- Layout `flex flex-col h-dvh` sur le conteneur principal du quiz player (état "playing")
- Header (titre, timer, progress bar) → `shrink-0`
- Zone question → `flex-1 overflow-y-auto`
- Barre navigation (Précédent, compteur, Suivant) → `shrink-0`
- Utilisation de `h-dvh` (dynamic viewport height) pour compatibilité mobile Safari/Chrome

**Fichiers modifiés:**
- `src/components/quiz/quiz-player.tsx` — réorganisation CSS du layout "playing"

---

## Hors scope

- Pas de nouvelle fonctionnalité de partage (Web Share API)
- Pas de téléchargement PNG du QR code
- Pas de modification des écrans intro/finished du quiz player
