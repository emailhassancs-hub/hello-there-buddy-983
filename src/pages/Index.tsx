import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import ChatInterface from "@/components/ChatInterface";
import ImageViewer from "@/components/ImageViewer";
import ModelViewer from "@/components/ModelViewer";
import ModelOptimization from "@/components/ModelOptimization";
import { ChatSidebar } from "@/components/ChatSidebar";
import { useUserProfile } from "@/hooks/use-user-profile";
import { useProject } from "@/hooks/use-project";
import { LocalStorageKeys } from "@/enums/localstorage";
import { SSEStatusListener } from "@/components/SSEStatusListener";
import { SSEStatusUpdate } from "@/hooks/useSSE";
import { extractImageUrls } from "@/components/chat/utils";
import { Message } from "@/components/chat/types";
import { WorkflowProgressDisplay } from "@/components/WorkflowProgressDisplay";
import { WorkflowChainResults } from "@/components/WorkflowChainResults";
import {
  createChainSSEConnection,
  WorkflowChainData,
  ChainResults,
} from "@/utils/workflowChainHandler";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";
import { useToast } from "@/hooks/use-toast";
import { Image as ImageIcon, Box, Settings, ChevronLeft, ChevronRight } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import ErrorBoundary from "@/components/ui/error-boundary";
import { apiFetch } from "@/lib/api";
import OnboardingModal from "@/components/Onboarding";

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
  const [messages, setMessages] = useState<Message[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("images");
  const [selectedModel, setSelectedModel] = useState<{ modelUrl: string; thumbnailUrl: string; workflow: string } | null>(null);
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [imageRefreshTrigger, setImageRefreshTrigger] = useState(0);
  const [modelRefreshTrigger, setModelRefreshTrigger] = useState(0);
  const [uploadedImageUrls, setUploadedImageUrls] = useState<string[]>([]);
  const [activeJobIds, setActiveJobIds] = useState<string[]>([]);
  const optimizationPollIntervalsRef = useRef<Map<number, NodeJS.Timeout>>(new Map());
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showTutorialOnboarding, setShowTutorialOnboarding] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const hasCheckedUrlParamsRef = useRef(false);
  const hasSentInitialPromptRef = useRef(false);
  
  // Workflow chain state
  const [workflowChain, setWorkflowChain] = useState<WorkflowChainData | null>(null);
  const [workflowProgress, setWorkflowProgress] = useState({ current: 0, total: 0 });
  const [workflowStatus, setWorkflowStatus] = useState<string>("");
  const [workflowError, setWorkflowError] = useState<string | null>(null);
  const [workflowResults, setWorkflowResults] = useState<ChainResults | null>(null);
  const [isWorkflowLoading, setIsWorkflowLoading] = useState(false);
  const chainSSERef = useRef<EventSource | null>(null);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: userProfile } = useUserProfile();
  const projectIdFromUrl = searchParams.get("projectId");
  const { data: currentProject } = useProject(projectIdFromUrl);

  const apiUrl = import.meta.env.VITE_API_BASE_URL;

  // If /studio is opened without a projectId, redirect to home
  useEffect(() => {
    if (!projectIdFromUrl) {
      navigate("/home", { replace: true });
    }
  }, [navigate, projectIdFromUrl]);


  //const apiUrl = "http://localhost:8080";
  const API = apiUrl;
 
  // Load token from localStorage only
  useEffect(() => {
    const storedToken = localStorage.getItem(LocalStorageKeys.AccessToken);
    if (storedToken) {
      setAuthToken(storedToken);
    }
  }, []);

  // Show onboarding modal for users who haven't seen the credits bonus / onboarding yet
  useEffect(() => {
    if (!userProfile) return;
    if (userProfile.hasSeenCreditsBonus === false) {
      setShowOnboarding(true);
    }
  }, [userProfile]);

  // Note: URL param check moved after handleLoadSession is defined

  // Cleanup workflow SSE on unmount
  useEffect(() => {
    return () => {
      if (chainSSERef.current) {
        chainSSERef.current.close();
      }
    };
  }, []);

  // Auto-remove workflow card after 3 seconds when workflow completes
  useEffect(() => {
    if (workflowResults && workflowChain) {
      const timer = setTimeout(() => {
        setWorkflowChain(null);
        setWorkflowResults(null);
        setWorkflowProgress({ current: 0, total: 0 });
        setWorkflowStatus("");
      }, 3000); 

      return () => clearTimeout(timer);
    }
  }, [workflowResults, workflowChain]);

  // Listen for model selection form refresh event
  useEffect(() => {
    const handleRefreshModelSelection = async () => {
      try {
        const currentToken = authToken || localStorage.getItem(LocalStorageKeys.AccessToken);
        const backendUrl = import.meta.env.VITE_API_BACKEND_URL || apiUrl;
        
        const response = await fetch(`${backendUrl}/api/model-optimization/models`, {
          headers: {
            "Authorization": currentToken ? `Bearer ${currentToken}` : "",
            "Content-Type": "application/json"
          }
        });

        if (response.ok) {
          const data = await response.json();
          const modelsArray = data.models || data || [];
          
          const updatedModels: any[] = modelsArray.map((model: any) => ({
            id: model.assetId,
            name: model.name || model.filename || model.fileName || `Model ${model.id || model.asset_id || model.assetId}`,
            image: model.thumbnail_url || model.thumbnailUrl || model.image || "/placeholder.svg",
            creationDate: model.created_at || model.createdAt 
              ? new Date(model.created_at || model.createdAt).toLocaleDateString() 
              : new Date().toLocaleDateString()
          }));

          // Update all messages with model-selection form type, preserving isUploading state
          setMessages((prev) =>
            prev.map((msg) =>
              msg.formType === "model-selection" && msg.formData && typeof msg.formData === "object"
                ? {
                    ...msg,
                    formData: {
                      models: updatedModels,
                      isUploading: (msg.formData as Record<string, any>).isUploading || false,
                    },
                  }
                : msg
            )
          );
        }
      } catch (error) {
        console.error("Error refreshing model selection form:", error);
      }
    };

    window.addEventListener('refreshModelSelectionForm', handleRefreshModelSelection);
    return () => window.removeEventListener('refreshModelSelectionForm', handleRefreshModelSelection);
  }, [authToken, apiUrl]);

  const updateSessionId = (newSessionId: string) => {
    setSessionId(newSessionId);
    // Update URL with session_id query param
    const newSearchParams = new URLSearchParams(searchParams);
    newSearchParams.set("session_id", newSessionId);
    setSearchParams(newSearchParams, { replace: true });
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

  const handleSendMessage = async (
    text: string,
    imageUrls?: string[],
    blobPaths?: string[],
    aiResponse?: any,
    uploadSessionId?: string,
    responseMode: "thinking" | "fast" = "thinking",
    humanInLoop: boolean = false,
  ) => {
    if (!text.trim() && (!imageUrls || imageUrls.length === 0)) return;

    const previousMessageCount = messages.length;
    const currentHasImages = !!(imageUrls && imageUrls.length > 0);

    // Store uploaded image URLs and blob paths in session state for agent reuse
    if (imageUrls && imageUrls.length > 0) {
      setUploadedImageUrls(imageUrls);
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
      // Get user ID from profile
      const userId = userProfile?.id;
      
      const payload: any = {
        query: text,
        mode: responseMode, 
        humanInLoop
      };
      
      if (sessionId) {
        payload.session_id = sessionId;
      }

      if (userId) {
        payload.userId = userId;
      }

      // Attach current project (if any) from URL
      const projectIdFromUrl = searchParams.get("projectId");
      if (projectIdFromUrl) {
        payload.projectId = projectIdFromUrl;
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

      if (projectIdFromUrl) {
        headers["x-project-id"] = projectIdFromUrl;
      }

      const response = await fetch(`${API}/ask`, {
        method: "POST",
        headers,
        mode: "cors",
        credentials: "include",
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      // ===== ADD THIS DEBUG =====
      console.log('=== /ask RESPONSE DEBUG ===');
      console.log('workflow_chain exists:', !!data.workflow_chain);
      console.log('workflow_chain:', JSON.stringify(data.workflow_chain, null, 2));
      console.log('pending_jobs:', data.pending_jobs);
      console.log('stream_urls:', data.stream_urls);
      console.log('===========================');
      // ===== END DEBUG =====

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

      // ============================================
      // CHECK: Is this a Workflow Chain?
      // ============================================
      if (data.workflow_chain) {
        console.log('🔗 Workflow Chain Detected!', data.workflow_chain);
        handleWorkflowChain(data.workflow_chain);
        setIsGenerating(false);
        return;
      }

      // ============================================
      // ELSE: Single Job or Regular Response
      // ============================================
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
        setMessages((prev) => [...prev, ...newMessages]);

        // Extract job IDs and trigger SSE connections
        const jobIds = newMessages
          .map((m: any) => {
            if (m.optimized_model_id) return undefined;
            if (m.jobId) return m.jobId;
            return undefined;
          })
          .filter((id: string | undefined): id is string => !!id);

        if (jobIds.length > 0) {
          setActiveJobIds((prev) => {
            const combined = [...prev, ...jobIds];
            return Array.from(new Set(combined));
          });
        }

        // Check for optimized model responses
        for (const msg of data.messages) {
          handleOptimizedModelId(msg);
        }
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

      if (userProfile?.id) {
        payload.userId = userProfile.id;
      }

      const headers: HeadersInit = {
        "Content-Type": "application/json",
      };
      
      if (authToken) {
        headers["Authorization"] = `Bearer ${authToken}`;
      }

      const projectIdFromUrl = searchParams.get("projectId");
      if (projectIdFromUrl) {
        headers["x-project-id"] = projectIdFromUrl;
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

      // ============================================
      // ✅ CHECK FOR WORKFLOW CHAIN FIRST!
      // ============================================
      if (data.workflow_chain) {
        console.log('🔗 [CONFIRMATION] Workflow Chain Detected!', data.workflow_chain);
        
        // Add the messages to chat first
        if (data.messages && Array.isArray(data.messages)) {
          const newMessages = data.messages
            .filter((msg: any) => msg.type !== "system")
            .map((msg: any) => {
              const content = msg.content || "";
              const role = msg.type === "ai" ? "assistant" : msg.type === "tool" ? "assistant" : "user";
              
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
        
        // Then start the workflow chain handler
        handleWorkflowChain(data.workflow_chain);
        setIsGenerating(false);
        return;  // ✅ IMPORTANT: Exit here, don't continue
      }

      // ============================================
      // ELSE: Normal tool confirmation response
      // ============================================
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
          .map((m: any) => {
            if (m.optimized_model_id) {
              return undefined;
            } else if (m.jobId) {
              return m.jobId;
            }
            return undefined;
          })
          .filter((id: string | undefined): id is string => !!id);
        
        if (jobIds.length > 0) {
          setActiveJobIds((prev) => {
            const combined = [...prev, ...jobIds];
            return Array.from(new Set(combined)); // Remove duplicates
          });
        }

        // console.log(jobIds,'here is main job ids i am getting====>>>>')

        // Check if any message is a successful model optimization
        if (data.messages && Array.isArray(data.messages)) {
          for (const msg of data.messages) {
            handleOptimizedModelId(msg);
          }
        }
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
  
  // ============================================
  // WORKFLOW CHAIN HANDLER
  // ============================================
const handleWorkflowChain = useCallback((chain: WorkflowChainData) => {
  console.log(`🔗 Starting workflow chain: ${chain.chain_id}`);
  
  setWorkflowChain(chain);
  setWorkflowProgress({ current: 0, total: chain.total_tasks });
  setWorkflowStatus("🔗 Starting workflow with " + chain.total_tasks + " tasks...");
  setWorkflowError(null);
  setWorkflowResults(null);
  setIsWorkflowLoading(true);

  // Add placeholder for first task
  const firstTaskPlaceholder: Message = {
    role: "assistant",
    text: `🔗 Starting task 1/${chain.total_tasks}...`,
    job_id: `chain_task_1_${chain.chain_id}`,
    status: "listening",
    generation_type: "image_generation",
    chainId: chain.chain_id,
    taskNumber: 1,
  };
  setMessages((prev) => [...prev, firstTaskPlaceholder]);

  if (chainSSERef.current) {
    chainSSERef.current.close();
  }

  const userEmail = userProfile?.email || extractEmailFromToken(authToken);
  const streamUrl = `${API}/generation-status/${chain.chain_id}/stream?email=${encodeURIComponent(userEmail || "")}`;
  console.log(`🔗 Opening SSE connection to: ${streamUrl}`);

  const taskPlaceholdersAdded = new Set<number>([1]);

  const eventSource = createChainSSEConnection(
    streamUrl,
    chain.total_tasks,
    {
      onTaskStarting: (event) => {
        setWorkflowStatus(`⚡ Task ${event.task_number}/${event.total_tasks}: ${event.prompt || event.task_type}`);
        
        if (!taskPlaceholdersAdded.has(event.task_number)) {
          taskPlaceholdersAdded.add(event.task_number);
          const taskPlaceholder: Message = {
            role: "assistant",
            text: `⚡ Starting task ${event.task_number}/${event.total_tasks}...`,
            job_id: `chain_task_${event.task_number}_${event.chain_id}`,
            status: "listening",
            generation_type: event.task_type === "image_editing" ? "image_editing" : 
                            event.task_type === "3d_generation" ? "3d_generation" : "image_generation",
            chainId: event.chain_id,
            taskNumber: event.task_number,
          };
          setMessages((prev) => [...prev, taskPlaceholder]);
        }
      },
      
      onTaskStarted: (event) => {
        setWorkflowStatus(`🎧 Processing task ${event.task_number}/${event.total_tasks}...`);
        setMessages((prev) =>
          prev.map((msg: any) => {
            if (msg.chainId === event.chain_id && msg.taskNumber === event.task_number) {
              return { ...msg, job_id: event.job_id, text: `🎧 Processing task ${event.task_number}/${event.total_tasks}...` };
            }
            return msg;
          })
        );
      },
      
      onTaskCompleted: (event) => {
        setWorkflowProgress({ current: event.task_number || 0, total: chain.total_tasks });
        setWorkflowStatus(`✅ Task ${event.task_number}/${event.total_tasks} completed!`);
        
        // ✅ FIX: Check both image_path AND thumbnail_url (for 3D models)
        const imagePath = event.image_path || event.thumbnail_url || event.output?.image_path || event.output?.thumbnail_url;
        
        // ✅ DEBUG: Log what we received
        console.log(`🖼️ [onTaskCompleted] Task ${event.task_number} URLs:`, {
          image_path: event.image_path,
          thumbnail_url: event.thumbnail_url,
          model_url: event.model_url,
          resolved_imagePath: imagePath
        });
        
        if (imagePath) {
          setMessages((prev) =>
            prev.map((msg: any) => {
              if (msg.job_id === event.job_id || (msg.chainId === event.chain_id && msg.taskNumber === event.task_number)) {
                return { 
                  ...msg, 
                  status: "COMPLETED", 
                  image_path: imagePath,
                  thumbnail_url: event.thumbnail_url,  // ✅ Also store thumbnail_url
                  model_url: event.model_url,          // ✅ Also store model_url for 3D
                  text: `✅ Task ${event.task_number}/${event.total_tasks} completed` 
                };
              }
              return msg;
            })
          );
        }
      },
      
      onChainCompleted: (event) => {
        const results: ChainResults = {
          images: event.outputs?.images || [],
          models: event.outputs?.models || [],
          allOutputs: event.outputs || {},
        };
        setWorkflowResults(results);
        setWorkflowProgress({ current: chain.total_tasks, total: chain.total_tasks });
        setWorkflowStatus(`🎉 All ${chain.total_tasks} tasks completed successfully!`);
        setIsWorkflowLoading(false);

        if (event.outputs) {
          const outputKeys = Object.keys(event.outputs).filter(k => k.startsWith('output_'));
          setMessages((prev) => {
            let updatedMessages = [...prev];
            outputKeys.forEach((key, index) => {
              const output = event.outputs[key];
              
              // ✅ FIX: Check both image_path AND thumbnail_url
              const outputImagePath = output?.image_path || output?.thumbnail_url;
              
              if (output && outputImagePath) {
                const alreadyHasImage = updatedMessages.some((msg: any) => 
                  msg.image_path === outputImagePath || msg.thumbnail_url === outputImagePath
                );
                if (!alreadyHasImage) {
                  const taskNumber = index + 1;
                  const placeholderIndex = updatedMessages.findIndex(
                    (msg: any) => msg.chainId === event.chain_id && msg.taskNumber === taskNumber && !msg.image_path && !msg.thumbnail_url
                  );
                  if (placeholderIndex !== -1) {
                    updatedMessages[placeholderIndex] = { 
                      ...updatedMessages[placeholderIndex], 
                      status: "COMPLETED", 
                      image_path: outputImagePath,
                      thumbnail_url: output.thumbnail_url,  // ✅ Store thumbnail_url
                      model_url: output.model_url,          // ✅ Store model_url
                      text: `✅ Result ${taskNumber}/${outputKeys.length}` 
                    };
                  } else {
                    updatedMessages.push({ 
                      role: "assistant", 
                      text: `✅ Result ${taskNumber}/${outputKeys.length}`, 
                      status: "COMPLETED", 
                      image_path: outputImagePath,
                      thumbnail_url: output.thumbnail_url,
                      model_url: output.model_url,
                      generation_type: output.type || "image_generation", 
                      job_id: output.job_id 
                    });
                  }
                }
              }
            });
            return updatedMessages;
          });
        }

        toast({ title: "Workflow Complete", description: `Generated ${results.images.length} images and ${results.models.length} models` });
        handleImageGenerated();
      },
      
      onTaskFailed: (event) => {
        setWorkflowError(`Task ${event.task_number} failed: ${event.error || "Unknown error"}`);
        setIsWorkflowLoading(false);
        setMessages((prev) =>
          prev.map((msg: any) => {
            if (msg.chainId === event.chain_id && msg.taskNumber === event.task_number) {
              return { ...msg, status: "error", text: `❌ Task ${event.task_number} failed: ${event.error || "Unknown error"}` };
            }
            return msg;
          })
        );
        toast({ title: "Workflow Error", description: `Task ${event.task_number} failed: ${event.error}`, variant: "destructive" });
      },
      
      onStatusUpdate: (message) => setWorkflowStatus(message),
      onProgressUpdate: (current, total) => setWorkflowProgress({ current, total }),
      onError: (error) => {
        setWorkflowError(error);
        setIsWorkflowLoading(false);
        toast({ title: "Connection Error", description: error, variant: "destructive" });
      },
      onLoaderToggle: (show) => setIsWorkflowLoading(show),
    }
  );

  chainSSERef.current = eventSource;
}, [toast, handleImageGenerated, API, authToken, userProfile?.email]);


  const handleModelGenerated = useCallback(() => {
    setModelRefreshTrigger(prev => prev + 1);
    queryClient.invalidateQueries({ queryKey: ['user-profile'] });
  }, [queryClient]);

  // Helper function to fetch optimized model data and update message
  const fetchAndDisplayOptimizedModel = useCallback(async (optimizedModelId: number, shouldAddPlaceholder: boolean = false) => {
    try {
      const result = await apiFetch<{ data: any }>(
        `/api/model-optimization/rapidmodels/${optimizedModelId}`,
        {
          method: 'GET',
        }
      );
      
      const modelData = result.data;
      if (modelData) {
        if (modelData.optimization_status === "done") {
          // Model is already done, show it directly
            // Update existing placeholder message
            if(shouldAddPlaceholder){
              const placeholderMessage: Message = {
                role: "assistant",
                text: "",
                formType: "optimized-model",
                status: "completed",
                optimizedModelId: optimizedModelId,
                formData: {
                  preset_name: modelData.preset_name || "Optimized Model",
                  optimization_status: modelData.optimization_status,
                  name: modelData.name,
                  downloads: modelData.downloads || {}
                }
              };
              setMessages((prev) => [...prev, placeholderMessage]);
            } else {
            setMessages((prev) => {
              return prev.map((msg) => {
                if (
                  msg.formType === "optimized-model" && 
                  msg.optimizedModelId === optimizedModelId
                ) {
                  return {
                    ...msg,
                    status: "completed",
                    formData: {
                      preset_name: modelData.preset_name || "Optimized Model",
                      optimization_status: modelData.optimization_status,
                      name: modelData.name,
                      downloads: modelData.downloads || {}
                    }
                  };
                }
                return msg;
              });
            });
        }
        } else {
          // Model is still processing, add placeholder and start polling
          if (shouldAddPlaceholder) {
            const placeholderMessage: Message = {
              role: "assistant",
              text: "",
              formType: "optimized-model",
              status: "listening",
              optimizedModelId: optimizedModelId,
              formData: {
                preset_name: modelData.preset_name || "",
                optimization_status: modelData.optimization_status || "processing",
                name: modelData.name || "",
                downloads: modelData.downloads || {}
              }
            };
            setMessages((prev) => [...prev, placeholderMessage]);
          }
          // Start polling for updates
          startPollingOptimizedModel(optimizedModelId);
        }
      }
    } catch (error) {
      console.error("Error fetching optimized model:", error);
      // Still add placeholder if requested, even if fetch fails
      if (shouldAddPlaceholder) {
        const placeholderMessage: Message = {
          role: "assistant",
          text: "",
          formType: "optimized-model",
          status: "listening",
          optimizedModelId: optimizedModelId,
          formData: {
            preset_name: "",
            optimization_status: "processing",
            name: "",
            downloads: {}
          }
        };
        setMessages((prev) => [...prev, placeholderMessage]);
        startPollingOptimizedModel(optimizedModelId);
      }
    }
  }, [toast]);

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
          },'final object====>>>>>')
          
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

    // ── Intent Loop: if backend sent next_job_id, open SSE for it ──
    const nextJobId = (finalStatus as any).next_job_id;
    if (nextJobId) {
      console.log(`[SSE] 🔄 Intent loop continuation — next job: ${nextJobId}`);
      const nextContext = (finalStatus as any).next_job_context || "Processing next task...";

      // Create a placeholder message for the next generation
      const placeholderMsg: Message = {
        role: "assistant",
        text: "",
        jobId: nextJobId,
        job_id: nextJobId,
        status: "listening",
        type: "tool_generation",
      } as any;
      setMessages((prev: Message[]) => [...prev, placeholderMsg]);

      // Add to activeJobIds so SSEStatusListener opens a connection
      setActiveJobIds((prev) => {
        const combined = [...prev, nextJobId];
        return Array.from(new Set(combined));
      });
    }

    // Show completion toast
    if (finalStatus.status.toLocaleLowerCase() === 'completed') {
      // Only show toast if there's no next job (avoid spamming toasts for chain steps)
      if (!nextJobId) {
        toast({
          title: "Completed",
          description: finalStatus.message || "Your request has been completed!",
        });
      }
      // Refresh images when job completes
      handleImageGenerated();
      // Also refresh models if this is a model generation job
      if (finalStatus.data?.model_url) {
        handleModelGenerated();
      }
    } else if (finalStatus.status.toLocaleLowerCase() === 'error' || finalStatus.status.toLocaleLowerCase() === 'failed') {
      toast({
        title: "Error",
        description: finalStatus.message || "An error occurred processing your request.",
        variant: "destructive",
      });
    }
  }, [toast, handleImageGenerated, handleModelGenerated]);

  // Poll optimized model status until it's done
  const startPollingOptimizedModel = useCallback((optimizedModelId: number) => {
    // Clear any existing polling for this model
    const existingInterval = optimizationPollIntervalsRef.current.get(optimizedModelId);
    if (existingInterval) {
      clearInterval(existingInterval);
    }
    
    let pollCount = 0;
    const maxPolls = 120; // 10 minutes max (5 seconds * 120)
    
    const pollInterval = setInterval(async () => {
      pollCount++;
      
      try {
        const result = await apiFetch<{ data: any }>(
          `/api/model-optimization/rapidmodels/${optimizedModelId}`,
          {
            method: 'GET',
          }
        );
        
        const modelData = result.data;
        
        if (modelData && modelData.optimization_status === "done") {
          clearInterval(pollInterval);
          optimizationPollIntervalsRef.current.delete(optimizedModelId);
          
          // Update placeholder message with actual optimized model data
          setMessages((prev) => {
            return prev.map((msg) => {
              // Find the placeholder message for this optimized model
              if (
                msg.formType === "optimized-model" && 
                msg.optimizedModelId === optimizedModelId &&
                msg.status === "listening"
              ) {
                return {
                  ...msg,
                  status: "completed",
                  formData: {
                    preset_name: modelData.preset_name || "Optimized Model",
                    optimization_status: modelData.optimization_status,
                    name: modelData.name,
                    downloads: modelData.downloads || {}
                  }
                };
              }
              return msg;
            });
          });
          
          toast({
            title: "Optimization Complete",
            description: "Your model has been optimized successfully!",
          });
        } else if (pollCount >= maxPolls) {
          clearInterval(pollInterval);
          optimizationPollIntervalsRef.current.delete(optimizedModelId);
          console.error("Optimization polling timeout");
        }
      } catch (error) {
        console.error("Error polling optimized model:", error);
        if (pollCount >= maxPolls) {
          clearInterval(pollInterval);
          optimizationPollIntervalsRef.current.delete(optimizedModelId);
        }
      }
    }, 5000); // Poll every 5 seconds
    
    optimizationPollIntervalsRef.current.set(optimizedModelId, pollInterval);
  }, [toast]);

  // Reusable function to check and handle optimized_model_id in tool messages
  const handleOptimizedModelId = useCallback((msg: any) => {
    if (msg.type === "tool" && 
        (msg.name === "optimize_single_model_tool" || msg.name === "optimize_multiple_models_tool")) {
      try {
        const toolContent = typeof msg.content === 'string' ? JSON.parse(msg.content) : msg.content;
        
        if (toolContent && toolContent.optimized_model_id) {
          const optimizedModelId = toolContent.optimized_model_id;
          
          // Check if status indicates it's done or still processing
          const activeStatuses = ["running", "PENDING", "pending", "processing", "PROCESSING", "queued", "QUEUED"];
          const isDone = toolContent.status === "done" || toolContent.status === "DONE" || toolContent.optimization_status === "done";
          
          if (toolContent.success === true && toolContent.status && activeStatuses.includes(toolContent.status)) {
            // Model is processing, add placeholder and start polling
            fetchAndDisplayOptimizedModel(optimizedModelId, true);
          } 
          
          return true; // Indicates we handled this message
        }
      } catch (error) {
        console.error("Error parsing optimization tool content:", error);
      }
    }
    return false; // Not an optimization tool message
  }, [fetchAndDisplayOptimizedModel]);
  
  // Cleanup polling intervals on unmount
  useEffect(() => {
    return () => {
      optimizationPollIntervalsRef.current.forEach((interval) => {
        clearInterval(interval);
      });
      optimizationPollIntervalsRef.current.clear();
    };
  }, []);

  const handleOptimizationFormSubmit = async (type: string, data: any) => {
    console.log("Optimization form submit:", type, data);

    if (type === "model-selected") {
      // Check if the last message is already an optimization-config form
      const lastMessage = messages[messages.length - 1];
      const isLastMessageConfigForm = lastMessage && 
        lastMessage.formType === "optimization-config";
      
      // Fetch presets before showing/updating optimization config form
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
        
        // If last message is already a config form, update it instead of adding a new one
        if (isLastMessageConfigForm) {
          setMessages((prev) => {
            const updated = [...prev];
            updated[updated.length - 1] = {
              ...updated[updated.length - 1],
              formData: {
                modelId: data.modelId,
                presets: presetsData,
                isDisabled: false // Keep it enabled when updating
              }
            };
            return updated;
          });
        } else {
          // Otherwise, add a new message with the config form
          handleAddDirectMessage("assistant", "Model selected! Now configure your optimization settings:", "optimization-config", {
            modelId: data.modelId,
            presets: presetsData,
            isDisabled: false
          });
        }
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
        optimization_type: optType,
        presetId: strength,
        reduction_strength: presetText,
        modelId: modelId,
        role: 'system'
      };
      
      
      // Send instruction to agent via normal chat flow (not displayed)
      const agentInstruction = `Invoke the tool 'optimize_single_model_tool' using the following parameters: ${JSON.stringify(payload)}`;
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
    } else if (type === "show-optimization-form") {
      // When Model Optimization button is clicked, disable all previous optimization forms
      setMessages((prev) => 
        prev.map((msg) => {
          if (msg.formType === "model-selection" || msg.formType === "optimization-config") {
            return {
              ...msg,
              formData: {
                ...(msg.formData as any || {}),
                isDisabled: true
              }
            };
          }
          return msg;
        })
      );
      
      // When Model Optimization button is clicked, fetch models and display them in chat
      handleAddDirectMessage("user", "Model optimization");
      
      // Fetch models from API
      try {
        const currentToken = authToken || localStorage.getItem(LocalStorageKeys.AccessToken);
        const backendUrl = import.meta.env.VITE_API_BACKEND_URL || apiUrl;
        
        const response = await fetch(`${backendUrl}/api/model-optimization/models`, {
          headers: {
            "Authorization": currentToken ? `Bearer ${currentToken}` : "",
            "Content-Type": "application/json"
          }
        });

        if (!response.ok) throw new Error("Failed to fetch models");

        const data = await response.json();
        
        // Handle different API response formats
        const modelsArray = data.models || data || [];
        
        // Convert API models to ModelInfo format
        const models: any[] = modelsArray.map((model: any) => ({
          id: model.assetId,
          name: model.name || model.filename || model.fileName || `Model ${model.id || model.asset_id || model.assetId}`,
          image: model.thumbnail_url || model.thumbnailUrl || model.image || "/placeholder.svg",
          creationDate: model.created_at || model.createdAt 
            ? new Date(model.created_at || model.createdAt).toLocaleDateString() 
            : new Date().toLocaleDateString()
        }));

        handleAddDirectMessage("assistant", "Select a model to optimize:", "model-selection", {
          models: models,
          isDisabled: false
        });
      } catch (error) {
        console.error("Error fetching models:", error);
        toast({
          title: "Error",
          description: "Failed to load models. Please try again.",
          variant: "destructive"
        });
        handleAddDirectMessage("assistant", "Failed to load models. Please try again.");
      }
    } else if (type === "upload-new") {
      // When user clicks "Upload New" button in model selection form
      document.getElementById('model-file-input')?.click();
    }
  };

  const handleModelSelect = (modelUrl: string, thumbnailUrl: string, workflow: string) => {
    setSelectedModel({ modelUrl, thumbnailUrl, workflow });
    setActiveTab("models");
  };

  const handleLoadSession = useCallback(async (sessionId: string) => {
    try {
      const headers: HeadersInit = {
        "Content-Type": "application/json",
      };
      
      if (authToken) {
        headers["Authorization"] = `Bearer ${authToken}`;
      }

      // Get user ID from profile
      const userId = userProfile?.id;
      
      // Build URL with userId parameter
      const exportUrl = userId 
        ? `${API}/session/${sessionId}/export?userId=${encodeURIComponent(userId)}`
        : `${API}/session/${sessionId}/export`;

      const response = await fetch(exportUrl, { headers });
      if (!response.ok) {
        throw new Error("Failed to load session");
      }
      
      const data = await response.json();
      
      // Update session ID and URL
      setSessionId(sessionId);
      // Update URL with session_id query param
      const newSearchParams = new URLSearchParams(searchParams);
      newSearchParams.set("session_id", sessionId);
      setSearchParams(newSearchParams, { replace: true });
      console.log(data.messages,'here is total messages==>>>')
      // Check for optimized_model_id in tool messages before processing
      if (data.messages && Array.isArray(data.messages)) {
        for (const msg of data.messages) {
          // Check if this is an optimization tool with optimized_model_id
          if (msg.type === "tool" && 
              (msg.name === "optimize_single_model_tool" || msg.name === "optimize_multiple_models_tool")) {
            try {
              const toolContent = typeof msg.content === 'string' ? JSON.parse(msg.content) : msg.content;
              if (toolContent && toolContent.optimized_model_id) {

              //  const placeholderMessage: Message = {
              //         role: "assistant",
              //         text: "",
              //         formType: "optimized-model",
              //         status: "listening",
              //         optimizedModelId: toolContent.optimized_model_id,
              //         formData: {
              //           preset_name: "",
              //           optimization_status: "processing",
              //           name: "",
              //           downloads: {}
              //         }
              //       };
              //       setMessages((prev) => [...prev, placeholderMessage]);

                // Fetch and display the optimized model (it might be done already)
                fetchAndDisplayOptimizedModel(toolContent.optimized_model_id, true);
              }
            } catch (error) {
              console.error("Error parsing optimization tool content in session load:", error);
            }
          }
        }
      }

      // Convert messages to the format expected by ChatInterface
      // Filter out system messages only
      const loadedMessages: Message[] = data.messages
        .filter((msg: any) => msg.type !== "system")
        .map((msg: any) => {
          const content = msg.content ?? "";
          const role = msg.type === "human" ? "user" : msg.type === "ai" ? "assistant" : "assistant";

          // ✅ NEW: Persist tool_generation outputs (image/model URLs) on reload
          // The export API returns these under msg.tool_generation; SSE puts them directly on the message.
          // Normalize so AssistantMessage/MessageImageRenderer can render after reload.
          const toolGen = msg.tool_generation;
          if (role === "assistant" && toolGen && typeof toolGen === "object") {
            const imagePath = toolGen.image_path || toolGen.image_url;
            return {
              role,
              text: typeof content === "string" ? content : "",
              timestamp: toolGen.created_at ? new Date(toolGen.created_at) : new Date(),
              status: toolGen.status,
              jobId: toolGen.job_id,
              job_id: toolGen.job_id,
              type: toolGen.type,
              generation_type: toolGen.type,
              model: toolGen.model,
              image_path: imagePath,
              img_url: toolGen.image_url || toolGen.image_path,
              thumbnail_url: toolGen.thumbnail_url,
              model_url: toolGen.model_url,
            };
          }

          // Extract image URLs from content for user messages
          let imagePaths: string[] | undefined;
          if (role === "user" && typeof content === "string" && content) {
            const extractedUrls = extractImageUrls(content);
            if (extractedUrls.length > 0) {
              imagePaths = extractedUrls;
            }
          }

          return {
            ...msg,
            role,
            text: typeof content === "string" ? content : "",
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
  }, [authToken, userProfile?.id, API, toast, fetchAndDisplayOptimizedModel, searchParams, setSearchParams]);

  // Check URL params on mount to restore session or start new chat
  // This runs after handleLoadSession is defined
  useEffect(() => {
    // Only proceed if we have authToken and userProfile, and haven't checked yet
    if (!authToken || !userProfile?.id || hasCheckedUrlParamsRef.current) {
      return;
    }

    const sessionIdFromUrl = searchParams.get("session_id");
    
    if (sessionIdFromUrl) {
      // Mark as checked to prevent multiple loads
      hasCheckedUrlParamsRef.current = true;
      // Load the session from URL param
      handleLoadSession(sessionIdFromUrl).catch((error) => {
        console.error("Failed to restore session from URL:", error);
        // If restoration fails, remove the param and start fresh
        const newSearchParams = new URLSearchParams(searchParams);
        newSearchParams.delete("session_id");
        setSearchParams(newSearchParams, { replace: true });
        setSessionId(null);
        setMessages([]);
      });
    } else {
      // No session_id in URL - start fresh chat
      hasCheckedUrlParamsRef.current = true;
      setSessionId(null);
      setMessages([]);
    }
  }, [userProfile?.id, authToken, handleLoadSession, searchParams, setSearchParams]);

  // If we arrive with an initial_prompt (from Home), auto-send it once
  useEffect(() => {
    if (!authToken || !userProfile?.id || hasSentInitialPromptRef.current) {
      return;
    }

    const initialPrompt = searchParams.get("initial_prompt");
    if (!initialPrompt) return;

    hasSentInitialPromptRef.current = true;

    // Parse any initial image URLs passed from Home
    let initialImages: string[] | undefined;
    const encodedImages = searchParams.get("image_urls");
    if (encodedImages) {
      try {
        initialImages = JSON.parse(decodeURIComponent(encodedImages));
      } catch (err) {
        console.error("Failed to parse initial image URLs:", err);
      }
    }

    // Start a fresh chat for this prompt
    setSessionId(null);

    // Fire and forget; any errors will be logged
    handleSendMessage(initialPrompt, initialImages).catch((err) => {
      console.error("Failed to send initial prompt from Home:", err);
    });

    const newSearchParams = new URLSearchParams(searchParams);
    newSearchParams.delete("initial_prompt");
    newSearchParams.delete("image_urls");
    setSearchParams(newSearchParams, { replace: true });
  }, [authToken, userProfile?.id, searchParams, setSearchParams, handleSendMessage]);

  // Handle when sessions are loaded from sidebar
  // Don't auto-load any session - user must explicitly click to load a chat
  const handleSessionsLoaded = useCallback((sessions: Array<{ session_id: string }>) => {
    // No auto-loading - user starts with a fresh chat
    // They can click on any session in the sidebar to load it
  }, []);

  const handleNewChat = () => {
    setSessionId(null);
    // Remove session_id from URL
    const newSearchParams = new URLSearchParams(searchParams);
    newSearchParams.delete("session_id");
    setSearchParams(newSearchParams, { replace: true });
    setMessages([]);
    toast({
      title: "New Chat Started",
      description: "You can now start a fresh conversation.",
    });
  };

  return (
    <div className="flex h-screen bg-background overflow-hidden max-h-screen">
      {/* First-time onboarding modal, controlled by backend flag - calls API */}
      {showOnboarding && (
        <OnboardingModal
          shouldShow={showOnboarding}
          onCompleted={async () => {
            setShowOnboarding(false);
            try {
              await apiFetch('/user/profile/mark-credits-bonus-seen', { method: 'POST' });
              queryClient.invalidateQueries({ queryKey: ['user-profile'] });
            } catch (err) {
              console.error('Failed to mark onboarding as seen', err);
            }
          }}
        />
      )}
      
      {/* Tutorial onboarding modal - triggered by Tutorial button, does NOT call API */}
      {showTutorialOnboarding && (
        <OnboardingModal
          shouldShow={showTutorialOnboarding}
          onCompleted={() => {
            setShowTutorialOnboarding(false);
          }}
        />
      )}
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
            // Set loading state on model selection form
            setMessages((prev) =>
              prev.map((msg) =>
                msg.formType === "model-selection" && msg.formData && typeof msg.formData === "object"
                  ? {
                      ...msg,
                      formData: {
                        ...(msg.formData as Record<string, any>),
                        isUploading: true,
                      },
                    }
                  : msg
              )
            );

            try {
              const currentToken = authToken || localStorage.getItem(LocalStorageKeys.AccessToken);
              
              if (!currentToken) {
                // Reset loading state on error
                setMessages((prev) =>
                  prev.map((msg) =>
                    msg.formType === "model-selection" && msg.formData && typeof msg.formData === "object"
                      ? {
                          ...msg,
                          formData: {
                            ...(msg.formData as Record<string, any>),
                            isUploading: false,
                          },
                        }
                      : msg
                  )
                );
                toast({
                  title: "Authentication required",
                  description: "Please authenticate first to upload models.",
                  variant: "destructive",
                });
                return;
              }

              toast({
                title: "Preparing upload...",
                description: "Getting upload credentials",
              });

              const backendUrl = import.meta.env.VITE_API_BACKEND_URL || apiUrl;
              const signedUrlResponse = await fetch(`${backendUrl}/api/model-optimization/get-signed-url`, {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  "Authorization": `Bearer ${currentToken}`
                },
                body: JSON.stringify({
                  model_name: file.name,
                  filename: file.name,
                }),
              });

              if (!signedUrlResponse.ok) {
                throw new Error(`Request failed with status ${signedUrlResponse.status}`);
              }

              const { s3_upload_url, asset_id } = await signedUrlResponse.json();

              toast({
                title: "Uploading...",
                description: "Uploading your model to storage",
              });

              const uploadResponse = await fetch(s3_upload_url, {
                method: "PUT",
                headers: { "Content-Type": "application/octet-stream" },
                body: file,
              });

              if (!uploadResponse.ok) {
                throw new Error("Failed to upload model to S3");
              }

              toast({
                title: "Registering...",
                description: "Registering your model for optimization",
              });

              const completeResponse = await fetch(`${backendUrl}/api/model-optimization/complete-upload/${asset_id}`, {
                method: "GET",
                headers: {
                  "Authorization": `Bearer ${currentToken}`,
                  "Content-Type": "application/json",
                },
              });

              if (!completeResponse.ok) {
                throw new Error("Model registration failed");
              }

              toast({
                title: "Success!",
                description: "Your model has been uploaded and registered for optimization.",
              });

              // Reset loading state after successful upload
              setMessages((prev) =>
                prev.map((msg) =>
                  msg.formType === "model-selection" && msg.formData && typeof msg.formData === "object"
                    ? {
                        ...msg,
                        formData: {
                          ...(msg.formData as Record<string, any>),
                          isUploading: false,
                        },
                      }
                    : msg
                )
              );

              // Trigger refresh of optimization form models
              window.dispatchEvent(new CustomEvent("refreshOptimizationModels"));
              
              // Trigger refresh of model selection form in chat
              window.dispatchEvent(new CustomEvent("refreshModelSelectionForm"));
            } catch (error) {
              console.error("Model upload error:", error);
              // Reset loading state on error
              setMessages((prev) =>
                prev.map((msg) =>
                  msg.formType === "model-selection" && msg.formData && typeof msg.formData === "object"
                    ? {
                        ...msg,
                        formData: {
                          ...(msg.formData as Record<string, any>),
                          isUploading: false,
                        },
                      }
                    : msg
                )
              );
              toast({
                title: "Upload failed",
                description: error instanceof Error ? error.message : "Failed to upload model",
                variant: "destructive",
              });
            }
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
        onSessionsLoaded={handleSessionsLoaded}
        onTutorialClick={() => setShowTutorialOnboarding(true)}
        projectName={currentProject?.name}
        projectId={projectIdFromUrl}
      />
      
      <ResizablePanelGroup direction="horizontal" className="h-full flex-1">
        {/* Chat Interface - Resizable Left Panel */}
        <ResizablePanel defaultSize={65} minSize={60} maxSize={75}>
          <ErrorBoundary>
            <ChatInterface
              messages={messages}
              onSendMessage={handleSendMessage}
              onToolConfirmation={handleToolConfirmation}
              isGenerating={isGenerating}
              apiUrl={apiUrl}
              onModelSelect={handleModelSelect}
              onImageGenerated={handleImageGenerated}
              onModelGenerated={handleModelGenerated}
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
              
              {/* Workflow Chain Progress/Results */}
              {workflowChain && (
                <div className="border-b p-4 bg-muted/20">
                  {workflowResults ? (
                    // Success message - shows for 3 seconds then auto-removes
                    <div className="w-full space-y-4 p-4 rounded-lg bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30 border-2 border-green-200 dark:border-green-800">
                      <div className="text-center space-y-2">
                        <h3 className="text-xl font-bold text-green-900 dark:text-green-100 flex items-center justify-center gap-2">
                          🎉 Workflow Chain Progress Complete!
                        </h3>
                        <div className="grid grid-cols-2 gap-4 mt-4">
                          <div className="p-3 rounded-lg bg-white/50 dark:bg-black/20 border border-green-200 dark:border-green-800">
                            <span className="block text-xs text-green-600 dark:text-green-400">Tasks Completed</span>
                            <span className="text-2xl font-bold text-green-900 dark:text-green-100">
                              {workflowChain.total_tasks}/{workflowChain.total_tasks}
                            </span>
                          </div>
                          <div className="p-3 rounded-lg bg-white/50 dark:bg-black/20 border border-green-200 dark:border-green-800">
                            <span className="block text-xs text-green-600 dark:text-green-400">Results Generated</span>
                            <span className="text-2xl font-bold text-green-900 dark:text-green-100">
                              {workflowResults.images.length + workflowResults.models.length}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <WorkflowProgressDisplay
                      chainId={workflowChain.chain_id}
                      totalTasks={workflowChain.total_tasks}
                      currentTask={workflowProgress.current}
                      currentStatus={workflowStatus}
                      isLoading={isWorkflowLoading}
                      error={workflowError}
                    />
                  )}
                </div>
              )}
              
              <TabsContent value="images" className="flex-1 m-0 overflow-hidden">
                <ImageViewer 
                  apiUrl={apiUrl} 
                  refreshTrigger={imageRefreshTrigger}
                  onRemixImage={(imageUrl) => {
                    // Dispatch custom event to add image to chat input
                    window.dispatchEvent(new CustomEvent('remixImage', { detail: { imageUrl } }));
                  }}
                />
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
                    <ModelViewer 
                      apiUrl={apiUrl} 
                      selectedModel={selectedModel} 
                      refreshTrigger={modelRefreshTrigger}
                      onInternalModelSelect={() => setSelectedModel(null)}
                    />
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