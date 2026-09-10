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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  getNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  type NotificationRow,
} from "@/features/notifications/actions";

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
  const [isOpen, setIsOpen] = useState(false);
  const [items, setItems] = useState<NotificationRow[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
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
    const interval = setInterval(fetchItems, 30_000);
    return () => clearInterval(interval);
  }, []);

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
        <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl border border-border bg-card shadow-2xl z-50 animate-in fade-in-0 zoom-in-95 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-border px-4 py-3 bg-muted/20">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-foreground">알림 센터</h3>
              {unreadCount > 0 && (
                <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary">
                  {unreadCount}개 안 읽음
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={handleMarkAllRead}
                disabled={isPending}
                className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors disabled:opacity-50"
              >
                <CheckCheck className="size-3.5" />
                모두 읽음
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-80 overflow-y-auto divide-y divide-border/60">
            {items.length === 0 ? (
              <div className="py-10 text-center text-xs text-muted-foreground">
                <Bell className="size-6 text-muted-foreground/40 mx-auto mb-2" />
                새로운 알림이 없습니다.
              </div>
            ) : (
              items.map((item) => (
                <div
                  key={item.id}
                  onClick={() => handleItemClick(item)}
                  className={`flex items-start gap-3 p-3.5 text-xs transition-colors cursor-pointer ${
                    item.is_read ? "opacity-75 hover:bg-muted/30" : "bg-primary/5 hover:bg-primary/10 font-medium"
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
  );
}
