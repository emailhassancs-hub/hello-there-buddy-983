import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import ReactMarkdown from "react-markdown";
import { Dialog, DialogContent, DialogClose, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Send, Sparkles, BookOpen, Plus, Upload, FileText, ChevronDown, ChevronUp, X, Box, User } from "lucide-react";
import toolsIcon from "@/assets/tools-icon.png";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import TypewriterText from "./TypewriterText";
import { ModelSelectionForm, OptimizationConfigForm, OptimizationResultForm } from "./OptimizationForms";
import { OptimizationInlineForm } from "./OptimizationInlineForm";

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
  imagePaths?: string[];
  formType?: "model-selection" | "optimization-config" | "optimization-result" | "optimization-inline";
  formData?: any;
}

interface ChatInterfaceProps {
  messages: Message[];
  onSendMessage: (message: string) => void;
  onToolConfirmation?: (action: "confirm" | "modify" | "cancel", modifiedArgs?: Record<string, Record<string, any>>) => void;
  isGenerating?: boolean;
  apiUrl: string;
  onModelSelect?: (modelUrl: string, thumbnailUrl: string, workflow: string) => void;
  onImageGenerated?: () => void;
  onOptimizationFormSubmit?: (type: string, data: any) => void;
}

const ChatInterface = ({ messages, onSendMessage, onToolConfirmation, isGenerating, apiUrl, onModelSelect, onImageGenerated, onOptimizationFormSubmit }: ChatInterfaceProps) => {
  const [inputValue, setInputValue] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const modelFileInputRef = useRef<HTMLInputElement>(null);
  const [editedArgs, setEditedArgs] = useState<Record<string, Record<string, any>>>({});
  const [showRawJson, setShowRawJson] = useState<Record<string, boolean>>({});
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [uploadedImages, setUploadedImages] = useState<{ file: File; preview: string }[]>([]);
  const [zoomedImage, setZoomedImage] = useState<string | null>(null);
  const [text3dPopup, setText3dPopup] = useState<string | null>(null);
  const [humanInLoop, setHumanInLoop] = useState(false);
  const { toast } = useToast();

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

  // Memoize filtered messages to prevent infinite re-renders
  const filteredMessages = useMemo(() => {
    return messages.filter(msg => !isToolInvocation(msg.text));
  }, [messages, isToolInvocation]);

  const welcomeMessages = [
    "Chat with me",
    "I will help you generate and edit images of your choice",
    "You can upload your image and I will segment the image for you or remove the background",
    "You can edit the image however you like, you can ask me the add or remove a certain object or maybe change its colour",
    "I will enhance your prompt for better image generation or generate the prompt from your image"
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  };

  useEffect(() => {
    if (filteredMessages.length > 0) {
      scrollToBottom();
    }
  }, [filteredMessages]);

  // Detect when an image is generated in messages
  useEffect(() => {
    if (filteredMessages.length > 0) {
      const lastMessage = filteredMessages[filteredMessages.length - 1];
      if (lastMessage.role === "assistant") {
        try {
          const parsed = JSON.parse(lastMessage.text);
          if (parsed?.img_url) {
            onImageGenerated?.();
          }
          // Detect text-to-3D thumbnail and show popup
          if (parsed?.thumbnail_url && lastMessage.toolName?.includes('text_to_3d')) {
            setText3dPopup(parsed.thumbnail_url);
          }
        } catch (e) {
          // Not JSON, ignore
        }
      }
    }
  }, [filteredMessages, onImageGenerated]);

  // Initialize edited args when confirmation is needed
  useEffect(() => {
    const lastMessage = messages[messages.length - 1];
    if (lastMessage && lastMessage.status === "awaiting_confirmation" && lastMessage.toolCalls) {
      const initialArgs: Record<string, Record<string, any>> = {};
      lastMessage.toolCalls.forEach(tc => {
        initialArgs[tc.name] = { ...tc.args };
      });
      setEditedArgs(initialArgs);
      
      // Auto-confirm if human in loop is OFF - don't send confirmation message
      if (!humanInLoop) {
        // Directly call the confirmation handler without showing UI
        const payloadArgs: Record<string, Record<string, any>> = {};
        lastMessage.toolCalls.forEach(tc => {
          payloadArgs[tc.name] = { ...tc.args };
        });
        onToolConfirmation?.("confirm", payloadArgs);
      }
    }
  }, [messages, humanInLoop, onToolConfirmation]);

  useEffect(() => {
    if (filteredMessages.length > 0) return;

    const interval = setInterval(() => {
      setIsVisible(false);
      
      setTimeout(() => {
        setCurrentMessageIndex((prev) => (prev + 1) % welcomeMessages.length);
        setIsVisible(true);
      }, 500);
    }, 3500);

    return () => clearInterval(interval);
  }, [filteredMessages.length, welcomeMessages.length]);

  // Auto-resize textarea based on content
  const adjustTextareaHeight = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  };

  useEffect(() => {
    adjustTextareaHeight();
  }, [inputValue]);

  const handleSend = async () => {
    if ((!inputValue.trim() && uploadedImages.length === 0) || isGenerating) return;
    
    let imagePaths: string[] = [];
    
    // Upload all images at once if any
    if (uploadedImages.length > 0) {
      const files = uploadedImages.map(img => img.file);
      imagePaths = await uploadImages(files);
    }
    
    // Send message text and image paths separately
    const messageText = inputValue.trim();
    
    // Include image paths in the message for backend processing
    let messageToSend = messageText;
    if (imagePaths.length > 0) {
      const imagePathsText = imagePaths.map(path => `[Image: ${path}]`).join('\n');
      messageToSend = `${messageText}\n${imagePathsText}`.trim();
    }
    
    onSendMessage(messageToSend);
    
    // Clear uploaded images and their previews
    uploadedImages.forEach(img => URL.revokeObjectURL(img.preview));
    setUploadedImages([]);
    setInputValue("");
    
    // Reset textarea height after sending
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    }, 0);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleConfirm = (toolCalls: ToolCall[]) => {
    // Build a clean modified_args object limited to the shown tool calls,
    // merging original args with any user edits so nothing is lost.
    const errors: Record<string, string> = {};
    const payloadArgs: Record<string, Record<string, any>> = {};

    toolCalls.forEach((tc) => {
      const original = (tc.args || {}) as Record<string, any>;
      const edits = (editedArgs[tc.name] || {}) as Record<string, any>;
      const merged = { ...original, ...edits } as Record<string, any>;

      // Validate merged values
      Object.entries(merged).forEach(([key, value]) => {
        const isNumeric = key.includes("num_") || key.includes("count") || key.includes("number");
        if (isNumeric && (value === "" || value === null || value === undefined || isNaN(Number(value)))) {
          errors[`${tc.name}.${key}`] = "Must be a number";
        }
        if (value === "" || value === null || value === undefined) {
          errors[`${tc.name}.${key}`] = "This field is required";
        }
      });

      payloadArgs[tc.name] = merged;
    });

    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      toast({
        title: "Validation Error",
        description: "Please fix the errors before submitting.",
        variant: "destructive",
      });
      return;
    }

    setValidationErrors({});
    onToolConfirmation?.("modify", payloadArgs);
  };

  const handleCancel = (toolCalls: ToolCall[]) => {
    onToolConfirmation?.("cancel");
  };

  const handleArgChange = (toolName: string, argKey: string, value: any) => {
    setEditedArgs(prev => ({
      ...prev,
      [toolName]: {
        ...prev[toolName],
        [argKey]: value,
      },
    }));
    // Clear validation error for this field
    const errorKey = `${toolName}.${argKey}`;
    if (validationErrors[errorKey]) {
      setValidationErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[errorKey];
        return newErrors;
      });
    }
  };

  const uploadImages = async (files: File[]): Promise<string[]> => {
    const formData = new FormData();
    
    // Append each file as "files" (plural)
    for (const file of files) {
      formData.append("files", file);
    }

    try {
      const headers: HeadersInit = {};
      const authToken = (window as any).authToken;
      
      if (authToken) {
        headers["Authorization"] = `Bearer ${authToken}`;
      }

      const response = await fetch(`${apiUrl}/upload`, {
        method: "POST",
        headers,
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.statusText}`);
      }

      const data = await response.json();
      
      // Expect { paths: ["images/img1.png", "images/img2.jpg"] } from backend
      const serverPaths = data.paths;
      
      if (!serverPaths || !Array.isArray(serverPaths)) {
        throw new Error("Backend did not return image paths");
      }
      
      toast({
        title: "Success",
        description: `${serverPaths.length} image(s) uploaded successfully`,
      });
      
      return serverPaths;
    } catch (error) {
      console.error("Upload error:", error);
      toast({
        title: "Error",
        description: "Failed to upload images",
        variant: "destructive",
      });
      return [];
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const newImages = Array.from(files)
        .filter(file => file.type.startsWith('image/'))
        .map(file => ({
          file,
          preview: URL.createObjectURL(file)
        }));
      setUploadedImages(prev => [...prev, ...newImages]);
    }
    // Reset input so same files can be selected again
    e.target.value = '';
  };

  const removeImage = (index: number) => {
    setUploadedImages(prev => {
      const newImages = [...prev];
      URL.revokeObjectURL(newImages[index].preview);
      newImages.splice(index, 1);
      return newImages;
    });
  };

  const triggerFileUpload = () => {
    fileInputRef.current?.click();
  };

  const handleModelOptimization = async (file: File) => {
    try {
      const authToken = (window as any).authToken;
      
      if (!authToken) {
        toast({
          title: "Authentication required",
          description: "Please authenticate first to upload models.",
          variant: "destructive",
        });
        return;
      }

      // Extract model name from filename (without extension)
      const modelName = file.name.replace(/\.[^/.]+$/, "");
      const filename = file.name;

      // Step 1: Get signed URL
      toast({
        title: "Preparing upload...",
        description: "Getting upload credentials",
      });

      const signedUrlResponse = await fetch(`${apiUrl}/api/model-optimization/get-signed-url`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${authToken}`
        },
        body: JSON.stringify({
          model_name: filename,
          filename: filename,
        }),
      });

      if (!signedUrlResponse.ok) {
        throw new Error(`Request failed with status ${signedUrlResponse.status}`);
      }

      const { s3_upload_url, asset_id } = await signedUrlResponse.json();
      console.log("✅ Received signed URL:", { s3_upload_url, asset_id });

      // Step 2: Upload to S3
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

      // Step 3: Complete upload/register model
      toast({
        title: "Registering...",
        description: "Registering your model for optimization",
      });

      const completeResponse = await fetch(`${apiUrl}/api/model-optimization/complete-upload/${asset_id}`, {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${authToken}`,
          "Content-Type": "application/json",
        },
      });

      if (!completeResponse.ok) {
        throw new Error("Model registration failed");
      }

      const result = await completeResponse.json();

      toast({
        title: "Success!",
        description: "Your model has been uploaded and registered for optimization.",
      });

      console.log("Model registered successfully:", result);
    } catch (error) {
      console.error("❌ Model optimization error:", error);
      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : "Failed to upload model",
        variant: "destructive",
      });
    }
  };

  const triggerModelUpload = () => {
    // Trigger the model optimization flow
    onOptimizationFormSubmit?.("model-optimization-clicked", {});
  };

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 p-6 border-b glass shadow-soft">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-primary dark:bg-white">
            <BookOpen className="w-6 h-6 text-primary-foreground dark:text-black" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-foreground dark:text-white">Game AI Studio</h2>
            <p className="text-sm text-muted-foreground dark:text-white/70">Create and edit images with AI</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={() => window.location.href = "/game-design-pro"}
            className="relative group overflow-hidden bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-white shadow-lg hover:shadow-xl transition-all duration-300 px-4 py-1.5 rounded-lg border border-primary/20"
          >
            <span className="relative z-10 flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              <span className="font-semibold">Game Design</span>
            </span>
            {/* Shine effect */}
            <span className="absolute inset-0 w-full h-full before:absolute before:inset-0 before:w-1/4 before:h-full before:bg-gradient-to-r before:from-transparent before:via-white/30 before:to-transparent before:skew-x-[-20deg] before:-translate-x-full before:animate-[shine_10s_ease-in-out_infinite]" />
          </Button>
          <ThemeToggle />
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-8 glass scrollbar-hide">
        {filteredMessages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center space-y-4">
            <div className="p-4 rounded-full bg-primary shadow-soft">
              <Sparkles className="w-8 h-8 text-primary-foreground" />
            </div>
            <div
              className={`transition-opacity duration-500 ${
                isVisible ? "opacity-100" : "opacity-0"
              }`}
            >
              <p className="text-chat-assistant-foreground text-lg max-w-md font-medium">
                {welcomeMessages[currentMessageIndex]}
              </p>
            </div>
          </div>
        )}

        {filteredMessages.map((message, index) => {
          return (
            <div key={index}>
              {/* User message with bubble, assistant without bubble */}
            {message.role === "user" ? (
              <div className="flex justify-end">
                <div className="max-w-[80%] p-4 rounded-2xl shadow-soft chat-bubble-enter bg-chat-user-bubble text-chat-user-foreground ml-4">
                  {(() => {
                    // Extract text without image markers
                    const textWithoutImages = message.text.replace(/\[Image:.*?\]/g, '').trim();
                    // Extract image paths
                    const imageMatches = message.text.match(/\[Image: (.*?)\]/g);
                    const imagePaths = imageMatches?.map(match => match.match(/\[Image: (.*?)\]/)?.[1]).filter(Boolean) || [];
                    
                    return (
                      <>
                        {textWithoutImages && (
                          <div className="whitespace-pre-wrap mb-2">
                            {textWithoutImages}
                          </div>
                        )}
                        {imagePaths.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {imagePaths.map((imagePath, idx) => {
                              const imageUrl = `${apiUrl}/${imagePath}`;
                              return (
                                <img
                                  key={idx}
                                  src={imageUrl}
                                  alt="Uploaded"
                                  className="w-16 h-16 object-cover rounded-lg border border-border/50"
                                  onError={(e) => {
                                    console.error('Image load error for:', imageUrl);
                                    e.currentTarget.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="64" height="64"%3E%3Crect fill="%23ddd" width="64" height="64"/%3E%3Ctext x="50%25" y="50%25" font-size="10" text-anchor="middle" dy=".3em"%3EImage%3C/text%3E%3C/svg%3E';
                                  }}
                                />
                              );
                            })}
                          </div>
                        )}
                      </>
                    );
                  })()}
                  {message.timestamp && (
                    <div className="text-xs opacity-70 mt-2">
                      {message.timestamp.toLocaleTimeString()}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex justify-start">
                <div className="max-w-[80%] chat-bubble-enter">
                  <div className="flex items-center gap-1.5 mb-2">
                    <Sparkles className="w-3.5 h-3.5 text-muted-foreground" />
                    <span className="text-xs font-bold text-muted-foreground">Game AI Studio</span>
                  </div>
                  {(() => {
                    // Ensure message.text is a string
                    if (typeof message.text !== 'string') {
                      return null;
                    }

                    // Check for 3D model tool messages
                    const is3DModelTool = message.toolName && (
                      message.toolName.includes('image_to_3d') || 
                      message.toolName.includes('text_to_3d') || 
                      message.toolName.includes('post_processing')
                    );

                    if (is3DModelTool) {
                      // Check if it's an error message
                      if (message.text.includes('Error executing tool') || message.text.includes('500 Server Error')) {
                        return (
                          <div className="space-y-2">
                            <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                              <p className="text-sm text-destructive">Failed to generate 3D model. Please try again.</p>
                            </div>
                          </div>
                        );
                      }

                      // Try to parse successful response
                      try {
                        const parsed = JSON.parse(message.text);
                        if (parsed && parsed.thumbnail_url && parsed.model_url) {
                          const workflow = message.toolName.includes('image_to_3d') ? 'image_to_3d' :
                                          message.toolName.includes('text_to_3d') ? 'text_to_3d' : 'post_processing';
                          
                          return (
                            <div className="space-y-2">
                              <img 
                                src={parsed.thumbnail_url}
                                alt="3D Model Preview"
                                className="rounded-lg max-w-full h-auto cursor-pointer hover:opacity-80 transition-opacity"
                                onClick={() => onModelSelect?.(parsed.model_url, parsed.thumbnail_url, workflow)}
                              />
                              <p className="text-xs text-muted-foreground italic">Click thumbnail to view 3D model</p>
                            </div>
                          );
                        }
                      } catch (e) {
                        // Not valid JSON, hide the raw response
                        return null;
                      }

                      // Hide raw tool responses for 3D tools
                      return null;
                    }

                    // Check if message is a plain URL (some tools return just the URL)
                    const urlPattern = /^https?:\/\/.+/;
                    if (urlPattern.test(message.text.trim())) {
                      const ImageWithFallback = () => {
                        const [hasError, setHasError] = useState(false);
                        
                        if (hasError) {
                          return (
                            <div className="text-sm text-muted-foreground">
                              Image preview unavailable.{' '}
                              <a 
                                href={message.text.trim()} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="underline hover:text-primary"
                              >
                                View link
                              </a>
                            </div>
                          );
                        }
                        
                        return (
                          <img 
                            src={message.text.trim()}
                            alt="Tool response thumbnail"
                            className="cursor-pointer hover:opacity-90 transition-opacity"
                            style={{ 
                              width: '200px',
                              borderRadius: '8px',
                              objectFit: 'cover',
                              marginTop: '8px'
                            }}
                            onError={() => setHasError(true)}
                            onClick={() => setZoomedImage(message.text.trim())}
                          />
                        );
                      };
                      
                      return <ImageWithFallback />;
                    }

                    // Check if message contains image response (JSON object with img_url or thumbnail_url)
                    try {
                      const parsed = JSON.parse(message.text);
                      
                      // Check for thumbnail_url in the response (priority)
                      if (parsed?.thumbnail_url) {
                        const ImageWithFallback = () => {
                          const [hasError, setHasError] = useState(false);
                          
                          if (hasError) {
                            return (
                              <div className="text-sm text-muted-foreground">
                                Image preview unavailable.{' '}
                                <a 
                                  href={parsed.thumbnail_url} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="underline hover:text-primary"
                                >
                                  View image
                                </a>
                              </div>
                            );
                          }
                          
                          return (
                            <img 
                              src={parsed.thumbnail_url}
                              alt={parsed.prompt || 'Generated thumbnail'}
                              className="cursor-pointer hover:opacity-90 transition-opacity"
                              style={{ 
                                width: '200px',
                                borderRadius: '8px',
                                objectFit: 'cover',
                                marginTop: '8px'
                              }}
                              onError={() => setHasError(true)}
                              onClick={() => setZoomedImage(parsed.thumbnail_url)}
                            />
                          );
                        };
                        
                        return <ImageWithFallback />;
                      }
                      
                      // Check for img_url in the response
                      if (parsed?.img_url) {
                        const ImageWithFallback = () => {
                          const [hasError, setHasError] = useState(false);
                          
                          if (hasError) {
                            return (
                              <div className="text-sm text-muted-foreground">
                                Image preview unavailable.{' '}
                                <a 
                                  href={parsed.img_url} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="underline hover:text-primary"
                                >
                                  View image
                                </a>
                              </div>
                            );
                          }
                          
                          return (
                            <div className="space-y-2">
                              <img 
                                src={parsed.img_url}
                                alt={parsed.filename || 'Generated image'}
                                className="rounded-xl max-w-[320px] h-auto cursor-pointer hover:opacity-90 transition-opacity"
                                style={{ marginTop: '8px' }}
                                onError={() => setHasError(true)}
                                onClick={() => setZoomedImage(parsed.img_url)}
                              />
                              {parsed.prompt && (
                                <p className="text-xs text-muted-foreground italic whitespace-pre-wrap break-words">{parsed.prompt}</p>
                              )}
                            </div>
                          );
                        };
                        
                        return <ImageWithFallback />;
                      }
                      
                      // Fallback to existing type: "image" check
                      if (parsed && (parsed.type === "image" || (Array.isArray(parsed) && parsed.some((item: any) => item.type === "image")))) {
                        const imageData = Array.isArray(parsed) ? parsed.find((item: any) => item.type === "image") : parsed;
                        const imagePath = imageData.path || imageData.filename;
                        const prompt = imageData.prompt || "Generated image";
                        
                        return (
                          <div className="space-y-2">
                            <img 
                              src={imagePath.startsWith('http') ? imagePath : `${apiUrl}/${imagePath}`}
                              alt={prompt}
                              className="rounded-lg max-w-full h-auto cursor-pointer hover:opacity-90 transition-opacity"
                              onClick={() => setZoomedImage(imagePath.startsWith('http') ? imagePath : `${apiUrl}/${imagePath}`)}
                            />
                            <p className="text-xs text-muted-foreground italic">Generated image</p>
                          </div>
                        );
                      }
                    } catch (e) {
                      // Not JSON, check if it's a plain image path
                    }
                    
                    // Check if message is a plain image path (e.g., "images\filename.png")
                    const imagePathPattern = /^images[\\/][\w\-_.]+\.(png|jpg|jpeg|gif|webp)$/i;
                    if (imagePathPattern.test(message.text.trim())) {
                      const imagePath = message.text.trim().replace(/\\/g, '/');
                      return (
                        <div className="space-y-2">
                          <img 
                            src={`${apiUrl}/${imagePath}`}
                            alt="Generated image"
                            className="rounded-lg max-w-full h-auto cursor-pointer hover:opacity-90 transition-opacity"
                            onClick={() => setZoomedImage(`${apiUrl}/${imagePath}`)}
                          />
                          <p className="text-xs text-muted-foreground italic">Generated image</p>
                        </div>
                      );
                    }
                    
                    return <TypewriterText text={message.text} speed={3} />;
                  })()}

                  {/* Show raw tool response - render image directly if tool returns image URL */}
                  {message.toolName && message.text && (() => {
                    const trimmedText = message.text.trim();
                    const isImageUrl = /\.(jpg|jpeg|png|gif|webp|svg)(\?.*)?$/i.test(trimmedText) || 
                                     trimmedText.includes('/model-images/') ||
                                     /\.(png|webp)$/i.test(trimmedText);
                    
                    // If tool response is an image URL, render it directly in chat
                    if (isImageUrl) {
                      return (
                        <div className="space-y-2 mt-3">
                          <img 
                            src={message.text.trim()} 
                            alt="Generated content" 
                            className="rounded-lg max-w-md h-auto cursor-pointer hover:opacity-90 transition-opacity border border-border shadow-sm"
                            onClick={() => setZoomedImage(message.text.trim())}
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                            }}
                          />
                          <p className="text-xs text-muted-foreground italic">Click to zoom</p>
                        </div>
                      );
                    }
                    
                    // Otherwise show collapsible for non-image tool responses
                    return (
                      <Collapsible className="mt-3">
                        <CollapsibleTrigger className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors">
                          <ChevronDown className="w-3 h-3" />
                          <span>View raw response</span>
                        </CollapsibleTrigger>
                        <CollapsibleContent className="mt-2">
                          <div className="p-3 rounded-lg bg-muted/50 border border-border/50">
                            <div className="text-xs font-mono text-muted-foreground mb-2">
                              Tool: <span className="text-foreground font-semibold">{message.toolName}</span>
                            </div>
                            <pre className="text-xs overflow-x-auto whitespace-pre-wrap break-words">
                              {(() => {
                                try {
                                  return JSON.stringify(JSON.parse(message.text), null, 2);
                                } catch {
                                  return message.text;
                                }
                              })()}
                            </pre>
                          </div>
                        </CollapsibleContent>
                      </Collapsible>
                    );
                  })()}

                  {/* Render interactive optimization forms */}
                  {message.formType === "model-selection" && message.formData && (
                    <div className="mt-3">
                      <ModelSelectionForm
                        models={message.formData.models}
                        onModelSelect={(modelId) => {
                          console.log("ModelSelectionForm onModelSelect called with:", modelId);
                          console.log("onOptimizationFormSubmit exists?", !!onOptimizationFormSubmit);
                          if (onOptimizationFormSubmit) {
                            onOptimizationFormSubmit("model-selected", { modelId });
                          } else {
                            console.error("onOptimizationFormSubmit is not defined!");
                          }
                        }}
                        onUploadNew={() => {
                          console.log("Upload new clicked");
                          if (onOptimizationFormSubmit) {
                            onOptimizationFormSubmit("upload-new", {});
                          }
                        }}
                      />
                    </div>
                  )}

                  {message.formType === "optimization-config" && message.formData && (
                    <div className="mt-3">
                      <OptimizationConfigForm
                        presets={message.formData.presets}
                        onSubmit={(type, strength) => onOptimizationFormSubmit?.("start-optimization", { type, strength, modelId: message.formData.modelId, presets: message.formData.presets })}
                        isLoading={false}
                        apiUrl={apiUrl}
                        authToken={(window as any).authToken || null}
                        modelId={message.formData.modelId}
                      />
                    </div>
                  )}

                  {message.formType === "optimization-result" && message.formData && (
                    <div className="mt-3">
                      <OptimizationResultForm
                        result={message.formData.result}
                        onDownload={(url, filename) => {
                          // Handle download
                          window.open(url, '_blank');
                        }}
                        onReset={() => onOptimizationFormSubmit?.("reset", {})}
                      />
                    </div>
                  )}

                  {message.formType === "optimization-inline" && (
                    <OptimizationInlineForm
                      apiUrl={apiUrl}
                      authToken={(window as any).authToken || null}
                      onOptimizationStart={() => {
                        onOptimizationFormSubmit?.("optimization-started", {});
                      }}
                      onOptimizationComplete={(result) => {
                        onOptimizationFormSubmit?.("optimization-complete", { result });
                      }}
                      onOptimizationError={(error) => {
                        onOptimizationFormSubmit?.("optimization-error", { error });
                      }}
                    />
                  )}
                  
                  {message.toolName && !(
                    message.toolName.includes('image_to_3d') || 
                    message.toolName.includes('text_to_3d') || 
                    message.toolName.includes('post_processing')
                  ) && (
                    <div className="mt-2 text-xs text-muted-foreground bg-secondary/30 px-2 py-1 rounded inline-block">
                      Tool result: {message.toolName}
                    </div>
                  )}
                  
                  {message.timestamp && (
                    <div className="text-xs opacity-70 mt-2">
                      {message.timestamp.toLocaleTimeString()}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Inline confirmation UI - only show for the last message with awaiting_confirmation and if human in loop is ON */}
            {message.status === "awaiting_confirmation" && message.toolCalls && index === messages.length - 1 && humanInLoop && (
              <div className="flex justify-start mt-4">
                <div className="max-w-[70%] mr-4">
                  <div className="bg-accent/10 border-2 border-accent rounded-xl p-3 shadow-soft space-y-3">
                    {/* Header */}
                    <div className="space-y-1">
                      <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-accent" />
                        Tool execution needs your approval
                      </h3>
                      {message.interruptMessage && (
                        <p className="text-xs text-muted-foreground">{message.interruptMessage}</p>
                      )}
                    </div>

                    {/* Tool calls */}
                    <div className="space-y-2">
                      {message.toolCalls.map((toolCall, idx) => {
                        const args = editedArgs[toolCall.name] || toolCall.args || {};
                        const hiddenParams = ["output_path", "input_path", "random_seed", "filename"];
                        const visibleArgs = Object.entries(args).filter(([key]) => !hiddenParams.includes(key));
                        
                        return (
                          <div key={`${toolCall.id}-${idx}`} className="bg-background border border-border rounded-lg p-2 space-y-2">

                            {/* Editable parameters */}
                            <div className="space-y-2">
                              {visibleArgs.map(([key, value]) => {
                                const errorKey = `${toolCall.name}.${key}`;
                                const hasError = !!validationErrors[errorKey];
                                const isNumeric = key.includes("num_") || key.includes("count") || key.includes("number");
                                const isLongText = typeof value === "string" && value.length > 100;

                                return (
                                  <div key={key} className="space-y-0.5">
                                    <Label htmlFor={`${toolCall.id}-${key}`} className="text-xs font-medium">
                                      {key.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase())}
                                    </Label>
                                    {isLongText ? (
                                      <>
                                        <Textarea
                                          id={`${toolCall.id}-${key}`}
                                          value={String(value)}
                                          onChange={(e) => handleArgChange(toolCall.name, key, e.target.value)}
                                          className={cn("text-xs", hasError ? "border-destructive" : "")}
                                          rows={3}
                                        />
                                        <p className="text-[10px] text-muted-foreground">
                                          Preview: {String(value).slice(0, 150)}...
                                        </p>
                                      </>
                                    ) : (
                                      <Input
                                        id={`${toolCall.id}-${key}`}
                                        type={isNumeric ? "number" : "text"}
                                        value={String(value)}
                                        onChange={(e) => handleArgChange(
                                          toolCall.name,
                                          key,
                                          isNumeric ? Number(e.target.value) : e.target.value
                                        )}
                                        className={cn("text-xs h-7", hasError ? "border-destructive" : "")}
                                      />
                                    )}
                                    {hasError && (
                                      <p className="text-[10px] text-destructive">{validationErrors[errorKey]}</p>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Action button */}
                    <div className="flex gap-2 pt-1">
                      <Button 
                        onClick={() => handleConfirm(message.toolCalls!)}
                        className="w-full h-8 text-xs"
                        size="sm"
                      >
                        Confirm
                      </Button>
                    </div>

                    {/* Help text */}
                    <p className="text-[10px] text-muted-foreground border-t border-border pt-2">
                      <strong>Why am I asked?</strong> The AI needs to call a backend tool. Edit any parameters if needed, then confirm to execute or cancel to stop.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        );
        })}

        {isGenerating && (
          <div className="flex justify-start">
            <div className="bg-chat-assistant-bubble text-chat-assistant-foreground p-4 rounded-2xl shadow-soft border border-border/20 mr-4">
              <div className="flex items-center space-x-2">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-primary rounded-full typing-indicator"></div>
                  <div className="w-2 h-2 bg-primary rounded-full typing-indicator" style={{ animationDelay: "0.2s" }}></div>
                  <div className="w-2 h-2 bg-primary rounded-full typing-indicator" style={{ animationDelay: "0.4s" }}></div>
                </div>
                <span className="text-sm shimmer-text">Processing request...</span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-6 border-t glass">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={handleFileSelect}
          className="hidden"
        />
        
        <input
          ref={modelFileInputRef}
          type="file"
          accept=".glb,.fbx,.obj,.gltf"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) {
              handleModelOptimization(file);
            }
            e.target.value = '';
          }}
          className="hidden"
        />
        
        {/* Image thumbnails */}
        {uploadedImages.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-3">
            {uploadedImages.map((img, index) => (
              <div key={index} className="relative group">
                <img 
                  src={img.preview} 
                  alt="Upload preview" 
                  className="w-16 h-16 object-cover rounded-lg border-2 border-border"
                />
                <button
                  onClick={() => removeImage(index)}
                  className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity shadow-md"
                  aria-label="Remove image"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        )}
        
        {/* Combined input box with buttons inside */}
        <div className="relative flex items-end glass border border-border rounded-2xl p-2 shadow-soft">
          {/* Plus button (left inside) */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="flex-shrink-0 h-9 w-9 rounded-lg hover:bg-muted/50"
              >
                <Plus className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-48">
              <DropdownMenuItem onClick={triggerFileUpload}>
                <Upload className="w-4 h-4 mr-2" />
                Upload Image
              </DropdownMenuItem>
              <DropdownMenuItem>
                <FileText className="w-4 h-4 mr-2" />
                Upload Episode
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Tools button (next to Plus) */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="flex-shrink-0 h-9 gap-1.5 px-2 rounded-lg hover:bg-muted/50"
              >
                <img src={toolsIcon} alt="Tools" className="w-5 h-5" />
                <span className="text-xs">Tools</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56">
              <DropdownMenuItem onClick={triggerModelUpload}>
                <Box className="w-4 h-4 mr-2" />
                Model Optimization
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Textarea (middle) */}
          <Textarea
            ref={textareaRef}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Describe your image idea..."
            className="flex-1 bg-transparent border-0 focus-visible:ring-0 focus-visible:ring-offset-0 resize-none overflow-hidden min-h-[36px] max-h-[200px] px-2"
            disabled={isGenerating}
            rows={1}
          />

          {/* Human in the loop toggle button */}
          <div className="flex flex-col items-center gap-0.5">
            <span className="text-[10px] font-medium text-muted-foreground">HITL</span>
            <Button
              variant={humanInLoop ? "default" : "outline"}
              size="icon"
              onClick={() => setHumanInLoop(!humanInLoop)}
              className={cn(
                "flex-shrink-0 h-9 w-9 rounded-lg transition-all",
                humanInLoop ? "bg-primary text-primary-foreground" : "bg-muted/50"
              )}
              title={humanInLoop ? "Human in the loop: ON" : "Human in the loop: OFF"}
            >
              <User className="w-4 h-4" />
            </Button>
          </div>

          {/* Send button (right inside) */}
          <Button
            onClick={handleSend}
            disabled={(!inputValue.trim() && uploadedImages.length === 0) || isGenerating}
            size="icon"
            className="flex-shrink-0 h-9 w-9 rounded-lg"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Image Zoom Dialog */}
      <Dialog open={!!zoomedImage} onOpenChange={() => setZoomedImage(null)}>
        <DialogContent className="max-w-5xl w-full p-0 overflow-hidden">
          <DialogTitle className="sr-only">Image Preview</DialogTitle>
          <DialogDescription className="sr-only">
            Full size image preview
          </DialogDescription>
          <DialogClose className="absolute right-4 top-4 z-10 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground">
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </DialogClose>
          {zoomedImage && (
            <div className="relative bg-muted/20 flex items-center justify-center p-8">
              <img
                src={zoomedImage}
                alt="Zoomed view"
                className="max-h-[80vh] w-auto object-contain"
              />
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Text-to-3D Result Popup Dialog */}
      <Dialog open={!!text3dPopup} onOpenChange={() => setText3dPopup(null)}>
        <DialogContent className="max-w-[500px]">
          <DialogTitle className="text-xl font-semibold flex items-center gap-2">
            <Box className="w-5 h-5 text-accent" />
            3D Model Generated!
          </DialogTitle>
          <DialogDescription>
            Your text-to-3D model has been generated successfully.
          </DialogDescription>
          <DialogClose className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none">
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </DialogClose>
          <div className="flex items-center justify-center w-full py-4">
            {text3dPopup && (
              <img 
                src={text3dPopup}
                alt="3D Model Preview"
                className="max-w-full rounded-lg shadow-lg"
                style={{ maxHeight: '400px', objectFit: 'contain' }}
              />
            )}
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button 
              variant="outline" 
              onClick={() => setText3dPopup(null)}
            >
              Close
            </Button>
            {text3dPopup && (
              <Button 
                onClick={() => window.open(text3dPopup, '_blank')}
              >
                Open Full Size
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>

    </div>
  );
};

export default ChatInterface;
