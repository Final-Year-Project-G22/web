"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  useGetCampaignTemplate,
  useUpdateCampaignTemplate,
} from "@/app/[locale]/(modules)/notifications/_services/notification.hook";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { getErrorMessage } from "@/lib/utils";

import { EmailEditor } from "../../../_components/email-editor";

type ChannelContent = {
  title?: string;
  subject?: string;
  body: string;
};

function parseContentToChannels(raw: unknown): Record<string, ChannelContent> {
  if (!raw || typeof raw !== "object") return {};
  const result: Record<string, ChannelContent> = {};
  for (const [key, val] of Object.entries(raw)) {
    if (val && typeof val === "object") {
      const v = val as Record<string, string>;
      result[key] = {
        title: v.title || "",
        subject: v.subject || "",
        body: v.body || "",
      };
    }
  }
  return result;
}

function buildContentFromChannels(
  channels: Record<string, ChannelContent>
): Record<string, unknown> {
  const content: Record<string, unknown> = {};
  for (const [key, val] of Object.entries(channels)) {
    if (key === "email") {
      content[key] = { subject: val.subject || "", body: val.body };
    } else {
      content[key] = { title: val.title || "", body: val.body };
    }
  }
  return content;
}

export default function EditCampaignTemplatePage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const templateQuery = useGetCampaignTemplate(id);
  const updateTemplate = useUpdateCampaignTemplate();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [enablePushMirror, setEnablePushMirror] = useState(false);

  const [channels, setChannels] = useState<Record<string, ChannelContent>>({
    in_app: { title: "", body: "" },
    email: { subject: "", body: "" },
    push: { title: "", body: "" },
  });

  useEffect(() => {
    if (templateQuery.data) {
      setName(templateQuery.data.name);
      setDescription(templateQuery.data.description ?? "");
      setEnablePushMirror(templateQuery.data.enablePushMirror ?? false);
      setChannels(parseContentToChannels(templateQuery.data.defaultContent));
    }
  }, [templateQuery.data]);

  function updateChannel(channel: string, field: keyof ChannelContent, value: string) {
    setChannels((prev) => ({
      ...prev,
      [channel]: { ...prev[channel], [field]: value },
    }));
  }

  function handleSaveTemplate(e: React.FormEvent) {
    e.preventDefault();
    updateTemplate.mutate({
      id,
      patch: {
        name,
        description: description || undefined,
        defaultContent: buildContentFromChannels(channels),
        enablePushMirror,
      },
    });
  }

  /* -------------------------
     STATES
  -------------------------- */
  if (templateQuery.isLoading) {
    return <p className="p-6 text-sm text-muted-foreground">Loading...</p>;
  }

  if (templateQuery.isError) {
    return (
      <p className="p-6 text-sm text-destructive">Failed: {getErrorMessage(templateQuery.error)}</p>
    );
  }

  /* -------------------------
     UI
  -------------------------- */
  return (
    <div className="mx-auto max-w-7xl px-4 py-10 space-y-10">
      {/* HEADER */}
      <div>
        <h1 className="text-2xl font-semibold">Edit Campaign Template</h1>
        <p className="text-sm text-muted-foreground">
          Update your multi-channel messaging template
        </p>
      </div>

      <Card className="rounded-2xl border-muted/40 shadow-sm">
        <CardHeader>
          <CardTitle>Template Details</CardTitle>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSaveTemplate} className="space-y-8">
            {/* BASIC INFO */}
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label>Name</Label>
                <Input
                  className="h-11"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>Description</Label>
                <Input
                  className="h-11"
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
                <TabsList className="grid grid-cols-3 w-full">
                  <TabsTrigger value="in_app">In-App</TabsTrigger>
                  <TabsTrigger value="email">Email</TabsTrigger>
                  <TabsTrigger value="push">Push</TabsTrigger>
                </TabsList>

                {/* IN APP */}
                <TabsContent value="in_app" className="pt-4">
                  <Card className="p-4 space-y-4">
                    <Input
                      className="h-11"
                      placeholder="Title"
                      value={channels.in_app?.title ?? ""}
                      onChange={(e) => updateChannel("in_app", "title", e.target.value)}
                    />
                    <Textarea
                      rows={4}
                      placeholder="Message"
                      value={channels.in_app?.body ?? ""}
                      onChange={(e) => updateChannel("in_app", "body", e.target.value)}
                    />
                  </Card>
                </TabsContent>

                {/* EMAIL */}
                <TabsContent value="email" className="pt-4">
                  <Card className="p-4 space-y-4">
                    <Input
                      className="h-11"
                      placeholder="Subject"
                      value={channels.email?.subject ?? ""}
                      onChange={(e) => updateChannel("email", "subject", e.target.value)}
                    />

                    <EmailEditor
                      value={channels.email.body}
                      onChange={(value) => updateChannel("email", "body", value)}
                    />
                  </Card>
                </TabsContent>

                {/* PUSH */}
                <TabsContent value="push" className="pt-4">
                  <Card className="p-4 space-y-4">
                    <Input
                      className="h-11"
                      placeholder="Title"
                      value={channels.push?.title ?? ""}
                      onChange={(e) => updateChannel("push", "title", e.target.value)}
                    />
                    <Textarea
                      rows={4}
                      placeholder="Message"
                      value={channels.push?.body ?? ""}
                      onChange={(e) => updateChannel("push", "body", e.target.value)}
                    />
                  </Card>
                </TabsContent>
              </Tabs>
            </div>

            {/* ERROR */}
            {updateTemplate.isError && (
              <p className="text-sm text-destructive">
                Failed to save: {getErrorMessage(updateTemplate.error)}
              </p>
            )}

            {/* ACTIONS */}
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push("/notifications/campaign-templates")}
              >
                Back
              </Button>

              <Button type="submit" disabled={updateTemplate.isPending}>
                {updateTemplate.isPending ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
