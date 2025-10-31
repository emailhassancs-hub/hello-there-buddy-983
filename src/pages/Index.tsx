import { useState, useEffect } from "react";
import ChatInterface from "@/components/ChatInterface";
import EpisodeViewer from "@/components/EpisodeViewer";
import ImageViewer from "@/components/ImageViewer";
import ModelViewer from "@/components/ModelViewer";
import ModelOptimization from "@/components/ModelOptimization";
import { ThemeToggle } from "@/components/ThemeToggle";
import { ChatSidebar } from "@/components/ChatSidebar";
import { ModelUploader } from "@/components/ModelUploader";
import { apiFetch } from "@/lib/api";

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
  formType?: "model-selection" | "optimization-config" | "optimization-result" | "optimization-inline";
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

  const apiUrl = "http://localhost:8000";
  const API = apiUrl;
 
  // Token capture from URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");
    if (token) {
      console.log("🔑 Token captured:", token);
      setAuthToken(token);
      // Store globally for child components
      (window as any).authToken = token;
      
      fetch(`${apiUrl}/store-token`, {
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
        const newMessages = data.messages
          .filter((msg: any) => {
            // Filter out tool result messages from optimize_single_3d_model_tool
            if (msg.type === "tool" && msg.name === "optimize_single_3d_model_tool") {
              return false;
            }
            return true;
          })
          .map((msg: any) => ({
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
      // Fetch presets before showing optimization config form
      try {
        const response = await fetch(`https://games-ai-studio-be-nest-347148155332.us-central1.run.app/api/model-optimization/presets`, {
          headers: {
            "Authorization": authToken ? `Bearer ${authToken}` : "",
            "Content-Type": "application/json"
          }
        });
        
        if (!response.ok) throw new Error("Failed to fetch presets");
        
        const presetsData = await response.json();
        
        handleAddDirectMessage("assistant", "Model selected! Now configure your optimization settings:", "optimization-config", {
          modelId: data.modelId,
          presets: presetsData
        });
      } catch (error) {
        console.error("Error fetching presets:", error);
        toast({
          title: "Error",
          description: "Failed to load optimization presets",
          variant: "destructive"
        });
      }
    } else if (type === "start-optimization") {
      // User submitted the optimization config form
      const { type: optType, strength, modelId, presets } = data;
      
      // Find the preset text for the selected strength
      const presetText = presets?.presets?.[optType]?.find((p: any) => p.id === strength)?.text || strength;
      
      // Build the payload
      const payload = {
        optimization_type: optType,
        presetId: strength,
        reduction_strength: presetText,
        modelId: modelId
      };
      
      // Display friendly message to user
      handleAddDirectMessage("user", "Processing the optimization flow....");
      
      // Send instruction to agent via normal chat flow (not displayed)
      const agentInstruction = `Invoke the tool 'optimize_single_model_tool' using the following parameters: ${JSON.stringify(payload)}`;
      
      // Show optimizing status
      handleAddDirectMessage("assistant", "🔧 Optimizing your model...");
      
      // Send to /ask endpoint through normal message handler
      await handleSendMessage(agentInstruction);
    } else if (type === "optimization-started") {
      handleAddDirectMessage("assistant", "⏳ Optimization in progress, please wait…");
    } else if (type === "optimization-complete") {
      handleAddDirectMessage("assistant", "✅ Model optimization completed successfully!", "optimization-result", {
        result: data.result
      });
    } else if (type === "optimization-error") {
      handleAddDirectMessage("assistant", `❌ Optimization failed: ${data.error}. Please try again.`);
    } else if (type === "reset") {
      // Reset workflow - user can start over
      handleAddDirectMessage("assistant", "Ready to optimize another model! Click the Model Optimization tab to begin.");
    } else if (type === "model-optimization-clicked") {
      // When Model Optimization button is clicked
      // Send system prompt silently to /ask endpoint
      const systemPrompt = `You are a 3D model optimization assistant. When a user requests model optimization, explain the following:

Available optimization categories:
- **Simple**: General purpose optimization for most 3D models
- **Batch**: Optimize multiple models at once with consistent settings
- **Hard Surface**: Specialized for mechanical, architectural, or man-made objects
- **Foliage**: Optimized for plants, trees, and organic vegetation
- **Animated**: Preserve animation data while reducing polygon count

Optimization strength levels:
- **10-30%**: Light optimization, preserves most detail
- **35-60%**: Moderate optimization, balanced quality/performance
- **70-95%**: Aggressive optimization, maximum performance

The process:
1. Select a model from your library or upload a new one
2. Choose the optimization type that matches your model
3. Select the reduction strength based on your needs
4. Download optimized files in GLB, USDZ, or FBX formats`;

      // Show simple user message first
      handleAddDirectMessage("user", "Model optimization invoked.");
      
      // Send system prompt to backend and get response
      try {
        const payload: any = {
          query: systemPrompt,
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

        // Show agent's response
        if (data.messages && Array.isArray(data.messages)) {
          const assistantMessages = data.messages.filter((msg: any) => msg.type === "ai");
          if (assistantMessages.length > 0) {
            const lastAssistantMsg = assistantMessages[assistantMessages.length - 1];
            handleAddDirectMessage("assistant", lastAssistantMsg.content || "", "optimization-inline");
          }
        } else if (data.response) {
          handleAddDirectMessage("assistant", data.response, "optimization-inline");
        } else {
          // Fallback if no response from backend
          handleAddDirectMessage("assistant", "Ready to optimize your 3D models! Please select your options below.", "optimization-inline");
        }
      } catch (error) {
        console.error("Error fetching optimization guide:", error);
        handleAddDirectMessage("assistant", "Ready to optimize your 3D models! Please select your options below.", "optimization-inline");
      }
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
      
      {/* Hidden file input for model uploads */}
      <input
        id="model-file-input"
        type="file"
        accept=".glb,.fbx,.obj,.gltf"
        className="hidden"
        onChange={async (e) => {
          const file = e.target.files?.[0];
          if (file) {
            // Handle model upload here if needed
            console.log("Model file selected:", file.name);
            toast({
              title: "Upload not implemented",
              description: "Model upload from optimization form is not yet implemented",
            });
          }
          e.target.value = '';
        }}
      />
      
      {/* Chat Sidebar */}
      <ChatSidebar
        currentSessionId={sessionId}
        onSelectSession={handleLoadSession}
        onNewChat={handleNewChat}
        apiUrl={apiUrl}
      />
      
      <ResizablePanelGroup direction="horizontal" className="h-full flex-1">
        {/* Chat Interface - Resizable Left Panel */}
        <ResizablePanel defaultSize={50} minSize={30} maxSize={70}>
          <ChatInterface
            messages={messages}
            onSendMessage={handleSendMessage}
            onToolConfirmation={handleToolConfirmation}
            isGenerating={isGenerating}
            apiUrl={apiUrl}
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
                <ImageViewer apiUrl={apiUrl} refreshTrigger={imageRefreshTrigger} />
              </TabsContent>
              
              <TabsContent value="models" className="flex-1 m-0 overflow-hidden">
                <div className="h-full flex flex-col">
                  <div className="p-4 border-b flex justify-between items-center">
                    <h3 className="text-lg font-semibold">3D Models</h3>
                    <ModelUploader 
                      apiUrl={apiUrl} 
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
                    <ModelViewer apiUrl={apiUrl} selectedModel={selectedModel} />
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
