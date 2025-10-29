import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import ReactMarkdown from "react-markdown";
import { Label } from "@/components/ui/label";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Send, Sparkles, BookOpen, Plus, Upload, FileText, ChevronDown, ChevronUp, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

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
}

interface ChatInterfaceProps {
  messages: Message[];
  onSendMessage: (message: string) => void;
  onToolConfirmation?: (action: "confirm" | "modify" | "cancel", modifiedArgs?: Record<string, Record<string, any>>) => void;
  isGenerating?: boolean;
  apiUrl: string;
  onModelSelect?: (modelUrl: string, thumbnailUrl: string, workflow: string) => void;
}

const ChatInterface = ({ messages, onSendMessage, onToolConfirmation, isGenerating, apiUrl, onModelSelect }: ChatInterfaceProps) => {
  const [inputValue, setInputValue] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [editedArgs, setEditedArgs] = useState<Record<string, Record<string, any>>>({});
  const [showRawJson, setShowRawJson] = useState<Record<string, boolean>>({});
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [uploadedImages, setUploadedImages] = useState<{ file: File; preview: string }[]>([]);
  const { toast } = useToast();

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
    if (messages.length > 0) {
      scrollToBottom();
    }
  }, [messages]);

  // Initialize edited args when confirmation is needed
  useEffect(() => {
    const lastMessage = messages[messages.length - 1];
    if (lastMessage && lastMessage.status === "awaiting_confirmation" && lastMessage.toolCalls) {
      const initialArgs: Record<string, Record<string, any>> = {};
      lastMessage.toolCalls.forEach(tc => {
        initialArgs[tc.name] = { ...tc.args };
      });
      setEditedArgs(initialArgs);
    }
  }, [messages]);

  useEffect(() => {
    if (messages.length > 0) return;

    const interval = setInterval(() => {
      setIsVisible(false);
      
      setTimeout(() => {
        setCurrentMessageIndex((prev) => (prev + 1) % welcomeMessages.length);
        setIsVisible(true);
      }, 500);
    }, 3500);

    return () => clearInterval(interval);
  }, [messages.length]);

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

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="flex items-center gap-3 p-6 border-b glass shadow-soft">
        <div className="p-2 rounded-xl bg-primary dark:bg-white">
          <BookOpen className="w-6 h-6 text-primary-foreground dark:text-black" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-foreground dark:text-white">Game AI Studio</h2>
          <p className="text-sm text-muted-foreground dark:text-white/70">Create and edit images with AI</p>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-8 glass">
        {messages.length === 0 && (
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

        {messages.map((message, index) => (
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

                    // Check if message contains image response (JSON object with type: "image" or img_url/image_url)
                    try {
                      const parsed = JSON.parse(message.text);
                      
                      // Check for img_url or image_url in the response
                      const imageUrl = parsed?.img_url || parsed?.image_url;
                      
                      if (imageUrl) {
                        const prompt = parsed.prompt || "Generated image";
                        return (
                          <div className="space-y-2">
                            <img 
                              src={imageUrl}
                              alt={prompt}
                              className="rounded-lg max-w-[300px] h-auto"
                              style={{ marginTop: '8px' }}
                            />
                            <p className="text-xs text-muted-foreground italic">{prompt}</p>
                          </div>
                        );
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
                              className="rounded-lg max-w-full h-auto"
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
                            className="rounded-lg max-w-full h-auto"
                          />
                          <p className="text-xs text-muted-foreground italic">Generated image</p>
                        </div>
                      );
                    }
                    
                    return (
                      <div className="prose prose-sm max-w-none text-chat-assistant-foreground">
                        <ReactMarkdown>{message.text}</ReactMarkdown>
                      </div>
                    );
                  })()}
                  
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

            {/* Inline confirmation UI */}
            {message.status === "awaiting_confirmation" && message.toolCalls && (
              <div className="flex justify-start mt-4">
                <div className="max-w-[85%] mr-4">
                  <div className="bg-accent/10 border-2 border-accent rounded-2xl p-5 shadow-soft space-y-4">
                    {/* Header */}
                    <div className="space-y-2">
                      <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-accent" />
                        Tool execution needs your approval
                      </h3>
                      {message.interruptMessage && (
                        <p className="text-sm text-muted-foreground">{message.interruptMessage}</p>
                      )}
                    </div>

                    {/* Tool calls */}
                    <div className="space-y-4">
                      {message.toolCalls.map((toolCall, idx) => {
                        const args = editedArgs[toolCall.name] || toolCall.args || {};
                        
                        return (
                          <div key={`${toolCall.id}-${idx}`} className="bg-background border border-border rounded-lg p-4 space-y-3">
                            {/* Tool header */}
                            <div className="flex items-center justify-end">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setShowRawJson(prev => ({ ...prev, [toolCall.id]: !prev[toolCall.id] }))}
                                className="h-7 text-xs"
                              >
                                {showRawJson[toolCall.id] ? <ChevronUp className="h-3 w-3 mr-1" /> : <ChevronDown className="h-3 w-3 mr-1" />}
                                Raw JSON
                              </Button>
                            </div>

                            {/* Raw JSON view */}
                            {showRawJson[toolCall.id] && (
                              <pre className="text-xs bg-muted p-3 rounded overflow-auto max-h-48 font-mono">
                                {JSON.stringify(toolCall.args, null, 2)}
                              </pre>
                            )}

                            {/* Editable parameters */}
                            <div className="space-y-3">
                              {Object.entries(args).map(([key, value]) => {
                                const errorKey = `${toolCall.name}.${key}`;
                                const hasError = !!validationErrors[errorKey];
                                const isNumeric = key.includes("num_") || key.includes("count") || key.includes("number");
                                const isLongText = typeof value === "string" && value.length > 100;

                                return (
                                  <div key={key} className="space-y-1">
                                    <Label htmlFor={`${toolCall.id}-${key}`} className="text-sm font-medium">
                                      {key.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase())}
                                    </Label>
                                    {isLongText ? (
                                      <>
                                        <Textarea
                                          id={`${toolCall.id}-${key}`}
                                          value={String(value)}
                                          onChange={(e) => handleArgChange(toolCall.name, key, e.target.value)}
                                          className={hasError ? "border-destructive" : ""}
                                          rows={4}
                                        />
                                        <p className="text-xs text-muted-foreground">
                                          Preview: {String(value).slice(0, 200)}...
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
                                        className={hasError ? "border-destructive" : ""}
                                      />
                                    )}
                                    {hasError && (
                                      <p className="text-xs text-destructive">{validationErrors[errorKey]}</p>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Action buttons */}
                    <div className="flex gap-2 pt-2">
                      <Button 
                        variant="outline" 
                        onClick={() => handleCancel(message.toolCalls!)}
                        className="flex-1"
                      >
                        Cancel
                      </Button>
                      <Button 
                        onClick={() => handleConfirm(message.toolCalls!)}
                        className="flex-1"
                      >
                        Confirm
                      </Button>
                    </div>

                    {/* Help text */}
                    <p className="text-xs text-muted-foreground border-t border-border pt-3">
                      <strong>Why am I asked?</strong> The AI needs to call a backend tool. Edit any parameters if needed, then confirm to execute or cancel to stop.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}

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

    </div>
  );
};

export default ChatInterface;
