"use client";

import * as DialogPrimitive from "@radix-ui/react-dialog";
import { UploadCloud, X } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { useSectorList, useTagList } from "@/app/[locale]/(modules)/admin/_services/taxonomy.hook";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getErrorMessage } from "@/lib/utils";
import { useUploadDocument } from "../_services/ai.hook";

export function UploadDialog() {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [language, setLanguage] = useState<"en" | "am">("en");
  const [selectedSectorIds, setSelectedSectorIds] = useState<string[]>([]);
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: sectorsData } = useSectorList();
  const { data: tagsData } = useTagList();
  const uploadDoc = useUploadDocument();

  const sectors = sectorsData?.data ?? [];
  const tags = tagsData?.data ?? [];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) {
      setFile(f);
      if (!title) {
        setTitle(f.name.replace(/\.[^/.]+$/, ""));
      }
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    toast.promise(
      uploadDoc.mutateAsync({
        file,
        title: title || file.name.replace(/\.[^/.]+$/, ""),
        language,
        sectorIds: selectedSectorIds.length > 0 ? selectedSectorIds : undefined,
        tagIds: selectedTagIds.length > 0 ? selectedTagIds : undefined,
      }),
      {
        loading: "Uploading document...",
        success: () => {
          setOpen(false);
          reset();
          return "Document uploaded successfully!";
        },
        error: (err) => `Failed to upload: ${getErrorMessage(err)}`,
      }
    );
  };

  const reset = () => {
    setTitle("");
    setLanguage("en");
    setSelectedSectorIds([]);
    setSelectedTagIds([]);
    setFile(null);
  };

  const toggleSector = (id: string) => {
    setSelectedSectorIds((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  };

  const toggleTag = (id: string) => {
    setSelectedTagIds((prev) => (prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]));
  };

  return (
    <DialogPrimitive.Root open={open} onOpenChange={setOpen}>
      <DialogPrimitive.Trigger asChild>
        <Button className="flex items-center gap-2">
          <UploadCloud className="w-4 h-4" />
          <span>Upload Document</span>
        </Button>
      </DialogPrimitive.Trigger>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/50 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <DialogPrimitive.Content
          className="fixed z-50 w-full max-w-lg gap-4 border bg-background p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] rounded-xl"
          style={{
            left: "50%",
            top: "50%",
            transform: "translate(-50%, -50%)",
          }}
        >
          <div className="flex items-center justify-between mb-4">
            <DialogPrimitive.Title className="text-lg font-semibold">
              Upload Document
            </DialogPrimitive.Title>
            <DialogPrimitive.Close asChild>
              <Button variant="ghost" size="icon-xs" className="shrink-0">
                <X className="w-4 h-4" />
              </Button>
            </DialogPrimitive.Close>
          </div>
          <DialogPrimitive.Description className="text-sm text-muted-foreground mb-4">
            Add metadata before uploading. Title defaults to the filename.
          </DialogPrimitive.Description>

          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                placeholder={file ? file.name.replace(/\.[^/.]+$/, "") : "Document title"}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="language">Language</Label>
              <Select value={language} onValueChange={(v) => setLanguage(v as "en" | "am")}>
                <SelectTrigger id="language">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="am">Amharic</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label>Sectors</Label>
              <div className="flex flex-wrap gap-2 max-h-28 overflow-y-auto border rounded-md p-2">
                {sectors.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => toggleSector(s.id)}
                    className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                      selectedSectorIds.includes(s.id)
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-background text-muted-foreground border-border hover:bg-muted"
                    }`}
                  >
                    {s.nameEn}
                  </button>
                ))}
                {sectors.length === 0 && (
                  <span className="text-xs text-muted-foreground">No sectors available</span>
                )}
              </div>
            </div>

            <div className="grid gap-2">
              <Label>Tags</Label>
              <div className="flex flex-wrap gap-2 max-h-28 overflow-y-auto border rounded-md p-2">
                {tags.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => toggleTag(t.id)}
                    className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                      selectedTagIds.includes(t.id)
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-background text-muted-foreground border-border hover:bg-muted"
                    }`}
                  >
                    {t.nameEn}
                  </button>
                ))}
                {tags.length === 0 && (
                  <span className="text-xs text-muted-foreground">No tags available</span>
                )}
              </div>
            </div>

            <div className="grid gap-2">
              <Label>File</Label>
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept=".pdf,.doc,.docx"
                onChange={handleFileChange}
              />
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={() => fileInputRef.current?.click()}
              >
                {file ? file.name : "Choose PDF/DOCX file"}
              </Button>
            </div>
          </div>

          <div className="flex justify-end gap-2 mt-6">
            <DialogPrimitive.Close asChild>
              <Button variant="outline">Cancel</Button>
            </DialogPrimitive.Close>
            <Button onClick={handleUpload} disabled={!file || uploadDoc.isPending}>
              {uploadDoc.isPending ? "Uploading..." : "Upload"}
            </Button>
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
