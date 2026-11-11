import { FieldError } from "@/components/field_error";
import { InputField } from "@/components/input_field";
import { PageHeader } from "@/components/page_header";
import { Panel, PanelHeader } from "@/components/panel";
import { Segmented } from "@/components/segmented";
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
import { Textarea } from "@/components/ui/textarea";
import { KEY_FORMATS, KeyFormat, TextView } from "@/constants/key_format";
import { SOURCE_LANGUAGE } from "@/constants/language";
import { PROJECTS, KEYS, LANGUAGES, getProject } from "@/data/mock_data";
import { formatExact, formatRelative } from "@/lib/format";
import { cn } from "@/lib/utils";
import { LabelField, LongTextField } from "@/pages/keys/components/translation_fields";
import type { TranslationKey } from "@/types/translation_key";
import { Check, FileText, Plus, Type } from "lucide-react";
import { useState, type FormEvent } from "react";
import { Trans, useTranslation } from "react-i18next";
import { Link, useNavigate, useParams, useSearchParams } from "react-router";
import { toast } from "sonner";

const KEY_PATTERN = /^[a-z0-9_]+(\.[a-z0-9_]+)*$/;

const FORMAT_OPTION = {
  [KeyFormat.Label]: { icon: Type, label: "keyForm.format.label" },
  [KeyFormat.LongText]: { icon: FileText, label: "keyForm.format.longText" },
} as const satisfies Record<KeyFormat, unknown>;

type FormErrors = {
  project?: boolean;
  key?: "required" | "format";
  source?: boolean;
};

function KeyForm({
  existing,
  initialProjectId,
}: {
  existing?: TranslationKey;
  initialProjectId?: number;
}) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const isEdit = !!existing;
  const [projectId, setProjectId] = useState(initialProjectId);
  const [keyName, setKeyName] = useState(existing?.key ?? "");
  const [format, setFormat] = useState<KeyFormat>(existing?.format ?? KeyFormat.Label);
  const [description, setDescription] = useState(existing?.description ?? "");
  const [values, setValues] = useState<Record<string, string>>(() =>
    Object.fromEntries(LANGUAGES.map((l) => [l.code, existing?.values[l.code] ?? ""])),
  );
  const [activeLang, setActiveLang] = useState(SOURCE_LANGUAGE);
  const [views, setViews] = useState<Record<string, TextView>>({});
  const [errors, setErrors] = useState<FormErrors>({});

  const project = projectId ? getProject(projectId) : undefined;
  const languages = LANGUAGES.filter((l) => !project || project.languages.includes(l.code));
  const filled = languages.filter((l) => values[l.code].trim()).length;
  const currentLang = languages.find((l) => l.code === activeLang) ?? languages[0];
  const setValue = (code: string, value: string) => {
    setValues((prev) => ({ ...prev, [code]: value }));
    if (code === SOURCE_LANGUAGE) setErrors((prev) => ({ ...prev, source: false }));
  };
  const backTo = project ? `/projects/${project.id}` : "/";
  const sourceError = errors.source ? t("keyForm.sourceRequired") : undefined;

  const submit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const next: FormErrors = {
      project: !projectId,
      key: !keyName.trim() ? "required" : !KEY_PATTERN.test(keyName) ? "format" : undefined,
      source: !values[SOURCE_LANGUAGE].trim(),
    };
    setErrors(next);
    if (next.source) {
      setActiveLang(SOURCE_LANGUAGE);
      setViews((prev) => ({ ...prev, [SOURCE_LANGUAGE]: TextView.Write }));
    }
    if (next.project || next.key || next.source) {
      toast.error(t("common.errors.fixFields"));
      return;
    }
    toast.success(isEdit ? t("keyForm.translationsSaved") : t("keyForm.keyCreated"));
    const submitter = (e.nativeEvent as SubmitEvent).submitter as HTMLButtonElement | null;
    if (submitter?.name === "another") {
      setKeyName("");
      setDescription("");
      setValues(Object.fromEntries(LANGUAGES.map((l) => [l.code, ""])));
    } else {
      navigate(backTo);
    }
  };

  return (
    <>
      <PageHeader
        breadcrumbs={[
          ...(project
            ? [
                { label: t("nav.projects"), to: "/projects" },
                { label: project.name, to: `/projects/${project.id}` },
              ]
            : []),
          {
            label: isEdit ? t("keyForm.editBreadcrumb") : t("keyForm.addTitle"),
          },
        ]}
        title={isEdit ? t("keyForm.editTitle") : t("keyForm.addTitle")}
        description={isEdit ? t("keyForm.editDescription") : undefined}
      />

      <form onSubmit={submit} noValidate className="grid gap-4 xl:grid-cols-12">
        <div className="space-y-4 xl:col-span-4">
          {/* ===== Key details ===== */}
          <Panel>
            <PanelHeader title={t("keyForm.details")} />
            <div className="space-y-4 p-5">
              <div className="space-y-1.5">
                <Label htmlFor="key-project" required>
                  {t("keyForm.project")}
                </Label>
                <Select
                  value={projectId ? String(projectId) : undefined}
                  onValueChange={(v) => {
                    setProjectId(Number(v));
                    setErrors((prev) => ({ ...prev, project: false }));
                  }}
                  disabled={isEdit}
                  required
                >
                  <SelectTrigger
                    id="key-project"
                    className="w-full bg-card"
                    aria-invalid={errors.project}
                  >
                    <SelectValue placeholder={t("keyForm.projectPlaceholder")} />
                  </SelectTrigger>
                  <SelectContent>
                    {PROJECTS.map((a) => (
                      <SelectItem key={a.id} value={String(a.id)}>
                        {a.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FieldError>{errors.project && t("keyForm.errors.projectRequired")}</FieldError>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="key-name" required>
                  {t("keyForm.key")}
                </Label>
                <InputField
                  id="key-name"
                  className="font-mono"
                  placeholder="checkout.button.pay_now"
                  required
                  readOnly={isEdit}
                  invalid={!!errors.key}
                  error={errors.key === "format" && t("keyForm.errors.keyFormat")}
                  value={keyName}
                  onChange={(e) => {
                    setKeyName(e.target.value);
                    setErrors((prev) => ({ ...prev, key: undefined }));
                  }}
                />
              </div>
              <div className="space-y-1.5">
                <Label>{t("keyForm.contentType")}</Label>
                <Segmented
                  stretch
                  value={format}
                  onChange={setFormat}
                  options={KEY_FORMATS.map((f) => {
                    const { icon: Icon, label } = FORMAT_OPTION[f];
                    return {
                      value: f,
                      label: (
                        <>
                          <Icon /> {t(label)}
                        </>
                      ),
                    };
                  })}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="key-desc">{t("keyForm.context")}</Label>
                <Textarea
                  id="key-desc"
                  rows={3}
                  placeholder={t("keyForm.contextPlaceholder")}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>
              {format === KeyFormat.Label && (
                <div className="space-y-1.5">
                  <Label htmlFor="max-len">
                    <Trans
                      i18nKey="keyForm.maxLength"
                      components={{
                        muted: <span className="font-normal text-muted-foreground" />,
                      }}
                    />
                  </Label>
                  <Input
                    id="max-len"
                    type="number"
                    min={1}
                    placeholder={t("keyForm.maxLengthPlaceholder")}
                  />
                </div>
              )}
            </div>
          </Panel>

          {/* ===== Audit info ===== */}
          {existing && (
            <Panel className="space-y-1 p-5 text-xs">
              <div className="flex justify-between py-1">
                <span className="text-muted-foreground">{t("keyForm.created")}</span>
                <span>
                  {formatExact(existing.createdAt)} · {existing.createdBy}
                </span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-muted-foreground">{t("keyForm.lastUpdated")}</span>
                <span>
                  {formatRelative(existing.updatedAt)} · {existing.updatedBy}
                </span>
              </div>
            </Panel>
          )}
        </div>

        <div className="xl:col-span-8">
          {/* ===== Translations ===== */}
          <Panel>
            <PanelHeader
              title={t("keyForm.translations")}
              description={t("keyForm.filled", {
                filled,
                total: languages.length,
              })}
              // actions={
              //   <Button
              //     type="button"
              //     size="sm"
              //     variant="secondary"
              //     className="bg-brand-soft text-brand-strong hover:bg-brand-muted"
              //     onClick={() => toast.success(t('keyForm.suggested'))}
              //   >
              //     <Sparkles /> {t('keyForm.suggest')}
              //   </Button>
              // }
            />
            {format === KeyFormat.LongText ? (
              <>
                <div
                  className="flex flex-wrap gap-1.5 border-b bg-surface-2 px-5 py-3"
                  role="tablist"
                  aria-label={t("keyForm.languageTabs")}
                >
                  {languages.map((l) => (
                    <button
                      key={l.code}
                      type="button"
                      role="tab"
                      aria-selected={l.code === currentLang.code}
                      title={l.name}
                      onClick={() => setActiveLang(l.code)}
                      className={cn(
                        "inline-flex items-center gap-1.5 rounded-full border border-input bg-card px-2.5 py-0.5 font-mono text-xs font-medium text-text-2 hover:border-brand-line hover:text-brand-strong",
                        l.code === currentLang.code &&
                          "border-brand bg-brand text-white hover:text-white",
                      )}
                    >
                      {l.code}
                      <span
                        className={cn(
                          "size-1.75 rounded-full bg-input",
                          values[l.code].trim() && "bg-good",
                          l.code === currentLang.code && "ring-[1.5px] ring-white",
                        )}
                      />
                    </button>
                  ))}
                </div>
                <div className="px-5">
                  <LongTextField
                    key={currentLang.code}
                    language={currentLang}
                    value={values[currentLang.code]}
                    onChange={(v) => setValue(currentLang.code, v)}
                    error={currentLang.code === SOURCE_LANGUAGE ? sourceError : undefined}
                    source={values[SOURCE_LANGUAGE]}
                    view={views[currentLang.code] ?? TextView.Write}
                    onViewChange={(view) =>
                      setViews((prev) => ({
                        ...prev,
                        [currentLang.code]: view,
                      }))
                    }
                  />
                </div>
              </>
            ) : (
              <div className="px-5">
                {languages.map((l) => (
                  <LabelField
                    key={l.code}
                    language={l}
                    value={values[l.code]}
                    onChange={(v) => setValue(l.code, v)}
                    error={l.code === SOURCE_LANGUAGE ? sourceError : undefined}
                  />
                ))}
              </div>
            )}
          </Panel>
          <div className="mt-4 flex justify-end gap-2">
            <Button asChild variant="outline">
              <Link to={backTo}>{t("common.cancel")}</Link>
            </Button>
            {!isEdit && (
              <Button type="submit" name="another" variant="outline">
                <Plus /> {t("keyForm.saveAndAddAnother")}
              </Button>
            )}
            <Button type="submit">
              <Check /> {isEdit ? t("keyForm.saveChanges") : t("keyForm.saveKey")}
            </Button>
          </div>
        </div>
      </form>
    </>
  );
}

export function KeyFormPage() {
  const { id } = useParams();
  const [params] = useSearchParams();
  const existing = id ? KEYS.find((k) => k.id === Number(id)) : undefined;
  const projectId = existing?.projectId ?? (Number(params.get("projectId")) || undefined);
  return (
    <KeyForm key={id ?? `new-${projectId}`} existing={existing} initialProjectId={projectId} />
  );
}
