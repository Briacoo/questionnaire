import Link from "next/link";

export function Navbar() {
  return (
    <header className="sticky top-0 z-50 border-b border-border-subtle bg-background/95 backdrop-blur-sm">
      <div className="flex h-14 items-center justify-between px-4">
        <Link href="/" className="text-lg font-bold text-text-primary">
          Questionnaires
        </Link>
        <Link
          href="/auth/login"
          className="text-sm font-semibold text-accent-blue hover:text-accent-blue-light"
        >
          Connexion
        </Link>
      </div>
    </header>
  );
}
