import { useState, useRef, useEffect } from "react";
import { Bell } from "lucide-react";

const NotificationMenu = () => {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="relative w-8 h-8 rounded-full bg-muted hover:bg-accent flex items-center justify-center transition-colors"
      >
        <Bell className="w-4 h-4 text-muted-foreground" />
      </button>

      {open && (
        <div className="absolute right-0 top-10 w-72 rounded-lg border border-border bg-popover text-popover-foreground shadow-md z-50">
          <div className="px-4 py-3 border-b border-border">
            <h3 className="text-sm font-semibold">Notifications</h3>
          </div>
          <div className="px-4 py-6 text-center">
            <p className="text-xs text-muted-foreground">No notifications yet</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationMenu;
