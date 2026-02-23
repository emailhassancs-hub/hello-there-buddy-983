import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import AppSidebar from "./AppSidebar";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Bell } from "lucide-react";
import { useUserProfile } from "@/hooks/use-user-profile";

interface SidebarLayoutProps {
  children: React.ReactNode;
}

const UserAvatarBell = () => {
  const { data: profile } = useUserProfile(true);
  const name = profile?.name || "User";
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="flex items-center gap-2">
      <button className="relative w-8 h-8 rounded-full bg-muted hover:bg-accent flex items-center justify-center transition-colors">
        <Bell className="w-4 h-4 text-muted-foreground" />
      </button>
      <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-semibold">
        {initials}
      </div>
    </div>
  );
};

const SidebarLayout = ({ children }: SidebarLayoutProps) => {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-12 flex items-center justify-between border-b border-border px-4 shrink-0">
            <SidebarTrigger />
            <div className="flex items-center gap-3">
              <ThemeToggle />
              <UserAvatarBell />
            </div>
          </header>
          <main className="flex-1 overflow-y-auto">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default SidebarLayout;
