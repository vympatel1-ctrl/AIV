import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { listAllUsage } from "@/lib/db/usage";
import { listAllProfiles } from "@/lib/db/profiles";
import { formatNumber, formatUsd } from "@/lib/utils";

export default async function AdminUsagePage() {
  const [usage, profiles] = await Promise.all([
    listAllUsage(500),
    listAllProfiles(),
  ]);

  type Bucket = { date: string; count: number; credits: number; cost: number };
  const byDay = new Map<string, Bucket>();
  for (const u of usage) {
    const d = u.created_at.slice(0, 10);
    const prev = byDay.get(d) ?? { date: d, count: 0, credits: 0, cost: 0 };
    prev.count += 1;
    prev.credits += u.credits;
    prev.cost += Number(u.cost_usd);
    byDay.set(d, prev);
  }
  const days = Array.from(byDay.values()).sort((a, b) =>
    a.date < b.date ? 1 : -1
  );

  type Kind = { kind: string; count: number; credits: number; cost: number };
  const byKind = new Map<string, Kind>();
  for (const u of usage) {
    const prev = byKind.get(u.kind) ?? {
      kind: u.kind,
      count: 0,
      credits: 0,
      cost: 0,
    };
    prev.count += 1;
    prev.credits += u.credits;
    prev.cost += Number(u.cost_usd);
    byKind.set(u.kind, prev);
  }

  return (
    <div className="flex flex-col gap-8">
      <Card>
        <CardHeader>
          <CardTitle className="font-display">By kind</CardTitle>
          <CardDescription>
            Distribution of generations across kinds.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {Array.from(byKind.values()).map((k) => (
              <div
                key={k.kind}
                className="rounded-lg border border-border/60 bg-card p-4"
              >
                <p className="text-xs uppercase tracking-wider text-muted-foreground">
                  {k.kind}
                </p>
                <p className="mt-1 font-display text-2xl tracking-tight">
                  {formatNumber(k.count)}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {formatNumber(k.credits)} credits · {formatUsd(k.cost)}
                </p>
              </div>
            ))}
            {byKind.size === 0 && (
              <p className="col-span-full py-8 text-center text-sm text-muted-foreground">
                No data yet.
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="font-display">Daily totals</CardTitle>
          <CardDescription>Last {days.length} days.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-xs uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="pb-2 pr-4">Date</th>
                  <th className="pb-2 pr-4">Generations</th>
                  <th className="pb-2 pr-4">Credits</th>
                  <th className="pb-2 pr-4">Cost</th>
                </tr>
              </thead>
              <tbody>
                {days.map((d) => (
                  <tr key={d.date} className="border-t border-border/60">
                    <td className="py-2 pr-4 text-muted-foreground">{d.date}</td>
                    <td className="py-2 pr-4 tabular-nums">
                      {formatNumber(d.count)}
                    </td>
                    <td className="py-2 pr-4 tabular-nums">
                      {formatNumber(d.credits)}
                    </td>
                    <td className="py-2 pr-4 tabular-nums">
                      {formatUsd(d.cost)}
                    </td>
                  </tr>
                ))}
                {days.length === 0 && (
                  <tr>
                    <td
                      colSpan={4}
                      className="py-8 text-center text-muted-foreground"
                    >
                      No data yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="font-display">Top users by spend</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="divide-y divide-border/60">
            {topUsersBySpend(usage, profiles).map((row) => (
              <li
                key={row.user_id}
                className="flex items-center justify-between py-2"
              >
                <span>{row.email}</span>
                <span className="tabular-nums text-muted-foreground">
                  {formatUsd(row.cost)}
                </span>
              </li>
            ))}
            {usage.length === 0 && (
              <li className="py-6 text-center text-sm text-muted-foreground">
                No spend yet.
              </li>
            )}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}

function topUsersBySpend(
  usage: { user_id: string; cost_usd: number }[],
  profiles: { id: string; email: string }[]
) {
  const map = new Map<string, { user_id: string; email: string; cost: number }>();
  for (const u of usage) {
    const prof = profiles.find((p) => p.id === u.user_id);
    const email = prof?.email ?? u.user_id.slice(0, 8);
    const prev = map.get(u.user_id) ?? { user_id: u.user_id, email, cost: 0 };
    prev.cost += Number(u.cost_usd);
    map.set(u.user_id, prev);
  }
  return Array.from(map.values())
    .sort((a, b) => b.cost - a.cost)
    .slice(0, 10);
}
