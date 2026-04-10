import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4">
      <Card className="w-full max-w-sm bg-surface border-border-default shadow-card">
        <CardHeader>
          <CardTitle className="text-text-primary">Questionnaires</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-text-secondary mb-4">Plateforme en construction</p>
          <Button className="w-full bg-accent-blue hover:bg-accent-blue-secondary text-background rounded-badge font-semibold">
            Commencer
          </Button>
        </CardContent>
      </Card>
    </main>
  );
}
