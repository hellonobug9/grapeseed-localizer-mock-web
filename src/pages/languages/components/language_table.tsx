import { CoverageBar } from "@/components/coverage_bar";
import { DataTable, Td, Th, Tr } from "@/components/data_table";
import { Pill } from "@/components/pill";
import { ProjectDot } from "@/components/project_icon";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { UserAvatar } from "@/components/user_avatar";
import { UserRole } from "@/constants/role";
import { coverage, languageTranslatedCount } from "@/lib/coverage";
import { formatExact, formatNumber } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { LanguageOverviewItem } from "@/types/language";
import { Clock, Ellipsis, Pencil, Trash, TriangleAlert } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";

type LanguageTableProps = {
  rows: LanguageOverviewItem[];
  selectedCode: string | null;
  onOpen: (code: string) => void;
  onEdit: (overview: LanguageOverviewItem) => void;
  onDelete: (overview: LanguageOverviewItem) => void;
};

export function LanguageTable({
  rows,
  selectedCode,
  onOpen,
  onEdit,
  onDelete,
}: LanguageTableProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <DataTable>
      <thead>
        <tr>
          <Th>{t("languages.columns.language")}</Th>
          <Th>{t("languages.columns.translators")}</Th>
          <Th numeric>{t("languages.columns.projects")}</Th>
          <Th>{t("languages.columns.completion")}</Th>
          <Th>{t("languages.columns.lastUpdated")}</Th>
          <Th />
        </tr>
      </thead>
      <tbody>
        {rows.map((o) => {
          const translated = languageTranslatedCount(o);
          const lastTranslatedAt = o.lastTranslatedAt ? new Date(o.lastTranslatedAt) : null;
          return (
            <Tr
              key={o.code}
              tabIndex={o.isSource ? undefined : 0}
              onDoubleClick={(e) => {
                if (
                  o.isSource ||
                  (e.target as HTMLElement).closest('a, button, label, [role="menu"]')
                )
                  return;
                onOpen(o.code);
              }}
              onKeyDown={(e) =>
                !o.isSource && e.key === "Enter" && e.target === e.currentTarget && onOpen(o.code)
              }
              className={cn(
                "group",
                !o.isSource &&
                  "focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-brand",
                selectedCode === o.code && "bg-brand-soft hover:bg-brand-soft",
              )}
            >
              <Td
                className={cn(!o.isSource && "cursor-pointer")}
                onClick={() => !o.isSource && onOpen(o.code)}
              >
                <div className="flex items-center gap-2">
                  <div className="min-w-0">
                    <div className="font-semibold">
                      {o.name}{" "}
                      {o.isSource && (
                        <Pill tone="blue" className="ml-1">
                          {t("languages.source")}
                        </Pill>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {o.nativeName} · <span className="font-mono">{o.code}</span>
                    </div>
                  </div>
                </div>
              </Td>
              <Td>
                {o.isSource ? (
                  <span className="text-xs text-muted-foreground">
                    {t("languages.writtenByDevelopers")}
                  </span>
                ) : o.translators.length === 0 ? (
                  <Pill tone="warn">
                    <TriangleAlert /> {t("languages.noTranslator")}
                  </Pill>
                ) : (
                  <div className="flex flex-col gap-1">
                    {o.translators.map((u) => (
                      <div
                        key={u.id}
                        className="flex min-w-0 items-center gap-2 text-sm font-medium"
                        title={u.email}
                      >
                        <UserAvatar name={u.name} role={UserRole.Comtor} size="xs" />
                        <span className="truncate">{u.name}</span>
                        {u.status === "Invited" && (
                          <Pill tone="warn" size="xs">
                            {t("languages.invited")}
                          </Pill>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </Td>
              <Td numeric>
                {o.projects.length === 0 ? (
                  <div className="font-semibold">{o.projects.length}</div>
                ) : (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="cursor-default">
                        <div className="font-semibold">{o.projects.length}</div>
                        <div className="flex items-center justify-end gap-1">
                          {o.projects.slice(0, 5).map((a) => (
                            <ProjectDot key={a.id} projectId={a.id} />
                          ))}
                          {o.projects.length > 5 && (
                            <span className="text-xs leading-2 text-muted-foreground">
                              +{o.projects.length - 5}
                            </span>
                          )}
                        </div>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" align="end">
                      <ul className="flex flex-col gap-1">
                        {o.projects.map((a) => (
                          <li key={a.id} className="flex items-center gap-2">
                            <ProjectDot projectId={a.id} />
                            {a.name}
                          </li>
                        ))}
                      </ul>
                    </TooltipContent>
                  </Tooltip>
                )}
              </Td>
              <Td className="group/coverage">
                {!o.isSource && o.projects.length > 0 ? (
                  <>
                    <CoverageBar value={coverage(translated, o.totalKeys)} showValue="hover" />
                    <div className="text-xs text-muted-foreground">
                      {formatNumber(translated)} / {formatNumber(o.totalKeys)}
                    </div>
                  </>
                ) : (
                  <span className="text-xs text-muted-foreground">
                    {o.isSource ? "-" : t("languages.notUsed")}
                  </span>
                )}
              </Td>
              <Td className="whitespace-nowrap">
                {lastTranslatedAt ? (
                  formatExact(lastTranslatedAt)
                ) : (
                  <span className="text-muted-foreground">-</span>
                )}
              </Td>
              <Td className="text-right whitespace-nowrap">
                <div className="flex justify-end gap-1 opacity-0 transition-opacity group-focus-within:opacity-100 group-hover:opacity-100 has-data-[state=open]:opacity-100">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        title={t("languages.moreActions")}
                        aria-label={t("languages.moreActions")}
                      >
                        <Ellipsis />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                      <DropdownMenuItem onSelect={() => onEdit(o)}>
                        <Pencil /> {t("languages.edit")}
                      </DropdownMenuItem>
                      <DropdownMenuItem onSelect={() => navigate(`/activity?lang=${o.code}`)}>
                        <Clock /> {t("languages.activity")}
                      </DropdownMenuItem>
                      {!o.isSource && (
                        <>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem variant="destructive" onSelect={() => onDelete(o)}>
                            <Trash /> {t("languages.delete")}
                          </DropdownMenuItem>
                        </>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </Td>
            </Tr>
          );
        })}
      </tbody>
    </DataTable>
  );
}
