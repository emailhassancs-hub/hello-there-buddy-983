import { MoreHorizontal } from "lucide-react";
import { useUserProfile } from "@/hooks/use-user-profile";

interface UserProfileBlockProps {
  collapsed?: boolean;
}

const UserProfileBlock = ({ collapsed = false }: UserProfileBlockProps) => {
  const { data: profile } = useUserProfile();

  const name = profile?.name || "User";
  const email = profile?.email || "user@example.com";
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  if (collapsed) {
    return (
      <div className="flex items-center justify-center p-2">
        <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-semibold">
          {initials}
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2.5 px-3 py-2">
      <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-semibold shrink-0">
        {initials}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{name}</p>
        <p className="text-[11px] text-muted-foreground truncate">{email}</p>
      </div>
      <button className="shrink-0 p-1 rounded-md hover:bg-accent text-muted-foreground">
        <MoreHorizontal className="w-4 h-4" />
      </button>
    </div>
  );
};

export default UserProfileBlock;
