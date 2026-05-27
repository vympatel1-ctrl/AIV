import Link from "next/link";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createProjectAction } from "../actions";

export default function NewProjectPage() {
  return (
    <div className="mx-auto max-w-xl">
      <p className="text-sm text-muted-foreground">Workspace</p>
      <h1 className="mb-6 font-display text-3xl tracking-tight sm:text-4xl">
        New project
      </h1>

      <Card>
        <CardHeader>
          <CardTitle className="font-display">Project details</CardTitle>
          <CardDescription>
            You can change everything later. The category becomes a folder
            on your projects page.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={createProjectAction} className="flex flex-col gap-5">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                name="name"
                placeholder="Spring product launch"
                required
                maxLength={120}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                name="description"
                placeholder="What is this project for?"
                maxLength={500}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="category">Category / folder</Label>
              <Input
                id="category"
                name="category"
                placeholder="Campaigns, Lookbook, Ads…"
                maxLength={60}
              />
            </div>
            <div className="flex items-center justify-end gap-2 pt-2">
              <Link href="/projects">
                <Button type="button" variant="ghost">
                  Cancel
                </Button>
              </Link>
              <Button type="submit" variant="gold">
                Create project
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
