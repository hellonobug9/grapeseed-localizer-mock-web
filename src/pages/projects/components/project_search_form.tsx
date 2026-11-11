import { SearchInput } from "@/components/search_input";
import type { FormEvent } from "react";
import { useTranslation } from "react-i18next";

export function ProjectSearchForm({ onSearch }: { onSearch: (value: string) => void }) {
  const { t } = useTranslation();

  const submit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    onSearch(String(new FormData(e.currentTarget).get("q") ?? "").trim());
  };

  return (
    <form onSubmit={submit} className="contents">
      <SearchInput
        name="q"
        className="max-w-85"
        placeholder={t("projects.filterPlaceholder")}
        onChange={(e) => !e.target.value && onSearch("")}
      />
    </form>
  );
}
