import { useLocation, useNavigate } from "react-router-dom";
import {
  Home,
  Image,
  Box,
  Wand2,
  ZoomIn,
  GitBranch,
  Wrench,
  Users,
  Sparkles,
  Settings,
  FolderOpen,
  LayoutGrid,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const navItems = [
  { icon: Home, label: "Home", tooltip: "Home", path: "/home" },
  { icon: FolderOpen, label: "Assets", tooltip: "Your Assets", path: "/assets" },
  { icon: Image, label: "Image", tooltip: "Image Generation", path: "/image" },
  { icon: Box, label: "3D", tooltip: "3D Generation", path: "/3d" },
  { icon: Wand2, label: "Edit", tooltip: "Edit Image", path: "/edit" },
  { icon: ZoomIn, label: "Upscale", tooltip: "Upscale Image", path: "/studio" },
  { icon: GitBranch, label: "Workflow", tooltip: "Workflows", path: "/workflow" },
  { icon: Wrench, label: "Tools", tooltip: "All Tools", path: "/studio" },
  { icon: LayoutGrid, label: "Gallery", tooltip: "Examples Gallery", path: "/examples" },
  { icon: Users, label: "Community", tooltip: "Community", path: "/home" },
];

const AppSidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const isActive = (path: string) => location.pathname === path;

  return (
    <aside className="fixed left-0 top-0 bottom-0 w-[54px] bg-sidebar-bg z-50 flex flex-col items-center py-3 gap-1">
      {/* Logo */}
      <button
        onClick={() => navigate("/home")}
        className="w-[42px] h-[42px] flex items-center justify-center rounded-lg mb-2 hover:bg-white/5 transition-colors"
      >
        <Sparkles className="w-5 h-5 text-primary" />
      </button>

      {/* Main nav */}
      <nav className="flex-1 flex flex-col items-center gap-0.5 w-full px-[6px]">
        {navItems.map((item) => {
          const active = isActive(item.path);
          return (
            <Tooltip key={item.path} delayDuration={400}>
              <TooltipTrigger asChild>
                <button
                  onClick={() => navigate(item.path)}
                  className={`
                    w-[42px] h-[42px] rounded-lg flex flex-col items-center justify-center gap-0.5 transition-all duration-150
                    ${active
                      ? "bg-primary/15 text-primary-glow"
                      : "text-muted-foreground hover:text-foreground/80 hover:bg-white/5"
                    }
                  `}
                >
                  <item.icon className="w-[20px] h-[20px]" />
                  <span className={`text-[10px] leading-none font-medium ${active ? "text-primary-glow" : ""}`}>
                    {item.label}
                  </span>
                </button>
              </TooltipTrigger>
              {!active && (
                <TooltipContent side="right" sideOffset={8} className="bg-popover border-border text-popover-foreground">
                  {item.tooltip}
                </TooltipContent>
              )}
            </Tooltip>
          );
        })}
      </nav>

      {/* Bottom items */}
      <div className="flex flex-col items-center gap-0.5 w-full px-[6px] pb-1">
        <Tooltip delayDuration={400}>
          <TooltipTrigger asChild>
            <button
              onClick={() => navigate("/studio")}
              className="w-[42px] h-[42px] rounded-lg flex flex-col items-center justify-center gap-0.5 text-muted-foreground hover:text-foreground/80 hover:bg-white/5 transition-all duration-150"
            >
              <Sparkles className="w-[20px] h-[20px]" />
              <span className="text-[10px] leading-none font-medium">Assist</span>
            </button>
          </TooltipTrigger>
          <TooltipContent side="right" sideOffset={8} className="bg-popover border-border text-popover-foreground">
            AI Assist
          </TooltipContent>
        </Tooltip>
        <Tooltip delayDuration={400}>
          <TooltipTrigger asChild>
            <button
              onClick={() => navigate("/usage")}
              className="w-[42px] h-[42px] rounded-lg flex flex-col items-center justify-center gap-0.5 text-muted-foreground hover:text-foreground/80 hover:bg-white/5 transition-all duration-150"
            >
              <Settings className="w-[20px] h-[20px]" />
              <span className="text-[10px] leading-none font-medium">Settings</span>
            </button>
          </TooltipTrigger>
          <TooltipContent side="right" sideOffset={8} className="bg-popover border-border text-popover-foreground">
            Settings
          </TooltipContent>
        </Tooltip>
      </div>
    </aside>
  );
};

export default AppSidebar;
