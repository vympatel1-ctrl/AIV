import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { listAllProfiles } from "@/lib/db/profiles";
import { listAllUsage } from "@/lib/db/usage";
import { formatNumber, formatUsd } from "@/lib/utils";

function rangeStart(days: number) {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - days);
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

export default async function AdminOverviewPage() {
  const [profiles, usage] = await Promise.all([
    listAllProfiles(),
    listAllUsage(500),
  ]);

  const since7 = rangeStart(7);
  const since30 = rangeStart(30);

  const usage7 = usage.filter((u) => new Date(u.created_at) >= since7);
  const usage30 = usage.filter((u) => new Date(u.created_at) >= since30);

  const cost7 = usage7.reduce((s, u) => s + Number(u.cost_usd), 0);
  const cost30 = usage30.reduce((s, u) => s + Number(u.cost_usd), 0);
  const credits7 = usage7.reduce((s, u) => s + u.credits, 0);

  const stats = [
    { label: "Users", value: formatNumber(profiles.length) },
    { label: "Generations · 7d", value: formatNumber(usage7.length) },
    { label: "Credits used · 7d", value: formatNumber(credits7) },
    { label: "API spend · 7d", value: formatUsd(cost7) },
    { label: "API spend · 30d", value: formatUsd(cost30) },
  ];

  return (
    <div className="flex flex-col gap-8">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {stats.map((s) => (
          <Card key={s.label}>
            <CardContent className="py-5">
              <p className="text-xs uppercase tracking-wider text-muted-foreground">
                {s.label}
              </p>
              <p className="mt-1 font-display text-2xl tracking-tight">
                {s.value}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="font-display">Recent activity</CardTitle>
          <CardDescription>Latest generation events.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-xs uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="pb-2 pr-4">Time</th>
                  <th className="pb-2 pr-4">User</th>
                  <th className="pb-2 pr-4">Kind</th>
                  <th className="pb-2 pr-4">Model</th>
                  <th className="pb-2 pr-4">Credits</th>
                  <th className="pb-2 pr-4">Cost</th>
                </tr>
              </thead>
              <tbody>
                {usage.slice(0, 25).map((u) => {
                  const profile = profiles.find((p) => p.id === u.user_id);
                  return (
                    <tr key={u.id} className="border-t border-border/60">
                      <td className="py-2 pr-4 text-muted-foreground">
                        {new Date(u.created_at).toLocaleString()}
                      </td>
                      <td className="py-2 pr-4">
                        {profile?.email ?? u.user_id.slice(0, 8)}
                      </td>
                      <td className="py-2 pr-4">{u.kind}</td>
                      <td className="py-2 pr-4 text-muted-foreground">
                        {u.model}
                      </td>
                      <td className="py-2 pr-4 tabular-nums">{u.credits}</td>
                      <td className="py-2 pr-4 tabular-nums">
                        {formatUsd(Number(u.cost_usd))}
                      </td>
                    </tr>
                  );
                })}
                {usage.length === 0 && (
                  <tr>
                    <td
                      colSpan={6}
                      className="py-8 text-center text-muted-foreground"
                    >
                      No activity yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
