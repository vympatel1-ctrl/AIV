import { CheckIcon, SparklesIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

const PLANS = [
  {
    id: "free",
    name: "Starter",
    price: "$0",
    cadence: "forever",
    description: "Try the studio with monthly free credits.",
    features: [
      "100 credits / month",
      "Copy + Image Studio",
      "Save to projects",
      "Community support",
    ],
    cta: "Current plan",
    highlighted: false,
  },
  {
    id: "pro",
    name: "Pro",
    price: "$39",
    cadence: "/ month",
    description: "For founders shipping ads weekly.",
    features: [
      "1,500 credits / month",
      "All studios incl. Video + Voiceover",
      "Brand Kits with logo + colors",
      "Priority generation",
      "Email support",
    ],
    cta: "Upgrade to Pro",
    highlighted: true,
  },
  {
    id: "business",
    name: "Business",
    price: "$129",
    cadence: "/ month",
    description: "For teams running paid acquisition at scale.",
    features: [
      "5,000 credits / month",
      "Higher rate limits",
      "Top-of-queue rendering",
      "Multiple brand kits",
      "Priority support",
    ],
    cta: "Upgrade to Business",
    highlighted: false,
  },
];

export default function BillingPage() {
  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-10">
      <div className="text-center">
        <Badge variant="outline" className="mx-auto mb-4 border-primary/40">
          <SparklesIcon className="size-3" />
          Pricing
        </Badge>
        <h1 className="font-display text-3xl tracking-tight sm:text-5xl">
          Pay for credits, not seats.
        </h1>
        <p className="mt-3 text-sm text-muted-foreground">
          Stripe billing wires up next. For the MVP, plans are display-only.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {PLANS.map((p) => (
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
            <CardHeader>
              <CardTitle className="font-display text-2xl">{p.name}</CardTitle>
              <CardDescription>{p.description}</CardDescription>
              <div className="mt-3 flex items-baseline gap-1">
                <span className="font-display text-4xl tracking-tight">
                  {p.price}
                </span>
                <span className="text-sm text-muted-foreground">
                  {p.cadence}
                </span>
              </div>
            </CardHeader>
            <CardContent className="flex flex-col gap-5">
              <ul className="space-y-2 text-sm">
                {p.features.map((f) => (
                  <li key={f} className="flex items-start gap-2">
                    <CheckIcon className="mt-0.5 size-4 shrink-0 text-primary" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
              <Button
                variant={p.highlighted ? "gold" : "outline"}
                size="lg"
                disabled
                title="Stripe wiring is intentionally TODO for the MVP"
              >
                {p.cta}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="bg-card/60">
        <CardContent className="flex flex-col gap-3 py-6 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <p>
            Need a custom plan? Reach out — we&apos;ll tailor credits and
            limits.
          </p>
          <a href="mailto:hello@aurum.studio">
            <Button variant="ghost" size="sm">
              Contact sales
            </Button>
          </a>
        </CardContent>
      </Card>
    </div>
  );
}
