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
import { useCreateLanguage, useUpdateLanguage } from "@/hooks/use_languages";
import { getFieldErrors } from "@/lib/api_error";
import { handleApiError } from "@/lib/handle_api_error";
import type { Language } from "@/types/language";
import { useState, type FormEvent } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

const CODE_PATTERN = /^[a-z]{2,3}(-[A-Za-z0-9]{2,4})?$/;

type Field = keyof Language;
type FieldErrors = Partial<Record<Field, string>>;

type LanguageDialogProps = {
  open: boolean;
  language: Language | null;
  onOpenChange: (open: boolean) => void;
};

function LanguageForm({ language, onDone }: { language: Language | null; onDone: () => void }) {
  const { t } = useTranslation();
  const createLanguage = useCreateLanguage();
  const updateLanguage = useUpdateLanguage();
  const [values, setValues] = useState<Language>({
    code: language?.code ?? "",
    name: language?.name ?? "",
    nativeName: language?.nativeName ?? "",
  });
  const [errors, setErrors] = useState<FieldErrors>({});
  const pending = createLanguage.isPending || updateLanguage.isPending;

  const change = (field: Field, value: string) => {
    setValues((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const validate = (): FieldErrors => {
    const required = t("common.errors.required");
    const code = values.code.trim();
    return {
      code: !code
        ? required
        : !CODE_PATTERN.test(code)
          ? t("languages.dialog.codeFormat")
          : undefined,
      name: values.name.trim() ? undefined : required,
      nativeName: values.nativeName.trim() ? undefined : required,
    };
  };

  const onError = (err: unknown) => {
    const fieldErrors = getFieldErrors(err);
    const next: FieldErrors = {
      code: fieldErrors.code,
      name: fieldErrors.name,
      nativeName: fieldErrors.nativeName,
    };
    if (Object.values(next).some(Boolean)) setErrors(next);
    else handleApiError(err);
  };

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const next = validate();
    setErrors(next);
    if (Object.values(next).some(Boolean)) return;

    const body = {
      name: values.name.trim(),
      nativeName: values.nativeName.trim(),
    };
    if (language) {
      updateLanguage.mutate(
        { code: language.code, ...body },
        {
          onSuccess: () => {
            toast.success(t("languages.dialog.saved", { name: body.name }));
            onDone();
          },
          onError,
        },
      );
    } else {
      createLanguage.mutate(
        { code: values.code.trim(), ...body },
        {
          onSuccess: () => {
            toast.success(t("languages.dialog.added"));
            onDone();
          },
          onError,
        },
      );
    }
  };

  return (
    <form onSubmit={submit} noValidate className="grid gap-4">
      <DialogHeader>
        <DialogTitle>
          {language
            ? t("languages.dialog.editTitle", { name: language.name })
            : t("languages.dialog.addTitle")}
        </DialogTitle>
      </DialogHeader>
      <div className="grid gap-4 md:grid-cols-12">
        <div className="space-y-1.5 md:col-span-3">
          <Label htmlFor="lang-code" required>
            {t("languages.dialog.code")}
          </Label>
          <InputField
            id="lang-code"
            className="font-mono"
            placeholder="vi"
            required
            readOnly={!!language}
            invalid={!!errors.code}
            error={errors.code}
            value={values.code}
            onChange={(e) => change("code", e.target.value)}
          />
        </div>
        <div className="space-y-1.5 md:col-span-9">
          <Label htmlFor="lang-name" required>
            {t("languages.dialog.name")}
          </Label>
          <InputField
            id="lang-name"
            placeholder={t("languages.dialog.namePlaceholder")}
            required
            invalid={!!errors.name}
            error={errors.name}
            value={values.name}
            onChange={(e) => change("name", e.target.value)}
          />
        </div>
        <div className="space-y-1.5 md:col-span-12">
          <Label htmlFor="lang-native" required>
            {t("languages.dialog.nativeName")}
          </Label>
          <InputField
            id="lang-native"
            placeholder="Tiếng Việt"
            required
            invalid={!!errors.nativeName}
            error={errors.nativeName}
            value={values.nativeName}
            onChange={(e) => change("nativeName", e.target.value)}
          />
        </div>
      </div>
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onDone} disabled={pending}>
          {t("common.cancel")}
        </Button>
        <Button type="submit" disabled={pending}>
          {language ? t("languages.dialog.save") : t("languages.dialog.add")}
        </Button>
      </DialogFooter>
    </form>
  );
}

export function LanguageDialog({ open, language, onOpenChange }: LanguageDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        {open && (
          <LanguageForm
            key={language?.code ?? "new"}
            language={language}
            onDone={() => onOpenChange(false)}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
