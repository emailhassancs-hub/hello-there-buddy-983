import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import ReactMarkdown from "react-markdown";
import { Label } from "@/components/ui/label";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Send, Sparkles, BookOpen, Plus, Upload, FileText, ChevronDown, ChevronUp, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

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
}

const ChatInterface = ({ messages, onSendMessage, onToolConfirmation, isGenerating, apiUrl }: ChatInterfaceProps) => {
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
    
    // Upload images first if any
    if (uploadedImages.length > 0) {
      for (const { file } of uploadedImages) {
        const path = await uploadImage(file);
        if (path) imagePaths.push(path);
      }
    }
    
    // Concatenate image paths with user message
    let messageToSend = inputValue;
    if (imagePaths.length > 0) {
      const imagePathsText = imagePaths.map(path => `[Image: ${path}]`).join('\n');
      messageToSend = `${inputValue}\n${imagePathsText}`.trim();
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

  const uploadImage = async (file: File): Promise<string | null> => {
    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch(`${apiUrl}/upload-image`, {
        method: "POST",
        body: formData,
      });

      const data = await response.json();
      console.log("Upload response:", data);
      
      // Get the full path from backend response
      const fullPath = data.full_path || data.absolute_path || data.path || data.filename;
      
      toast({
        title: "Success",
        description: "Image uploaded successfully",
      });
      return fullPath;
    } catch (error) {
      console.error("Upload error:", error);
      toast({
        title: "Error",
        description: "Failed to upload image",
        variant: "destructive",
      });
      return null;
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      const preview = URL.createObjectURL(file);
      setUploadedImages(prev => [...prev, { file, preview }]);
    }
    // Reset input so same file can be selected again
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
    <div className="flex flex-col h-full bg-gradient-story">
      {/* Header */}
      <div className="flex items-center gap-3 p-6 border-b border-border bg-background">
        <div className="p-2 rounded-xl bg-foreground">
          <BookOpen className="w-6 h-6 text-background" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-foreground">Game AI Studio</h2>
          <p className="text-sm text-muted-foreground">Create and edit images with AI</p>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-8">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center space-y-4">
            <div className="p-4 rounded-full bg-foreground shadow-soft">
              <Sparkles className="w-8 h-8 text-background" />
            </div>
            <div
              className={`transition-opacity duration-500 ${
                isVisible ? "opacity-100" : "opacity-0"
              }`}
            >
              <p className="text-foreground text-lg max-w-md font-medium">
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
                  <div 
                    className="whitespace-pre-wrap"
                    dangerouslySetInnerHTML={{ __html: message.text.replace(/\[Image:.*?\]/g, '') }}
                  />
                  {(() => {
                    const imageMatches = message.text.match(/\[Image: (.*?)\]/g);
                    if (imageMatches) {
                      return (
                        <div className="flex flex-wrap gap-2 mt-2">
                          {imageMatches.map((match, idx) => {
                            const fullPath = match.match(/\[Image: (.*?)\]/)?.[1];
                            if (!fullPath) return null;
                            
                            // Extract filename from full path for display URL
                            const filename = fullPath.split(/[\\/]/).pop() || '';
                            const displayUrl = `${apiUrl}/images/${filename}`;
                            
                            return (
                              <img
                                key={idx}
                                src={displayUrl}
                                alt="Uploaded"
                                className="w-20 h-20 object-cover rounded-lg"
                                onError={(e) => {
                                  console.error('Image load error for:', displayUrl);
                                  e.currentTarget.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="80" height="80"%3E%3Crect fill="%23ddd" width="80" height="80"/%3E%3Ctext x="50%25" y="50%25" font-size="12" text-anchor="middle" dy=".3em"%3EImage%3C/text%3E%3C/svg%3E';
                                }}
                              />
                            );
                          })}
                        </div>
                      );
                    }
                    return null;
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

                    // Check if message contains image response (JSON object with type: "image")
                    try {
                      const parsed = JSON.parse(message.text);
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
                  
                  {message.toolName && (
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
      <div className="p-6 border-t border-border bg-background">
        <div className="flex gap-3">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="rounded-xl border-border hover:bg-muted"
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
          
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
          />
          
          <div className="flex-1 flex flex-col gap-2">
            {/* Image thumbnails */}
            {uploadedImages.length > 0 && (
              <div className="flex flex-wrap gap-2">
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
            
            <Textarea
              ref={textareaRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Describe your image idea..."
              className="bg-background border-border focus:border-primary transition-all rounded-xl resize-none overflow-hidden min-h-[44px] max-h-[200px]"
              disabled={isGenerating}
              rows={1}
            />
          </div>
          
          <Button
            onClick={handleSend}
            disabled={(!inputValue.trim() && uploadedImages.length === 0) || isGenerating}
            variant="black"
            className="rounded-xl px-6 shadow-soft"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>

    </div>
  );
};

export default ChatInterface;
