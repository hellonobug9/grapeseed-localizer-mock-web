import { useState, type DragEvent, type FormEvent, type ReactNode } from "react";
import { CloudUpload, FileBraces, TriangleAlert, X } from "lucide-react";
import { Trans, useTranslation } from "react-i18next";
import { Link, useSearchParams } from "react-router";
import { toast } from "sonner";
import { Callout } from "@/components/callout";
import { OptionTile } from "@/components/choice_tile";
import { DataTable, Td, Th, Tr } from "@/components/data_table";
import { PageHeader } from "@/components/page_header";
import { Panel, PanelHeader } from "@/components/panel";
import { Button } from "@/components/ui/button";
import { RadioGroup } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { IMPORT_MODES, ImportMode } from "@/constants/import_mode";
import { PROJECTS, LANGUAGES, getProject } from "@/data/mock_data";
import { formatNumber } from "@/lib/format";
import { cn } from "@/lib/utils";

const PREVIEW_LIMIT = 200;

type Parsed = { entries: [string, unknown][]; invalid: number };

const flatten = (obj: Record<string, unknown>, prefix = "", out: Record<string, unknown> = {}) => {
  for (const [k, v] of Object.entries(obj)) {
    const key = prefix ? `${prefix}.${k}` : k;
    if (v && typeof v === "object" && !Array.isArray(v))
      flatten(v as Record<string, unknown>, key, out);
    else out[key] = v;
  }
  return out;
};

const guessLanguage = (fileName: string) => {
  const base = fileName.replace(/\.json$/i, "");
  return LANGUAGES.find(
    (l) => base === l.code || ["_", "-", "."].some((sep) => base.endsWith(`${sep}${l.code}`)),
  )?.code;
};

function Step({ n, required, children }: { n: number; required?: boolean; children: ReactNode }) {
  return (
    <div className="mb-3 flex items-center gap-2.5 font-semibold">
      <span className="grid size-6 place-items-center rounded-full bg-brand text-xs text-white">
        {n}
      </span>
      <span>
        {children}
        {required && (
          <span aria-hidden className="ml-0.5 text-destructive">
            *
          </span>
        )}
      </span>
    </div>
  );
}

export function UploadPage() {
  const { t } = useTranslation();
  const [params] = useSearchParams();
  const initialProjectId = getProject(Number(params.get("projectId")))?.id;
  const [projectId, setProjectId] = useState(initialProjectId ? String(initialProjectId) : "");
  const [lang, setLang] = useState(params.get("lang") ?? "");
  const [mode, setMode] = useState<ImportMode>(ImportMode.Fill);
  const [file, setFile] = useState<File | null>(null);
  const [parsed, setParsed] = useState<Parsed | null>(null);
  const [error, setError] = useState("");
  const [dragging, setDragging] = useState(false);

  const handleFile = (next: File | null) => {
    setFile(next);
    setParsed(null);
    setError("");
    if (!next) return;
    const guess = guessLanguage(next.name);
    if (guess) setLang(guess);
    next.text().then((text) => {
      try {
        const json = JSON.parse(text);
        if (!json || typeof json !== "object" || Array.isArray(json))
          throw new Error(t("upload.errors.invalidRoot"));
        const entries = Object.entries(flatten(json));
        setParsed({
          entries,
          invalid: entries.filter(([, v]) => typeof v !== "string").length,
        });
      } catch (err) {
        setError(t("upload.errors.readFailed", { message: (err as Error).message }));
      }
    });
  };

  const onDrop = (e: DragEvent) => {
    e.preventDefault();
    setDragging(false);
    handleFile(e.dataTransfer.files[0] ?? null);
  };

  const submit = (e: FormEvent) => {
    e.preventDefault();
    toast.success(t("upload.queued"));
  };

  return (
    <>
      <PageHeader title={t("upload.title")} />

      <form onSubmit={submit} className="grid gap-4 xl:grid-cols-2">
        <div className="space-y-4">
          <Panel className="p-5">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Step n={1} required>
                  {t("upload.steps.project")}
                </Step>
                <Select value={projectId || undefined} onValueChange={setProjectId}>
                  <SelectTrigger className="w-full bg-card">
                    <SelectValue placeholder={t("upload.projectPlaceholder")} />
                  </SelectTrigger>
                  <SelectContent>
                    {PROJECTS.map((a) => (
                      <SelectItem key={a.id} value={String(a.id)}>
                        {a.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Step n={2} required>
                  {t("upload.steps.language")}
                </Step>
                <Select value={lang || undefined} onValueChange={setLang}>
                  <SelectTrigger className="w-full bg-card">
                    <SelectValue placeholder={t("upload.languagePlaceholder")} />
                  </SelectTrigger>
                  <SelectContent>
                    {LANGUAGES.map((l) => (
                      <SelectItem key={l.code} value={l.code}>
                        {l.name} ({l.code})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="mt-6">
              <Step n={3} required>
                {t("upload.steps.file")}
              </Step>
              <label
                onDragEnter={() => setDragging(true)}
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragging(true);
                }}
                onDragLeave={() => setDragging(false)}
                onDrop={onDrop}
                className={cn(
                  "relative block cursor-pointer rounded-xl border-2 border-dashed border-brand-line bg-brand-soft px-6 py-10 text-center transition-colors hover:border-brand hover:bg-brand-muted",
                  dragging && "border-brand bg-brand-muted",
                )}
              >
                <input
                  type="file"
                  accept=".json,application/json"
                  aria-label={t("upload.dropzone.choose")}
                  className="absolute inset-0 cursor-pointer opacity-0"
                  onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
                />
                <span className="mb-3 inline-grid size-14 place-items-center rounded-full bg-white text-brand shadow-sm">
                  <FileBraces className="size-7" />
                </span>
                <div className="font-semibold">
                  <Trans
                    i18nKey="upload.dropzone.title"
                    components={{ browse: <span className="text-brand" /> }}
                  />
                </div>
                <div className="mt-1 text-xs text-muted-foreground">
                  {t("upload.dropzone.hint")}
                </div>
              </label>

              {file && (
                <div className="mt-3 flex items-center gap-3 rounded-lg border bg-white px-4 py-3">
                  <span className="grid size-[38px] place-items-center rounded-lg bg-brand-soft text-brand">
                    <FileBraces className="size-5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-semibold">{file.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {t("upload.fileSize", {
                        size: formatNumber(Math.round(file.size / 102.4) / 10),
                      })}
                      {parsed && ` · ${t("common.keyCount", { count: parsed.entries.length })}`}
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon-sm"
                    aria-label={t("upload.removeFile")}
                    onClick={() => handleFile(null)}
                  >
                    <X />
                  </Button>
                </div>
              )}
              {error && (
                <Callout icon={TriangleAlert} tone="warn" className="mt-3">
                  {error}
                </Callout>
              )}
            </div>

            <div className="mt-6">
              <Step n={4}>{t("upload.steps.mode")}</Step>
              <RadioGroup
                value={mode}
                onValueChange={(v) => setMode(v as ImportMode)}
                className="gap-0"
              >
                {IMPORT_MODES.map((value) => (
                  <OptionTile
                    key={value}
                    value={value}
                    checked={mode === value}
                    title={t(`upload.mode.${value}.title`)}
                    description={t(`upload.mode.${value}.description`)}
                  />
                ))}
              </RadioGroup>
            </div>
          </Panel>
        </div>

        <div className="relative">
          <div className="flex flex-col gap-4 xl:absolute xl:inset-0">
            <Panel>
              <PanelHeader title={t("upload.expectedFormat.title")} />
              <div className="p-5">
                <p className="mb-2 text-xs text-text-2">{t("upload.expectedFormat.flatKeys")}</p>
                <pre className="overflow-x-auto rounded-lg bg-[#0f1b2d] p-4 font-mono text-xs text-[#d6e2ff]">
                  {"{\n"}
                  {"  "}
                  <span className="text-[#8ab4ff]">"auth.button.sign_in"</span>:{" "}
                  <span className="text-[#a7e3b5]">"Đăng nhập"</span>,{"\n"}
                  {"  "}
                  <span className="text-[#8ab4ff]">"auth.label.password"</span>:{" "}
                  <span className="text-[#a7e3b5]">"Mật khẩu"</span>,{"\n"}
                  {"  "}
                  <span className="text-[#8ab4ff]">"home.title.welcome"</span>:{" "}
                  <span className="text-[#a7e3b5]">"Chào mừng trở lại!"</span>
                  {"\n"}
                  {"}"}
                </pre>
              </div>
            </Panel>

            {parsed && (
              <Panel className="flex min-h-0 flex-1 flex-col overflow-hidden">
                <PanelHeader
                  title={t("upload.preview.title")}
                  description={[
                    t("upload.preview.keysFound", { count: parsed.entries.length }),
                    parsed.invalid > 0 && t("upload.preview.skipped", { count: parsed.invalid }),
                    parsed.entries.length > PREVIEW_LIMIT &&
                      t("upload.preview.showingFirst", { count: PREVIEW_LIMIT }),
                  ]
                    .filter(Boolean)
                    .join(" · ")}
                />
                <div className="max-h-105 min-h-0 flex-1 overflow-y-auto xl:max-h-none">
                  <DataTable>
                    <thead>
                      <tr>
                        <Th className="w-[40%]">{t("upload.preview.key")}</Th>
                        <Th>{t("upload.preview.value")}</Th>
                      </tr>
                    </thead>
                    <tbody>
                      {parsed.entries.slice(0, PREVIEW_LIMIT).map(([k, v]) => (
                        <Tr key={k}>
                          <Td className="font-mono text-sm font-medium break-all text-brand-strong">
                            {k}
                          </Td>
                          <Td>
                            {typeof v === "string" ? (
                              v
                            ) : (
                              <span className="text-bad italic">{t("upload.preview.notText")}</span>
                            )}
                          </Td>
                        </Tr>
                      ))}
                    </tbody>
                  </DataTable>
                </div>
              </Panel>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button asChild variant="outline">
            <Link to={initialProjectId ? `/projects/${initialProjectId}` : "/"}>
              {t("common.cancel")}
            </Link>
          </Button>
          <Button type="submit" disabled={!(parsed && projectId && lang)}>
            <CloudUpload /> {t("upload.submit")}
          </Button>
        </div>
      </form>
    </>
  );
}
