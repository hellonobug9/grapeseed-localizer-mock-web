import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type PagerProps = {
  page: number;
  pageCount: number;
  pageSize: number;
  shown: number;
  total: number;
  noun: string;
  onPageChange: (page: number) => void;
};

export function Pager({ page, pageCount, pageSize, shown, total, noun, onPageChange }: PagerProps) {
  const { t } = useTranslation();
  const from = (page - 1) * pageSize + 1;
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 border-t px-5 py-3 text-sm text-muted-foreground">
      <span>{t("common.pager.showing", { from, to: from + shown - 1, total, noun })}</span>
      {pageCount > 1 && (
        <div className="flex gap-1">
          <Button
            variant="outline"
            size="icon-sm"
            disabled={page === 1}
            aria-label={t("common.pager.previous")}
            onClick={() => onPageChange(page - 1)}
          >
            ‹
          </Button>
          {Array.from({ length: pageCount }, (_, i) => i + 1).map((p) => (
            <Button
              key={p}
              variant={p === page ? "default" : "outline"}
              size="icon-sm"
              className={cn(p !== page && "text-text-2")}
              onClick={() => onPageChange(p)}
            >
              {p}
            </Button>
          ))}
          <Button
            variant="outline"
            size="icon-sm"
            disabled={page === pageCount}
            aria-label={t("common.pager.next")}
            onClick={() => onPageChange(page + 1)}
          >
            ›
          </Button>
        </div>
      )}
    </div>
  );
}
