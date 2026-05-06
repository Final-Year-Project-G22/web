"use client";

import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useState } from "react";

import {
  useCreateCampaign,
  useListCampaignTemplates,
} from "@/app/[locale]/(modules)/notifications/_services/notification.hook";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectScrollDownButton,
  SelectScrollUpButton,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { getErrorMessage } from "@/lib/utils";

const steps = ["Template", "Details", "Review"];

export default function CreateCampaignPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [campaignType, setCampaignType] = useState("broadcast");
  const [campaignTemplateId, setCampaignTemplateId] = useState("");
  const [scheduledFor, setScheduledFor] = useState("");

  const templatesQuery = useListCampaignTemplates({ page: 1, pageSize: 200 });
  const createMutation = useCreateCampaign();

  const templates = templatesQuery.data?.data ?? [];

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();

    createMutation.mutate(
      {
        name,
        description: description || undefined,
        campaignType,
        campaignTemplateId,
        scheduledFor: scheduledFor ? new Date(scheduledFor).toISOString() : undefined,
      },
      {
        onSuccess: () => router.push("/notifications/campaigns"),
      }
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 space-y-10">
      {/* Stepper */}
      <div className="flex justify-between items-center">
        {steps.map((s, i) => (
          <div key={s} className="flex-1 text-center">
            <div
              className={`mx-auto mb-2 h-9 w-9 rounded-full flex items-center justify-center text-sm font-medium transition
              ${i <= step ? "bg-primary text-white" : "bg-muted text-muted-foreground"}`}
            >
              {i + 1}
            </div>
            <p className="text-xs text-muted-foreground">{s}</p>
          </div>
        ))}
      </div>

      <Card className="shadow-xl border-muted/40 rounded-2xl">
        <CardHeader className="pb-2">
          <CardTitle className="text-2xl font-semibold">{steps[step]}</CardTitle>
        </CardHeader>

        <CardContent>
          <form onSubmit={onSubmit} className="space-y-8">
            {/* STEP 1 */}
            {step === 0 && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <div className="space-y-3">
                  <Label>Campaign Template</Label>

                  <Select value={campaignTemplateId} onValueChange={setCampaignTemplateId}>
                    <SelectTrigger className="h-11">
                      <SelectValue placeholder="Choose template..." />
                    </SelectTrigger>

                    <SelectContent
                      position="popper"
                      className="max-h-60 z-50 animate-in fade-in zoom-in-95"
                    >
                      <SelectScrollUpButton />

                      {templates.map((t) => (
                        <SelectItem key={t.id} value={t.id} className="py-2">
                          {t.name}
                        </SelectItem>
                      ))}

                      <SelectScrollDownButton />
                    </SelectContent>
                  </Select>

                  {templatesQuery.isError && (
                    <p className="text-sm text-destructive">
                      {getErrorMessage(templatesQuery.error)}
                    </p>
                  )}
                </div>

                <div className="flex justify-end pt-8">
                  <Button type="button" disabled={!campaignTemplateId} onClick={() => setStep(1)}>
                    Continue →
                  </Button>
                </div>
              </motion.div>
            )}

            {/* STEP 2 */}
            {step === 1 && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label>Name</Label>
                    <Input
                      className="h-11"
                      placeholder="Summer Sale Launch"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Campaign Type</Label>
                    <Select value={campaignType} onValueChange={setCampaignType}>
                      <SelectTrigger className="h-11">
                        <SelectValue />
                      </SelectTrigger>

                      <SelectContent position="popper" className="z-50">
                        <SelectItem value="broadcast">Broadcast</SelectItem>
                        <SelectItem value="segmented">Segmented</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Description</Label>
                  <Input
                    className="h-11"
                    placeholder="Optional..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Schedule</Label>
                  <Input
                    className="h-11"
                    type="datetime-local"
                    value={scheduledFor}
                    onChange={(e) => setScheduledFor(e.target.value)}
                  />
                </div>

                <div className="flex justify-between pt-6">
                  <Button variant="outline" onClick={() => setStep(0)}>
                    ← Back
                  </Button>

                  <Button disabled={!name} onClick={() => setStep(2)}>
                    Continue →
                  </Button>
                </div>
              </motion.div>
            )}

            {/* STEP 3 */}
            {step === 2 && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <div className="rounded-xl bg-muted/40 p-6 space-y-3 text-sm">
                  <p>
                    <span className="font-medium">Template:</span>{" "}
                    {templates.find((t) => t.id === campaignTemplateId)?.name}
                  </p>
                  <p>
                    <span className="font-medium">Name:</span> {name}
                  </p>
                  <p>
                    <span className="font-medium">Description:</span> {description || "—"}
                  </p>
                  <p>
                    <span className="font-medium">Type:</span> {campaignType}
                  </p>
                  <p>
                    <span className="font-medium">Schedule:</span>{" "}
                    {scheduledFor ? new Date(scheduledFor).toLocaleString() : "Immediately"}
                  </p>
                </div>

                {createMutation.isError && (
                  <p className="text-sm text-destructive pt-3">
                    {getErrorMessage(createMutation.error)}
                  </p>
                )}

                <div className="flex justify-between pt-8">
                  <Button variant="outline" onClick={() => setStep(1)}>
                    ← Back
                  </Button>

                  <Button type="submit" disabled={createMutation.isPending}>
                    {createMutation.isPending ? "Creating..." : "Create Campaign"}
                  </Button>
                </div>
              </motion.div>
            )}
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
