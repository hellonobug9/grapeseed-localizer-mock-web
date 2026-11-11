import { useState, type FormEvent } from "react";
import { Download } from "lucide-react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { FieldError } from "@/components/field_error";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { getLanguage } from "@/data/mock_data";
import { slugify } from "@/lib/slug";
import type { ProjectInfo } from "@/types/project";

const INVALID_FILE_NAME_CHARS = /[\\/:*?"<>|]/g;

type DownloadDialogProps = {
  project: ProjectInfo;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

const sanitize = (value: string) => value.replace(INVALID_FILE_NAME_CHARS, "");
const defaultFileName = (code: string) => `${code}.json`;

export function DownloadDialog({ project, open, onOpenChange }: DownloadDialogProps) {
  const { t } = useTranslation();
  const [selected, setSelected] = useState(project.languages);
  const [overrides, setOverrides] = useState<Record<string, string>>({});
  const [archiveName, setArchiveName] = useState(`${slugify(project.name)}-translations`);
  const [includeUntranslated, setIncludeUntranslated] = useState(true);
  const fileName = (code: string) => overrides[code] ?? defaultFileName(code);
  const fileNamesValid = selected.every((code) => fileName(code).trim() !== "");
  const canExport = selected.length > 0 && fileNamesValid && archiveName.trim() !== "";

  const toggle = (code: string, checked: boolean) =>
    setSelected((prev) => (checked ? [...prev, code] : prev.filter((c) => c !== code)));

  const submit = (e: FormEvent) => {
    e.preventDefault();
    onOpenChange(false);
    toast.success(
      t("projectDetails.downloadDialog.preparing", { file: `${archiveName.trim()}.zip` }),
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <form onSubmit={submit} className="grid gap-4">
          <DialogHeader>
            <DialogTitle>
              {t("projectDetails.downloadDialog.title", { name: project.name })}
            </DialogTitle>
          </DialogHeader>

          <div>
            <div className="mb-2 flex items-center justify-between">
              <div className="flex items-baseline gap-2">
                <Label required>{t("projectDetails.downloadDialog.languages")}</Label>
                <span className="text-xs text-muted-foreground">
                  {t("projectDetails.downloadDialog.selectedOf", {
                    selected: selected.length,
                    total: project.languages.length,
                  })}
                </span>
              </div>
              <div className="flex gap-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelected(project.languages)}
                >
                  {t("projectDetails.downloadDialog.all")}
                </Button>
                <Button type="button" variant="ghost" size="sm" onClick={() => setSelected([])}>
                  {t("projectDetails.downloadDialog.none")}
                </Button>
              </div>
            </div>
            <div className="grid max-h-64 gap-2 overflow-y-auto pr-1">
              {project.languages.map((code) => {
                const checked = selected.includes(code);
                return (
                  <div
                    key={code}
                    className="grid grid-cols-[minmax(0,2fr)_minmax(0,3fr)] items-center gap-3"
                  >
                    <label className="flex items-center gap-2 truncate">
                      <Checkbox
                        checked={checked}
                        onCheckedChange={(v) => toggle(code, v === true)}
                      />
                      {getLanguage(code).name}
                    </label>
                    <Input
                      className="font-mono"
                      disabled={!checked}
                      value={checked ? fileName(code) : ""}
                      placeholder={defaultFileName(code)}
                      aria-label={t("projectDetails.downloadDialog.fileNameFor", {
                        language: getLanguage(code).name,
                      })}
                      aria-invalid={checked && fileName(code).trim() === ""}
                      onChange={(e) =>
                        setOverrides((prev) => ({ ...prev, [code]: sanitize(e.target.value) }))
                      }
                    />
                  </div>
                );
              })}
            </div>
            <FieldError className="mt-2">
              {selected.length === 0 && t("projectDetails.downloadDialog.selectLanguage")}
            </FieldError>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="download-archive-name" required>
              {t("projectDetails.downloadDialog.archiveName")}
            </Label>
            <div className="flex items-center gap-2">
              <Input
                id="download-archive-name"
                required
                aria-invalid={archiveName.trim() === ""}
                className="font-mono"
                value={archiveName}
                onChange={(e) => setArchiveName(sanitize(e.target.value))}
              />
              <span className="font-mono text-sm text-muted-foreground">.zip</span>
            </div>
            <FieldError>{archiveName.trim() === "" && t("common.errors.required")}</FieldError>
          </div>

          <label className="flex items-center gap-2">
            <Checkbox
              checked={includeUntranslated}
              onCheckedChange={(v) => setIncludeUntranslated(v === true)}
            />
            {t("projectDetails.downloadDialog.includeUntranslated")}
          </label>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {t("common.cancel")}
            </Button>
            <Button type="submit" disabled={!canExport}>
              <Download /> {t("projectDetails.downloadDialog.export")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
