import { useState, useEffect } from "react";
import ChatInterface from "@/components/ChatInterface";
import EpisodeViewer from "@/components/EpisodeViewer";
import ImageViewer from "@/components/ImageViewer";
import ModelViewer from "@/components/ModelViewer";
import ModelOptimization from "@/components/ModelOptimization";
import { ThemeToggle } from "@/components/ThemeToggle";
import { ChatSidebar } from "@/components/ChatSidebar";
import { ModelUploader } from "@/components/ModelUploader";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";
import { useToast } from "@/hooks/use-toast";
import { Image as ImageIcon, BookOpen, Box, Settings } from "lucide-react";

interface ToolCall {
  id: string;
  name: string;
  args: Record<string, any>;
}

interface Message {
  role: "user" | "assistant" | "system";
  text: string;
  timestamp?: Date;
  toolCalls?: ToolCall[];
  conversationId?: string;
  toolName?: string;
  status?: "awaiting_confirmation" | "complete";
  interruptMessage?: string;
  formType?: "model-selection" | "optimization-config" | "optimization-result";
  formData?: any;
}

interface StoryState {
  current_episode: string;
  episode_count: number;
}

interface Episode {
  episode_number: number;
  summary: string;
  characters?: string[];
  locations?: string[];
  highlights?: string[];
  episode_text: string;
}

const Index = () => {
  const [storyState, setStoryState] = useState<StoryState | null>(null);
  const [episodes, setEpisodes] = useState<string[]>([]);
  const [stories, setStories] = useState<string[]>([]);
  const [selectedEpisode, setSelectedEpisode] = useState<Episode | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("images");
  const [selectedModel, setSelectedModel] = useState<{ modelUrl: string; thumbnailUrl: string; workflow: string } | null>(null);
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [imageRefreshTrigger, setImageRefreshTrigger] = useState(0);
  const { toast } = useToast();

  const API = "http://localhost:8000";

  // Token capture from URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");
    if (token) {
      console.log("🔑 Token captured:", token);
      setAuthToken(token);
      // Store globally for child components
      (window as any).authToken = token;
      
      fetch("http://localhost:8000/store-token", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ token }),
      })
        .then(res => res.json())
        .then(data => console.log("✅ Token sent successfully:", data))
        .catch(err => console.error("❌ Error sending token:", err));
    } else {
      console.warn("⚠️ No token found in URL");
    }
  }, []);

  // Session management
  useEffect(() => {
    const storedSessionId = localStorage.getItem("mcp_session_id");
    if (storedSessionId) {
      setSessionId(storedSessionId);
    }
  }, []);

  const updateSessionId = (newSessionId: string) => {
    setSessionId(newSessionId);
    localStorage.setItem("mcp_session_id", newSessionId);
  };

  // Load available episodes and stories on component mount
  useEffect(() => {
    const loadAvailableContent = async () => {
      if (!authToken) return;
      
      try {
        const headers: HeadersInit = {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${authToken}`
        };

        // Load episodes
        const episodesRes = await fetch(`${API}/episodes`, { headers });
        if (episodesRes.ok) {
          const episodesData = await episodesRes.json();
          setEpisodes(episodesData.episodes || []);
        }

        // Load stories
        const storiesRes = await fetch(`${API}/stories`, { headers });
        if (storiesRes.ok) {
          const storiesData = await storiesRes.json();
          setStories(storiesData.stories || []);
        }
      } catch (error) {
        console.log("Could not load available content");
      }
    };

    loadAvailableContent();
  }, [authToken]);

  const addMessage = (role: "user" | "assistant", text: string, toolName?: string) => {
    setMessages((prev) => [...prev, { role, text, timestamp: new Date(), toolName }]);
  };

  const handleAddDirectMessage = (role: "user" | "assistant", text: string, formType?: string, formData?: any) => {
    setMessages((prev) => [...prev, { role, text, timestamp: new Date(), formType: formType as any, formData }]);
  };

  const handleSendMessage = async (text: string) => {
    if (!text.trim()) return;

    const userMessage: Message = {
      role: "user",
      text: text,
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsGenerating(true);

    try {
      const payload: any = {
        query: text,
      };
      
      if (sessionId) {
        payload.session_id = sessionId;
      }

      const headers: HeadersInit = {
        "Content-Type": "application/json",
      };
      
      if (authToken) {
        headers["Authorization"] = `Bearer ${authToken}`;
      }

      const response = await fetch(`${API}/ask`, {
        method: "POST",
        headers,
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      // Update session ID if provided
      if (data.session_id) {
        updateSessionId(data.session_id);
      }

      // Append any messages from the backend
      if (data.messages && Array.isArray(data.messages)) {
        const newMessages = data.messages.map((msg: any) => ({
          role: msg.type === "ai" ? "assistant" : msg.type === "tool" ? "assistant" : "user",
          text: msg.content || "",
          toolName: msg.type === "tool" ? msg.name : undefined,
        }));
        setMessages((prev) => [...prev, ...newMessages]);
      }

      if (data.status === "awaiting_confirmation") {
        const assistantMessage: Message = {
          role: "assistant",
          text: data.interrupt_message || "Tool execution requires confirmation.",
          status: "awaiting_confirmation",
          interruptMessage: data.interrupt_message,
          toolCalls: data.tool_calls,
          conversationId: data.session_id,
        };
        setMessages((prev) => [...prev, assistantMessage]);
      } else if (data.status === "complete") {
        // Already handled by messages array above
        if (!data.messages || data.messages.length === 0) {
          const assistantMessage: Message = {
            role: "assistant",
            text: data.response || "Request completed.",
          };
          setMessages((prev) => [...prev, assistantMessage]);
        }
      } else if (data.status === "cancelled") {
        const assistantMessage: Message = {
          role: "assistant",
          text: "Operation cancelled.",
        };
        setMessages((prev) => [...prev, assistantMessage]);
      }
    } catch (error) {
      console.error("Error sending message:", error);
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleToolConfirmation = async (
    action: "confirm" | "modify" | "cancel",
    modifiedArgs?: Record<string, Record<string, any>>
  ) => {
    setIsGenerating(true);

    try {
      const payload: any = {
        session_id: sessionId,
        confirmation_response: {
          action,
        },
      };

      if (action === "modify" && modifiedArgs) {
        payload.confirmation_response.modified_args = modifiedArgs;
      }

      const headers: HeadersInit = {
        "Content-Type": "application/json",
      };
      
      if (authToken) {
        headers["Authorization"] = `Bearer ${authToken}`;
      }

      const response = await fetch(`${API}/ask`, {
        method: "POST",
        headers,
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      // Update session ID if provided
      if (data.session_id) {
        updateSessionId(data.session_id);
      }

      // Append any messages from the backend
      if (data.messages && Array.isArray(data.messages)) {
        const newMessages = data.messages.map((msg: any) => ({
          role: msg.type === "ai" ? "assistant" : msg.type === "tool" ? "assistant" : "user",
          text: msg.content || "",
          toolName: msg.type === "tool" ? msg.name : undefined,
        }));
        setMessages((prev) => [...prev, ...newMessages]);
      }

      if (data.status === "awaiting_confirmation") {
        // Nested interrupt - show confirmation UI again
        const assistantMessage: Message = {
          role: "assistant",
          text: data.interrupt_message || "Another tool requires confirmation.",
          status: "awaiting_confirmation",
          interruptMessage: data.interrupt_message,
          toolCalls: data.tool_calls,
          conversationId: data.session_id,
        };
        setMessages((prev) => [...prev, assistantMessage]);
      } else if (data.status === "complete") {
        // Already handled by messages array above
        if (!data.messages || data.messages.length === 0) {
          const assistantMessage: Message = {
            role: "assistant",
            text: "Tools executed successfully.",
          };
          setMessages((prev) => [...prev, assistantMessage]);
        }
      } else if (data.status === "cancelled") {
        const assistantMessage: Message = {
          role: "assistant",
          text: "Operation cancelled.",
        };
        setMessages((prev) => [...prev, assistantMessage]);
      }
    } catch (error) {
      console.error("Error confirming tool:", error);
      toast({
        title: "Error",
        description: "Failed to confirm tool execution. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleExtendStory = async (abstract?: string) => {
    const message = abstract ? `Generate the next episode with this direction: ${abstract}` : "Generate the next episode of the story";
    await handleSendMessage(message);
  };

  const handleLoadEpisode = async (filename: string) => {
    try {
      const headers: HeadersInit = {
        "Content-Type": "application/json",
      };
      
      if (authToken) {
        headers["Authorization"] = `Bearer ${authToken}`;
      }

      const res = await fetch(`${API}/episodes/${filename}`, { headers });
      
      if (!res.ok) {
        throw new Error("Failed to load episode");
      }

      const data = await res.json();
      
      // Convert the text content to episode format for display
      const episode: Episode = {
        episode_number: 1, // Default value, could be parsed from filename
        summary: "Episode content loaded from file",
        characters: [],
        locations: [],
        highlights: [],
        episode_text: data.content
      };
      
      setSelectedEpisode(episode);
      
      toast({
        title: "Episode Loaded",
        description: `Episode content from ${filename} is now displayed.`,
      });
    } catch (error) {
      toast({
        title: "Load Failed",
        description: "Unable to load the selected episode.",
        variant: "destructive",
      });
    }
  };

  const handleLoadStory = async (filename: string) => {
    try {
      const headers: HeadersInit = {
        "Content-Type": "application/json",
      };
      
      if (authToken) {
        headers["Authorization"] = `Bearer ${authToken}`;
      }

      const res = await fetch(`${API}/stories/${filename}`, { headers });
      
      if (!res.ok) {
        throw new Error("Failed to load story");
      }

      const data = await res.json();
      
      // Convert the text content to episode format for display
      const episode: Episode = {
        episode_number: 1, // Default value, could be parsed from filename
        summary: "Story content loaded from file",
        characters: [],
        locations: [],
        highlights: [],
        episode_text: data.content
      };
      
      setSelectedEpisode(episode);
      
      toast({
        title: "Story Loaded",
        description: `Story content from ${filename} is now displayed.`,
      });
    } catch (error) {
      toast({
        title: "Load Failed",
        description: "Unable to load the selected story.",
        variant: "destructive",
      });
    }
  };

  const handleImageGenerated = () => {
    setImageRefreshTrigger(prev => prev + 1);
  };

  const handleOptimizationFormSubmit = async (type: string, data: any) => {
    console.log("Optimization form submit:", type, data);
    
    if (type === "model-selected") {
      // User confirmed model selection, now fetch presets and show optimization config form
      try {
        // Fetch optimization presets from the backend
        const BASE_URL = "https://games-ai-studio-be-nest-347148155332.us-central1.run.app";
        const response = await fetch(`${BASE_URL}/api/model-optimization/presets`, {
          headers: {
            "Authorization": `Bearer ${authToken}`,
            "Content-Type": "application/json"
          }
        });
        
        if (!response.ok) {
          throw new Error("Failed to fetch presets");
        }
        
        const presets = await response.json();
        
        // Show optimization configuration form in chat
        handleAddDirectMessage("assistant", "Great! Now configure your optimization settings:", "optimization-config", {
          presets,
          modelId: data.modelId
        });
      } catch (error) {
        console.error("Failed to fetch presets:", error);
        handleAddDirectMessage("assistant", "Failed to load optimization settings. Please try again.");
      }
    } else if (type === "upload-new") {
      // Trigger model upload via file input
      document.getElementById('model-file-input')?.click();
    } else if (type === "start-optimization") {
      // User submitted optimization configuration, start the optimization process
      handleAddDirectMessage("assistant", "⏳ Optimizing your model... please wait");
      
      try {
        const BASE_URL = "https://games-ai-studio-be-nest-347148155332.us-central1.run.app";
        
        // Call optimize single model endpoint
        const response = await fetch(`${BASE_URL}/api/model-optimization/optimize/single`, {
          method: 'POST',
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${authToken}`
          },
          body: JSON.stringify({
            model_id: data.modelId.toString(),
            config: {
              preset_id: data.strength,
              exportName: `optimized_${Date.now()}`
            }
          })
        });
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || "Optimization failed");
        }
        
        const optimizationResult = await response.json();
        console.log("Optimization started:", optimizationResult);
        
        // Wait for optimization to process (adjust time based on typical processing time)
        await new Promise(resolve => setTimeout(resolve, 5000));
        
        // Fetch the optimized model result
        const resultResponse = await fetch(`${BASE_URL}/api/model-optimization/models/${data.modelId}/associated`, {
          headers: {
            "Authorization": `Bearer ${authToken}`,
            "Content-Type": "application/json"
          }
        });
        
        if (!resultResponse.ok) {
          throw new Error("Failed to fetch optimization result");
        }
        
        const resultData = await resultResponse.json();
        
        // Get the latest optimized model (first in the array)
        if (resultData.models && resultData.models.length > 0) {
          const latestResult = resultData.models[0];
          
          handleAddDirectMessage("assistant", "✅ Model optimization complete! Your optimized model is ready.", "optimization-result", {
            result: latestResult
          });
        } else {
          throw new Error("No optimization results found");
        }
      } catch (error) {
        console.error("Optimization failed:", error);
        handleAddDirectMessage("assistant", `❌ Optimization failed: ${error instanceof Error ? error.message : "Unknown error"}. Please try again.`);
      }
    } else if (type === "reset") {
      // Reset workflow - user can start over
      handleAddDirectMessage("assistant", "Ready to optimize another model! Click the Model Optimization tab to begin.");
    }
  };

  const handleModelSelect = (modelUrl: string, thumbnailUrl: string, workflow: string) => {
    setSelectedModel({ modelUrl, thumbnailUrl, workflow });
    setActiveTab("models");
  };

  const handleLoadSession = async (sessionId: string) => {
    try {
      const headers: HeadersInit = {
        "Content-Type": "application/json",
      };
      
      if (authToken) {
        headers["Authorization"] = `Bearer ${authToken}`;
      }

      const response = await fetch(`${API}/session/${sessionId}/export`, { headers });
      if (!response.ok) {
        throw new Error("Failed to load session");
      }
      
      const data = await response.json();
      
      // Update session ID
      setSessionId(sessionId);
      localStorage.setItem("mcp_session_id", sessionId);
      
      // Convert messages to the format expected by ChatInterface
      const loadedMessages: Message[] = data.messages.map((msg: any) => ({
        role: msg.type === "human" ? "user" : msg.type === "ai" ? "assistant" : "assistant",
        text: msg.content || "",
        timestamp: new Date(),
        toolName: msg.type === "tool" ? msg.name : undefined,
      }));
      
      setMessages(loadedMessages);
      
      toast({
        title: "Chat Loaded",
        description: "Previous conversation has been restored.",
      });
    } catch (error) {
      console.error("Error loading session:", error);
      toast({
        title: "Error",
        description: "Failed to load chat session",
        variant: "destructive",
      });
    }
  };

  const handleNewChat = () => {
    setSessionId(null);
    localStorage.removeItem("mcp_session_id");
    setMessages([]);
    toast({
      title: "New Chat Started",
      description: "You can now start a fresh conversation.",
    });
  };

  return (
    <div className="flex h-screen bg-background overflow-hidden max-h-screen">
      <div className="absolute top-4 right-4 z-50">
        <ThemeToggle />
      </div>
      
      {/* Chat Sidebar */}
      <ChatSidebar
        currentSessionId={sessionId}
        onSelectSession={handleLoadSession}
        onNewChat={handleNewChat}
        apiUrl={API}
      />
      
      <ResizablePanelGroup direction="horizontal" className="h-full flex-1">
        {/* Chat Interface - Resizable Left Panel */}
        <ResizablePanel defaultSize={50} minSize={30} maxSize={70}>
          <ChatInterface
            messages={messages}
            onSendMessage={handleSendMessage}
            onToolConfirmation={handleToolConfirmation}
            isGenerating={isGenerating}
            apiUrl={API}
            onModelSelect={handleModelSelect}
            onImageGenerated={() => setImageRefreshTrigger(prev => prev + 1)}
            onOptimizationFormSubmit={handleOptimizationFormSubmit}
          />
        </ResizablePanel>

        {/* Draggable Resize Handle */}
        <ResizableHandle withHandle className="w-px bg-border/50 hover:bg-primary/20 transition-colors" />

        {/* Right Panel - Tabs for Image Viewer, 3D Model Viewer, and Episode Viewer */}
        <ResizablePanel defaultSize={50} minSize={30} maxSize={70}>
          <div className="flex flex-col h-full overflow-hidden">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0">
              <TabsList className="w-full justify-start rounded-none border-b bg-background h-14 px-6">
                <TabsTrigger value="images" className="gap-2">
                  <ImageIcon className="w-4 h-4 dark:text-white" />
                  Image Viewer
                </TabsTrigger>
                <TabsTrigger value="models" className="gap-2">
                  <Box className="w-4 h-4" />
                  3D Model Viewer
                </TabsTrigger>
                <TabsTrigger value="optimization" className="gap-2">
                  <Settings className="w-4 h-4" />
                  Model Optimization
                </TabsTrigger>
                <TabsTrigger value="episodes" className="gap-2">
                  <BookOpen className="w-4 h-4" />
                  Episode Viewer
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="images" className="flex-1 m-0 overflow-hidden">
                <ImageViewer apiUrl={API} refreshTrigger={imageRefreshTrigger} />
              </TabsContent>
              
              <TabsContent value="models" className="flex-1 m-0 overflow-hidden">
                <div className="h-full flex flex-col">
                  <div className="p-4 border-b flex justify-between items-center">
                    <h3 className="text-lg font-semibold">3D Models</h3>
                    <ModelUploader 
                      apiUrl={API} 
                      authToken={authToken || ''} 
                      onUploadComplete={(assetId) => {
                        console.log("Upload complete, asset ID:", assetId);
                        toast({
                          title: "Success",
                          description: "Model uploaded and registered successfully!",
                        });
                      }}
                    />
                  </div>
                  <div className="flex-1 overflow-hidden">
                    <ModelViewer apiUrl={API} selectedModel={selectedModel} />
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="optimization" className="flex-1 m-0 overflow-auto hide-scrollbar">
                <ModelOptimization 
                  isActive={activeTab === "optimization"}
                  onSendMessage={handleSendMessage}
                  onAddDirectMessage={handleAddDirectMessage}
                />
              </TabsContent>
              
              <TabsContent value="episodes" className="flex-1 m-0 overflow-hidden">
                <EpisodeViewer
                  storyState={storyState}
                  episodes={episodes}
                  stories={stories}
                  selectedEpisode={selectedEpisode}
                  onExtendStory={handleExtendStory}
                  onLoadEpisode={handleLoadEpisode}
                  onLoadStory={handleLoadStory}
                  isGenerating={isGenerating}
                />
              </TabsContent>
            </Tabs>
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
};

export default Index;
