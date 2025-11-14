import { useState, useEffect, useMemo, useCallback } from "react";
import ChatInterface from "@/components/ChatInterface";
import ImageViewer from "@/components/ImageViewer";
import ModelViewer from "@/components/ModelViewer";
import ModelOptimization from "@/components/ModelOptimization";
import { ThemeToggle } from "@/components/ThemeToggle";
import { ChatSidebar } from "@/components/ChatSidebar";
import { ModelUploader } from "@/components/ModelUploader";
import ModelGallery from "@/pages/ModelGallery";
import { apiFetch } from "@/lib/api";
import { useUserProfile } from "@/hooks/use-user-profile";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";
import { useToast } from "@/hooks/use-toast";
import { Image as ImageIcon, BookOpen, Box, Settings, Video, ChevronLeft, ChevronRight, Sparkles } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

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

const Index = () => {
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("images");
  const [selectedModel, setSelectedModel] = useState<{ modelUrl: string; thumbnailUrl: string; workflow: string } | null>(null);
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [imageRefreshTrigger, setImageRefreshTrigger] = useState(0);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: userProfile } = useUserProfile();

  // const apiUrl = "http://localhost:8000";
  const apiUrl = "http://35.209.183.202:8000";
  const API = apiUrl;
 
  // Token capture from URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");
    if (token) {
      console.log("🔑 Token captured from URL:", token);
      setAuthToken(token);
      // Store globally for child components and API calls
      (window as any).authToken = token;
      localStorage.setItem("auth_token", token);
      
      fetch(`${apiUrl}/store-token`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ token }),
      })
        .then(res => res.json())
        .then(data => console.log("✅ Token stored successfully on backend:", data))
        .catch(err => console.error("❌ Error storing token on backend:", err));
    } else {
      // Try to load from localStorage or window as fallback
      const storedToken = localStorage.getItem("auth_token") || (window as any).authToken;
      if (storedToken) {
        console.log("🔑 Token loaded from storage:", storedToken);
        setAuthToken(storedToken);
        (window as any).authToken = storedToken;
      } else {
        console.warn("⚠️ No token found in URL or storage");
      }
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


  const addMessage = (role: "user" | "assistant", text: string, toolName?: string) => {
    setMessages((prev) => [...prev, { role, text, timestamp: new Date(), toolName }]);
  };

  const handleAddDirectMessage = (role: "user" | "assistant", text: string, formType?: string, formData?: any) => {
    setMessages((prev) => [...prev, { role, text, timestamp: new Date(), formType: formType as any, formData }]);
  };

  // Helper to detect raw tool invocation messages and tool responses - memoized to prevent infinite loops
  const isToolInvocation = useCallback((content: string): boolean => {
    if (!content) return false;
    const lowerContent = content.toLowerCase();
    return (
      lowerContent.includes("invoke the tool") ||
      lowerContent.includes("using the following parameters") ||
      lowerContent.includes("access_token") ||
      lowerContent.includes("optimize_single_model_tool") ||
      lowerContent.includes("optimize_multiple_models_tool") ||
      lowerContent.includes("tool result:") ||
      lowerContent.includes("optimize_id") ||
      lowerContent.includes("asset_id") ||
      lowerContent.includes("preset_id") ||
      lowerContent.includes("modelid") ||
      lowerContent.includes("presetid") ||
      (lowerContent.includes("{") && lowerContent.includes("model_id")) ||
      (lowerContent.includes("{") && lowerContent.includes("optimize_id")) ||
      (lowerContent.includes("{") && lowerContent.includes("optimized_model")) ||
      (lowerContent.includes("'optimize_") && lowerContent.includes("'"))
    );
  }, []);

  const handleSendMessage = async (text: string) => {
    if (!text.trim()) return;

    const userMessage: Message = {
      role: "user",
      text: text,
    };

    // Do not show raw tool invocation messages in chat
    if (!isToolInvocation(text)) {
      setMessages((prev) => [...prev, userMessage]);
    }
    setIsGenerating(true);

    try {
      const payload: any = {
        query: text,
      };
      
      if (sessionId) {
        payload.session_id = sessionId;
      }

      if (userProfile?.email) {
        payload.email = userProfile.email;
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
          .map((msg: any) => ({
            role: msg.type === "ai" ? "assistant" : msg.type === "tool" ? "assistant" : "user",
            text: msg.content || "",
            toolName: msg.type === "tool" ? msg.name : undefined,
          }))
          .filter((m: any) => typeof m.text === "string" && !isToolInvocation(m.text));
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
        // Invalidate user profile query to refresh credits after operation completes
        queryClient.invalidateQueries({ queryKey: ['user-profile'] });
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

      if (userProfile?.email) {
        payload.email = userProfile.email;
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
          .map((msg: any) => ({
            role: msg.type === "ai" ? "assistant" : msg.type === "tool" ? "assistant" : "user",
            text: msg.content || "",
            toolName: msg.type === "tool" ? msg.name : undefined,
          }))
          .filter((m: any) => typeof m.text === "string" && !isToolInvocation(m.text));
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
        // Invalidate user profile query to refresh credits after tool execution
        queryClient.invalidateQueries({ queryKey: ['user-profile'] });
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


  const handleImageGenerated = () => {
    setImageRefreshTrigger(prev => prev + 1);
    // Invalidate user profile query to refresh credits
    queryClient.invalidateQueries({ queryKey: ['user-profile'] });
  };

  const handleOptimizationFormSubmit = async (type: string, data: any) => {
    console.log("Optimization form submit:", type, data);
    
    if (type === "model-selected") {
      // Fetch presets before showing optimization config form
      try {
        // Get the latest token from URL, window, or localStorage
        const params = new URLSearchParams(window.location.search);
        const currentToken = params.get("token") || authToken || (window as any).authToken || localStorage.getItem("auth_token");
        
        const response = await fetch(`https://games-ai-studio-be-nest-347148155332.us-central1.run.app/api/model-optimization/presets`, {
          headers: {
            "Authorization": currentToken ? `Bearer ${currentToken}` : "",
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
      
      // Extract the ACCESS_TOKEN from URL, window, or localStorage
      const params = new URLSearchParams(window.location.search);
      const accessToken = params.get("token") || authToken || (window as any).authToken || localStorage.getItem("auth_token");
      
      // Build the payload with ACCESS_TOKEN
      const payload = {
        ACCESS_TOKEN: accessToken,
        optimization_type: optType,
        presetId: strength,
        reduction_strength: presetText,
        modelId: modelId
      };
      
      // Display friendly message to user
      handleAddDirectMessage("assistant", "Agent working on Optimization");
      
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

        if (userProfile?.email) {
          payload.email = userProfile.email;
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
              <div className="relative flex items-center border-b bg-background">
                <button
                  onClick={() => {
                    const container = document.querySelector('.tabs-scroll-container');
                    if (container) container.scrollBy({ left: -200, behavior: 'smooth' });
                  }}
                  className="absolute left-0 z-10 h-14 px-2 bg-background/95 hover:bg-muted transition-colors"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                
                <TabsList className="tabs-scroll-container w-full justify-start rounded-none border-0 bg-background h-14 px-12 overflow-x-auto flex-nowrap scrollbar-hide">
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
                  <TabsTrigger value="videos" className="gap-2">
                    <Video className="w-4 h-4" />
                    Video Gallery
                  </TabsTrigger>
                  <TabsTrigger value="game-design-pro" className="gap-2" onClick={() => navigate("/game-design-pro")}>
                    <Sparkles className="w-4 h-4" />
                    Game Design Pro
                  </TabsTrigger>
                </TabsList>
                
                <button
                  onClick={() => {
                    const container = document.querySelector('.tabs-scroll-container');
                    if (container) container.scrollBy({ left: 200, behavior: 'smooth' });
                  }}
                  className="absolute right-0 z-10 h-14 px-2 bg-background/95 hover:bg-muted transition-colors"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
              
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
              
              <TabsContent value="videos" className="flex-1 m-0 overflow-auto">
                <iframe 
                  src="/videos" 
                  className="w-full h-full border-0"
                  title="Video Gallery"
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
