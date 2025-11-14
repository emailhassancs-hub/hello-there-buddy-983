import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Plus, Trash2, Edit2, MessageSquare, ChevronLeft, Menu } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";
import { UserInfo } from "@/components/UserInfo";
import { useUserProfile } from "@/hooks/use-user-profile";

interface Session {
  session_id: string;
  created_at: string;
  updated_at: string;
  message_count: number;
}

interface ChatSidebarProps {
  currentSessionId: string | null;
  onSelectSession: (sessionId: string) => void;
  onNewChat: () => void;
  apiUrl: string;
}

export const ChatSidebar = ({ currentSessionId, onSelectSession, onNewChat, apiUrl }: ChatSidebarProps) => {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { toast } = useToast();
  const { data: userProfile } = useUserProfile();

  // Load all sessions on mount and when user profile is available
  useEffect(() => {
    if (userProfile?.email) {
      fetchSessions();
    }
  }, [userProfile?.email]);

  const fetchSessions = async () => {
    setIsLoading(true);
    try {
      // Get access token from URL first, then window, then localStorage
      const params = new URLSearchParams(window.location.search);
      const authToken = params.get("token") || (window as any).authToken || localStorage.getItem("auth_token");
      
      const headers: HeadersInit = {
        "Content-Type": "application/json",
      };
      
      if (authToken) {
        headers["Authorization"] = `Bearer ${authToken}`;
      }

      // Include user email in query parameter
      const userEmail = userProfile?.email;
      const url = userEmail 
        ? `${apiUrl}/user/sessions?email=${encodeURIComponent(userEmail)}`
        : `${apiUrl}/user/sessions`;
      
      const response = await fetch(url, { headers });
      if (!response.ok) {
        throw new Error("Failed to fetch sessions");
      }
      const data = await response.json();
      
      // Handle new session_ids format
      if (data.session_ids) {
        const sessions = data.session_ids.map((id: string) => ({
          session_id: id,
          created_at: null,
          updated_at: null,
          message_count: 0
        }));
        setSessions(sessions);
      } else {
        setSessions([]);
      }
    } catch (error) {
      console.error("Error fetching sessions:", error);
      toast({
        title: "Error",
        description: "Could not load chat history",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getChatName = (sessionId: string, createdAt: string): string => {
    const chatNames = JSON.parse(localStorage.getItem("chatNames") || "{}");
    return chatNames[sessionId] || `Chat - ${new Date(createdAt).toLocaleDateString()}`;
  };

  const saveChatName = (sessionId: string, name: string) => {
    const chatNames = JSON.parse(localStorage.getItem("chatNames") || "{}");
    chatNames[sessionId] = name;
    localStorage.setItem("chatNames", JSON.stringify(chatNames));
  };

  const handleRename = (sessionId: string) => {
    const currentName = getChatName(sessionId, "");
    setEditingSessionId(sessionId);
    setEditingName(currentName);
  };

  const saveRename = () => {
    if (editingSessionId && editingName.trim()) {
      saveChatName(editingSessionId, editingName.trim());
      setEditingSessionId(null);
      setEditingName("");
      // Force re-render
      setSessions([...sessions]);
    }
  };

  const cancelRename = () => {
    setEditingSessionId(null);
    setEditingName("");
  };

  const handleDelete = async (sessionId: string) => {
    if (!confirm("Are you sure you want to delete this chat?")) {
      return;
    }

    try {
      // Get access token from URL first, then window, then localStorage
      const params = new URLSearchParams(window.location.search);
      const authToken = params.get("token") || (window as any).authToken || localStorage.getItem("auth_token");
      
      const headers: HeadersInit = {
        "Content-Type": "application/json",
      };
      
      if (authToken) {
        headers["Authorization"] = `Bearer ${authToken}`;
      }

      const response = await fetch(`${apiUrl}/user/sessions/${sessionId}`, {
        method: "DELETE",
        headers,
      });

      if (!response.ok) {
        throw new Error("Failed to delete session");
      }

      // Remove from list
      setSessions(sessions.filter((s) => s.session_id !== sessionId));

      // If this was the active chat, create a new one
      if (sessionId === currentSessionId) {
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
    }
  };

  const formatTimestamp = (timestamp: string) => {
    try {
      return formatDistanceToNow(new Date(timestamp), { addSuffix: true });
    } catch {
      return "Recently";
    }
  };

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
      </div>
    );
  }

  return (
    <div className="w-[170px] h-full glass border-r flex flex-col shadow-soft">
      {/* Header */}
      <div className="p-2 border-b glass flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <MessageSquare className="w-3.5 h-3.5 dark:text-white" />
          <h2 className="font-semibold text-xs dark:text-white">Chats</h2>
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
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-xs truncate dark:text-white">
                          {getChatName(session.session_id, session.created_at)}
                        </h3>
                        <div className="flex items-center gap-1.5 mt-0.5 text-[10px] text-muted-foreground">
                          <span>{session.message_count}</span>
                          <span>•</span>
                          <span className="truncate">{formatTimestamp(session.updated_at)}</span>
                        </div>
                      </div>
                      {currentSessionId === session.session_id && (
                        <div className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0 mt-1" />
                      )}
                    </div>
                    <div
                      className="absolute top-1 right-1 flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 dark:text-white dark:hover:bg-muted"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRename(session.session_id);
                        }}
                      >
                        <Edit2 className="w-3 h-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-destructive hover:text-destructive dark:hover:bg-muted"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(session.session_id);
                        }}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
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
      <UserInfo />
    </div>
  );
};
