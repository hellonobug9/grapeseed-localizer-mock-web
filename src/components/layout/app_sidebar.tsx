import { LockStatus } from "@/constants/lock";
import { PROJECTS } from "@/data/mock_data";
import { useLocks } from "@/hooks/use_locks";
import { cn } from "@/lib/utils";
import {
  ChevronDown,
  Globe,
  History,
  Languages,
  LayoutDashboard,
  LayoutGrid,
  Lock,
  Search,
  Users,
} from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { NavLink } from "react-router";
import { ProjectDot } from "../project_icon";

const WORKSPACE_LINKS = [
  { to: "/", labelKey: "nav.dashboard", icon: LayoutDashboard, end: true },
  {
    to: "/projects",
    labelKey: "nav.projects",
    icon: LayoutGrid,
    end: true,
  },
  { to: "/languages", labelKey: "nav.languages", icon: Globe, end: false },
  { to: "/search", labelKey: "nav.search", icon: Search, end: false },
  { to: "/activity", labelKey: "nav.activity", icon: History, end: false },
] as const;

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  cn(
    "mb-0.5 flex items-center gap-2.5 rounded-lg px-3 py-2 font-medium text-text-2 transition-colors hover:bg-surface-2 hover:text-foreground [&>svg]:size-[1.05rem] [&>svg]:text-muted-foreground",
    isActive &&
      "bg-brand-soft text-brand-strong hover:bg-brand-soft hover:text-brand-strong [&>svg]:text-brand",
  );

function NavLabel({ children }: { children: string }) {
  return (
    <div className="px-3 pt-4 pb-1.5 text-xs font-semibold tracking-widest text-muted-foreground uppercase">
      {children}
    </div>
  );
}

export function AppSidebar({ onNavigate }: { onNavigate?: () => void }) {
  const { t } = useTranslation();
  const { statusOf } = useLocks();
  const [projectsExpanded, setProjectsExpanded] = useState(true);

  return (
    <aside className="h-full w-62 overflow-y-auto border-r bg-card px-3 pt-4 pb-8 text-sm">
      <NavLink
        to="/"
        onClick={onNavigate}
        className="flex items-center gap-2.5 px-2 pt-1 pb-4 text-lg font-bold"
      >
        <span className="grid size-8.5 place-items-center rounded-[10px] bg-linear-to-br from-[#3b82f6] to-[#1d4ed8] text-white shadow-[0_4px_10px_rgba(37,99,235,.3)]">
          <Languages className="size-[1.05rem]" />
        </span>
        <span className="mt-1.25 ml-1 cursor-pointer font-brand text-[25px] leading-[1.5] font-extralight [text-shadow:rgba(0,0,0,0.1)_3px_3px_0px,rgba(0,0,0,0.05)_7px_7px_0px]">
          Localizer
        </span>
      </NavLink>

      <nav onClick={onNavigate}>
        <NavLabel>{t("nav.workspace")}</NavLabel>
        {WORKSPACE_LINKS.map(({ to, labelKey, icon: Icon, end }) => (
          <NavLink key={to} to={to} end={end} className={navLinkClass}>
            <Icon /> {t(labelKey)}
          </NavLink>
        ))}

        <NavLabel>{t("nav.administration")}</NavLabel>
        <NavLink to="/users" className={navLinkClass}>
          <Users /> {t("nav.users")}
        </NavLink>

        <button
          type="button"
          aria-expanded={projectsExpanded}
          aria-controls="sidebar-projects"
          onClick={(e) => {
            e.stopPropagation();
            setProjectsExpanded((v) => !v);
          }}
          className="flex w-full cursor-pointer items-center justify-between rounded-md px-3 pt-4 pb-1.5 text-xs font-semibold tracking-widest text-muted-foreground uppercase transition-colors hover:text-foreground"
        >
          {t("nav.projects")}
          <ChevronDown
            className={cn("size-3.5 transition-transform", !projectsExpanded && "-rotate-90")}
          />
        </button>

        <div id="sidebar-projects" hidden={!projectsExpanded}>
          {PROJECTS.map((project) => (
            <NavLink
              key={project.id}
              to={`/projects/${project.id}`}
              className={(state) => cn(navLinkClass(state), "py-1.5 text-sm")}
            >
              <ProjectDot projectId={project.id} /> {project.name}
              {statusOf(project.id) === LockStatus.Locked && (
                <Lock className="ml-auto size-3! text-warn!" aria-label={t("lock.status.locked")} />
              )}
            </NavLink>
          ))}
        </div>
      </nav>
    </aside>
  );
}
