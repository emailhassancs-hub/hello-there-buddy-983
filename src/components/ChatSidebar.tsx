import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Plus, Trash2, Edit2, MessageSquare, ChevronLeft, Menu, MoreVertical, Coins, User, BookOpen, LogOut, Home, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";
import { UserInfo } from "@/components/UserInfo";
import { useUserProfile } from "@/hooks/use-user-profile";
import { LocalStorageKeys } from "@/enums/localstorage";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { ProfileModal } from "@/components/ProfileModal";
import { useUser } from "@/hooks/use-user";
import { useProject } from "@/hooks/use-project";
import { useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useNavigate } from "react-router-dom";
import { ProjectMembersModal } from "@/components/home/ProjectMembersModal";

const formatCredits = (credits: unknown): string => {
  const n = typeof credits === "number" ? credits : Number(credits);
  if (!Number.isFinite(n) || n === 0) return "0";
  return n.toFixed(3).replace(/\.?0+$/, "");
};

interface Session {
  session_id: string;
  created_at: string;
  updated_at: string;
  message_count?: number;
  total_messages?: number;
  title?: string;
}

interface ChatSidebarProps {
  currentSessionId: string | null;
  onSelectSession: (sessionId: string) => void;
  onNewChat: () => void;
  apiUrl: string;
  onSessionsLoaded?: (sessions: Session[]) => void;
  onTutorialClick?: () => void;
  projectName?: string;
  projectId?: string | null;
}

const SIDEBAR_COLLAPSE_KEY = "sidebar_collapsed";

export const ChatSidebar = ({
  currentSessionId,
  onSelectSession,
  onNewChat,
  apiUrl,
  onSessionsLoaded,
  onTutorialClick,
  projectName,
  projectId,
}: ChatSidebarProps) => {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  
  // Initialize collapse state from localStorage
  const [isCollapsed, setIsCollapsed] = useState(() => {
    const saved = localStorage.getItem(SIDEBAR_COLLAPSE_KEY);
    return saved === "true";
  });
  
  const [deleteSessionId, setDeleteSessionId] = useState<string | null>(null);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null); // Track which dropdown is open
  const { toast } = useToast();
  const { data: userProfile } = useUserProfile();
  const { clearUser } = useUser();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { data: project } = useProject(projectId);
  const canEditProject = !!projectId && project?.creatorId === userProfile?.id;
  const [projectNameDraft, setProjectNameDraft] = useState(projectName ?? "");
  const [isSavingProjectName, setIsSavingProjectName] = useState(false);
  const [isMembersModalOpen, setIsMembersModalOpen] = useState(false);

  useEffect(() => {
    setProjectNameDraft(projectName ?? "");
  }, [projectName]);

  const handleProjectRename = async () => {
    if (!projectId || !projectNameDraft.trim()) return;
    try {
      setIsSavingProjectName(true);
      await apiFetch(`/api/projects/${projectId}`, {
        method: "PATCH",
        body: { name: projectNameDraft.trim() },
      });
      await queryClient.invalidateQueries({ queryKey: ["project", projectId] });
      toast({
        title: "Project updated",
        description: "Project name has been updated.",
      });
    } catch (error) {
      console.error("Error updating project name:", error);
      toast({
        title: "Error",
        description: "Failed to update project name.",
        variant: "destructive",
      });
    } finally {
      setIsSavingProjectName(false);
    }
  };

  // Save collapse state to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem(SIDEBAR_COLLAPSE_KEY, String(isCollapsed));
  }, [isCollapsed]);

  // Load all sessions on mount and when user profile loads
  useEffect(() => {
    if (userProfile?.email) {
      fetchSessions();
    }
  }, [userProfile?.email]);


  // Listen for refresh events (e.g., after title generation)
  useEffect(() => {
    const handleRefresh = async (event: Event) => {
      if (!userProfile?.email) return;
      
      const customEvent = event as CustomEvent;
      const sessionDetail = customEvent?.detail?.session;
      
      // If a specific session is provided, update it optimistically without full reload
      if (sessionDetail) {
        // Skip if session_id is null
        if (sessionDetail.session_id === null) {
          return;
        }
        
        setSessions((prev) => {
          const existingIndex = prev.findIndex((s) => s.session_id === sessionDetail.session_id);
          
          if (existingIndex >= 0) {
            // Update existing session
            const updated = [...prev];
            updated[existingIndex] = {
              ...updated[existingIndex],
              ...sessionDetail,
              // Keep the original created_at if not provided
              created_at: sessionDetail.created_at || updated[existingIndex].created_at,
            };
            return updated.filter((s) => s.session_id !== null);
          } else {
            // Add new session to the beginning of the list
            return [sessionDetail, ...prev].filter((s) => s.session_id !== null);
          }
        });
        return; // Don't do full fetch for optimistic updates
      }
      
      // Only do full fetch if no session detail provided (for other refresh scenarios)
      setIsRefreshing(true);
      await fetchSessions();
      setIsRefreshing(false);
    };

    window.addEventListener('refreshChatSidebar', handleRefresh);
    return () => window.removeEventListener('refreshChatSidebar', handleRefresh);
  }, [userProfile?.email]);

  const fetchSessions = async () => {
    const loadingState = !isRefreshing; // Only set main loading if not refreshing
    if (loadingState) setIsLoading(true);
    try {
      // Get access token from localStorage
      const authToken = localStorage.getItem(LocalStorageKeys.AccessToken);
      
      const headers: HeadersInit = {
        "Content-Type": "application/json",
      };
      
      if (authToken) {
        headers["Authorization"] = `Bearer ${authToken}`;
      }

      const url = `${apiUrl}/project/${projectId}/sessions`
      
      const response = await fetch(url, { headers });
      if (!response.ok) {
        throw new Error("Failed to fetch sessions");
      }
      const data = await response.json();
      const loadedSessions = (data.sessions || []).filter((session: Session) => session.session_id !== null);
      setSessions(loadedSessions);
      
      // Notify parent that sessions are loaded
      if (onSessionsLoaded) {
        onSessionsLoaded(loadedSessions);
      }
    } catch (error) {
      console.error("Error fetching sessions:", error);
      toast({
        title: "Error",
        description: "Could not load chat history",
        variant: "destructive",
      });
    } finally {
      if (loadingState) setIsLoading(false);
    }
  };

  const getChatName = (session: Session): string => {
    const chatNames = JSON.parse(localStorage.getItem("chatNames") || "{}");
    
    // If there's a saved custom name, use it
    if (chatNames[session.session_id]) {
      return chatNames[session.session_id];
    }
    
    // Use title from session if available
    if (session.title) {
      return session.title;
    }
    
    // Fallback to date-based name
    return `Chat - ${new Date(session.created_at).toLocaleDateString()}`;
  };

  const saveChatName = (sessionId: string, name: string) => {
    const chatNames = JSON.parse(localStorage.getItem("chatNames") || "{}");
    chatNames[sessionId] = name;
    localStorage.setItem("chatNames", JSON.stringify(chatNames));
  };

  const handleRename = (session: Session) => {
    setOpenDropdownId(null); // Close dropdown first
    const currentName = getChatName(session);
    setEditingSessionId(session.session_id);
    setEditingName(currentName);
  };

  const saveRename = () => {
    if (editingSessionId && editingName.trim()) {
      saveChatName(editingSessionId, editingName.trim());
      setEditingSessionId(null);
      setEditingName("");
      // Force re-render (sessions are already filtered, but ensure no nulls)
      setSessions(sessions.filter((s) => s.session_id !== null));
    }
  };

  const cancelRename = () => {
    setEditingSessionId(null);
    setEditingName("");
  };

  const handleDeleteClick = (sessionId: string, e?: React.MouseEvent) => {
    e?.stopPropagation(); // Prevent event bubbling
    setOpenDropdownId(null); // Close dropdown first
    setDeleteSessionId(sessionId); // Then open delete dialog
  };

  const handleDeleteConfirm = async () => {
    if (!deleteSessionId) return;

    try {
      // Get access token from localStorage
      const authToken = localStorage.getItem(LocalStorageKeys.AccessToken);
      
      const headers: HeadersInit = {
        "Content-Type": "application/json",
      };
      
      if (authToken) {
        headers["Authorization"] = `Bearer ${authToken}`;
      }

      const userId = userProfile?.id;
      const deleteUrl = userId 
        ? `${apiUrl}/session/${deleteSessionId}/delete?userId=${encodeURIComponent(userId)}`
        : `${apiUrl}/session/${deleteSessionId}/delete`;
      
      const response = await fetch(deleteUrl, {
        method: "DELETE",
        headers,
      });

      if (!response.ok) {
        throw new Error("Failed to delete session");
      }

      // Remove from list (also filter out any null session_ids)
      setSessions(sessions.filter((s) => s.session_id !== deleteSessionId && s.session_id !== null));

      // If this was the active chat, create a new one
      if (deleteSessionId === currentSessionId) {
        onNewChat();
      }

      toast({
        title: "Success",
        description: "Chat deleted successfully",
      });
    } catch (error) {
      console.error("Error deleting session:", error);
      toast({
        title: "Error",
        description: "Failed to delete chat",
        variant: "destructive",
      });
    } finally {
      setDeleteSessionId(null);
    }
  };

  const formatTimestamp = (timestamp: string) => {
    try {
      // Parse the timestamp - if it doesn't have timezone info, treat it as UTC
      // let date: Date;
      // if (timestamp.includes('Z') || timestamp.includes('+') || timestamp.includes('-') && timestamp.match(/[+-]\d{2}:\d{2}$/)) {
      //   // Has timezone info, parse normally
      //   date = new Date(timestamp);
      // } else {
      //   // No timezone info, assume UTC and append 'Z'
      //   date = new Date(timestamp.endsWith('Z') ? timestamp : timestamp + 'Z');
      // }
      
      // // Validate the date
      // if (isNaN(date.getTime())) {
      //   return "Recently";
      // }
      
      // return formatDistanceToNow(date, { addSuffix: true });
       return formatDistanceToNow(new Date(timestamp), { addSuffix: true });
    } catch {
      return "Recently";
    }
  };

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

  const initials = userProfile?.name
    ? userProfile.name
        .trim()
        .split(/\s+/)
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "U";

  if (isCollapsed) {
    return (
      <div className="w-12 h-full bg-background border-r border-border flex flex-col items-center py-4 gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsCollapsed(false)}
          className="dark:text-white"
        >
          <Menu className="w-4 h-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={onNewChat}
          className="dark:text-white"
        >
          <Plus className="w-4 h-4" />
        </Button>
        
        {/* Spacer to push icons to bottom */}
        <div className="flex-1" />
        
        {/* Compact Credits Icon */}
        {userProfile && (
          <Tooltip delayDuration={200}>
            <TooltipTrigger asChild>
              <div className="flex items-center justify-center w-8 h-8 rounded-md bg-black cursor-pointer">
                <Coins className="w-4 h-4 text-yellow-400" />
              </div>
            </TooltipTrigger>
            <TooltipContent side="right" className="bg-gray-900 text-white p-2 z-[1000]">
              <p className="text-xs font-medium">
                {formatCredits(userProfile.credits)} Credits
              </p>
            </TooltipContent>
          </Tooltip>
        )}
        
        {/* Compact Profile Icon with Dropdown */}
        {userProfile && (
          <DropdownMenu>
            <Tooltip delayDuration={200}>
              <TooltipTrigger asChild>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="w-8 h-8 rounded-full bg-primary/20 hover:bg-primary/30"
                  >
                    <span className="text-[10px] font-medium text-foreground">{initials}</span>
                  </Button>
                </DropdownMenuTrigger>
              </TooltipTrigger>
              <TooltipContent side="right" className="bg-gray-900 text-white p-2 z-[1000]">
                <p className="text-xs font-medium">{userProfile.name || "User"}</p>
              </TooltipContent>
            </Tooltip>
            <DropdownMenuContent align="end" className="w-40 !z-[9999] bg-white ml-2" side="right" sideOffset={5}>
              <DropdownMenuItem
                onClick={() => setIsProfileModalOpen(true)}
                className="cursor-pointer text-black hover:bg-gray-800 hover:text-white"
              >
                <User className="h-4 w-4 mr-2" />
                Profile
              </DropdownMenuItem>
              {onTutorialClick && (
                <DropdownMenuItem
                  onClick={onTutorialClick}
                  className="cursor-pointer text-black hover:bg-gray-800 hover:text-white"
                >
                  <BookOpen className="h-4 w-4 mr-2" />
                  Tutorial
                </DropdownMenuItem>
              )}
              <DropdownMenuItem
                onClick={handleLogout}
                className="cursor-pointer text-black hover:bg-gray-800 hover:text-white"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}

        {/* Profile Modal */}
        <ProfileModal
          isOpen={isProfileModalOpen}
          onClose={() => setIsProfileModalOpen(false)}
        />
      </div>
    );
  }

  return (
    <div className="w-[14%] h-full bg-gray-100 border-r flex flex-col shadow-soft">
      {/* Project Name Accordion */}
      {projectName && (
        <Accordion type="single" collapsible className="border-b glass">
          <AccordionItem value="project" className="border-none">
            <AccordionTrigger className="px-2 py-2 hover:no-underline">
              <h3
                className="font-semibold text-sm text-foreground dark:text-white truncate flex-1 text-left min-w-0 max-w-[calc(100%-2rem)]"
                title={projectName}
              >
                {projectName && projectName.length > 30 ? `${projectName.substring(0, 30)}...` : projectName}
              </h3>
            </AccordionTrigger>
            <AccordionContent className="px-2 pb-2">
              <div className="flex flex-col gap-1">
                <button
                  onClick={() => navigate("/home")}
                  className="flex items-center gap-2 px-2 py-1.5 text-sm text-foreground hover:bg-accent rounded-md transition-colors text-left"
                >
                  <Home className="w-4 h-4" />
                  Home page
                </button>
                {canEditProject && (
                  <>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <button className="flex items-center gap-2 px-2 py-1.5 text-sm text-foreground hover:bg-accent rounded-md transition-colors text-left w-full">
                          <Edit2 className="w-4 h-4" />
                          Rename
                        </button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Edit project name</AlertDialogTitle>
                          <AlertDialogDescription>
                            Update the name of this project. This will be visible to all members.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <div className="space-y-2">
                          <Input
                            value={projectNameDraft}
                            onChange={(e) => setProjectNameDraft(e.target.value)}
                            placeholder="Project name"
                            autoFocus
                          />
                        </div>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => {
                              handleProjectRename();
                            }}
                            className="bg-black text-white hover:bg-black/90"
                          >
                            {isSavingProjectName ? "Saving..." : "Save"}
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                    <button
                      onClick={() => setIsMembersModalOpen(true)}
                      className="flex items-center gap-2 px-2 py-1.5 text-sm text-foreground hover:bg-accent rounded-md transition-colors text-left"
                    >
                      <Users className="w-4 h-4" />
                      Members
                    </button>
                  </>
                )}
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      )}
      {/* Header */}
      <div className="p-2 border-b glass flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <MessageSquare className="w-3.5 h-3.5 dark:text-white" />
          <h2 className="font-semibold text-xs dark:text-white">Chats</h2>
          {isRefreshing && (
            <div className="w-3 h-3 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          )}
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsCollapsed(true)}
          className="dark:text-white h-6 w-6"
        >
          <ChevronLeft className="w-3 h-3" />
        </Button>
      </div>


      {/* Chat List */}
      <ScrollArea className="flex-1 px-2 pt-2">
        {isLoading ? (
          <div className="p-3 text-center text-muted-foreground text-xs">Loading...</div>
        ) : sessions.length === 0 ? (
          <div className="p-3 text-center text-muted-foreground text-xs">
            No chats yet
          </div>
        ) : (
          <div className="space-y-2 pb-4">
            {sessions.map((session) => (
              <div
                key={session.session_id}
                className={cn(
                  "group relative p-2 rounded-md cursor-pointer transition-colors border border-transparent",
                  currentSessionId === session.session_id
                    ? "bg-primary/10 border-primary/20 dark:bg-primary/20 dark:border-primary/30"
                    : "hover:bg-muted/50 dark:hover:bg-muted/20"
                )}
                onClick={() => onSelectSession(session.session_id)}
              >
                {editingSessionId === session.session_id ? (
                  <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                    <Input
                      value={editingName}
                      onChange={(e) => setEditingName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") saveRename();
                        if (e.key === "Escape") cancelRename();
                      }}
                      onBlur={saveRename}
                      autoFocus
                      className="h-7 text-sm"
                    />
                  </div>
                ) : (
                  <>
                    <div className="flex items-start justify-between gap-1">
                      <div className="flex-1 min-w-0 pr-6">
                        <h3 className="font-medium text-xs truncate dark:text-white leading-tight mb-0.5">
                          {getChatName(session)}
                        </h3>
                        <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                          
                          <span className="truncate">{formatTimestamp(session.updated_at)}</span>
                        </div>
                      </div>
                     
                    </div>
                    <div
                      className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity z-10"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <DropdownMenu 
                        open={openDropdownId === session.session_id} 
                        onOpenChange={(open) => {
                          if (open) {
                            setOpenDropdownId(session.session_id);
                          } else {
                            setOpenDropdownId(null);
                          }
                        }}
                      >
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 dark:text-white dark:hover:bg-muted"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <MoreVertical className="w-3.5 h-3.5" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-40 bg-white">
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation();
                              setOpenDropdownId(null); // Close dropdown first
                              handleRename(session);
                            }}
                            className="cursor-pointer"
                          >
                            <Edit2 className="w-4 h-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteClick(session.session_id, e);
                            }}
                            className="cursor-pointer text-destructive focus:text-destructive"
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </ScrollArea>

      {/* New Chat Button - Bottom */}
      <div className="p-2 border-t border-border">
        <Button
          onClick={onNewChat}
          className="w-full gap-1.5 h-7 text-xs"
          variant="default"
        >
          <Plus className="w-3 h-3" />
          New
        </Button>
      </div>
      <UserInfo onTutorialClick={onTutorialClick} />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteSessionId !== null} onOpenChange={(open) => !open && setDeleteSessionId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Chat</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this chat? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-black text-white hover:bg-black/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Project Members Modal */}
      {projectId && (
        <ProjectMembersModal
          projectId={projectId}
          projectCreatorId={project?.creatorId || ""}
          open={isMembersModalOpen}
          onOpenChange={setIsMembersModalOpen}
          canManageMembers={canEditProject}
        />
      )}
    </div>
  );
};
