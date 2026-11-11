import { CheckGrid, CheckTile } from "@/components/choice_tile";
import { FieldError } from "@/components/field_error";
import { InputField } from "@/components/input_field";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useLanguageCatalog } from "@/hooks/use_languages";
import { useCreateProject } from "@/hooks/use_projects";
import { useState, type FormEvent } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

type NewProjectDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

type FieldErrors = { name?: string; languages?: string };

function NewProjectForm({ onDone }: { onDone: () => void }) {
  const { t } = useTranslation();
  const createProject = useCreateProject();
  const { targets } = useLanguageCatalog();
  const [picked, setPicked] = useState<string[] | null>(null);
  const selected = picked ?? targets.slice(0, 1).map((l) => l.code);
  const [name, setName] = useState("");
  const [errors, setErrors] = useState<FieldErrors>({});
  const pending = createProject.isPending;

  const toggle = (code: string) => {
    setPicked(selected.includes(code) ? selected.filter((v) => v !== code) : [...selected, code]);
    setErrors((prev) => ({ ...prev, languages: undefined }));
  };

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const languageCodes = selected.filter((code) => targets.some((l) => l.code === code));
    const next: FieldErrors = {
      name: name.trim() ? undefined : t("common.errors.required"),
      languages: languageCodes.length ? undefined : t("projects.newDialog.languagesRequired"),
    };
    setErrors(next);
    if (Object.values(next).some(Boolean)) return;

    createProject.mutate(
      { name: name.trim(), languageCodes },
      {
        onSuccess: () => {
          toast.success(t("projects.newDialog.created"));
          onDone();
        },
      },
    );
  };

  return (
    <form onSubmit={submit} noValidate className="grid gap-4">
      <DialogHeader>
        <DialogTitle>{t("projects.newDialog.title")}</DialogTitle>
      </DialogHeader>
      <div className="space-y-1.5">
        <Label htmlFor="project-name" required>
          {t("projects.newDialog.name")}
        </Label>
        <InputField
          id="project-name"
          placeholder={t("projects.newDialog.namePlaceholder")}
          required
          invalid={!!errors.name}
          error={errors.name}
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            setErrors((prev) => ({ ...prev, name: undefined }));
          }}
        />
      </div>
      <div className="space-y-1.5">
        <Label required>{t("projects.newDialog.languages")}</Label>
        <CheckGrid>
          {targets.map((l) => (
            <CheckTile
              key={l.code}
              checked={selected.includes(l.code)}
              onCheckedChange={() => toggle(l.code)}
            >
              {l.name}
            </CheckTile>
          ))}
        </CheckGrid>
        <FieldError>{errors.languages}</FieldError>
        <p className="text-xs text-muted-foreground">{t("projects.newDialog.languagesHint")}</p>
      </div>
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onDone} disabled={pending}>
          {t("common.cancel")}
        </Button>
        <Button type="submit" disabled={pending}>
          {t("projects.newDialog.create")}
        </Button>
      </DialogFooter>
    </form>
  );
}

export function NewProjectDialog({ open, onOpenChange }: NewProjectDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        {open && <NewProjectForm onDone={() => onOpenChange(false)} />}
      </DialogContent>
    </Dialog>
  );
}
