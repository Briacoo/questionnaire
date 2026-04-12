"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";

export function RegisterForm() {
  const router = useRouter();
  const [pseudo, setPseudo] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError("Les mots de passe ne correspondent pas");
      return;
    }

    if (pseudo.length < 3) {
      setError("Le pseudo doit faire au moins 3 caracteres");
      return;
    }

    if (password.length < 6) {
      setError("Le mot de passe doit faire au moins 6 caracteres");
      return;
    }

    setLoading(true);

    const supabase = createClient();

    // Check if pseudo is already taken
    const { data: existingProfile } = await supabase
      .from("profiles")
      .select("id")
      .eq("pseudo", pseudo)
      .single();

    if (existingProfile) {
      setError("Ce pseudo est deja pris");
      setLoading(false);
      return;
    }

    // Supabase Auth requires email — generate a deterministic one from pseudo
    const fakeEmail = `${pseudo.toLowerCase().replace(/[^a-z0-9]/g, "")}@questionnaires-app.com`;

    const { error: signUpError } = await supabase.auth.signUp({
      email: fakeEmail,
      password,
      options: {
        data: {
          pseudo,
          role: "admin",
        },
      },
    });

    if (signUpError) {
      setError(signUpError.message);
      setLoading(false);
      return;
    }

    router.push("/admin");
    router.refresh();
  }

  return (
    <Card className="bg-surface border-border-default shadow-card">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl text-text-primary">Inscription</CardTitle>
        <p className="text-text-secondary text-sm mt-1">
          Creez votre compte pour commencer
        </p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="pseudo" className="text-text-primary">
              Pseudo
            </Label>
            <Input
              id="pseudo"
              type="text"
              value={pseudo}
              onChange={(e) => setPseudo(e.target.value)}
              placeholder="Votre pseudo unique"
              required
              className="bg-background border-border-default text-text-primary placeholder:text-text-secondary"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password" className="text-text-primary">
              Mot de passe
            </Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Minimum 6 caracteres"
              required
              className="bg-background border-border-default text-text-primary placeholder:text-text-secondary"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirmPassword" className="text-text-primary">
              Confirmer le mot de passe
            </Label>
            <Input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Retapez votre mot de passe"
              required
              className="bg-background border-border-default text-text-primary placeholder:text-text-secondary"
            />
          </div>
          {error && <p className="text-sm text-red-400">{error}</p>}
          <Button
            type="submit"
            disabled={loading}
            className="w-full bg-accent-blue hover:bg-accent-blue-secondary text-background rounded-badge font-semibold"
          >
            {loading ? "Inscription..." : "Creer mon compte"}
          </Button>
          <p className="text-center text-sm text-text-secondary">
            Deja un compte ?{" "}
            <Link
              href="/auth/login"
              className="text-accent-blue hover:text-accent-blue-light"
            >
              Se connecter
            </Link>
          </p>
        </form>
      </CardContent>
    </Card>
  );
}
