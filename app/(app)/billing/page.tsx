import { CheckIcon, CoinsIcon, SparklesIcon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

import { getCurrentUser } from "@/lib/auth/current-user";
import { listUserLedger } from "@/lib/db/credit-ledger";
import { getSubscription } from "@/lib/db/subscriptions";
import { PACKS, PRO, type PackConfig } from "@/lib/stripe";

import { BuyButton, PortalButton } from "./_components/buy-button";

type SP = { status?: string };

const REASON_LABEL: Record<string, string> = {
  signup_bonus: "Signup bonus",
  pack_purchase: "Credit pack",
  subscription_grant: "Pro renewal",
  generation: "Generation",
  refund: "Refund",
  admin_adjust: "Adjustment",
};

function formatUsd(cents: number): string {
  return `$${(cents / 100).toFixed(cents % 100 === 0 ? 0 : 2)}`;
}

function formatCredits(n: number): string {
  return n.toLocaleString("en-US");
}

export default async function BillingPage({
  searchParams,
}: {
  searchParams: Promise<SP>;
}) {
  const { status } = await searchParams;
  const user = await getCurrentUser();
  const [subscription, ledger] = await Promise.all([
    getSubscription(user.userId),
    listUserLedger(user.userId, 12),
  ]);

  const isPro =
    subscription?.plan === "pro" &&
    subscription.status !== "cancelled" &&
    subscription.status !== "incomplete_expired";

  const packs: PackConfig[] = (
    ["spark", "creator", "studio", "scale"] as const
  ).map((id) => PACKS[id]);

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-10">
      {status === "success" && (
        <div className="rounded-md border border-primary/30 bg-primary/5 px-4 py-3 text-sm">
          Payment received — credits should land within a few seconds. If the
          balance below doesn&apos;t update, refresh the page.
        </div>
      )}
      {status === "cancelled" && (
        <div className="rounded-md border border-foreground/10 bg-card px-4 py-3 text-sm text-muted-foreground">
          Checkout cancelled. No charge was made.
        </div>
      )}

      <div className="flex flex-col gap-3 text-center">
        <Badge variant="outline" className="mx-auto border-primary/40">
          <SparklesIcon className="size-3" />
          Pricing
        </Badge>
        <h1 className="font-display text-3xl tracking-tight sm:text-5xl">
          Pay for credits, not seats.
        </h1>
        <p className="mx-auto max-w-xl text-sm text-muted-foreground">
          One credit ≈ $0.01 retail. Generations are priced at our cost × 10
          so a $25 pack covers ~9 high-quality images, ~6 short videos, or
          ~30 voiceovers. Bigger packs include bonus credits.
        </p>
      </div>

      {/* Current balance + subscription state */}
      <Card>
        <CardContent className="flex flex-col gap-4 py-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex size-12 items-center justify-center rounded-md bg-primary/10 text-primary">
              <CoinsIcon className="size-5" />
            </div>
            <div className="flex flex-col gap-0.5">
              <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">
                Current balance
              </p>
              <p className="font-display text-3xl tracking-tight">
                {formatCredits(user.profile.credits)}{" "}
                <span className="text-base text-muted-foreground">credits</span>
              </p>
              {isPro && (
                <p className="text-xs text-muted-foreground">
                  Pro subscriber · {formatCredits(PRO.monthlyCredits)} credits
                  renewing
                  {subscription?.current_period_end
                    ? ` on ${new Date(subscription.current_period_end).toLocaleDateString(
                        "en-US",
                        { month: "short", day: "numeric" }
                      )}`
                    : ""}
                  .
                </p>
              )}
            </div>
          </div>
          {subscription?.stripe_customer_id && <PortalButton variant="outline" />}
        </CardContent>
      </Card>

      {/* Token packs */}
      <section className="flex flex-col gap-5">
        <div className="flex items-baseline justify-between">
          <h2 className="font-display text-2xl tracking-tight">
            Top up with credits
          </h2>
          <span className="text-xs uppercase tracking-[0.22em] text-muted-foreground">
            One-time purchase · never expires
          </span>
        </div>

        <div className="grid gap-5 lg:grid-cols-4">
          {packs.map((p) => {
            const perCredit = p.amountCents / p.credits / 100;
            return (
              <Card
                key={p.id}
                className={cn(
                  "relative overflow-hidden",
                  p.highlighted && "border-primary/40 editorial-shadow"
                )}
              >
                {p.highlighted && (
                  <div className="absolute right-3 top-3">
                    <Badge variant="ink">Most popular</Badge>
                  </div>
                )}
                {p.bonusPercent > 0 && !p.highlighted && (
                  <div className="absolute right-3 top-3">
                    <Badge variant="outline">+{p.bonusPercent}% bonus</Badge>
                  </div>
                )}
                <CardHeader>
                  <CardTitle className="font-display text-xl">
                    {p.name}
                  </CardTitle>
                  <CardDescription>{p.tagline}</CardDescription>
                  <div className="mt-3 flex items-baseline gap-1">
                    <span className="font-display text-3xl tracking-tight">
                      {formatUsd(p.amountCents)}
                    </span>
                  </div>
                  <p className="text-sm text-foreground/80">
                    {formatCredits(p.credits)} credits
                  </p>
                  <p className="text-xs text-muted-foreground">
                    ${perCredit.toFixed(4)} per credit
                  </p>
                </CardHeader>
                <CardContent>
                  <BuyButton
                    payload={{ kind: "pack", packId: p.id }}
                    label={`Buy ${p.name}`}
                    variant={p.highlighted ? "ink" : "outline"}
                    size="default"
                    className="w-full"
                  />
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      {/* Pro subscription */}
      <section className="flex flex-col gap-5">
        <div className="flex items-baseline justify-between">
          <h2 className="font-display text-2xl tracking-tight">
            Or go monthly with <span className="italic ink-text">Pro</span>
          </h2>
          <span className="text-xs uppercase tracking-[0.22em] text-muted-foreground">
            Cancel anytime
          </span>
        </div>
        <Card className="border-primary/30">
          <CardContent className="flex flex-col gap-6 py-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-col gap-3">
              <div className="flex items-baseline gap-2">
                <h3 className="font-display text-2xl tracking-tight">
                  {PRO.name}
                </h3>
                <span className="font-display text-3xl tracking-tight">
                  {formatUsd(PRO.amountCents)}
                </span>
                <span className="text-sm text-muted-foreground">/ month</span>
              </div>
              <p className="text-sm text-muted-foreground">{PRO.tagline}</p>
              <ul className="grid gap-1.5 sm:grid-cols-2">
                {PRO.perks.map((perk) => (
                  <li key={perk} className="flex items-start gap-2 text-sm">
                    <CheckIcon className="mt-0.5 size-4 shrink-0 text-primary" />
                    <span>{perk}</span>
                  </li>
                ))}
              </ul>
            </div>
            {isPro ? (
              <div className="flex flex-col items-end gap-2">
                <Badge variant="ink">Active subscription</Badge>
                <PortalButton variant="outline" />
              </div>
            ) : (
              <BuyButton
                payload={{ kind: "pro" }}
                label="Upgrade to Pro"
                variant="ink"
                size="lg"
              />
            )}
          </CardContent>
        </Card>
      </section>

      {/* Recent ledger */}
      <section className="flex flex-col gap-3">
        <h2 className="font-display text-2xl tracking-tight">Recent activity</h2>
        <Card>
          <CardContent className="p-0">
            {ledger.length === 0 ? (
              <p className="px-6 py-8 text-sm text-muted-foreground">
                No transactions yet. Buy a pack above to get rolling.
              </p>
            ) : (
              <ul className="divide-y divide-foreground/5">
                {ledger.map((entry) => (
                  <li
                    key={entry.id}
                    className="flex items-center justify-between px-6 py-3 text-sm"
                  >
                    <div className="flex flex-col gap-0.5">
                      <span className="font-medium">
                        {REASON_LABEL[entry.reason] ?? entry.reason}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {new Date(entry.created_at).toLocaleString("en-US", {
                          month: "short",
                          day: "numeric",
                          hour: "numeric",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                    <div className="flex flex-col items-end gap-0.5">
                      <span
                        className={cn(
                          "font-mono text-sm tabular-nums",
                          entry.delta >= 0
                            ? "text-primary"
                            : "text-foreground/80"
                        )}
                      >
                        {entry.delta >= 0 ? "+" : ""}
                        {formatCredits(entry.delta)}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        balance {formatCredits(entry.balance_after)}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </section>

      <Separator />

      <Card className="bg-card/60">
        <CardContent className="flex flex-col gap-3 py-6 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <p>
            Need volume pricing or invoiced billing? Reach out — we tailor
            credit allocations and SLAs.
          </p>
          <a
            href="mailto:hello@aiv.app"
            className="text-foreground underline-offset-4 hover:underline"
          >
            hello@aiv.app
          </a>
        </CardContent>
      </Card>
    </div>
  );
}
