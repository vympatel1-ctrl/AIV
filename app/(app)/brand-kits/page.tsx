import { PaletteIcon } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { EmptyState } from "@/components/app/empty-state";
import { listBrandKits } from "@/lib/db/brand-kits";
import { getCurrentUser } from "@/lib/auth/current-user";
import { createBrandKitAction, deleteBrandKitAction } from "./actions";

export default async function BrandKitsPage() {
  const user = await getCurrentUser();
  const kits = await listBrandKits(user.userId);

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-8">
      <div>
        <p className="text-sm text-muted-foreground">Workspace</p>
        <h1 className="font-display text-3xl tracking-tight sm:text-4xl">
          Brand Kits
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Save logos, colors and fonts so every generation matches your brand.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="font-display">Create a brand kit</CardTitle>
          <CardDescription>
            You can attach this kit to any project to keep generations on-brand.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form
            action={createBrandKitAction}
            className="grid gap-4 sm:grid-cols-2"
          >
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="name">Name</Label>
              <Input id="name" name="name" required placeholder="My Brand" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="primary_color">Primary color</Label>
              <Input
                id="primary_color"
                name="primary_color"
                placeholder="#0F172A"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="accent_color">Accent color</Label>
              <Input
                id="accent_color"
                name="accent_color"
                placeholder="#D4AF37"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="font_family">Font family</Label>
              <Input
                id="font_family"
                name="font_family"
                placeholder="Inter, Playfair Display"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="logo_url">Logo URL</Label>
              <Input
                id="logo_url"
                name="logo_url"
                placeholder="https://… (paste a hosted URL for now)"
              />
            </div>
            <div className="sm:col-span-2 flex justify-end">
              <Button type="submit" variant="ink">
                Save brand kit
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {kits.length === 0 ? (
        <EmptyState
          icon={PaletteIcon}
          title="No brand kits yet"
          description="Save your first brand kit above and it will show up here."
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {kits.map((kit) => (
            <Card key={kit.id} className="overflow-hidden">
              <div
                className="h-16 w-full"
                style={{
                  background: `linear-gradient(120deg, ${
                    kit.primary_color ?? "#0f172a"
                  }, ${kit.accent_color ?? "#d4af37"})`,
                }}
              />
              <CardHeader>
                <CardTitle className="font-display">{kit.name}</CardTitle>
                <CardDescription>
                  {kit.font_family ?? "—"}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex items-center justify-between gap-2">
                <div className="flex gap-2 text-xs text-muted-foreground">
                  <Swatch color={kit.primary_color} label="Primary" />
                  <Swatch color={kit.accent_color} label="Accent" />
                </div>
                <form action={deleteBrandKitAction}>
                  <input type="hidden" name="id" value={kit.id} />
                  <Button type="submit" variant="ghost" size="sm">
                    Delete
                  </Button>
                </form>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function Swatch({ color, label }: { color: string | null; label: string }) {
  return (
    <div className="flex items-center gap-2">
      <span
        aria-hidden
        className="size-4 rounded-full border border-border/60"
        style={{ background: color ?? "transparent" }}
      />
      <span>{label}</span>
    </div>
  );
}
