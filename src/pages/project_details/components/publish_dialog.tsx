import { useState, type FormEvent } from "react";
import { Rocket, Send, TriangleAlert } from "lucide-react";
import { Trans, useTranslation } from "react-i18next";
import { toast } from "sonner";
import { Callout } from "@/components/callout";
import { EnvBadge } from "@/components/env_badge";
import { MiniStat } from "@/components/kpi_card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { Environment } from "@/types/publish";
import type { ProjectStats } from "@/types/stats";

type PublishDialogProps = {
  stats: ProjectStats;
  env: Environment | null;
  onOpenChange: (open: boolean) => void;
};

function PublishForm({
  stats,
  env,
  onDone,
}: {
  stats: ProjectStats;
  env: Environment;
  onDone: () => void;
}) {
  const { t } = useTranslation();
  const { project } = stats;
  const isLive = env === "LIVE";
  const pending = isLive ? stats.pendingLive : stats.pendingTest;
  const [fallback, setFallback] = useState(true);
  const [verified, setVerified] = useState(false);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    onDone();
    toast.success(t("projectDetails.publishDialog.published", { project: project.name, env }));
  };

  return (
    <form onSubmit={submit} noValidate className="grid gap-4">
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          <Trans
            i18nKey="projectDetails.publishDialog.title"
            components={{ badge: <EnvBadge env={env} /> }}
          />
        </DialogTitle>
        <DialogDescription>{project.name}</DialogDescription>
      </DialogHeader>

      {isLive && (
        <Callout icon={TriangleAlert} tone="warn">
          {t("projectDetails.publishDialog.liveWarning")}
        </Callout>
      )}

      <div className="grid grid-cols-3 gap-2">
        <MiniStat value={pending} label={t("projectDetails.publishDialog.changedKeys")} />
        <MiniStat value={stats.newKeys} label={t("projectDetails.publishDialog.newKeys")} />
        <MiniStat
          value={stats.untranslated}
          label={t("projectDetails.publishDialog.untranslated")}
          valueClassName={stats.untranslated > 0 ? "text-bad" : undefined}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor={`note-${env}`}>{t("projectDetails.publishDialog.releaseNote")}</Label>
        <Textarea
          id={`note-${env}`}
          rows={2}
          placeholder={t("projectDetails.publishDialog.releaseNotePlaceholder")}
        />
      </div>

      <div className="space-y-2">
        {stats.untranslated > 0 && (
          <label className="flex items-center gap-2 text-sm">
            <Checkbox checked={fallback} onCheckedChange={(v) => setFallback(v === true)} />
            {t("projectDetails.publishDialog.useEnglish", { count: stats.untranslated })}
          </label>
        )}
        {isLive && (
          <label className="flex items-center gap-2 text-sm">
            <Checkbox checked={verified} onCheckedChange={(v) => setVerified(v === true)} />
            {t("projectDetails.publishDialog.qaVerified")}
          </label>
        )}
      </div>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onDone}>
          {t("common.cancel")}
        </Button>
        {isLive ? (
          <Button type="submit" disabled={!verified} className="bg-live hover:bg-live-strong">
            <Rocket /> {t("projectDetails.env.publishTo", { env })}
          </Button>
        ) : (
          <Button type="submit">
            <Send /> {t("projectDetails.env.publishTo", { env })}
          </Button>
        )}
      </DialogFooter>
    </form>
  );
}

export function PublishDialog({ stats, env, onOpenChange }: PublishDialogProps) {
  return (
    <Dialog open={!!env} onOpenChange={onOpenChange}>
      <DialogContent>
        {env && (
          <PublishForm key={env} stats={stats} env={env} onDone={() => onOpenChange(false)} />
        )}
      </DialogContent>
    </Dialog>
  );
}
