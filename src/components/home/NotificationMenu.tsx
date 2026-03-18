import { useState, useRef, useEffect } from "react";
import { Bell } from "lucide-react";
import { useMarkAllNotificationsRead, useNotifications } from "@/hooks/use-notifications";

const renderMessageWithLinks = (message: string) => {
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const parts = message.split(urlRegex);
  return parts.map((part, idx) => {
    if (urlRegex.test(part)) {
      return (
        <a
          key={`${part}-${idx}`}
          href={part}
          target="_blank"
          rel="noreferrer"
          className="text-primary underline underline-offset-2 break-all"
          onClick={(e) => e.stopPropagation()}
        >
          {part}
        </a>
      );
    }
    return <span key={`${idx}-${part}`}>{part}</span>;
  });
};

const NotificationMenu = () => {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Fetch notifications via React Query (this will be prefetched on /home too)
  const { data: notificationsData = [], isLoading } = useNotifications(true);
  const notifications = Array.isArray(notificationsData) ? notificationsData : [];
  const unreadCount = notifications.filter((n) => !n.isRead).length;
  const markAllRead = useMarkAllNotificationsRead();

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (!open) return;
    if (unreadCount === 0) return;
    if (markAllRead.isPending) return;
    markAllRead.mutate();
  }, [open, unreadCount, markAllRead]);

  const handleToggle = async () => {
    const next = !open;
    setOpen(next);
  };

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={handleToggle}
        className="relative w-8 h-8 rounded-full bg-muted hover:bg-accent flex items-center justify-center transition-colors"
      >
        <Bell className="w-4 h-4 text-muted-foreground" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 inline-flex items-center justify-center rounded-full bg-red-500 text-[10px] text-white h-4 min-w-4 px-1">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-12 w-[420px] max-w-[calc(100vw-24px)] rounded-xl border border-border bg-white text-popover-foreground shadow-xl z-[60] overflow-hidden">
          <div className="px-4 py-3 border-b border-border flex items-center justify-between">
            <h3 className="text-sm font-semibold">Notifications</h3>
            {unreadCount > 0 && (
              <span className="text-[11px] text-muted-foreground">{unreadCount} unread</span>
            )}
          </div>
          <div className="max-h-[420px] overflow-y-auto">
            {isLoading ? (
              <div className="px-4 py-4 text-xs text-muted-foreground text-center">
                Loading notifications...
              </div>
            ) : notifications.length === 0 ? (
              <div className="px-4 py-6 text-center">
                <p className="text-xs text-muted-foreground">No notifications yet</p>
              </div>
            ) : (
              <ul className="divide-y divide-border">
                {notifications.map((n) => (
                  <li key={n.id} className="px-4 py-3">
                    <p
                      className={
                        n.isRead
                          ? "text-xs text-muted-foreground whitespace-normal break-words leading-relaxed"
                          : "text-xs text-foreground font-medium whitespace-normal break-words leading-relaxed"
                      }
                    >
                      {renderMessageWithLinks(n.message)}
                    </p>
                    <span className="mt-1 block text-[10px] text-muted-foreground">
                      {new Date(n.createdAt).toLocaleString()}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationMenu;
