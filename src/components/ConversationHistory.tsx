import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Search,
  MessageSquare,
  Image as ImageIcon,
  Trash2,
  Download,
  X,
  User,
  Sparkles,
  Wrench,
  Box,
  Play,
  Clock,
  ChevronRight,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";

interface GeneratedAsset {
  url: string;
  type: "image" | "model" | "video";
}

interface Message {
  id: number;
  timestamp: string;
  role: "user" | "assistant" | "tool";
  content: string;
  display_name: string;
  avatar_color: string;
  generated_assets?: GeneratedAsset[];
}

interface SessionStatistics {
  user_messages: number;
  assistant_messages: number;
  tool_executions: number;
  generated_assets: number;
}

interface Session {
  session_id: string;
  created_at: string;
  last_updated: string;
  total_messages: number;
  last_user_message: string;
  statistics: SessionStatistics;
  preview_assets?: string[];
}

interface ConversationHistoryProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  apiUrl: string;
  userEmail?: string;
  accessToken?: string;
  onViewModel?: (modelUrl: string, thumbnailUrl: string, workflow: string) => void;
}

const API_URL = "https://games-ai-studio-middleware-agentic-main-347148155332.us-central1.run.app";

export function ConversationHistory({
  open,
  onOpenChange,
  apiUrl,
  userEmail,
  accessToken,
  onViewModel,
}: ConversationHistoryProps) {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [selectedSession, setSelectedSession] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [statistics, setStatistics] = useState<SessionStatistics | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [loadingSessions, setLoadingSessions] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [sessionToDelete, setSessionToDelete] = useState<string | null>(null);
  const [zoomedImage, setZoomedImage] = useState<string | null>(null);
  const { toast } = useToast();

  // Fetch all sessions on mount/open
  useEffect(() => {
    if (open && userEmail) {
      console.log("[ConversationHistory] Fetching sessions for:", userEmail);
      fetchSessions();
    }
  }, [open, userEmail]);

  // Fetch conversation when session selected
  useEffect(() => {
    if (selectedSession && userEmail) {
      console.log("[ConversationHistory] Fetching conversation:", selectedSession);
      fetchConversation(selectedSession);
    }
  }, [selectedSession, userEmail]);

  const getAuthHeaders = (): HeadersInit => {
    const headers: HeadersInit = {
      "Content-Type": "application/json",
      "ngrok-skip-browser-warning": "true",
    };
    if (accessToken) {
      headers["Authorization"] = `Bearer ${accessToken}`;
    }
    return headers;
  };

  const fetchSessions = async () => {
    if (!userEmail) {
      console.warn("[ConversationHistory] No userEmail provided, skipping fetch");
      return;
    }

    setLoadingSessions(true);
    const url = `${API_URL}/conversation-sessions/enhanced?email=${encodeURIComponent(userEmail)}`;
    console.log("[ConversationHistory] Fetching sessions from:", url);
    
    try {
      const response = await fetch(url, {
        method: "GET",
        headers: getAuthHeaders(),
      });

      console.log("[ConversationHistory] Sessions response status:", response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error("[ConversationHistory] Sessions error response:", errorText);
        throw new Error(`Failed to fetch sessions: ${response.status}`);
      }

      const data = await response.json();
      console.log("[ConversationHistory] Sessions data:", data);
      setSessions(data.sessions || []);
    } catch (error) {
      console.error("[ConversationHistory] Error fetching sessions:", error);
      toast({
        title: "Error",
        description: "Failed to load conversation history",
        variant: "destructive",
      });
    } finally {
      setLoadingSessions(false);
    }
  };

  const fetchConversation = async (sessionId: string) => {
    if (!userEmail) {
      console.warn("[ConversationHistory] No userEmail provided, skipping conversation fetch");
      return;
    }

    setLoadingMessages(true);
    const url = `${API_URL}/conversation-history/${sessionId}/formatted?email=${encodeURIComponent(userEmail)}`;
    console.log("[ConversationHistory] Fetching conversation from:", url);
    
    try {
      const response = await fetch(url, {
        method: "GET",
        headers: getAuthHeaders(),
      });

      console.log("[ConversationHistory] Conversation response status:", response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error("[ConversationHistory] Conversation error response:", errorText);
        throw new Error(`Failed to fetch conversation: ${response.status}`);
      }

      const data = await response.json();
      console.log("[ConversationHistory] Conversation data:", data);
      setMessages(data.messages || []);
      setStatistics(data.statistics || null);
    } catch (error) {
      console.error("[ConversationHistory] Error fetching conversation:", error);
      toast({
        title: "Error",
        description: "Failed to load conversation",
        variant: "destructive",
      });
    } finally {
      setLoadingMessages(false);
    }
  };

  const handleDeleteConversation = async () => {
    if (!sessionToDelete || !userEmail) return;

    const url = `${API_URL}/conversation-sessions/delete/${sessionToDelete}?email=${encodeURIComponent(userEmail)}`;
    console.log("[ConversationHistory] Deleting conversation:", url);
    
    try {
      const response = await fetch(url, {
        method: "DELETE",
        headers: getAuthHeaders(),
      });

      console.log("[ConversationHistory] Delete response status:", response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error("[ConversationHistory] Delete error response:", errorText);
        throw new Error(`Failed to delete conversation: ${response.status}`);
      }

      toast({
        title: "Success",
        description: "Conversation deleted successfully",
      });

      // Remove from local state
      setSessions((prev) => prev.filter((s) => s.session_id !== sessionToDelete));
      if (selectedSession === sessionToDelete) {
        setSelectedSession(null);
        setMessages([]);
        setStatistics(null);
      }
    } catch (error) {
      console.error("[ConversationHistory] Error deleting conversation:", error);
      toast({
        title: "Error",
        description: "Failed to delete conversation",
        variant: "destructive",
      });
    } finally {
      setDeleteDialogOpen(false);
      setSessionToDelete(null);
    }
  };

  const handleExportMarkdown = async () => {
    if (!selectedSession || !userEmail) return;

    const url = `${API_URL}/conversation-history/${selectedSession}/export-markdown?email=${encodeURIComponent(userEmail)}`;
    console.log("[ConversationHistory] Exporting markdown from:", url);
    
    try {
      const response = await fetch(url, {
        method: "GET",
        headers: getAuthHeaders(),
      });

      console.log("[ConversationHistory] Export response status:", response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error("[ConversationHistory] Export error response:", errorText);
        throw new Error(`Failed to export: ${response.status}`);
      }

      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = blobUrl;
      a.download = `conversation-${selectedSession}.md`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(blobUrl);

      toast({
        title: "Success",
        description: "Conversation exported successfully",
      });
    } catch (error) {
      console.error("[ConversationHistory] Error exporting conversation:", error);
      toast({
        title: "Error",
        description: "Failed to export conversation",
        variant: "destructive",
      });
    }
  };

  const formatTimestamp = (timestamp: string) => {
    try {
      return formatDistanceToNow(new Date(timestamp), { addSuffix: true });
    } catch {
      return timestamp;
    }
  };

  const filteredSessions = sessions.filter((session) =>
    session.last_user_message?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const truncateText = (text: string, maxLength: number = 100) => {
    if (!text) return "No messages";
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + "...";
  };

  const renderAsset = (asset: GeneratedAsset) => {
    if (asset.type === "image") {
      return (
        <img
          src={asset.url}
          alt="Generated"
          className="max-w-[200px] rounded-lg cursor-pointer hover:opacity-80 transition-opacity"
          onClick={() => setZoomedImage(asset.url)}
        />
      );
    }
    if (asset.type === "model") {
      return (
        <Button
          variant="outline"
          size="sm"
          onClick={() => onViewModel?.(asset.url, asset.url, "view")}
          className="gap-2"
        >
          <Box className="w-4 h-4" />
          View 3D Model
        </Button>
      );
    }
    if (asset.type === "video") {
      return (
        <video
          src={asset.url}
          controls
          className="max-w-[300px] rounded-lg"
        />
      );
    }
    return null;
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-6xl h-[85vh] p-0 gap-0">
          <DialogTitle className="sr-only">Conversation History</DialogTitle>
          <DialogDescription className="sr-only">
            View and manage your past conversations
          </DialogDescription>
          
          <div className="flex h-full">
            {/* Sidebar */}
            <div className="w-80 border-r flex flex-col bg-muted/30">
              <div className="p-4 border-b">
                <h2 className="text-lg font-semibold mb-3">Conversation History</h2>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search conversations..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>

              <ScrollArea className="flex-1">
                <div className="p-2 space-y-1">
                  {loadingSessions ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <div key={i} className="p-3 space-y-2">
                        <Skeleton className="h-4 w-3/4" />
                        <Skeleton className="h-3 w-1/2" />
                      </div>
                    ))
                  ) : filteredSessions.length === 0 ? (
                    <div className="p-4 text-center text-muted-foreground">
                      No conversations found
                    </div>
                  ) : (
                    filteredSessions.map((session) => (
                      <div
                        key={session.session_id}
                        className={cn(
                          "p-3 rounded-lg cursor-pointer transition-colors group",
                          selectedSession === session.session_id
                            ? "bg-primary/10 border border-primary/20"
                            : "hover:bg-muted"
                        )}
                        onClick={() => setSelectedSession(session.session_id)}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-sm font-medium line-clamp-2 flex-1">
                            {truncateText(session.last_user_message, 80)}
                          </p>
                          <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
                        </div>
                        <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                          <Clock className="w-3 h-3" />
                          <span>{formatTimestamp(session.last_updated)}</span>
                        </div>
                        <div className="flex items-center gap-2 mt-2">
                          <Badge variant="secondary" className="text-xs">
                            <MessageSquare className="w-3 h-3 mr-1" />
                            {session.total_messages}
                          </Badge>
                          {session.statistics?.generated_assets > 0 && (
                            <Badge variant="secondary" className="text-xs">
                              <ImageIcon className="w-3 h-3 mr-1" />
                              {session.statistics.generated_assets}
                            </Badge>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex flex-col">
              {selectedSession ? (
                <>
                  {/* Conversation Header */}
                  <div className="p-4 border-b flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      {statistics && (
                        <div className="flex items-center gap-3 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <User className="w-4 h-4" />
                            {statistics.user_messages}
                          </span>
                          <span className="flex items-center gap-1">
                            <Sparkles className="w-4 h-4" />
                            {statistics.assistant_messages}
                          </span>
                          <span className="flex items-center gap-1">
                            <Wrench className="w-4 h-4" />
                            {statistics.tool_executions}
                          </span>
                          <span className="flex items-center gap-1">
                            <ImageIcon className="w-4 h-4" />
                            {statistics.generated_assets}
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleExportMarkdown}
                        className="gap-2"
                      >
                        <Download className="w-4 h-4" />
                        Export
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSessionToDelete(selectedSession);
                          setDeleteDialogOpen(true);
                        }}
                        className="gap-2 text-destructive hover:text-destructive"
                      >
                        <Trash2 className="w-4 h-4" />
                        Delete
                      </Button>
                    </div>
                  </div>

                  {/* Messages */}
                  <ScrollArea className="flex-1 p-4">
                    {loadingMessages ? (
                      <div className="space-y-4">
                        {Array.from({ length: 4 }).map((_, i) => (
                          <div
                            key={i}
                            className={cn(
                              "flex",
                              i % 2 === 0 ? "justify-end" : "justify-start"
                            )}
                          >
                            <div className="max-w-[70%] space-y-2">
                              <Skeleton className="h-4 w-20" />
                              <Skeleton className="h-16 w-64" />
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : messages.length === 0 ? (
                      <div className="flex items-center justify-center h-full text-muted-foreground">
                        No messages in this conversation
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {messages.map((message) => (
                          <div
                            key={message.id}
                            className={cn(
                              "flex",
                              message.role === "user" ? "justify-end" : "justify-start"
                            )}
                          >
                            <div
                              className={cn(
                                "max-w-[70%] p-4 rounded-2xl",
                                message.role === "user"
                                  ? "bg-chat-user-bubble text-chat-user-foreground"
                                  : message.role === "tool"
                                  ? "bg-success/10 border border-success/20"
                                  : "bg-chat-assistant-bubble text-chat-assistant-foreground"
                              )}
                            >
                              {message.role === "tool" && (
                                <Badge variant="outline" className="mb-2 text-success border-success/30">
                                  <Wrench className="w-3 h-3 mr-1" />
                                  {message.display_name}
                                </Badge>
                              )}
                              <p className="whitespace-pre-wrap text-sm">{message.content}</p>
                              {message.generated_assets && message.generated_assets.length > 0 && (
                                <div className="mt-3 space-y-2">
                                  {message.generated_assets.map((asset, idx) => (
                                    <div key={idx}>{renderAsset(asset)}</div>
                                  ))}
                                </div>
                              )}
                              <p className="text-xs opacity-60 mt-2">
                                {formatTimestamp(message.timestamp)}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </ScrollArea>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center text-muted-foreground">
                  <div className="text-center space-y-2">
                    <MessageSquare className="w-12 h-12 mx-auto opacity-50" />
                    <p>Select a conversation to view</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          <Button
            variant="ghost"
            size="icon"
            className="absolute top-4 right-4"
            onClick={() => onOpenChange(false)}
          >
            <X className="w-4 h-4" />
          </Button>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Conversation</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this conversation? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConversation}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Image Zoom Dialog */}
      <Dialog open={!!zoomedImage} onOpenChange={() => setZoomedImage(null)}>
        <DialogContent className="max-w-4xl p-2">
          <DialogTitle className="sr-only">Image Preview</DialogTitle>
          <DialogDescription className="sr-only">Full size image preview</DialogDescription>
          {zoomedImage && (
            <img
              src={zoomedImage}
              alt="Zoomed"
              className="w-full h-auto rounded-lg"
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
