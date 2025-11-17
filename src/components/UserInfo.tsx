import { useUserProfile } from "@/hooks/use-user-profile";
import { Coins } from "lucide-react";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface UserInfoProps {
  className?: string;
}

export const UserInfo = ({ className }: UserInfoProps) => {
  const { data: userProfile, isLoading } = useUserProfile();

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
    <div className={cn("p-2 border-t border-border space-y-2", className)}>
      <div className="flex items-center justify-center gap-2 px-2 py-1.5 bg-black rounded-md border border-border">
        <Coins className="h-3.5 w-3.5 text-yellow-400" />
        <span className="text-xs font-medium text-white">
          {userProfile.credits?.toLocaleString() || 0} Credits
        </span>
      </div>
      
      <div className="flex items-center gap-2 px-2 py-1.5">
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
      </div>
    </div>
  );
};
