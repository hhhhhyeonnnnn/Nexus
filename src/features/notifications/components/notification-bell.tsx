"use client";

import { useState, useEffect, useRef, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Bell,
  CheckCheck,
  ListChecks,
  FileCheck2,
  AlertTriangle,
  Megaphone,
  Info,
  X,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  getNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  type NotificationRow,
} from "@/features/notifications/actions";
import { useRoleContext } from "@/features/auth/role-context";
import { useRealtimeSubscription } from "@/lib/supabase/realtime";

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "방금 전";
  if (mins < 60) return `${mins}분 전`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}시간 전`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}일 전`;
  return new Date(dateStr).toLocaleDateString("ko-KR", { month: "short", day: "numeric" });
}

function getNotificationIcon(type: string) {
  switch (type) {
    case "TASK":
      return <ListChecks className="size-4 text-blue-500" />;
    case "APPROVAL":
      return <FileCheck2 className="size-4 text-amber-500" />;
    case "WARNING":
      return <AlertTriangle className="size-4 text-rose-500" />;
    case "PETITION":
    case "ANNOUNCEMENT":
      return <Megaphone className="size-4 text-purple-500" />;
    default:
      return <Info className="size-4 text-primary" />;
  }
}

export function NotificationBell() {
  const router = useRouter();
  const { userId } = useRoleContext();
  const [isOpen, setIsOpen] = useState(false);
  const [items, setItems] = useState<NotificationRow[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [liveToast, setLiveToast] = useState<NotificationRow | null>(null);
  const [isPending, startTransition] = useTransition();
  const containerRef = useRef<HTMLDivElement>(null);

  const fetchItems = () => {
    startTransition(async () => {
      const data = await getNotifications();
      setItems(data.notifications);
      setUnreadCount(data.unreadCount);
    });
  };

  useEffect(() => {
    fetchItems();
    const interval = setInterval(fetchItems, 60_000);
    return () => clearInterval(interval);
  }, []);

  // Supabase Realtime instant notification push
  useRealtimeSubscription<NotificationRow>({
    table: "notifications",
    filter: userId ? `user_id=eq.${userId}` : undefined,
    enabled: Boolean(userId),
    onInsert: (newNotification) => {
      setItems((prev) => [newNotification, ...prev]);
      setUnreadCount((prev) => prev + 1);
      setLiveToast(newNotification);
    },
  });

  // Auto-dismiss live toast after 6 seconds
  useEffect(() => {
    if (!liveToast) return;
    const timer = setTimeout(() => {
      setLiveToast(null);
    }, 6000);
    return () => clearTimeout(timer);
  }, [liveToast]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  const handleItemClick = (item: NotificationRow) => {
    if (!item.is_read) {
      startTransition(async () => {
        await markNotificationAsRead(item.id);
        setItems((prev) =>
          prev.map((n) => (n.id === item.id ? { ...n, is_read: true } : n))
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      });
    }

    setIsOpen(false);
    if (item.link_url) {
      router.push(item.link_url);
    }
  };

  const handleMarkAllRead = () => {
    startTransition(async () => {
      await markAllNotificationsAsRead();
      setItems((prev) => prev.map((n) => ({ ...n, is_read: true })));
      setUnreadCount(0);
    });
  };

  return (
    <>
      {/* Floating Live Toast Notification */}
      {liveToast && (
        <aside
          role="status"
          aria-live="polite"
          className="fixed bottom-5 right-5 z-50 flex max-w-sm items-start gap-3 rounded-xl border border-primary/20 bg-card p-4 shadow-xl ring-1 ring-black/5 animate-in fade-in slide-in-from-bottom-5 duration-300"
        >
          <div className="mt-0.5 shrink-0 rounded-full bg-primary/10 p-2 text-primary">
            {getNotificationIcon(liveToast.type)}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-primary">
                실시간 새 알림
              </span>
              <button
                onClick={() => setLiveToast(null)}
                className="text-muted-foreground hover:text-foreground rounded p-0.5"
                aria-label="알림 닫기"
              >
                <X className="size-3.5" />
              </button>
            </div>
            <h5 className="text-xs font-bold text-foreground mt-0.5 truncate">
              {liveToast.title}
            </h5>
            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
              {liveToast.message}
            </p>
            {liveToast.link_url && (
              <button
                onClick={() => {
                  const url = liveToast.link_url;
                  setLiveToast(null);
                  if (url) router.push(url);
                }}
                className="mt-2 inline-flex items-center text-[11px] font-semibold text-primary hover:underline"
              >
                확인하러 가기 <ArrowRight className="size-3 ml-1" />
              </button>
            )}
          </div>
        </aside>
      )}

      {/* Bell Dropdown */}
      <div ref={containerRef} className="relative">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => {
            setIsOpen(!isOpen);
            if (!isOpen) fetchItems();
          }}
          className="relative size-8 text-muted-foreground hover:text-foreground"
          aria-label={`알림 ${unreadCount}개`}
          aria-expanded={isOpen}
        >
          <Bell className="size-4" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 flex size-4 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white shadow-xs">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Button>

        {isOpen && (
          <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-xl border border-border bg-card shadow-lg z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-border px-4 py-3 bg-muted/20">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-foreground">알림</span>
                {unreadCount > 0 && (
                  <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-bold text-primary">
                    {unreadCount}
                  </span>
                )}
                <span className="flex items-center gap-1 text-[10px] text-muted-foreground ml-1">
                  <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  라이브
                </span>
              </div>
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllRead}
                  disabled={isPending}
                  className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
                >
                  <CheckCheck className="size-3.5" />
                  모두 읽음
                </button>
              )}
            </div>

            {/* List */}
            <div className="max-h-96 overflow-y-auto divide-y divide-border/60">
              {items.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-center text-muted-foreground px-4">
                  <Bell className="size-8 stroke-1 text-muted-foreground/40 mb-2" />
                  <p className="text-xs">새로운 알림이 없습니다.</p>
                </div>
              ) : (
                items.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => handleItemClick(item)}
                    className={`flex items-start gap-3 p-3.5 transition-colors cursor-pointer hover:bg-muted/50 ${
                      item.is_read ? "bg-transparent opacity-75" : "bg-primary/5"
                    }`}
                  >
                    <div className="mt-0.5 shrink-0 rounded-full bg-background p-1.5 border border-border shadow-xs">
                      {getNotificationIcon(item.type)}
                    </div>
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center justify-between gap-1">
                        <p className={`text-xs truncate ${item.is_read ? "text-foreground" : "font-bold text-foreground"}`}>
                          {item.title}
                        </p>
                        <span className="text-[10px] text-muted-foreground shrink-0">
                          {timeAgo(item.created_at)}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                        {item.message}
                      </p>
                    </div>
                    {!item.is_read && (
                      <span className="size-2 rounded-full bg-primary shrink-0 mt-1.5" />
                    )}
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            <div className="border-t border-border bg-muted/10 px-4 py-2 text-center text-[10px] text-muted-foreground">
              학생회 활동 및 결재 알림을 실시간으로 안내합니다
            </div>
          </div>
        )}
      </div>
    </>
  );
}
