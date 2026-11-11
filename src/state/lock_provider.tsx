import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { queryKeys } from "@/constants/query_keys";
import { setMockProjectLock } from "@/data/mock_api";
import { PROJECTS } from "@/data/mock_data";
import { LockContext } from "@/state/lock_context";
import type { LockInfo } from "@/types/lock";

const initialLocks = Object.fromEntries(PROJECTS.map((a) => [a.id, a.lock]));

export function LockProvider({ children }: { children: ReactNode }) {
  const [locks, setLocks] = useState<Record<number, LockInfo | undefined>>(initialLocks);
  // Lock status depends on the time, so it is re-read every minute and a
  // scheduled lock starts or ends without a reload.
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(timer);
  }, []);

  const queryClient = useQueryClient();
  const setLock = useCallback(
    (projectId: number, lock: LockInfo | undefined) => {
      setLocks((prev) => ({ ...prev, [projectId]: lock }));
      // Project lists and the dashboard come from the mock API; keep its lock in
      // step and refetch them so the change shows everywhere.
      setMockProjectLock(projectId, lock);
      void Promise.all(
        [queryKeys.projects.all, queryKeys.dashboard, queryKeys.languages.all].map((queryKey) =>
          queryClient.invalidateQueries({ queryKey }),
        ),
      );
    },
    [queryClient],
  );

  const value = useMemo(() => ({ locks, setLock, now }), [locks, setLock, now]);

  return <LockContext value={value}>{children}</LockContext>;
}
