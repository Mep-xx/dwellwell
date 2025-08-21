import { useEffect, useState } from 'react';
import { api } from '@/utils/api';

type Metrics = {
  usersCount: number;
  premiumUsersCount: number;
  homesCount: number;
  trackablesCount: number;
  tasksCompletedThisMonth: number;
  feedbackOpenCount: number;
  aiQueriesLast7d: number;
  mostDismissedTemplates: { templateId: string | null; name: string; dismisses: number }[];
};

export default function AdminDashboard() {
  const [data, setData] = useState<Metrics | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .get('/admin/metrics') // <-- no extra /api
      .then((res) => setData(res.data))
      .catch((e) => setError(e?.response?.data?.error ?? e.message));
  }, []);

  if (error) return <div className="text-red-600">Error: {error}</div>;
  if (!data) return <div>Loading…</div>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Admin Dashboard</h1>

      <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Users', value: data.usersCount },
          { label: 'Premium Users', value: data.premiumUsersCount },
          { label: 'Homes', value: data.homesCount },
          { label: 'Trackables', value: data.trackablesCount },
          { label: 'Tasks Completed (Mo.)', value: data.tasksCompletedThisMonth },
          { label: 'Open Feedback', value: data.feedbackOpenCount },
          { label: 'AI Queries (7d)', value: data.aiQueriesLast7d },
        ].map((kpi) => (
          <div key={kpi.label} className="rounded-2xl border p-4 shadow-sm">
            <div className="text-sm text-gray-500">{kpi.label}</div>
            <div className="text-2xl font-bold">{kpi.value}</div>
          </div>
        ))}
      </section>

      <section>
        <h2 className="text-lg font-medium mb-2">Most Dismissed Templates</h2>
        <div className="rounded-2xl border">
          <table className="w-full text-sm">
            <thead>
              <tr className="[&>th]:text-left [&>th]:p-3 border-b">
                <th>Template</th>
                <th>Dismisses</th>
              </tr>
            </thead>
            <tbody>
              {data.mostDismissedTemplates.map((row) => (
                <tr key={row.templateId ?? row.name} className="[&>td]:p-3 border-b">
                  <td>{row.name}</td>
                  <td>{row.dismisses}</td>
                </tr>
              ))}
              {data.mostDismissedTemplates.length === 0 && (
                <tr>
                  <td className="p-3 text-gray-500" colSpan={2}>
                    No data yet
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
