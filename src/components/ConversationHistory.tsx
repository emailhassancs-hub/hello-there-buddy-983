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
  Clock,
  ChevronRight,
  RefreshCw,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import {
  fetchConversationSessions,
  fetchConversationMessages,
  deleteConversationSession,
  exportConversationMarkdown,
  type Session,
  type Message,
  type SessionStatistics,
  type GeneratedAsset,
} from "@/lib/chatHistoryApi";

interface ConversationHistoryProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  apiUrl: string;
  userEmail?: string;
  accessToken?: string;
  onViewModel?: (modelUrl: string, thumbnailUrl: string, workflow: string) => void;
}

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
      console.log("[ConversationHistory] Dialog opened, fetching sessions for:", userEmail);
      loadSessions();
    }
  }, [open, userEmail]);

  // Fetch conversation when session selected
  useEffect(() => {
    if (selectedSession && userEmail) {
      console.log("[ConversationHistory] Session selected:", selectedSession);
      loadConversation(selectedSession);
    }
  }, [selectedSession, userEmail]);

  const loadSessions = async () => {
    if (!userEmail) {
      console.warn("[ConversationHistory] No userEmail, skipping session fetch");
      return;
    }

    setLoadingSessions(true);
    try {
      const data = await fetchConversationSessions(userEmail, accessToken);
      setSessions(data.sessions || []);
    } catch (error) {
      console.error("[ConversationHistory] Error loading sessions:", error);
      toast({
        title: "Error",
        description: "Failed to load conversation history",
        variant: "destructive",
      });
    } finally {
      setLoadingSessions(false);
    }
  };

  const loadConversation = async (sessionId: string) => {
    if (!userEmail) {
      console.warn("[ConversationHistory] No userEmail, skipping conversation fetch");
      return;
    }

    setLoadingMessages(true);
    try {
      const data = await fetchConversationMessages(sessionId, userEmail, accessToken);
      setMessages(data.messages || []);
      setStatistics(data.statistics || null);
    } catch (error) {
      console.error("[ConversationHistory] Error loading conversation:", error);
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

    try {
      await deleteConversationSession(sessionToDelete, userEmail, accessToken);

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

    try {
      const blob = await exportConversationMarkdown(selectedSession, userEmail, accessToken);
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
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-lg font-semibold">Conversation History</h2>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={loadSessions}
                    disabled={loadingSessions}
                    className="h-8 w-8"
                  >
                    <RefreshCw className={cn("w-4 h-4", loadingSessions && "animate-spin")} />
                  </Button>
                </div>
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
                      {sessions.length === 0 
                        ? "No conversations found. Start chatting to see your history here."
                        : "No conversations match your search"}
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
                          <span>{formatTimestamp(session.last_updated || session.updated_at || session.created_at)}</span>
                        </div>
                        <div className="flex items-center gap-2 mt-2">
                          <Badge variant="secondary" className="text-xs">
                            <MessageSquare className="w-3 h-3 mr-1" />
                            {session.total_messages || session.message_count || 0}
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
                                  ? "bg-primary text-primary-foreground"
                                  : message.role === "tool"
                                  ? "bg-success/10 border border-success/20"
                                  : "bg-muted"
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
