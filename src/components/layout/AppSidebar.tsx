import { useLocation, useNavigate } from "react-router-dom";
import { Home, FolderOpen, Users, Globe, Settings, Sparkles } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
  useSidebar,
} from "@/components/ui/sidebar";
import CreditsBlock from "./CreditsBlock";
import UpgradeButton from "./UpgradeButton";
import UserProfileBlock from "./UserProfileBlock";

const navItems = [
  { title: "Home", icon: Home, path: "/home" },
  { title: "All Projects", icon: FolderOpen, path: "/projects" },
  { title: "Shared with Me", icon: Users, path: "/projects?filter=shared", hasNotification: true },
  { title: "Community", icon: Globe, path: "/community", comingSoon: true },
];

const AppSidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { state } = useSidebar();
  const collapsed = state === "collapsed";

  return (
    <Sidebar collapsible="icon">
      {/* Logo */}
      <SidebarHeader>
        <div className="flex items-center gap-2 px-1 py-1">
          <Sparkles className="w-5 h-5 text-primary shrink-0" />
          {!collapsed && (
            <>
              <span className="font-bold text-sm truncate">Rapid Assets</span>
              <span className="px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide rounded bg-primary/10 text-primary border border-primary/20 shrink-0">
                Beta
              </span>
            </>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    isActive={
                      item.path.includes("?")
                        ? location.pathname + location.search === item.path
                        : location.pathname === item.path && !location.search
                    }
                    tooltip={item.title}
                    onClick={() => {
                      if (!item.comingSoon) navigate(item.path);
                    }}
                    className={item.comingSoon ? "opacity-50 cursor-not-allowed" : ""}
                  >
                    <div className="relative">
                      <item.icon className="w-4 h-4" />
                      {item.hasNotification && (
                        <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-primary" />
                      )}
                    </div>
                    <span className="flex items-center gap-2">
                      {item.title}
                      {item.comingSoon && (
                        <span className="px-1.5 py-0.5 text-[9px] font-medium italic rounded bg-muted text-muted-foreground">
                          Coming Soon
                        </span>
                      )}
                    </span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarSeparator />

        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  isActive={location.pathname === "/settings"}
                  tooltip="Settings"
                  onClick={() => navigate("/settings")}
                >
                  <Settings className="w-4 h-4" />
                  <span>Settings</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <CreditsBlock collapsed={collapsed} />
        <div className="px-2">
          <UpgradeButton collapsed={collapsed} />
        </div>
        <SidebarSeparator />
        <UserProfileBlock collapsed={collapsed} />
      </SidebarFooter>
    </Sidebar>
  );
};

export default AppSidebar;
