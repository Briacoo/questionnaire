export default function AdminDashboard() {
  return (
    <div className="px-4 pt-6">
      <div className="mb-1 text-xs font-semibold uppercase tracking-wider text-accent-blue">
        Mes Questionnaires
      </div>
      <h1 className="text-2xl font-bold text-text-primary">Dashboard</h1>
      <div className="mt-6 rounded-card bg-surface p-6 border border-border-default shadow-card">
        <p className="text-text-secondary">Aucun questionnaire pour le moment.</p>
      </div>
    </div>
  );
}
