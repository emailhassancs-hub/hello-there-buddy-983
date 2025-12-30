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
import { LocalStorageKeys } from "@/enums/localstorage";
import { SSEStatusListener } from "@/components/SSEStatusListener";
import { SSEStatusUpdate } from "@/hooks/useSSE";
import { extractImageUrls } from "@/components/chat/utils";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";
import { useToast } from "@/hooks/use-toast";
import { Image as ImageIcon, BookOpen, Box, Settings, Video, ChevronLeft, ChevronRight, Sparkles } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import ErrorBoundary from "@/components/ui/error-boundary";

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
  imagePaths?: string[]; // URLs of uploaded images for user messages
}

// Helper function to extract email from JWT token
const extractEmailFromToken = (token: string | null): string | null => {
  if (!token) return null;
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.email || payload.sub || null;
  } catch {
    return null;
  }
};

const Index = () => {
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("images");
  const [selectedModel, setSelectedModel] = useState<{ modelUrl: string; thumbnailUrl: string; workflow: string } | null>(null);
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [imageRefreshTrigger, setImageRefreshTrigger] = useState(0);
  const [uploadedImageUrls, setUploadedImageUrls] = useState<string[]>([]);
  const [uploadedBlobPaths, setUploadedBlobPaths] = useState<string[]>([]);
  const [activeJobIds, setActiveJobIds] = useState<string[]>([]);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: userProfile } = useUserProfile();

  const apiUrl = import.meta.env.VITE_API_BASE_URL;
  const API = apiUrl;
 
  // Load token from localStorage only
  useEffect(() => {
    const storedToken = localStorage.getItem(LocalStorageKeys.AccessToken);
    if (storedToken) {
      setAuthToken(storedToken);
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

  const isToolInvocation = useCallback((content: string): boolean => {
    if (!content) return false;

    return (
      content.includes("Invoke the tool") ||
      content.includes("using the following parameters") ||
      content.trim().startsWith("{") && content.includes("model_id")
    );
  }, []);

  const refreshImageUrl = async (blobPath: string): Promise<string | null> => {
    try {
      const response = await fetch(`${apiUrl}/images/refresh-url`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": authToken ? `Bearer ${authToken}` : "",
        },
        body: JSON.stringify({
          email: userProfile?.email,
          blob_path: blobPath
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to refresh URL");
      }

      const data = await response.json();
      return data.url;
    } catch (error) {
      console.error("Error refreshing image URL:", error);
      toast({
        title: "Error",
        description: "Failed to refresh image URL",
        variant: "destructive",
      });
      return null;
    }
  };

  const handleSendMessage = async (text: string, imageUrls?: string[], blobPaths?: string[], aiResponse?: any, uploadSessionId?: string) => {
    if (!text.trim() && (!imageUrls || imageUrls.length === 0)) return;

    const previousMessageCount = messages.length;
    const currentHasImages = !!(imageUrls && imageUrls.length > 0);

    // Store uploaded image URLs and blob paths in session state for agent reuse
    if (imageUrls && imageUrls.length > 0) {
      setUploadedImageUrls(imageUrls);
    }
    if (blobPaths && blobPaths.length > 0) {
      setUploadedBlobPaths(blobPaths);
    }

    // Update session ID if provided from upload
    if (uploadSessionId) {
      updateSessionId(uploadSessionId);
    }

    // If we got an AI response from the upload, add it to messages and return early
    if (aiResponse?.messages) {
      const userMessage: Message = {
        role: "user",
        text: text,
        imagePaths: imageUrls, // Include uploaded image URLs
      };
      const assistantMessage: Message = {
        role: "assistant",
        text: aiResponse.messages,
      };
      setMessages((prev) => [...prev, userMessage, assistantMessage]);
      return;
    }

    const userMessage: Message = {
      role: "user",
      text: text,
      imagePaths: imageUrls, // Include uploaded image URLs
    };

    // Do not show raw tool invocation messages in chat
    if (!isToolInvocation(text)) {
      setMessages((prev) => [...prev, userMessage]);
    }
    setIsGenerating(true);

    try {
      // Get user email from profile or extract from auth token
      const userEmail = userProfile?.email || extractEmailFromToken(authToken);
      
      const payload: any = {
        query: text,
      };
      
      if (sessionId) {
        payload.session_id = sessionId;
      }

      if (userEmail) {
        payload.email = userEmail;
      }

      // Include uploaded image URLs in the payload for agent processing
      if (imageUrls && imageUrls.length > 0) {
        payload.image_urls = imageUrls;
      } else if (uploadedImageUrls.length > 0) {
        // Include previously uploaded URLs for agent reuse
        payload.image_urls = uploadedImageUrls;
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
        mode: "cors",
        credentials: "include",
        body: JSON.stringify(payload),
      });

      const data = await response.json();
    // console.log(data,'here is data response getting from backend==>>')
      // Update session ID if provided
      if (data.session_id) {
        updateSessionId(data.session_id);
        const nowIso = new Date().toISOString();

        // Optimistically update sidebar without triggering full reload
        window.dispatchEvent(
          new CustomEvent("refreshChatSidebar", {
            detail: {
              session: {
                session_id: data.session_id,
                created_at: nowIso,
                updated_at: nowIso,
                message_count: previousMessageCount + 1, // user message just sent
              },
            },
          })
        );
      }

      // Append any messages from the backend - filter out system messages only
      if (data.messages && Array.isArray(data.messages)) {
        const newMessages = data.messages
          .filter((msg: any) => msg.type !== "system")
          .map((msg: any) => {
            const content = msg.content || "";
            const role = msg.type === "ai" ? "assistant" : msg.type === "tool" ? "assistant" : "user";
            
            // Extract image URLs from content for user messages
            let imagePaths: string[] | undefined;
            if (role === "user" && content) {
              const extractedUrls = extractImageUrls(content);
              if (extractedUrls.length > 0) {
                imagePaths = extractedUrls;
              }
            }
            
            return {
              role,
              text: content,
              toolName: msg.type === "tool" ? msg.name : undefined,
              imagePaths,
            };
          })
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
        mode: "cors",
        credentials: "include",
        body: JSON.stringify(payload),
      });

      const data = await response.json();
       console.log(data,'data after tool invoke===============>>>>')
       console.log(messages,'here is before messages==>>>')
      // Update session ID if provided
      if (data.session_id) {
        updateSessionId(data.session_id);
      }

      // Append any messages from the backend - filter out system messages only
      if (data.messages && Array.isArray(data.messages)) {
        const newMessages = data.messages
          .filter((msg: any) => msg.type !== "system")
          .map((msg: any) => {
            let jobId: string | undefined;
            let contentParsed: any = undefined;
            let isJSONParsed = false;
            try {
              if (msg.content) {
                contentParsed = JSON.parse(msg.content);
                isJSONParsed = true;
                if (contentParsed && typeof contentParsed === 'object' && contentParsed.job_id) {
                  jobId = contentParsed.job_id;
                }
              }
            } catch {
              // Not JSON, ignore
            }

            const role = msg.type === "ai" || msg.type === "tool" ? "assistant" : "user";
            const content = msg.content || "";
            
            // Extract image URLs from content for user messages
            let imagePaths: string[] | undefined;
            if (role === "user" && content) {
              const extractedUrls = extractImageUrls(content);
              if (extractedUrls.length > 0) {
                imagePaths = extractedUrls;
              }
            }
            
             if (isJSONParsed && typeof contentParsed === 'object' && contentParsed !== null) {
              return {
                role,
                ...contentParsed,
                toolName: msg.type === "tool" ? msg.name : undefined,
                jobId,
                imagePaths,
              };
            } else {
              return {
                role,
                text: content,
                toolName: msg.type === "tool" ? msg.name : undefined,
                jobId,
                imagePaths,
              };
            }
          })
          .filter((m: any) => (typeof m.text === "string" ? !isToolInvocation(m.text) : true));
        console.log(newMessages, 'new messages==>>>')
        setMessages((prev) => [...prev, ...newMessages]);
        const jobIds = newMessages
          .map((m: any) => m.jobId)
          .filter((id: string | undefined): id is string => !!id);
        
        if (jobIds.length > 0) {
          setActiveJobIds((prev) => {
            const combined = [...prev, ...jobIds];
            return Array.from(new Set(combined)); // Remove duplicates
          });
        }

        // console.log(jobIds,'here is main job ids i am getting====>>>>')
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


  const handleImageGenerated = useCallback(() => {
    setImageRefreshTrigger(prev => prev + 1);
    queryClient.invalidateQueries({ queryKey: ['user-profile'] });
  }, [queryClient]);

  // Handle SSE status updates
  const handleSSEStatusUpdate = useCallback((jobId: string, update: SSEStatusUpdate) => {
    console.log(`[SSE] Status update for job ${jobId}:`, update);
    
    // Update the message that contains this job ID
    setMessages((prev: Message[]) =>
      prev.map((msg: any) => {
        if ((msg as any).jobId === jobId) {
          let updatedText: any ={}
          
              updatedText ={
                ...msg,
                ...update.data,
                status: update.status
              };

          console.log({
            ...msg,
            ...updatedText,
            role: 'assistant'
          },'final objecttttttttttttttttttttttttttttttttttttttttttttttttttttttt')
          
          return {
            ...msg,
            ...updatedText,
            role: 'assistant',
            status: update.status || 'listening'
          }
        }
        return msg;
      })
    );
    
    // // Show toast for important status changes
    // if (update.status === 'processing') {
    //   toast({
    //     title: "Processing",
    //     description: update.message || "Your request is being processed...",
    //   });
    // }
  }, [toast]);

  // Handle SSE job completion
  const handleSSEJobComplete = useCallback((jobId: string, finalStatus: SSEStatusUpdate) => {
    console.log(`[SSE] Job ${jobId} completed:`, finalStatus);
    
    // Remove from active jobs
    setActiveJobIds((prev) => prev.filter((id) => id !== jobId));
    
    // Update message with final status
    console.log(messages,'here is prev message before update')
    setMessages((prev: Message[]) =>
      prev.map((msg: any) => {
        if ((msg as any).jobId === jobId) {
          let updatedText: any ={}
          
              updatedText ={
                ...msg,
                ...finalStatus.data,
                status: finalStatus.status
              };

          console.log({
            ...msg,
            ...updatedText,
            role: 'assistant'
          },'final objecttttttttttttttttttttttttttttttttttttttttttttttttttttttt')
          
          return {
            ...msg,
            ...updatedText,
            role: 'assistant',
            status: finalStatus.status || 'COMPLETED'
          }
        }
        return msg;
      })
    );
    
    // Show completion toast
    if (finalStatus.status.toLocaleLowerCase() === 'completed') {
      toast({
        title: "Completed",
        description: finalStatus.message || "Your request has been completed!",
      });
      // Refresh images when job completes
      handleImageGenerated();
    } else if (finalStatus.status.toLocaleLowerCase() === 'error' || finalStatus.status.toLocaleLowerCase() === 'failed') {
      toast({
        title: "Error",
        description: finalStatus.message || "An error occurred processing your request.",
        variant: "destructive",
      });
    }
  }, [toast, handleImageGenerated]);

  const handleOptimizationFormSubmit = async (type: string, data: any) => {
    console.log("Optimization form submit:", type, data);
    
    if (type === "model-selected") {
      // Fetch presets before showing optimization config form
      try {
        // Get token from localStorage
        const currentToken = authToken || localStorage.getItem(LocalStorageKeys.AccessToken);
        
        const backendUrl = import.meta.env.VITE_API_BACKEND_URL;
        const response = await fetch(`${backendUrl}/api/model-optimization/presets`, {
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
      
      // Get ACCESS_TOKEN from localStorage
      const accessToken = authToken || localStorage.getItem(LocalStorageKeys.AccessToken);
      
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

      // Get user email from profile or extract from auth token
      const userEmail = userProfile?.email || extractEmailFromToken(authToken);
      
      // Build URL with email parameter
      const exportUrl = userEmail 
        ? `${API}/session/${sessionId}/export?email=${encodeURIComponent(userEmail)}`
        : `${API}/session/${sessionId}/export`;

      const response = await fetch(exportUrl, { headers });
      if (!response.ok) {
        throw new Error("Failed to load session");
      }
      
      const data = await response.json();
      
      // Update session ID
      setSessionId(sessionId);
      localStorage.setItem("mcp_session_id", sessionId);
      
      // Convert messages to the format expected by ChatInterface
      // Filter out system messages only
      const loadedMessages: Message[] = data.messages
        .filter((msg: any) => msg.type !== "system")
        .map((msg: any) => {
          const content = msg.content || "";
          const role = msg.type === "human" ? "user" : msg.type === "ai" ? "assistant" : "assistant";
          
          // Extract image URLs from content for user messages
          let imagePaths: string[] | undefined;
          if (role === "user" && content) {
            const extractedUrls = extractImageUrls(content);
            if (extractedUrls.length > 0) {
              imagePaths = extractedUrls;
            }
          }
          
          return {
            ...msg,
            role,
            text: content,
            timestamp: new Date(),
            toolName: msg.type === "tool" ? msg.name : undefined,
            imagePaths,
          };
        });
      
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
      {/* SSE Status Listener - listens for real-time updates */}
      <SSEStatusListener
        apiUrl={apiUrl}
        email={userProfile?.email || extractEmailFromToken(authToken) || undefined}
        activeJobIds={activeJobIds}
        onStatusUpdate={handleSSEStatusUpdate}
        onJobComplete={handleSSEJobComplete}
      />
      
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
          <ErrorBoundary>
            <ChatInterface
              messages={messages}
              onSendMessage={handleSendMessage}
              onToolConfirmation={handleToolConfirmation}
              isGenerating={isGenerating}
              apiUrl={apiUrl}
              onModelSelect={handleModelSelect}
              onImageGenerated={handleImageGenerated}
              onOptimizationFormSubmit={handleOptimizationFormSubmit}
              userEmail={userProfile?.email || extractEmailFromToken(authToken)}
              sessionId={sessionId || undefined}
              accessToken={authToken || undefined}
            />
          </ErrorBoundary>
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
                  <TabsTrigger value="videos" className="gap-2 relative" disabled>
                    <Video className="w-4 h-4" />
                    Video Gallery
                    <span className="text-[10px] italic ml-1 text-muted-foreground">Coming Soon</span>
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
                    {/* <ModelUploader 
                      apiUrl={apiUrl} 
                      authToken={authToken || ''} 
                      onUploadComplete={(assetId) => {
                        console.log("Upload complete, asset ID:", assetId);
                        toast({
                          title: "Success",
                          description: "Model uploaded and registered successfully!",
                        });
                      }}
                    /> */}
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