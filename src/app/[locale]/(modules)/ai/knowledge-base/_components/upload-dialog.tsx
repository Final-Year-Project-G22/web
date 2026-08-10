"use client";

import * as DialogPrimitive from "@radix-ui/react-dialog";
import { UploadCloud, X } from "lucide-react";
import { useTranslations } from "next-intl";
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
  const t = useTranslations("surfaces.ai.kb");
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
        loading: t("uploading"),
        success: () => {
          setOpen(false);
          reset();
          return t("uploadSuccess");
        },
        error: (err) => t("uploadFailed", { error: getErrorMessage(err) }),
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
    setSelectedTagIds((prev) =>
      prev.includes(id) ? prev.filter((tg) => tg !== id) : [...prev, id]
    );
  };

  return (
    <DialogPrimitive.Root open={open} onOpenChange={setOpen}>
      <DialogPrimitive.Trigger asChild>
        <Button className="flex items-center gap-2">
          <UploadCloud className="h-4 w-4" />
          <span>{t("upload")}</span>
        </Button>
      </DialogPrimitive.Trigger>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/50 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <DialogPrimitive.Content
          className="fixed z-50 w-full max-w-lg gap-4 rounded-lg border border-line bg-panel p-6 shadow-popover duration-150 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%]"
          style={{
            left: "50%",
            top: "50%",
            transform: "translate(-50%, -50%)",
          }}
        >
          <div className="mb-4 flex items-center justify-between">
            <DialogPrimitive.Title className="font-display text-[15px] font-semibold text-ink">
              {t("upload")}
            </DialogPrimitive.Title>
            <DialogPrimitive.Close asChild>
              <Button variant="ghost" size="icon-xs" className="shrink-0">
                <X className="h-4 w-4" />
              </Button>
            </DialogPrimitive.Close>
          </div>
          <DialogPrimitive.Description className="mb-4 text-sm text-muted-foreground">
            {t("uploadDesc")}
          </DialogPrimitive.Description>

          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="title">{t("titleLabel")}</Label>
              <Input
                id="title"
                placeholder={file ? file.name.replace(/\.[^/.]+$/, "") : t("titleLabel")}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="language">{t("languageLabel")}</Label>
              <Select value={language} onValueChange={(v) => setLanguage(v as "en" | "am")}>
                <SelectTrigger id="language">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="am">አማርኛ</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label>{t("sectorsLabel")}</Label>
              <div className="flex max-h-28 flex-wrap gap-2 overflow-y-auto rounded-md border border-line p-2">
                {sectors.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => toggleSector(s.id)}
                    className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors duration-base ${
                      selectedSectorIds.includes(s.id)
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border bg-panel text-muted-foreground hover:bg-panel-2"
                    }`}
                  >
                    {s.nameEn}
                  </button>
                ))}
                {sectors.length === 0 && (
                  <span className="text-xs text-muted-foreground">{t("noSectors")}</span>
                )}
              </div>
            </div>

            <div className="grid gap-2">
              <Label>{t("tagsLabel")}</Label>
              <div className="flex max-h-28 flex-wrap gap-2 overflow-y-auto rounded-md border border-line p-2">
                {tags.map((tg) => (
                  <button
                    key={tg.id}
                    type="button"
                    onClick={() => toggleTag(tg.id)}
                    className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors duration-base ${
                      selectedTagIds.includes(tg.id)
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border bg-panel text-muted-foreground hover:bg-panel-2"
                    }`}
                  >
                    {tg.nameEn}
                  </button>
                ))}
                {tags.length === 0 && (
                  <span className="text-xs text-muted-foreground">{t("noTags")}</span>
                )}
              </div>
            </div>

            <div className="grid gap-2">
              <Label>{t("fileLabel")}</Label>
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
                className="w-full overflow-hidden"
                title={file ? file.name : undefined}
                onClick={() => fileInputRef.current?.click()}
              >
                <span className="block w-full truncate text-left">
                  {file ? file.name : t("chooseFile")}
                </span>
              </Button>
            </div>
          </div>

          <div className="mt-6 flex justify-end gap-2">
            <DialogPrimitive.Close asChild>
              <Button variant="outline">{t("cancel")}</Button>
            </DialogPrimitive.Close>
            <Button onClick={handleUpload} disabled={!file || uploadDoc.isPending}>
              {uploadDoc.isPending ? t("uploadingButton") : t("uploadButton")}
            </Button>
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
