import { LanguageSwitcher } from "@/components/language_switcher";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { UserAvatar } from "@/components/user_avatar";
import { CURRENT_USER } from "@/data/mock_data";
import { ChevronDown, Key, LogOut, Menu, Plus, Search, User } from "lucide-react";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { useTranslation } from "react-i18next";
import { Link, useLocation, useNavigate } from "react-router";
import { toast } from "sonner";

export function AppTopbar({ onMenuClick }: { onMenuClick: () => void }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  // Demo build: no sign-in, so the signed-in user is the mock one.
  const { name, role } = CURRENT_USER;
  const notInDemo = () => toast.info(t("topbar.notInDemo"));
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const isSearchPage = location.pathname === "/search";

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const tag = (document.activeElement as HTMLElement | null)?.tagName;
      if (e.key === "/" && !["INPUT", "TEXTAREA", "SELECT"].includes(tag ?? "")) {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    navigate(`/search?q=${encodeURIComponent(query.trim())}`);
    setQuery("");
  };

  return (
    <header className="sticky top-0 z-30 flex items-center gap-4 border-b bg-white/88 px-4 py-2.5 backdrop-blur-md lg:px-7">
      <Button
        variant="ghost"
        size="icon-lg"
        className="lg:hidden"
        onClick={onMenuClick}
        aria-label={t("topbar.openMenu")}
      >
        <Menu />
      </Button>
      {!isSearchPage && (
        <form role="search" onSubmit={submit} className="relative max-w-[520px] min-w-0 flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            ref={inputRef}
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("topbar.searchPlaceholder")}
            aria-label={t("topbar.search")}
            className="w-full rounded-[10px] border bg-surface-2 py-2 pr-10 pl-9 text-sm outline-none transition focus:border-brand focus:bg-white focus:ring-3 focus:ring-brand/15"
          />
          <kbd className="absolute top-1/2 right-2.5 hidden -translate-y-1/2 rounded border bg-white px-1.5 text-xs text-muted-foreground lg:block">
            /
          </kbd>
        </form>
      )}
      <div className="ml-auto flex items-center gap-2.5">
        <Button asChild size="sm" className="hidden md:inline-flex">
          <Link to="/keys/new">
            <Plus /> New key
          </Link>
        </Button>
        <LanguageSwitcher />
        <DropdownMenu>
          <DropdownMenuTrigger className="flex items-center gap-2.5 rounded-[10px] px-1.5 py-1 hover:bg-surface-2">
            <UserAvatar name={name} />
            <span className="hidden text-left sm:block">
              <span className="block text-sm leading-tight font-semibold">{name}</span>
              <span className="block text-xs text-muted-foreground">{role}</span>
            </span>
            <ChevronDown className="size-3.5 text-muted-foreground" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-44">
            <DropdownMenuItem onSelect={notInDemo}>
              <User /> {t("topbar.profile")}
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Key /> {t("topbar.apiTokens")}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={notInDemo}>
              <LogOut /> {t("topbar.signOut")}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
