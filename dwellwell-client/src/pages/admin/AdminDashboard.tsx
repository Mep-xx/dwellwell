// dwellwell-client/src/pages/admin/AdminDashboard.tsx
import { useEffect, useState } from "react";
import { api } from "@/utils/api";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

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
      .get("/admin/metrics")
      .then((res) => setData(res.data))
      .catch((e) => setError(e?.response?.data?.error ?? e.message));
  }, []);

  if (error) return <div className="text-red-600">Error: {error}</div>;
  if (!data) return <div>Loading…</div>;

  const KPIS = [
    { label: "Users", value: data.usersCount },
    { label: "Premium Users", value: data.premiumUsersCount },
    { label: "Homes", value: data.homesCount },
    { label: "Trackables", value: data.trackablesCount },
    { label: "Tasks Completed (Mo.)", value: data.tasksCompletedThisMonth },
    { label: "Open Feedback", value: data.feedbackOpenCount },
    { label: "AI Queries (7d)", value: data.aiQueriesLast7d },
  ];

  return (
    <div className="space-y-6 p-4">
      <h1 className="text-2xl font-semibold">Admin Dashboard</h1>

      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {KPIS.map((k) => (
          <Card key={k.label} className="rounded-2xl">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{k.label}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{k.value}</div>
            </CardContent>
          </Card>
        ))}
      </section>

      <section>
        <Card className="rounded-2xl">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Most Dismissed Templates</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/40">
                  <tr>
                    <th className="text-left p-3">Template</th>
                    <th className="text-left p-3">Dismisses</th>
                  </tr>
                </thead>
                <tbody>
                  {data.mostDismissedTemplates.length === 0 ? (
                    <tr>
                      <td className="p-4 text-muted-foreground" colSpan={2}>
                        No data yet
                      </td>
                    </tr>
                  ) : (
                    data.mostDismissedTemplates.map((row) => (
                      <tr key={row.templateId ?? row.name} className="border-t">
                        <td className="p-3">{row.name}</td>
                        <td className="p-3">{row.dismisses}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
