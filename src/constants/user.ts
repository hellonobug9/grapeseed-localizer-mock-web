import type { UserStatus } from "@/types/user";

export const USER_STATUS_BY_ID = {
  1: "Active",
  2: "Invited",
  3: "Disabled",
} as const satisfies Record<number, UserStatus>;

export type UserStatusId = keyof typeof USER_STATUS_BY_ID;
