import * as React from "react";
import { useUserProfile } from "@/hooks/use-user-profile";
import { useUser } from "@/hooks/use-user";
import { Coins, MoreVertical, LogOut, User, BookOpen } from "lucide-react";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LocalStorageKeys } from "@/enums/localstorage";
import { ProfileModal } from "@/components/ProfileModal";

interface UserInfoProps {
  className?: string;
  onTutorialClick?: () => void;
}

export const UserInfo = ({ className, onTutorialClick }: UserInfoProps) => {
  const { data: userProfile, isLoading } = useUserProfile();
  const { clearUser } = useUser();
  const [isProfileModalOpen, setIsProfileModalOpen] = React.useState(false);

  const handleLogout = () => {
    try {
      localStorage.removeItem(LocalStorageKeys.AccessToken);
      localStorage.removeItem(LocalStorageKeys.User);
      clearUser();
      if (!window.location.pathname.startsWith("/login")) {
        window.location.href = "/login";
      }
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  if (isLoading) {
    return (
      <div className={cn("p-2 border-t border-border", className)}>
        <div className="text-xs text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!userProfile) {
    return null;
  }

  const initials = userProfile.name
    ? userProfile.name
        .trim()
        .split(/\s+/)
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "U";

  return (
    <div className={cn("p-2 border-t border-border space-y-2 relative", className)}>
      <div className="flex items-center justify-center gap-2 px-2 py-1.5 bg-black rounded-md border border-border relative z-0">
        <Coins className="h-3.5 w-3.5 text-yellow-400" />
        <span className="text-xs font-medium text-white">
          {userProfile.credits?.toLocaleString() || 0} Credits
        </span>
      </div>
      
      <div className="flex items-center gap-2 px-2 py-1.5 relative z-10">
        <div className="h-6 w-6 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
          <span className="text-[10px] font-medium text-foreground">{initials}</span>
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-xs font-medium text-foreground truncate">
            {userProfile.name || "User"}
          </div>
          {userProfile.email ? (
            <Tooltip delayDuration={200}>
              <TooltipTrigger asChild>
                <div className="text-[10px] text-muted-foreground truncate cursor-help">
                  {userProfile.email}
                </div>
              </TooltipTrigger>
              <TooltipContent 
                side="top" 
                className="min-w-lg bg-gray-900 dark:bg-gray-800 border-gray-700 text-white p-2 z-[1000]"
              >
                <p className="break-all whitespace-normal text-xs font-normal">
                  {userProfile.email}
                </p>
              </TooltipContent>
            </Tooltip>
          ) : (
            <div className="text-[10px] text-muted-foreground truncate">
              No email
            </div>
          )}
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-6 w-6 text-muted-foreground hover:text-foreground relative z-20"
            >
              <MoreVertical className="h-3.5 w-3.5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent 
            align="end" 
            className="w-40 !z-[9999] bg-white ml-2"
            side="top"
            sideOffset={5}
          >
            <DropdownMenuItem 
              onClick={() => setIsProfileModalOpen(true)}
              className="cursor-pointer text-black hover:bg-gray-800 hover:text-white"
            >
              <User className="h-4 w-4 mr-2" />
              Profile
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => onTutorialClick?.()}
              className="cursor-pointer text-black hover:bg-gray-800 hover:text-white"
            >
              <BookOpen className="h-4 w-4 mr-2" />
              Tutorial
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={handleLogout}
              className="cursor-pointer text-black hover:bg-gray-800 hover:text-white"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        
        {/* Profile Modal */}
        <ProfileModal 
          isOpen={isProfileModalOpen} 
          onClose={() => setIsProfileModalOpen(false)} 
        />
      </div>
    </div>
  );
};
