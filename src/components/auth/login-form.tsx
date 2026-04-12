"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") || "/admin";
  const [pseudo, setPseudo] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const supabase = createClient();

    // Use the same fake email pattern as registration
    const fakeEmail = `${pseudo.toLowerCase().replace(/[^a-z0-9]/g, "")}@questionnaires-app.com`;

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: fakeEmail,
      password,
    });

    if (signInError) {
      setError("Pseudo ou mot de passe incorrect");
      setLoading(false);
      return;
    }

    if (rememberMe) {
      localStorage.setItem("persistSession", "true");
      sessionStorage.removeItem("sessionOnly");
    } else {
      localStorage.removeItem("persistSession");
      sessionStorage.setItem("sessionOnly", "true");
    }

    router.push(redirect);
    router.refresh();
  }

  return (
    <Card className="bg-surface border-border-default shadow-card">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl text-text-primary">Connexion</CardTitle>
        <p className="text-text-secondary text-sm mt-1">
          Connectez-vous a votre compte
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
              placeholder="Votre pseudo"
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
              placeholder="Votre mot de passe"
              required
              className="bg-background border-border-default text-text-primary placeholder:text-text-secondary"
            />
          </div>
          <div className="flex items-center gap-2">
            <Checkbox
              id="rememberMe"
              checked={rememberMe}
              onCheckedChange={(checked) => setRememberMe(checked === true)}
              className="border-border-default data-[state=checked]:bg-accent-blue"
            />
            <Label htmlFor="rememberMe" className="text-sm text-text-secondary cursor-pointer">
              Rester connecte
            </Label>
          </div>
          {error && <p className="text-sm text-red-400">{error}</p>}
          <Button
            type="submit"
            disabled={loading}
            className="w-full bg-accent-blue hover:bg-accent-blue-secondary text-background rounded-badge font-semibold"
          >
            {loading ? "Connexion..." : "Se connecter"}
          </Button>
          <p className="text-center text-sm text-text-secondary">
            Pas encore de compte ?{" "}
            <Link
              href="/auth/register"
              className="text-accent-blue hover:text-accent-blue-light"
            >
              S&apos;inscrire
            </Link>
          </p>
        </form>
      </CardContent>
    </Card>
  );
}
