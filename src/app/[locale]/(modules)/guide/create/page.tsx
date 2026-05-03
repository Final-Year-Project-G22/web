"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function CreateGuidePage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [category, setCategory] = useState("legal-compliance");

  function onCreateGuide(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fakeCreatedId = "guide-local-1";
    router.push(`/guide/${fakeCreatedId}/edit?step=step-1`);
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Create Guide</CardTitle>
          <CardDescription>Initialize a new guide before editing steps and content</CardDescription>
        </CardHeader>

        <CardContent>
          <form className="space-y-4" onSubmit={onCreateGuide}>
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                placeholder="How to Register a Sole Proprietorship"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="slug">Slug</Label>
              <Input
                id="slug"
                placeholder="register-sole-proprietorship"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Category</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="legal-compliance">Legal & Compliance</SelectItem>
                  <SelectItem value="tax">Tax</SelectItem>
                  <SelectItem value="licensing">Licensing</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => router.push("/guide")}>
                Cancel
              </Button>
              <Button type="submit">Create & Continue</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
