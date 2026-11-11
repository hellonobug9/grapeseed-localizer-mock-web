import { DataTable, Td, Th, Tr } from "@/components/data_table";
import { Pill } from "@/components/pill";
import { Button } from "@/components/ui/button";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { SOURCE_LANGUAGE } from "@/constants/language";
import {
  TEMPLATE_STATUS_TONE,
  TRANSLATION_STATE_TONE,
  TranslationState,
} from "@/constants/template";
import { formatDay } from "@/lib/format";
import { cn } from "@/lib/utils";
import { getTemplateLanguage } from "@/data/templates";
import { releaseLabel } from "@/pages/templates/components/labels";
import { TemplatePreview } from "@/pages/templates/components/template_preview";
import type { TemplateContent, TemplateRow } from "@/types/template";
import { useTranslation } from "react-i18next";

type TemplateTableProps = {
  rows: TemplateRow[];
  releaseId: number | null;
  onOpen: (row: TemplateRow) => void;
};

const NEEDS_WORK: TranslationState[] = [TranslationState.Missing, TranslationState.Outdated];

export function TemplateTable({ rows, releaseId, onOpen }: TemplateTableProps) {
  const { t } = useTranslation();

  return (
    <DataTable>
      <thead>
        <tr>
          <Th>{t("templates.columns.template")}</Th>
          <Th>{t("templates.columns.type")}</Th>
          <Th>{t("templates.columns.service")}</Th>
          <Th>{t("templates.columns.english")}</Th>
          <Th>{t("templates.columns.translation")}</Th>
          <Th>{t("templates.columns.updatedBy")}</Th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => {
          const { template, source, target, state } = row;
          const canOpen = !!source;

          return (
            <Tr
              key={template.id}
              onClick={canOpen ? () => onOpen(row) : undefined}
              title={canOpen ? undefined : t("templates.noSourceHint")}
              className={cn(
                canOpen ? "cursor-pointer" : "text-muted-foreground",
                NEEDS_WORK.includes(state) && "shadow-[inset_2px_0_0_var(--color-warn)]",
              )}
            >
              <Td>
                <TemplateCodePreview row={row} disabled={!canOpen} onOpen={() => onOpen(row)} />
              </Td>
              <Td>
                <Pill>{t(`templates.type.${template.type}`)}</Pill>
              </Td>
              <Td className="text-text-2">{template.service ?? "–"}</Td>
              <Td>
                <ContentStatus content={source} />
              </Td>
              <Td>
                <Pill tone={TRANSLATION_STATE_TONE[state]}>{t(`templates.state.${state}`)}</Pill>
                {target && target.releaseId !== releaseId && (
                  <div className="mt-0.5 text-xs whitespace-nowrap text-muted-foreground">
                    {t("templates.liveFrom", {
                      release: releaseLabel(target.releaseId, t),
                    })}
                  </div>
                )}
              </Td>
              <Td>
                {target ? (
                  <div className="whitespace-nowrap">
                    <div>{target.updatedBy}</div>
                    <div className="text-xs text-muted-foreground">
                      {formatDay(target.updatedAt)}
                    </div>
                  </div>
                ) : (
                  <span className="text-muted-foreground">–</span>
                )}
              </Td>
            </Tr>
          );
        })}
      </tbody>
    </DataTable>
  );
}

function TemplateCodePreview({
  row,
  disabled,
  onOpen,
}: {
  row: TemplateRow;
  disabled: boolean;
  onOpen: () => void;
}) {
  const { t } = useTranslation();
  const { template, source, target } = row;
  const sourceLanguage = getTemplateLanguage(SOURCE_LANGUAGE);
  const targetLanguage = target ? getTemplateLanguage(target.language) : undefined;

  return (
    <HoverCard>
      <HoverCardTrigger asChild>
        <Button
          variant="link"
          className="h-auto max-w-full justify-start p-0 text-left font-mono text-sm font-semibold wrap-break-word text-brand-strong"
          disabled={disabled}
          onClick={(event) => {
            event.stopPropagation();
            onOpen();
          }}
        >
          {template.code}
        </Button>
      </HoverCardTrigger>
      <div className="mt-0.5 text-xs text-muted-foreground">{template.name}</div>
      {source && (
        <HoverCardContent
          align="start"
          className="w-[min(760px,calc(100vw-2rem))] overflow-hidden p-0"
        >
          <div className="border-b bg-surface-2 px-4 py-3">
            <div className="font-mono text-xs font-semibold text-text-2">{template.code}</div>
            <div className="mt-0.5 text-xs text-muted-foreground">{template.name}</div>
          </div>
          <div className="grid max-h-[480px] grid-cols-1 overflow-y-auto md:grid-cols-2">
            <TemplatePreviewPane
              label={`${sourceLanguage.name} ${t("templates.columns.english")}`}
              template={template}
              content={source}
            />
            <TemplatePreviewPane
              label={targetLanguage?.name ?? t("templates.columns.translation")}
              template={template}
              content={target}
            />
          </div>
        </HoverCardContent>
      )}
    </HoverCard>
  );
}

function TemplatePreviewPane({
  label,
  template,
  content,
}: {
  label: string;
  template: TemplateRow["template"];
  content?: TemplateContent;
}) {
  const { t } = useTranslation();

  return (
    <section className="min-w-0 border-b p-4 last:border-b-0 md:border-r md:last:border-r-0">
      <h4 className="mb-3 text-xs font-semibold text-text-2">{label}</h4>
      {content ? (
        <TemplatePreview type={template.type} title={content.title} body={content.body} />
      ) : (
        <p className="text-sm text-warn italic">
          {t("templates.preview.notTranslated", { field: t("templates.fields.body") })}
        </p>
      )}
    </section>
  );
}

function ContentStatus({ content }: { content?: TemplateContent }) {
  const { t } = useTranslation();
  if (!content) return <span className="text-muted-foreground">–</span>;

  return (
    <div className="whitespace-nowrap">
      <Pill size="xs" tone={TEMPLATE_STATUS_TONE[content.status]}>
        {t(`templates.status.${content.status}`)}
      </Pill>
      <div className="mt-0.5 text-xs text-muted-foreground">
        {releaseLabel(content.releaseId, t)}
      </div>
    </div>
  );
}
