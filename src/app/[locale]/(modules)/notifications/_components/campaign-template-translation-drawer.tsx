"use client";

import { X } from "lucide-react";
import { useEffect, useState } from "react";
import {
  useAddCampaignTemplateTranslation,
  useDeleteCampaignTemplateTranslation,
  useGetCampaignTemplate,
  useUpdateCampaignTemplateTranslation,
} from "@/app/[locale]/(modules)/notifications/_services/notification.hook";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { getErrorMessage } from "@/lib/utils";
import { EmailEditor } from "./email-editor";

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

type CampaignTemplateTranslationDrawerProps = {
  templateId: string | null;
  onClose: () => void;
};

export function CampaignTemplateTranslationDrawer({
  templateId,
  onClose,
}: CampaignTemplateTranslationDrawerProps) {
  const templateQuery = useGetCampaignTemplate(templateId ?? "");
  const addTranslation = useAddCampaignTemplateTranslation();
  const updateTranslation = useUpdateCampaignTemplateTranslation();
  const deleteTranslation = useDeleteCampaignTemplateTranslation();

  const [isEditing, setIsEditing] = useState(false);
  const [channels, setChannels] = useState<Record<string, ChannelContent>>({
    in_app: { title: "", body: "" },
    email: { subject: "", body: "" },
    push: { title: "", body: "" },
  });

  useEffect(() => {
    if (templateQuery.data) {
      const amTranslation = templateQuery.data.translations?.find((t) => t.language === "am");
      if (amTranslation) {
        setIsEditing(true);
        setChannels(parseContentToChannels(amTranslation.content));
      } else {
        setIsEditing(false);
        setChannels({
          in_app: { title: "", body: "" },
          email: { subject: "", body: "" },
          push: { title: "", body: "" },
        });
      }
    }
  }, [templateQuery.data]);

  function updateChannel(channel: string, field: keyof ChannelContent, value: string) {
    setChannels((prev) => ({
      ...prev,
      [channel]: { ...prev[channel], [field]: value },
    }));
  }

  function handleSave() {
    if (!templateId) return;

    const payload = {
      content: buildContentFromChannels(channels),
    };

    if (isEditing) {
      updateTranslation.mutate({ id: templateId, lang: "am", payload }, { onSuccess: onClose });
    } else {
      addTranslation.mutate(
        { id: templateId, payload: { language: "am", ...payload } },
        { onSuccess: onClose }
      );
    }
  }

  function handleDelete() {
    if (!templateId) return;
    deleteTranslation.mutate({ id: templateId, lang: "am" }, { onSuccess: onClose });
  }

  const isPending =
    addTranslation.isPending || updateTranslation.isPending || deleteTranslation.isPending;
  const isError = addTranslation.isError || updateTranslation.isError || deleteTranslation.isError;

  const title = isEditing ? "Edit Amharic Translation" : "Add Amharic Translation";
  const saveLabel = isPending ? "Saving…" : isEditing ? "Update Translation" : "Add Translation";

  return (
    <>
      <button
        type="button"
        aria-label="Close drawer"
        className="fixed inset-0 bg-black/40 z-40 cursor-default"
        onClick={onClose}
      />
      <div className="fixed right-0 top-0 h-full w-full max-w-lg bg-background border-l shadow-xl z-50 flex flex-col">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="text-lg font-semibold">{title}</h3>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {templateQuery.isLoading ? (
            <p className="text-sm text-muted-foreground">Loading template&hellip;</p>
          ) : templateQuery.isError ? (
            <p className="text-sm text-destructive">
              Failed to load: {getErrorMessage(templateQuery.error)}
            </p>
          ) : (
            <Tabs defaultValue="in_app">
              <TabsList>
                <TabsTrigger value="in_app">In-App</TabsTrigger>
                <TabsTrigger value="email">Email</TabsTrigger>
                <TabsTrigger value="push">Push</TabsTrigger>
              </TabsList>

              <TabsContent value="in_app" className="space-y-3 pt-2">
                <div className="space-y-2">
                  <Label htmlFor="in_app-title">Title</Label>
                  <Input
                    id="in_app-title"
                    value={channels.in_app?.title ?? ""}
                    onChange={(e) => updateChannel("in_app", "title", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="in_app-body">Body</Label>
                  <Textarea
                    id="in_app-body"
                    value={channels.in_app?.body ?? ""}
                    onChange={(e) => updateChannel("in_app", "body", e.target.value)}
                    rows={4}
                  />
                </div>
              </TabsContent>

              <TabsContent value="email" className="space-y-3 pt-2">
                <div className="space-y-2">
                  <Label htmlFor="email-subject">Subject</Label>
                  <Input
                    id="email-subject"
                    value={channels.email?.subject ?? ""}
                    onChange={(e) => updateChannel("email", "subject", e.target.value)}
                  />
                </div>
                <EmailEditor
                  value={channels.email?.body ?? ""}
                  onChange={(value) => updateChannel("email", "body", value)}
                />
              </TabsContent>

              <TabsContent value="push" className="space-y-3 pt-2">
                <div className="space-y-2">
                  <Label htmlFor="push-title">Title</Label>
                  <Input
                    id="push-title"
                    value={channels.push?.title ?? ""}
                    onChange={(e) => updateChannel("push", "title", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="push-body">Body</Label>
                  <Textarea
                    id="push-body"
                    value={channels.push?.body ?? ""}
                    onChange={(e) => updateChannel("push", "body", e.target.value)}
                    rows={4}
                  />
                </div>
              </TabsContent>
            </Tabs>
          )}

          {isError && (
            <p className="text-sm text-destructive">
              Failed to save:{" "}
              {getErrorMessage(
                addTranslation.error ?? updateTranslation.error ?? deleteTranslation.error
              )}
            </p>
          )}
        </div>

        <div className="p-4 border-t flex justify-end gap-2">
          {isEditing && (
            <ConfirmDialog
              title="Remove Translation"
              description="Remove the Amharic translation? This cannot be undone."
              confirmLabel="Remove"
              variant="destructive"
              onConfirm={handleDelete}
            >
              <Button variant="destructive" disabled={isPending}>
                Remove
              </Button>
            </ConfirmDialog>
          )}
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isPending || templateQuery.isLoading}>
            {saveLabel}
          </Button>
        </div>
      </div>
    </>
  );
}
