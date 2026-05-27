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

  const stats: { label: string; value: string; sub?: string }[] = [
    { label: "Users", value: formatNumber(profiles.length) },
    {
      label: "Generations",
      value: formatNumber(usage7.length),
      sub: "Last 7 days",
    },
    {
      label: "Credits used",
      value: formatNumber(credits7),
      sub: "Last 7 days",
    },
    { label: "API spend", value: formatUsd(cost7), sub: "Last 7 days" },
    { label: "API spend", value: formatUsd(cost30), sub: "Last 30 days" },
  ];

  return (
    <div className="flex flex-col gap-10">
      {/* ====================================================
       *  STATS GRID — editorial newspaper plate
       * ==================================================== */}
      <div className="grid gap-px overflow-hidden rounded-xl border border-foreground/10 bg-foreground/10 sm:grid-cols-2 lg:grid-cols-5">
        {stats.map((s, i) => (
          <div key={`${s.label}-${i}`} className="bg-card p-5">
            <p className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
              {s.label}
            </p>
            <p className="mt-2 font-display text-3xl tracking-tight tabular-nums">
              {s.value}
            </p>
            {s.sub && (
              <p className="mt-1 text-xs text-muted-foreground">{s.sub}</p>
            )}
          </div>
        ))}
      </div>

      {/* ====================================================
       *  RECENT ACTIVITY
       * ==================================================== */}
      <Card className="border-foreground/10 bg-card editorial-shadow">
        <CardHeader>
          <p className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
            Live feed
          </p>
          <CardTitle className="font-display text-2xl tracking-tight">
            Recent activity
          </CardTitle>
          <CardDescription>
            Latest 25 generation events across all users.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
                <tr className="border-b border-foreground/10">
                  <th className="py-3 pr-4 font-medium">Time</th>
                  <th className="py-3 pr-4 font-medium">User</th>
                  <th className="py-3 pr-4 font-medium">Kind</th>
                  <th className="py-3 pr-4 font-medium">Model</th>
                  <th className="py-3 pr-4 text-right font-medium">Credits</th>
                  <th className="py-3 pr-4 text-right font-medium">Cost</th>
                </tr>
              </thead>
              <tbody>
                {usage.slice(0, 25).map((u) => {
                  const profile = profiles.find((p) => p.id === u.user_id);
                  return (
                    <tr
                      key={u.id}
                      className="border-b border-foreground/[0.06] last:border-0"
                    >
                      <td className="py-3 pr-4 text-xs text-muted-foreground tabular-nums">
                        {new Date(u.created_at).toLocaleString()}
                      </td>
                      <td className="py-3 pr-4 text-sm">
                        {profile?.email ?? (
                          <span className="font-mono text-xs text-muted-foreground">
                            {u.user_id.slice(0, 8)}
                          </span>
                        )}
                      </td>
                      <td className="py-3 pr-4 text-sm capitalize">
                        {u.kind}
                      </td>
                      <td className="py-3 pr-4 font-mono text-xs text-muted-foreground">
                        {u.model}
                      </td>
                      <td className="py-3 pr-4 text-right tabular-nums">
                        {u.credits}
                      </td>
                      <td className="py-3 pr-4 text-right tabular-nums">
                        {formatUsd(Number(u.cost_usd))}
                      </td>
                    </tr>
                  );
                })}
                {usage.length === 0 && (
                  <tr>
                    <td
                      colSpan={6}
                      className="py-12 text-center text-sm text-muted-foreground"
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
