import { useState, type FormEvent } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { ProjectDot } from "@/components/project_icon";
import { CheckGrid, CheckTile, OptionTile } from "@/components/choice_tile";
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
import { RadioGroup } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";
import { PROJECTS, TARGET_LANGUAGES } from "@/data/mock_data";
import { USER_ROLES, UserRole } from "@/constants/role";
import type { User } from "@/types/user";

type UserDialogProps = {
  open: boolean;
  user: User | null;
  onOpenChange: (open: boolean) => void;
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const toggle = <T,>(list: T[], value: T, checked: boolean) =>
  checked ? [...list, value] : list.filter((v) => v !== value);

function UserForm({ user, onDone }: { user: User | null; onDone: () => void }) {
  const { t } = useTranslation();
  const [name, setName] = useState(user?.name ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [role, setRole] = useState<UserRole>(user?.role ?? UserRole.Developer);
  const [languages, setLanguages] = useState(user?.languages ?? []);
  const [projectIds, setProjectIds] = useState(user?.projectIds ?? []);
  const [errors, setErrors] = useState<{ name?: boolean; email?: "required" | "format" }>({});

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const next = {
      name: !name.trim(),
      email: !email.trim()
        ? ("required" as const)
        : !EMAIL_PATTERN.test(email.trim())
          ? ("format" as const)
          : undefined,
    };
    setErrors(next);
    if (next.name || next.email) return;
    onDone();
    toast.success(t("users.dialog.saved"));
  };

  return (
    <form onSubmit={submit} noValidate className="grid gap-4">
      <DialogHeader>
        <DialogTitle>
          {user ? t("users.dialog.editTitle", { name: user.name }) : t("users.dialog.inviteTitle")}
        </DialogTitle>
      </DialogHeader>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="user-name" required>
            {t("users.dialog.fullName")}
          </Label>
          <InputField
            id="user-name"
            required
            invalid={errors.name}
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              setErrors((prev) => ({ ...prev, name: false }));
            }}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="user-email" required>
            {t("users.dialog.email")}
          </Label>
          <InputField
            id="user-email"
            type="email"
            required
            disabled={!!user && user.status !== "Invited"}
            invalid={!!errors.email}
            error={errors.email === "format" && t("common.errors.email")}
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setErrors((prev) => ({ ...prev, email: undefined }));
            }}
          />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label>{t("users.dialog.role")}</Label>
        <RadioGroup
          value={role}
          onValueChange={(v) => setRole(v as UserRole)}
          className="grid gap-2 md:grid-cols-2"
        >
          {USER_ROLES.map((r) => (
            <OptionTile
              key={r}
              value={r}
              checked={role === r}
              title={t(`users.roles.${r}`)}
              description={t(`users.dialog.roleDescriptions.${r}`)}
              className="mb-0 h-full"
            />
          ))}
        </RadioGroup>
      </div>
      {role === UserRole.Comtor && (
        <div className="space-y-1.5">
          <Label>{t("users.dialog.languages")}</Label>
          <CheckGrid>
            {TARGET_LANGUAGES.map((l) => (
              <CheckTile
                key={l.code}
                checked={languages.includes(l.code)}
                onCheckedChange={(v) => setLanguages((prev) => toggle(prev, l.code, v))}
              >
                {l.name}
              </CheckTile>
            ))}
          </CheckGrid>
        </div>
      )}
      {role !== UserRole.Admin && (
        <div>
          <div className="mb-2 flex items-center justify-between">
            <Label>{t("users.dialog.projects")}</Label>
            <label className="flex items-center gap-2 text-xs font-semibold">
              <Switch
                checked={projectIds.length === PROJECTS.length}
                onCheckedChange={(v) => setProjectIds(v ? PROJECTS.map((a) => a.id) : [])}
              />
              {t("users.dialog.allProjects")}
            </label>
          </div>
          <CheckGrid>
            {PROJECTS.map((a) => (
              <CheckTile
                key={a.id}
                checked={projectIds.includes(a.id)}
                onCheckedChange={(v) => setProjectIds((prev) => toggle(prev, a.id, v))}
              >
                <ProjectDot projectId={a.id} /> {a.name}
              </CheckTile>
            ))}
          </CheckGrid>
        </div>
      )}
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onDone}>
          {t("common.cancel")}
        </Button>
        <Button type="submit">
          {user ? t("users.dialog.saveChanges") : t("users.dialog.sendInvite")}
        </Button>
      </DialogFooter>
    </form>
  );
}

export function UserDialog({ open, user, onOpenChange }: UserDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
        {open && (
          <UserForm key={user?.id ?? "new"} user={user} onDone={() => onOpenChange(false)} />
        )}
      </DialogContent>
    </Dialog>
  );
}
