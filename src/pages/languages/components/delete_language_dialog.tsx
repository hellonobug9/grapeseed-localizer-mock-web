import { ConfirmDialog } from "@/components/confirm_dialog";
import { useDeleteLanguage } from "@/hooks/use_languages";
import { formatNumber } from "@/lib/format";
import type { LanguageOverviewItem } from "@/types/language";
import { Trans, useTranslation } from "react-i18next";
import { toast } from "sonner";

type DeleteLanguageDialogProps = {
  overview: LanguageOverviewItem | null;
  onOpenChange: (open: boolean) => void;
};

export function DeleteLanguageDialog({ overview, onOpenChange }: DeleteLanguageDialogProps) {
  const { t } = useTranslation();
  const deleteLanguage = useDeleteLanguage();

  const confirm = async () => {
    if (!overview) return;
    await deleteLanguage.mutateAsync(overview.code);
    toast.success(t("languages.deleteDialog.deleted", { name: overview.name }));
  };

  return (
    <ConfirmDialog
      open={!!overview}
      onOpenChange={onOpenChange}
      title={t("languages.deleteDialog.title", { name: overview?.name })}
      confirmLabel={t("languages.deleteDialog.confirm")}
      onConfirm={confirm}
    >
      {overview && (
        <Trans
          i18nKey="languages.deleteDialog.warning"
          values={{
            projects: t("common.projectCount", {
              count: overview.projects.length,
            }),
            translations: formatNumber(overview.totalKeys - overview.untranslatedCount),
          }}
          components={{ b: <b /> }}
        />
      )}
    </ConfirmDialog>
  );
}
