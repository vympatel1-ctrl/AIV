import { ShieldIcon } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { EmptyState } from "@/components/app/empty-state";

export default function AdminModerationPage() {
  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="font-display">Moderation queue</CardTitle>
          <CardDescription>
            Flagged content from automated moderation will appear here. We
            run text + image moderation on every generation; items flagged
            above the threshold are surfaced for review.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <EmptyState
            icon={ShieldIcon}
            title="No items in queue"
            description="When a generation trips the moderation threshold, it lands here. Wire OpenAI moderation in /api/ai/* before launch."
          />
        </CardContent>
      </Card>
    </div>
  );
}
