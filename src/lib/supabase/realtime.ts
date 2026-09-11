"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { RealtimePostgresChangesPayload } from "@supabase/supabase-js";

export type RealtimeChangeEvent<T extends object = Record<string, unknown>> = RealtimePostgresChangesPayload<T>;

export interface UseRealtimeSubscriptionOptions<T extends object = Record<string, unknown>> {
  table: string;
  schema?: string;
  event?: "INSERT" | "UPDATE" | "DELETE" | "*";
  filter?: string;
  enabled?: boolean;
  channelName?: string;
  onInsert?: (row: T) => void;
  onUpdate?: (row: T, oldRow: Partial<T>) => void;
  onDelete?: (oldRow: Partial<T>) => void;
  onChange?: (payload: RealtimeChangeEvent<T>) => void;
}

export function useRealtimeSubscription<T extends object = Record<string, unknown>>({
  table,
  schema = "public",
  event = "*",
  filter,
  enabled = true,
  channelName,
  onInsert,
  onUpdate,
  onDelete,
  onChange,
}: UseRealtimeSubscriptionOptions<T>) {
  const onInsertRef = useRef(onInsert);
  const onUpdateRef = useRef(onUpdate);
  const onDeleteRef = useRef(onDelete);
  const onChangeRef = useRef(onChange);

  useEffect(() => {
    onInsertRef.current = onInsert;
    onUpdateRef.current = onUpdate;
    onDeleteRef.current = onDelete;
    onChangeRef.current = onChange;
  });

  useEffect(() => {
    if (!enabled) return;

    let supabase: ReturnType<typeof createClient>;
    try {
      supabase = createClient();
    } catch {
      return;
    }

    const uniqueId = Math.random().toString(36).substring(2, 9);
    const channelId = channelName ?? `rt:${table}:${filter ?? "all"}:${uniqueId}`;

    const filterConfig: {
      event: "INSERT" | "UPDATE" | "DELETE" | "*";
      schema: string;
      table: string;
      filter?: string;
    } = {
      event,
      schema,
      table,
    };

    if (filter) {
      filterConfig.filter = filter;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const channel = (supabase.channel(channelId) as any)
      .on("postgres_changes", filterConfig, (payload: RealtimeChangeEvent<T>) => {
        onChangeRef.current?.(payload);
        if (payload.eventType === "INSERT" && onInsertRef.current) {
          onInsertRef.current(payload.new as T);
        } else if (payload.eventType === "UPDATE" && onUpdateRef.current) {
          onUpdateRef.current(payload.new as T, payload.old as Partial<T>);
        } else if (payload.eventType === "DELETE" && onDeleteRef.current) {
          onDeleteRef.current(payload.old as Partial<T>);
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [table, schema, event, filter, enabled, channelName]);
}

export interface UseRealtimeRefreshOptions {
  table: string;
  schema?: string;
  event?: "INSERT" | "UPDATE" | "DELETE" | "*";
  filter?: string;
  enabled?: boolean;
  channelName?: string;
  debounceMs?: number;
  onRefresh?: () => void;
}

export function useRealtimeRefresh({
  table,
  schema = "public",
  event = "*",
  filter,
  enabled = true,
  channelName,
  debounceMs = 300,
  onRefresh,
}: UseRealtimeRefreshOptions) {
  const router = useRouter();
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const onRefreshRef = useRef(onRefresh);

  useEffect(() => {
    onRefreshRef.current = onRefresh;
  });

  useRealtimeSubscription({
    table,
    schema,
    event,
    filter,
    enabled,
    channelName,
    onChange: () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      timeoutRef.current = setTimeout(() => {
        router.refresh();
        onRefreshRef.current?.();
      }, debounceMs);
    },
  });

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);
}
