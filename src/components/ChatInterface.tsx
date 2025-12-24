import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogClose, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Send, Sparkles, BookOpen, Plus, Upload, FileText, X, Box, User } from "lucide-react";
import toolsIcon from "@/assets/tools-icon.png";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { Message, ChatInterfaceProps, ToolCall } from "./chat/types";
import { filterMessages, validateToolArgs, parseToolResponse } from "./chat/utils";
import { UserMessage } from "./chat/UserMessage";
import { AssistantMessage } from "./chat/AssistantMessage";
import { ToolConfirmationUI } from "./chat/ToolConfirmationUI";
import { useFileUpload } from "./chat/useFileUpload";

const WELCOME_MESSAGES = [
  "Chat with me",
  "I will help you generate and edit images of your choice",
  "You can upload your image and I will segment the image for you or remove the background",
  "You can edit the image however you like, you can ask me the add or remove a certain object or maybe change its colour",
  "I will enhance your prompt for better image generation or generate the prompt from your image"
];

const ChatInterface = ({
  messages,
  onSendMessage,
  onToolConfirmation,
  isGenerating,
  apiUrl,
  onModelSelect,
  onImageGenerated,
  onOptimizationFormSubmit,
  userEmail,
  sessionId,
  accessToken,
}: ChatInterfaceProps) => {
  const [inputValue, setInputValue] = useState("");
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(true);
  const [zoomedImage, setZoomedImage] = useState<string | null>(null);
  const [text3dPopup, setText3dPopup] = useState<string | null>(null);
  const [humanInLoop, setHumanInLoop] = useState(false);
  const [editedArgs, setEditedArgs] = useState<Record<string, Record<string, unknown>>>({});
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const modelFileInputRef = useRef<HTMLInputElement>(null);
  const lastProcessedImageKeyRef = useRef<string | null>(null);
  const lastAutoConfirmedKeyRef = useRef<string | null>(null);

  const { toast } = useToast();

  // Stable refs for callbacks
  const onImageGeneratedRef = useRef(onImageGenerated);
  useEffect(() => {
    onImageGeneratedRef.current = onImageGenerated;
  }, [onImageGenerated]);

  const onToolConfirmationRef = useRef(onToolConfirmation);
  useEffect(() => {
    onToolConfirmationRef.current = onToolConfirmation;
  }, [onToolConfirmation]);

  // File upload hook
  const {
    isUploading,
    uploadedImageUrls,
    uploadedImagePreviews,
    handleFileSelect: handleFileSelectFromHook,
    removeUploadedUrl,
    clearUploads,
  } = useFileUpload({
    apiUrl,
    userEmail,
    sessionId,
    accessToken,
  });

  // Filter and clean messages for rendering
  const filteredMessages = useMemo(() => {
    return filterMessages(messages);
  }, [messages]);

  // Scroll to bottom when messages change
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "auto", block: "nearest" });
  }, []);

  useEffect(() => {
    if (filteredMessages.length > 0) {
      scrollToBottom();
    }
  }, [filteredMessages, scrollToBottom]);

  // Detect when an image is generated in the latest assistant message
  useEffect(() => {
    if (filteredMessages.length === 0) return;
    const lastMessage = filteredMessages[filteredMessages.length - 1];
    if (lastMessage.role !== "assistant") return;

    const key = `${lastMessage.text}|${lastMessage.toolName || ""}`;
    if (lastProcessedImageKeyRef.current === key) return;

    // Check message object first for image fields (new structure)
    if (lastMessage.image_path || lastMessage.img_url || lastMessage.thumbnail_url) {
      onImageGeneratedRef.current?.();
    }
    if (lastMessage.thumbnail_url && lastMessage.toolName?.includes('text_to_3d')) {
      setText3dPopup(lastMessage.thumbnail_url);
    }
    
    // Fallback: Check parsed text for backward compatibility
    try {
      const parsed = JSON.parse(lastMessage.text);
      if (parsed?.img_url || parsed?.image_path || parsed?.thumbnail_url) {
        onImageGeneratedRef.current?.();
      }
      if (parsed?.thumbnail_url && lastMessage.toolName?.includes('text_to_3d')) {
        setText3dPopup(parsed.thumbnail_url);
      }
    } catch {
      // Not JSON, ignore
    }

    lastProcessedImageKeyRef.current = key;
  }, [filteredMessages]);

  useEffect(()=>{
    console.log(messages,'messages in chat interface===>>>')
  },[messages])

  // Initialize edited args when confirmation is needed
  useEffect(() => {
    const lastMessage = messages[messages.length - 1];
    if (!(lastMessage && lastMessage.status === "awaiting_confirmation" && lastMessage.toolCalls)) return;

    const key = JSON.stringify(lastMessage.toolCalls);
    if (lastAutoConfirmedKeyRef.current === key) return;

    const initialArgs: Record<string, Record<string, unknown>> = {};
    lastMessage.toolCalls.forEach(tc => {
      initialArgs[tc.name] = { ...tc.args };
    });
    setEditedArgs(initialArgs);

    if (!humanInLoop) {
      const payloadArgs: Record<string, Record<string, unknown>> = {};
      lastMessage.toolCalls.forEach(tc => {
        payloadArgs[tc.name] = { ...tc.args };
      });
      onToolConfirmationRef.current?.("confirm", payloadArgs);
    }

    lastAutoConfirmedKeyRef.current = key;
  }, [messages, humanInLoop]);

  // Welcome message rotation
  useEffect(() => {
    if (filteredMessages.length > 0) return;

    const interval = setInterval(() => {
      setIsVisible(false);
      setTimeout(() => {
        setCurrentMessageIndex((prev) => (prev + 1) % WELCOME_MESSAGES.length);
        setIsVisible(true);
      }, 500);
    }, 3500);

    return () => clearInterval(interval);
  }, [filteredMessages.length]);

  // Auto-resize textarea
  const adjustTextareaHeight = useCallback(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  }, []);

  useEffect(() => {
    adjustTextareaHeight();
  }, [inputValue, adjustTextareaHeight]);

  // Handle sending messages
  const handleSend = useCallback(async () => {
    if (!inputValue.trim() || isGenerating) return;

    let messageText = inputValue.trim();
    if (uploadedImageUrls.length > 0) {
      uploadedImageUrls.forEach((url, index) => {
        const marker = `[IMAGE_INPUT_${index + 1}]\nURL: ${url}\n[/IMAGE_INPUT_${index + 1}]`;
        messageText += `\n${marker}`;
      });
    }

    onSendMessage(messageText, uploadedImageUrls, [], undefined, sessionId);
    clearUploads();
    setInputValue("");

    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    }, 0);
  }, [inputValue, isGenerating, uploadedImageUrls, onSendMessage, sessionId, clearUploads]);

  const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }, [handleSend]);

  // Tool confirmation handlers
  const handleConfirm = useCallback((toolCalls: ToolCall[]) => {
    const errors = validateToolArgs(toolCalls, editedArgs);
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
    const payloadArgs: Record<string, Record<string, unknown>> = {};
    toolCalls.forEach((tc) => {
      const original = (tc.args || {}) as Record<string, unknown>;
      const edits = (editedArgs[tc.name] || {}) as Record<string, unknown>;
      payloadArgs[tc.name] = { ...original, ...edits };
    });
    onToolConfirmation?.("modify", payloadArgs);
  }, [editedArgs, onToolConfirmation, toast]);

  const handleCancel = useCallback(() => {
    onToolConfirmation?.("cancel");
  }, [onToolConfirmation]);

  const handleArgChange = useCallback((toolName: string, argKey: string, value: unknown) => {
    setEditedArgs(prev => ({
      ...prev,
      [toolName]: {
        ...prev[toolName],
        [argKey]: value,
      },
    }));
    const errorKey = `${toolName}.${argKey}`;
    if (validationErrors[errorKey]) {
      setValidationErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[errorKey];
        return newErrors;
      });
    }
  }, [validationErrors]);

  // File upload handlers
  const handleFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    await handleFileSelectFromHook(e.target.files);
    e.target.value = '';
  }, [handleFileSelectFromHook]);

  // Model optimization handler
  const handleModelOptimization = useCallback(async (file: File) => {
    try {
      const authToken = (window as { authToken?: string }).authToken;

      if (!authToken) {
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

      const signedUrlResponse = await fetch(`${apiUrl}/api/model-optimization/get-signed-url`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${authToken}`
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

      toast({
        title: "Success!",
        description: "Your model has been uploaded and registered for optimization.",
      });
    } catch (error) {
      console.error("Model optimization error:", error);
      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : "Failed to upload model",
        variant: "destructive",
      });
    }
  }, [apiUrl, toast]);

  const triggerFileUpload = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const triggerModelUpload = useCallback(() => {
    onOptimizationFormSubmit?.("model-optimization-clicked", {});
  }, [onOptimizationFormSubmit]);

  const handleImageZoom = useCallback((src: string) => {
    setZoomedImage(src);
  }, []);

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
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-8 glass scrollbar-hide">
        {filteredMessages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center space-y-4">
            <div className="p-4 rounded-full bg-primary shadow-soft">
              <Sparkles className="w-8 h-8 text-primary-foreground" />
            </div>
            <div className={`transition-opacity duration-500 ${isVisible ? "opacity-100" : "opacity-0"}`}>
              <p className="text-chat-assistant-foreground text-lg max-w-md font-medium">
                {WELCOME_MESSAGES[currentMessageIndex]}
              </p>
            </div>
          </div>
        )}

        {filteredMessages.map((message, index) => (
          <div key={index}>
            {message.role === "user" ? (
              <UserMessage message={message} />
            ) : (
              <AssistantMessage
                message={message}
                apiUrl={apiUrl}
                onImageZoom={handleImageZoom}
                onModelSelect={onModelSelect}
                onOptimizationFormSubmit={onOptimizationFormSubmit}
              />
            )}

            {/* Tool Confirmation UI */}
            {message.status === "awaiting_confirmation" &&
              message.toolCalls &&
              index === messages.length - 1 &&
              humanInLoop && (
                <ToolConfirmationUI
                  toolCalls={message.toolCalls}
                  editedArgs={editedArgs}
                  validationErrors={validationErrors}
                  interruptMessage={message.interruptMessage}
                  onArgChange={handleArgChange}
                  onConfirm={handleConfirm}
                  onCancel={handleCancel}
                />
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
                <span className="text-sm shimmer-text">
                  Processing request...
                </span>
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

        {isUploading && (
          <div className="flex items-center gap-2 p-2 bg-muted/30 rounded-lg border border-border mb-3">
            <div className="animate-spin rounded-full h-3 w-3 border-2 border-primary border-t-transparent"></div>
            <span className="text-xs text-muted-foreground">Uploading...</span>
          </div>
        )}

        {uploadedImagePreviews.length > 0 && !isUploading && (
          <div className="flex flex-wrap gap-2 mb-3">
            {uploadedImagePreviews.map((preview, index) => (
              <div key={index} className="relative group">
                <img
                  src={preview}
                  alt={`Upload ${index + 1}`}
                  className="w-12 h-12 object-cover rounded-lg border border-border/50"
                />
                <button
                  onClick={() => removeUploadedUrl(index)}
                  className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                  aria-label="Remove image"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="relative flex items-end glass border border-border rounded-2xl p-2 shadow-soft">
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

          <Button
            onClick={handleSend}
            disabled={!inputValue.trim() || isGenerating || isUploading}
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
          <DialogDescription className="sr-only">Full size image preview</DialogDescription>
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
            <Button variant="outline" onClick={() => setText3dPopup(null)}>
              Close
            </Button>
            {text3dPopup && (
              <Button onClick={() => window.open(text3dPopup, '_blank')}>
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
