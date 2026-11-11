import { createContext } from "react";
import type { LockInfo } from "@/types/lock";

export type LockContextValue = {
  locks: Record<number, LockInfo | undefined>;
  setLock: (projectId: number, lock: LockInfo | undefined) => void;
  now: Date;
};

export const LockContext = createContext<LockContextValue | null>(null);
