"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useCreateCampaignTemplate } from "@/app/[locale]/(modules)/notifications/_services/notification.hook";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { getErrorMessage } from "@/lib/utils";
import { EmailEditor } from "../../_components/email-editor";

/* -------------------------
   TYPES
-------------------------- */
type ChannelContent = {
  title?: string;
  subject?: string;
  body: string;
};

const defaultChannels: Record<string, ChannelContent> = {
  in_app: { title: "", body: "" },
  email: { subject: "", body: "" },
  push: { title: "", body: "" },
};

export default function CreateCampaignTemplatePage() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [enablePushMirror, setEnablePushMirror] = useState(false);

  const [channels, setChannels] = useState<Record<string, ChannelContent>>(defaultChannels);

  const createMutation = useCreateCampaignTemplate();

  function updateChannel(channel: string, field: keyof ChannelContent, value: string) {
    setChannels((prev) => ({
      ...prev,
      [channel]: { ...prev[channel], [field]: value },
    }));
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();

    const defaultContent: Record<string, unknown> = {};

    for (const [key, val] of Object.entries(channels)) {
      if (key === "email") {
        defaultContent[key] = {
          subject: val.subject || "",
          body: val.body,
        };
      } else {
        defaultContent[key] = {
          title: val.title || "",
          body: val.body,
        };
      }
    }

    createMutation.mutate(
      { name, description: description || undefined, defaultContent, enablePushMirror },
      {
        onSuccess: () => router.push("/notifications/campaign-templates"),
      }
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 space-y-10">
      {/* HEADER */}
      <div>
        <h1 className="text-2xl font-semibold">Create Campaign Template</h1>
        <p className="text-sm text-muted-foreground">
          Build reusable multi-channel messaging templates
        </p>
      </div>

      <Card className="rounded-2xl border-muted/40 shadow-sm">
        <CardHeader>
          <CardTitle>Template Details</CardTitle>
        </CardHeader>

        <CardContent>
          <form onSubmit={onSubmit} className="space-y-8">
            {/* BASIC INFO */}
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label>Name</Label>
                <Input
                  className="h-11"
                  placeholder="Summer Sale 2026"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>Description</Label>
                <Input
                  className="h-11"
                  placeholder="Seasonal campaign"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>
            </div>

            {/* PUSH MIRROR */}
            <div className="flex items-center gap-2">
              <input
                id="enablePushMirror"
                type="checkbox"
                checked={enablePushMirror}
                onChange={(e) => setEnablePushMirror(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300"
              />
              <Label htmlFor="enablePushMirror" className="text-sm cursor-pointer">
                Auto-mirror in-app content as push notification
              </Label>
            </div>

            {/* CHANNELS */}
            <div className="space-y-4">
              <Label className="text-base font-medium">Channel Content</Label>

              <Tabs defaultValue="in_app" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="in_app">In-App</TabsTrigger>
                  <TabsTrigger value="email">Email</TabsTrigger>
                  <TabsTrigger value="push">Push</TabsTrigger>
                </TabsList>

                {/* IN-APP */}
                <TabsContent value="in_app" className="pt-4">
                  <Card className="p-4 space-y-4">
                    <div className="space-y-2">
                      <Label>Title</Label>
                      <Input
                        className="h-11"
                        value={channels.in_app.title ?? ""}
                        onChange={(e) => updateChannel("in_app", "title", e.target.value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Message</Label>
                      <Textarea
                        rows={4}
                        value={channels.in_app.body}
                        onChange={(e) => updateChannel("in_app", "body", e.target.value)}
                      />
                    </div>
                  </Card>
                </TabsContent>

                {/* EMAIL (FULL MODERN EDITOR) */}
                <TabsContent value="email" className="pt-4">
                  <Card className="p-4 space-y-4">
                    <div className="space-y-2">
                      <Label>Subject</Label>
                      <Input
                        className="h-11"
                        value={channels.email.subject ?? ""}
                        onChange={(e) => updateChannel("email", "subject", e.target.value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Email Body</Label>

                      <EmailEditor
                        value={channels.email.body}
                        onChange={(value) => updateChannel("email", "body", value)}
                      />
                    </div>
                  </Card>
                </TabsContent>

                {/* PUSH */}
                <TabsContent value="push" className="pt-4">
                  <Card className="p-4 space-y-4">
                    <div className="space-y-2">
                      <Label>Title</Label>
                      <Input
                        className="h-11"
                        value={channels.push.title ?? ""}
                        onChange={(e) => updateChannel("push", "title", e.target.value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Message</Label>
                      <Textarea
                        rows={4}
                        value={channels.push.body}
                        onChange={(e) => updateChannel("push", "body", e.target.value)}
                      />
                    </div>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>

            {/* ERRORS */}
            {createMutation.isError && (
              <p className="text-sm text-destructive">
                Failed to create: {getErrorMessage(createMutation.error)}
              </p>
            )}

            {/* ACTIONS */}
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push("/notifications/campaign-templates")}
              >
                Cancel
              </Button>

              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending ? "Creating..." : "Create Template"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
