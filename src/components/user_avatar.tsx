import { initials } from "@/lib/format";
import { cn } from "@/lib/utils";
import { UserRole } from "@/constants/role";

const ROLE_CLASSES: Record<UserRole, string> = {
  [UserRole.Admin]: "bg-admin-bg text-admin",
  [UserRole.Developer]: "bg-brand-muted text-brand-strong",
  [UserRole.Comtor]: "bg-comtor-bg text-comtor",
};

type UserAvatarProps = {
  name: string;
  role?: UserRole;
  size?: "xs" | "md";
};

export function UserAvatar({ name, role = UserRole.Developer, size = "md" }: UserAvatarProps) {
  return (
    <span
      className={cn(
        "inline-grid shrink-0 place-items-center rounded-full font-semibold",
        size === "xs" ? "size-6 text-xs" : "size-[34px] text-xs",
        ROLE_CLASSES[role],
      )}
    >
      {initials(name)}
    </span>
  );
}
