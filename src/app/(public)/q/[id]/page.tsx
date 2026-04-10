export default async function QuizPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <div className="flex min-h-[60vh] items-center justify-center p-4">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-text-primary">Questionnaire</h1>
        <p className="mt-2 text-text-secondary">ID: {id}</p>
        <p className="mt-1 text-text-secondary">Bientot disponible</p>
      </div>
    </div>
  );
}
