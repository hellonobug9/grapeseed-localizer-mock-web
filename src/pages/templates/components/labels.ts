import { getRelease } from "@/data/templates";
import type { SegmentToken } from "@/types/template";
import type { TFunction } from "i18next";

export const releaseLabel = (id: number | null, t: TFunction) =>
  id === null
    ? t("templates.release.none")
    : t("templates.release.option", {
        version: getRelease(id)?.versionNumber ?? "",
      });

// What a tag token stands for, shown as a hint on token chips and insert buttons.
export const describeToken = (token: SegmentToken, t: TFunction) => {
  switch (token.tag) {
    case "a":
      return t("templates.tags.link", { href: token.href ?? "" });
    case "strong":
    case "b":
      return t("templates.tags.bold");
    case "em":
    case "i":
      return t("templates.tags.italic");
    case "u":
      return t("templates.tags.underline");
    case "s":
    case "del":
      return t("templates.tags.strike");
    case "img":
      return t("templates.tags.image");
    case "span":
      return t("templates.tags.style", { style: token.style ?? "" });
    default:
      return t("templates.tags.other", { tag: token.tag });
  }
};
