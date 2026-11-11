import type { ReactNode } from "react";
import { ChevronRight } from "lucide-react";
import { Link } from "react-router";

type Crumb = { label: string; to?: string };

type PageHeaderProps = {
  title: ReactNode;
  description?: ReactNode;
  icon?: ReactNode;
  actions?: ReactNode;
  breadcrumbs?: Crumb[];
};

export function PageHeader({ title, description, icon, actions, breadcrumbs }: PageHeaderProps) {
  return (
    <>
      {breadcrumbs && (
        <nav className="mb-2 flex items-center gap-1 text-sm text-muted-foreground">
          {breadcrumbs.map((crumb, i) => (
            <span key={crumb.label} className="flex items-center gap-1">
              {i > 0 && <ChevronRight className="size-3.5" />}
              {crumb.to ? (
                <Link to={crumb.to} className="hover:text-brand">
                  {crumb.label}
                </Link>
              ) : (
                crumb.label
              )}
            </span>
          ))}
        </nav>
      )}
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div className="flex items-center gap-3">
          {icon}
          <div>
            <h1 className="mb-1 text-2xl font-bold tracking-tight">{title}</h1>
            {description && <p className="text-text-2">{description}</p>}
          </div>
        </div>
        {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
      </div>
    </>
  );
}
