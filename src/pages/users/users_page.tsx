import { ConfirmDialog } from "@/components/confirm_dialog";
import { DataTable, Td, Th, Tr } from "@/components/data_table";
import { EmptyState } from "@/components/empty_state";
import { PageHeader } from "@/components/page_header";
import { Panel, PanelToolbar } from "@/components/panel";
import { Pill } from "@/components/pill";
import { SearchInput } from "@/components/search_input";
import { Segmented } from "@/components/segmented";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ROLE_TONE, USER_ROLES } from "@/constants/role";
import { USERS, getLanguage } from "@/data/mock_data";
import { formatExact } from "@/lib/format";
import { UserDialog } from "@/pages/users/components/user_dialog";
import type { User } from "@/types/user";
import { Ban, CircleCheck, Ellipsis, Mail, Pencil, Trash, UserPlus, Users } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useSearchParams } from "react-router";
import { toast } from "sonner";

function StatusPill({ status }: { status: User["status"] }) {
  const { t } = useTranslation();
  const label = t(`users.status.${status}`);
  if (status === "Active")
    return (
      <Pill tone="good">
        <span className="size-1.5 rounded-full bg-current" /> {label}
      </Pill>
    );
  if (status === "Invited")
    return (
      <Pill tone="warn">
        <Mail /> {label}
      </Pill>
    );
  return (
    <Pill tone="gray">
      <Ban /> {label}
    </Pill>
  );
}

export function UsersPage() {
  const { t } = useTranslation();
  const [params, setParams] = useSearchParams();
  const roleParam = USER_ROLES.find((r) => r.toLowerCase() === params.get("role")?.toLowerCase());
  const [query, setQuery] = useState("");
  const [dialog, setDialog] = useState<{ open: boolean; user: User | null }>({
    open: false,
    user: null,
  });
  const [removing, setRemoving] = useState<User | null>(null);

  const q = query.trim().toLowerCase();
  const users = USERS.filter((u) => !roleParam || u.role === roleParam).filter(
    (u) => !q || u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q),
  );

  return (
    <>
      <PageHeader
        title={t("users.title")}
        actions={
          <Button onClick={() => setDialog({ open: true, user: null })}>
            <UserPlus /> {t("users.invite")}
          </Button>
        }
      />

      <Panel>
        <PanelToolbar>
          <Segmented
            value={roleParam ?? FILTER_ALL}
            onChange={(value) =>
              setParams(value === FILTER_ALL ? {} : { role: value.toLowerCase() })
            }
            options={[
              {
                value: FILTER_ALL,
                label: t("users.filter.all"),
                count: USERS.length,
              },
              ...USER_ROLES.map((r) => ({
                value: r,
                label: t(`users.roles.${r}`),
                count: USERS.filter((u) => u.role === r).length,
              })),
            ]}
          />
          <SearchInput
            className="max-w-[320px]"
            placeholder={t("users.searchPlaceholder")}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </PanelToolbar>

        {users.length === 0 ? (
          <EmptyState icon={Users} title={t("users.noMatch")} />
        ) : (
          <DataTable>
            <thead>
              <tr>
                <Th>{t("users.columns.user")}</Th>
                <Th>{t("users.columns.role")}</Th>
                <Th>{t("users.columns.languages")}</Th>
                <Th>{t("users.columns.status")}</Th>
                <Th>{t("users.columns.lastActive")}</Th>
                <Th />
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <Tr key={u.id} className="group">
                  <Td
                    className="group/user cursor-pointer"
                    onClick={() => setDialog({ open: true, user: u })}
                  >
                    <div className="font-semibold group-hover/user:text-brand">{u.name}</div>
                    <div className="text-xs text-muted-foreground">{u.email}</div>
                  </Td>
                  <Td>
                    <Pill tone={ROLE_TONE[u.role]}>{t(`users.roles.${u.role}`)}</Pill>
                  </Td>
                  <Td>
                    {u.languages === null ? (
                      <span className="text-xs text-muted-foreground">
                        {t("users.allLanguagesRead")}
                      </span>
                    ) : (
                      <div className="flex flex-wrap gap-1">
                        {u.languages.map((code) => (
                          <Pill key={code} tone="gray" title={getLanguage(code).name}>
                            {code}
                          </Pill>
                        ))}
                      </div>
                    )}
                  </Td>
                  <Td>
                    <StatusPill status={u.status} />
                  </Td>
                  <Td className="whitespace-nowrap">{formatExact(u.lastActive)}</Td>
                  <Td className="text-right whitespace-nowrap">
                    <div className="flex justify-end gap-1 opacity-0 transition-opacity group-focus-within:opacity-100 group-hover:opacity-100 has-data-[state=open]:opacity-100">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="outline" size="icon-sm" aria-label={t("users.more")}>
                            <Ellipsis />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-44">
                          <DropdownMenuItem onSelect={() => setDialog({ open: true, user: u })}>
                            <Pencil /> {t("users.edit")}
                          </DropdownMenuItem>
                          {u.status === "Invited" && (
                            <DropdownMenuItem
                              onSelect={() =>
                                toast.success(t("users.inviteResent", { email: u.email }))
                              }
                            >
                              <Mail /> {t("users.resendInvite")}
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem
                            onSelect={() =>
                              toast.success(
                                u.status === "Disabled"
                                  ? t("users.enabled", { name: u.name })
                                  : t("users.disabled", { name: u.name }),
                              )
                            }
                          >
                            {u.status === "Disabled" ? (
                              <>
                                <CircleCheck /> {t("users.enable")}
                              </>
                            ) : (
                              <>
                                <Ban /> {t("users.disable")}
                              </>
                            )}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem variant="destructive" onSelect={() => setRemoving(u)}>
                            <Trash /> {t("users.remove")}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </Td>
                </Tr>
              ))}
            </tbody>
          </DataTable>
        )}
      </Panel>

      <ConfirmDialog
        open={!!removing}
        onOpenChange={(open) => !open && setRemoving(null)}
        title={t("users.removeDialog.title", { name: removing?.name })}
        confirmLabel={t("users.remove")}
        onConfirm={() => toast.success(t("users.removed", { name: removing?.name }))}
      >
        {t("users.removeDialog.warning")}
      </ConfirmDialog>
      <UserDialog
        open={dialog.open}
        user={dialog.user}
        onOpenChange={(open) => setDialog((d) => ({ ...d, open }))}
      />
    </>
  );
}

const FILTER_ALL = "all";
