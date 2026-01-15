import { useState, useEffect, useCallback, useRef } from "react";
import ChatInterface from "@/components/ChatInterface";
import ImageViewer from "@/components/ImageViewer";
import ModelViewer from "@/components/ModelViewer";
import ModelOptimization from "@/components/ModelOptimization";
import { ChatSidebar } from "@/components/ChatSidebar";
import { useUserProfile } from "@/hooks/use-user-profile";
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

  const apiUrl = import.meta.env.VITE_API_BASE_URL;


  //const apiUrl = "http://localhost:8080";
  const API = apiUrl;
 
  // Load token from localStorage only
  useEffect(() => {
    const storedToken = localStorage.getItem(LocalStorageKeys.AccessToken);
    if (storedToken) {
      setAuthToken(storedToken);
    }
  }, []);

  // Start with a new chat on page load/refresh
  // Don't load stored session - always start fresh
  useEffect(() => {
    // Clear any stored session on mount to ensure fresh start
    localStorage.removeItem("mcp_session_id");
    setSessionId(null);
    setMessages([]);
  }, []);

  // Cleanup workflow SSE on unmount
  useEffect(() => {
    return () => {
      if (chainSSERef.current) {
        chainSSERef.current.close();
      }
    };
  }, []);

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
    localStorage.setItem("mcp_session_id", newSessionId);
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

  const handleSendMessage = async (text: string, imageUrls?: string[], blobPaths?: string[], aiResponse?: any, uploadSessionId?: string) => {
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
          .map((m: any) => m.jobId)
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
            if (msg.type === "tool" && 
                (msg.name === "optimize_single_model_tool" || msg.name === "optimize_multiple_models_tool")) {
              try {
                const toolContent = typeof msg.content === 'string' ? JSON.parse(msg.content) : msg.content;
                // Check for success and any status that indicates optimization has started
                const activeStatuses = ["running", "PENDING", "pending", "processing", "PROCESSING", "queued", "QUEUED"];
                if (toolContent && 
                    toolContent.success === true && 
                    toolContent.status && 
                    activeStatuses.includes(toolContent.status)) {
                  // If optimized_model_id exists, add placeholder and start polling for the optimized model
                  if (toolContent.optimized_model_id) {
                    // Add placeholder message for optimized model
                    const placeholderMessage: Message = {
                      role: "assistant",
                      text: "",
                      formType: "optimized-model",
                      status: "listening",
                      optimizedModelId: toolContent.optimized_model_id,
                      formData: {
                        preset_name: "",
                        optimization_status: "processing",
                        name: "",
                        downloads: {}
                      }
                    };
                    setMessages((prev) => [...prev, placeholderMessage]);
                    
                    // Start polling
                    startPollingOptimizedModel(toolContent.optimized_model_id);
                  }
                  
                  console.log("Model optimization started, redirecting to optimization tab and starting polling in 5 seconds", toolContent);
                  break; // Only handle the first optimization found
                }
              } catch (error) {
                console.error("Error parsing optimization tool content:", error);
              }
            }
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
            generation_type: event.task_type === "image_editing" ? "image_editing" : "image_generation",
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
        
        const imagePath = event.image_path || event.output?.image_path;
        if (imagePath) {
          setMessages((prev) =>
            prev.map((msg: any) => {
              if (msg.job_id === event.job_id || (msg.chainId === event.chain_id && msg.taskNumber === event.task_number)) {
                return { ...msg, status: "COMPLETED", image_path: imagePath, text: `✅ Task ${event.task_number}/${event.total_tasks} completed` };
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
              if (output && output.image_path) {
                const alreadyHasImage = updatedMessages.some((msg: any) => msg.image_path === output.image_path);
                if (!alreadyHasImage) {
                  const taskNumber = index + 1;
                  const placeholderIndex = updatedMessages.findIndex(
                    (msg: any) => msg.chainId === event.chain_id && msg.taskNumber === taskNumber && !msg.image_path
                  );
                  if (placeholderIndex !== -1) {
                    updatedMessages[placeholderIndex] = { ...updatedMessages[placeholderIndex], status: "COMPLETED", image_path: output.image_path, text: `✅ Result ${taskNumber}/${outputKeys.length}` };
                  } else {
                    updatedMessages.push({ role: "assistant", text: `✅ Result ${taskNumber}/${outputKeys.length}`, status: "COMPLETED", image_path: output.image_path, generation_type: output.type || "image_generation", job_id: output.job_id });
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
  }, [authToken, userProfile?.email, API, toast]);

  // Handle when sessions are loaded from sidebar
  // Don't auto-load any session - user must explicitly click to load a chat
  const handleSessionsLoaded = useCallback((sessions: Array<{ session_id: string }>) => {
    // No auto-loading - user starts with a fresh chat
    // They can click on any session in the sidebar to load it
  }, []);

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
                    <WorkflowChainResults
                      chainId={workflowChain.chain_id}
                      images={workflowResults.images}
                      models={workflowResults.models}
                      totalTasks={workflowChain.total_tasks}
                      onClose={() => {
                        setWorkflowChain(null);
                        setWorkflowResults(null);
                        setWorkflowProgress({ current: 0, total: 0 });
                        setWorkflowStatus("");
                      }}
                    />
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