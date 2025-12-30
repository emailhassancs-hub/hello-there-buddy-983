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
import { LocalStorageKeys } from "@/enums/localstorage";

interface Session {
  session_id: string;
  created_at: string;
  updated_at: string;
  message_count: number;
}

interface SessionFirstPrompt {
  [sessionId: string]: string;
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
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [firstPrompts, setFirstPrompts] = useState<SessionFirstPrompt>({});
  const [loadingPrompts, setLoadingPrompts] = useState<Set<string>>(new Set());
  const { toast } = useToast();
  const { data: userProfile } = useUserProfile();

  // Load cached prompts from localStorage on mount
  useEffect(() => {
    const cachedPrompts = JSON.parse(localStorage.getItem("sessionFirstPrompts") || "{}");
    if (Object.keys(cachedPrompts).length > 0) {
      setFirstPrompts(cachedPrompts);
    }
  }, []);

  // Load all sessions on mount and when user profile loads
  useEffect(() => {
    if (userProfile?.email) {
      fetchSessions();
    }
  }, [userProfile?.email]);

  // Fetch first prompts for all sessions when sessions are loaded
  useEffect(() => {
    if (sessions.length === 0 || !userProfile?.email) {
      return;
    }

    const chatNames = JSON.parse(localStorage.getItem("chatNames") || "{}");
    const cachedPrompts = JSON.parse(localStorage.getItem("sessionFirstPrompts") || "{}");
    
    // Batch fetch prompts with a delay to avoid overwhelming the server
    sessions.forEach((session, index) => {
      // Skip if already has custom name or cached prompt
      if (chatNames[session.session_id] || cachedPrompts[session.session_id]) {
        return;
      }
      
      // Skip if already loading or already fetched
      if (loadingPrompts.has(session.session_id) || firstPrompts[session.session_id]) {
        return;
      }
      
      // Stagger requests to avoid race conditions
      setTimeout(() => {
        fetchFirstPrompt(session.session_id);
      }, index * 100); // 100ms delay between each request
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessions.length, apiUrl, userProfile?.email]);

  // Listen for refresh events (e.g., after title generation)
  useEffect(() => {
    const handleRefresh = async (event: Event) => {
      if (!userProfile?.email) return;
      
      const customEvent = event as CustomEvent;
      const sessionDetail = customEvent?.detail?.session;
      
      // If a specific session is provided, update it optimistically without full reload
      if (sessionDetail) {
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
            return updated;
          } else {
            // Add new session to the beginning of the list
            return [sessionDetail, ...prev];
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

      const email = userProfile?.email;
      const url = email 
        ? `${apiUrl}/sessions?email=${encodeURIComponent(email)}`
        : `${apiUrl}/sessions`;
      
      const response = await fetch(url, { headers });
      if (!response.ok) {
        throw new Error("Failed to fetch sessions");
      }
      const data = await response.json();
      setSessions(data.sessions || []);
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

  // Fetch first prompt for a session
  const fetchFirstPrompt = async (sessionId: string) => {
    // Skip if already loading or already fetched
    if (loadingPrompts.has(sessionId) || firstPrompts[sessionId]) {
      return;
    }

    // Check localStorage for cached prompt
    const cachedPrompts = JSON.parse(localStorage.getItem("sessionFirstPrompts") || "{}");
    if (cachedPrompts[sessionId]) {
      setFirstPrompts((prev) => ({ ...prev, [sessionId]: cachedPrompts[sessionId] }));
      return;
    }

    setLoadingPrompts((prev) => {
      const next = new Set(prev);
      next.add(sessionId);
      return next;
    });

    try {
      // Get access token from localStorage
      const authToken = localStorage.getItem(LocalStorageKeys.AccessToken);
      
      const headers: HeadersInit = {
        "Content-Type": "application/json",
      };
      
      if (authToken) {
        headers["Authorization"] = `Bearer ${authToken}`;
      }

      const email = userProfile?.email;
      const exportUrl = email 
        ? `${apiUrl}/session/${sessionId}/export?email=${encodeURIComponent(email)}`
        : `${apiUrl}/session/${sessionId}/export`;
      
      const response = await fetch(exportUrl, { headers });
      if (!response.ok) {
        throw new Error("Failed to fetch first prompt");
      }
      
      const data = await response.json();
      
      // Find the first user message
      const firstUserMessage = data.messages?.find((msg: any) => 
        msg.type === "human" || (msg.type === "user" && msg.content)
      );
      
      if (firstUserMessage?.content) {
        // Truncate if too long
        const prompt = firstUserMessage.content.length > 50 
          ? firstUserMessage.content.substring(0, 50) + "..." 
          : firstUserMessage.content;
        
        setFirstPrompts((prev) => ({ ...prev, [sessionId]: prompt }));
        
        // Cache in localStorage
        const updatedCache = { ...cachedPrompts, [sessionId]: prompt };
        localStorage.setItem("sessionFirstPrompts", JSON.stringify(updatedCache));
      }
    } catch (error) {
      console.error("Error fetching first prompt:", error);
    } finally {
      setLoadingPrompts((prev) => {
        const next = new Set(prev);
        next.delete(sessionId);
        return next;
      });
    }
  };

  const getChatName = (sessionId: string, createdAt: string): string => {
    const chatNames = JSON.parse(localStorage.getItem("chatNames") || "{}");
    
    // If there's a saved name, use it
    if (chatNames[sessionId]) {
      return chatNames[sessionId];
    }
    
    // If we have the first prompt, use it
    if (firstPrompts[sessionId]) {
      return firstPrompts[sessionId];
    }
    
    // Check localStorage cache again (might have been updated)
    const cachedPrompts = JSON.parse(localStorage.getItem("sessionFirstPrompts") || "{}");
    if (cachedPrompts[sessionId]) {
      // Update state asynchronously to avoid render side effects
      setTimeout(() => {
        setFirstPrompts((prev) => {
          if (!prev[sessionId]) {
            return { ...prev, [sessionId]: cachedPrompts[sessionId] };
          }
          return prev;
        });
      }, 0);
      return cachedPrompts[sessionId];
    }
    
    // Fallback while loading or if fetch fails - use date as last resort
    // DO NOT trigger fetch here - that should only happen in useEffect
    return `Chat - ${new Date(createdAt).toLocaleDateString()}`;
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
      // Get access token from localStorage
      const authToken = localStorage.getItem(LocalStorageKeys.AccessToken);
      
      const headers: HeadersInit = {
        "Content-Type": "application/json",
      };
      
      if (authToken) {
        headers["Authorization"] = `Bearer ${authToken}`;
      }

      const email = userProfile?.email;
      const deleteUrl = email 
        ? `${apiUrl}/session/${sessionId}/delete?email=${encodeURIComponent(email)}`
        : `${apiUrl}/session/${sessionId}/delete`;
      
      const response = await fetch(deleteUrl, {
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
                          {getChatName(session.session_id, session.created_at)}
                        </h3>
                        <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
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
                      className="absolute top-1 right-1 flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity z-10 bg-background/80 rounded"
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
