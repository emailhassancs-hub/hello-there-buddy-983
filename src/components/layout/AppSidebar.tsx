import { useLocation, useNavigate } from "react-router-dom";
import {
  Home,
  FolderOpen,
  Image,
  Box,
  Wand2,
  ZoomIn,
  GitBranch,
  Wrench,
  Users,
  Plus,
  MessageSquare,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const group1 = [
  { icon: Home, label: "Home", path: "/home" },
  { icon: FolderOpen, label: "Assets", path: "/assets" },
];

const group2 = [
  { icon: Image, label: "Image", path: "/image", large: true },
  { icon: Box, label: "3D", path: "/3d", large: true },
  { icon: Wand2, label: "Edit", path: "/edit", large: true },
  { icon: ZoomIn, label: "Upscale", path: "/upscale", large: true },
];

const group3 = [
  { icon: GitBranch, label: "Workflow", path: "/workflow" },
  { icon: Wrench, label: "Tools", path: "/tools" },
];

const group4 = [
  { icon: Users, label: "Community", path: "/community" },
  { icon: MessageSquare, label: "Assist", path: "/assist" },
];

const Divider = () => <div className="w-full h-px bg-border my-1" />;

const AppSidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const isActive = (path: string) => location.pathname === path;

  const renderItem = (item: { icon: typeof Home; label: string; path: string; large?: boolean }) => {
    const active = isActive(item.path);
    const iconSize = item.large ? "w-[22px] h-[22px]" : "w-5 h-5";

    return (
      <Tooltip key={item.path} delayDuration={400}>
        <TooltipTrigger asChild>
          <button
            onClick={() => navigate(item.path)}
            className={`relative w-[42px] h-[42px] rounded-lg flex flex-col items-center justify-center gap-0.5 transition-all duration-150 ${
              active
                ? "bg-primary/20 text-primary"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
            }`}
          >
            {active && (
              <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[2px] h-5 rounded-r bg-primary" />
            )}
            <item.icon className={iconSize} />
            <span className={`text-[10px] leading-none font-medium ${active ? "text-primary" : ""}`}>
              {item.label}
            </span>
          </button>
        </TooltipTrigger>
        {!active && (
          <TooltipContent side="right" sideOffset={8}>
            {item.label}
          </TooltipContent>
        )}
      </Tooltip>
    );
  };

  const handleCreateClick = () => {
    // Focus prompt bar by scrolling to top - the prompt bar is fixed so it's always visible
    window.scrollTo({ top: 0, behavior: "smooth" });
    // Try to focus the textarea
    setTimeout(() => {
      const textarea = document.querySelector<HTMLTextAreaElement>('textarea[placeholder*="Describe"]');
      textarea?.focus();
    }, 300);
  };

  return (
    <aside className="fixed left-0 top-0 bottom-0 w-[54px] bg-sidebar-bg border-r border-border z-50 flex flex-col items-center py-3 gap-0.5">
      {/* Logo */}
      <button
        onClick={() => navigate("/home")}
        className="w-[42px] h-[42px] flex items-center justify-center rounded-lg mb-1 hover:bg-muted/50 transition-colors"
      >
        <span className="text-primary font-bold text-lg">R</span>
      </button>

      {/* Group 1: Navigation */}
      <nav className="flex flex-col items-center gap-0.5 w-full px-[6px]">
        {group1.map(renderItem)}
      </nav>

      <Divider />

      {/* Group 2: Primary Creation Tools */}
      <nav className="flex flex-col items-center gap-0.5 w-full px-[6px]">
        {group2.map(renderItem)}
      </nav>

      <Divider />

      {/* Group 3: Advanced */}
      <nav className="flex flex-col items-center gap-0.5 w-full px-[6px]">
        {group3.map(renderItem)}
      </nav>

      <Divider />

      {/* Group 4: Social */}
      <nav className="flex flex-col items-center gap-0.5 w-full px-[6px]">
        {group4.map(renderItem)}
      </nav>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Create shortcut */}
      <Tooltip delayDuration={300}>
        <TooltipTrigger asChild>
          <button
            onClick={handleCreateClick}
            className="w-9 h-9 rounded-full bg-primary text-primary-foreground flex items-center justify-center hover:bg-primary/90 transition-colors mb-2 shadow-lg"
          >
            <Plus className="w-5 h-5" />
          </button>
        </TooltipTrigger>
        <TooltipContent side="right">Start creating</TooltipContent>
      </Tooltip>
    </aside>
  );
};

export default AppSidebar;
