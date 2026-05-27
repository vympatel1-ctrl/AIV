import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { listAllProfiles } from "@/lib/db/profiles";
import { formatNumber, formatRelative } from "@/lib/utils";

export default async function AdminUsersPage() {
  const profiles = await listAllProfiles();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-display">Users</CardTitle>
        <CardDescription>{profiles.length} total</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="pb-2 pr-4">Email</th>
                <th className="pb-2 pr-4">Name</th>
                <th className="pb-2 pr-4">Role</th>
                <th className="pb-2 pr-4">Credits</th>
                <th className="pb-2 pr-4">Joined</th>
              </tr>
            </thead>
            <tbody>
              {profiles.map((p) => (
                <tr key={p.id} className="border-t border-border/60">
                  <td className="py-2 pr-4">{p.email}</td>
                  <td className="py-2 pr-4 text-muted-foreground">
                    {p.full_name ?? "—"}
                  </td>
                  <td className="py-2 pr-4">
                    <Badge variant={p.role === "admin" ? "gold" : "secondary"}>
                      {p.role}
                    </Badge>
                  </td>
                  <td className="py-2 pr-4 tabular-nums">
                    {formatNumber(p.credits)}
                  </td>
                  <td className="py-2 pr-4 text-muted-foreground">
                    {formatRelative(p.created_at)}
                  </td>
                </tr>
              ))}
              {profiles.length === 0 && (
                <tr>
                  <td
                    colSpan={5}
                    className="py-8 text-center text-muted-foreground"
                  >
                    No users yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
