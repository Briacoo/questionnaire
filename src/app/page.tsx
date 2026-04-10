import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-4">
        <span className="text-lg font-bold text-text-primary">Questionnaires</span>
        <Link href="/auth/login">
          <Button
            variant="outline"
            size="sm"
            className="rounded-badge border-border-default text-text-primary hover:bg-surface"
          >
            Connexion
          </Button>
        </Link>
      </header>

      {/* Hero */}
      <main className="flex flex-1 flex-col items-center justify-center px-4 text-center">
        <div className="mb-4 inline-flex items-center rounded-badge bg-surface px-3 py-1 text-xs font-semibold text-accent-blue border border-border-default">
          Plateforme de questionnaires
        </div>
        <h1 className="text-4xl font-bold leading-tight text-text-primary">
          Creez des questionnaires
          <br />
          <span className="text-accent-blue">en quelques minutes</span>
        </h1>
        <p className="mt-4 max-w-md text-text-secondary">
          Concevez des quiz, examens et evaluations. Partagez-les par lien ou QR
          code. Suivez les resultats en temps reel.
        </p>
        <div className="mt-8 flex gap-3">
          <Link href="/auth/register">
            <Button className="rounded-badge bg-accent-blue hover:bg-accent-blue-secondary text-background font-semibold px-6">
              Commencer gratuitement
            </Button>
          </Link>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border-subtle py-6 text-center text-sm text-text-secondary">
        Questionnaires — Formation et evaluation en ligne
      </footer>
    </div>
  );
}
