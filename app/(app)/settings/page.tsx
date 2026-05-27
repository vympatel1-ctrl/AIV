import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { getCurrentUser } from "@/lib/auth/current-user";

export default async function SettingsPage() {
  const user = await getCurrentUser();

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-8">
      <div>
        <p className="text-sm text-muted-foreground">Account</p>
        <h1 className="font-display text-3xl tracking-tight sm:text-4xl">
          Settings
        </h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="font-display">Profile</CardTitle>
          <CardDescription>
            Real authentication is wired in code but disabled for the MVP demo.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Name</Label>
            <Input
              defaultValue={user.profile.full_name ?? user.name}
              disabled
            />
          </div>
          <div className="space-y-2">
            <Label>Email</Label>
            <Input defaultValue={user.email} disabled />
          </div>
          <div className="space-y-2">
            <Label>Role</Label>
            <div>
              <Badge variant={user.role === "admin" ? "gold" : "secondary"}>
                {user.role}
              </Badge>
            </div>
          </div>
          <div className="space-y-2">
            <Label>Credits</Label>
            <Input value={user.profile.credits} disabled />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="font-display">Coming soon</CardTitle>
          <CardDescription>
            Real Supabase Auth, team workspaces, API keys, and notifications.
          </CardDescription>
        </CardHeader>
      </Card>
    </div>
  );
}
