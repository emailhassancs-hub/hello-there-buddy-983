import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Send, Sparkles, BookOpen, Plus, Upload, FileText, ChevronDown, ChevronUp } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ToolCall {
  id: string;
  tool_name: string;
  parameters: Record<string, any>;
}

interface Message {
  role: "user" | "assistant";
  text: string;
  timestamp?: Date;
  toolCalls?: ToolCall[];
  conversationId?: string;
  toolName?: string;
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
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [currentToolCalls, setCurrentToolCalls] = useState<ToolCall[]>([]);
  const [editedArgs, setEditedArgs] = useState<Record<string, Record<string, any>>>({});
  const [showRawJson, setShowRawJson] = useState<Record<string, boolean>>({});
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
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

  // Check for tool confirmation requests
  useEffect(() => {
    const lastMessage = messages[messages.length - 1];
    if (lastMessage && lastMessage.role === "assistant" && lastMessage.toolCalls) {
      setCurrentToolCalls(lastMessage.toolCalls);
      // Initialize edited args with original args
      const initialArgs: Record<string, Record<string, any>> = {};
      lastMessage.toolCalls.forEach(tc => {
        initialArgs[tc.tool_name] = { ...tc.parameters };
      });
      setEditedArgs(initialArgs);
      setShowConfirmModal(true);
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

  const handleSend = () => {
    if (!inputValue.trim() || isGenerating) return;
    onSendMessage(inputValue);
    setInputValue("");
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleConfirm = () => {
    setShowConfirmModal(false);
    onToolConfirmation?.("confirm");
  };

  const handleModify = () => {
    // Validate all fields
    const errors: Record<string, string> = {};
    currentToolCalls.forEach(tc => {
      const args = editedArgs[tc.tool_name] || {};
      Object.entries(args).forEach(([key, value]) => {
        // Basic validation - check if numeric fields are numbers
        if (key.includes("num_") || key.includes("count") || key.includes("number")) {
          if (isNaN(Number(value))) {
            errors[`${tc.tool_name}.${key}`] = "Must be a number";
          }
        }
        // Check for empty required fields (basic check)
        if (value === "" || value === null || value === undefined) {
          errors[`${tc.tool_name}.${key}`] = "This field is required";
        }
      });
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

    setShowConfirmModal(false);
    setValidationErrors({});
    onToolConfirmation?.("modify", editedArgs);
  };

  const handleCancel = () => {
    setShowConfirmModal(false);
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

  const uploadImage = async (file: File) => {
    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch(`${apiUrl}/upload-image`, {
        method: "POST",
        body: formData,
      });

      const data = await response.json();
      console.log("Uploaded:", data);
      toast({
        title: "Success",
        description: "Image uploaded successfully",
      });
    } catch (error) {
      console.error("Upload error:", error);
      toast({
        title: "Error",
        description: "Failed to upload image",
        variant: "destructive",
      });
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      uploadImage(file);
    }
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
          <h2 className="text-xl font-bold text-foreground">AI Game Studio</h2>
          <p className="text-sm text-muted-foreground">Create and edit images with AI</p>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
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
          <div
            key={index}
            className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[80%] p-4 rounded-2xl shadow-soft chat-bubble-enter ${
                message.role === "user"
                  ? "bg-chat-user-bubble text-chat-user-foreground ml-4"
                  : "bg-chat-assistant-bubble text-chat-assistant-foreground mr-4 border border-border/20"
              }`}
            >
              <div 
                className="whitespace-pre-wrap"
                dangerouslySetInnerHTML={{ __html: message.text }}
              />
              
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
                <span className="text-sm text-muted-foreground">Crafting your story...</span>
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
          
          <Input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Describe your image idea..."
            className="flex-1 bg-background border-border focus:border-primary transition-colors rounded-xl"
            disabled={isGenerating}
          />
          <Button
            onClick={handleSend}
            disabled={!inputValue.trim() || isGenerating}
            variant="black"
            className="rounded-xl px-6 shadow-soft"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Confirmation Modal */}
      <Dialog open={showConfirmModal} onOpenChange={setShowConfirmModal}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Tool execution needs your approval</DialogTitle>
            <DialogDescription>
              The AI wants to call the following tool(s). Review and confirm parameters below.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {currentToolCalls.map((toolCall, idx) => {
              const args = editedArgs[toolCall.tool_name] || toolCall.parameters;
              
              return (
                <div key={`${toolCall.id}-${idx}`} className="border rounded-lg p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-lg">{toolCall.tool_name}</h3>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">ID: {toolCall.id}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowRawJson(prev => ({ ...prev, [toolCall.id]: !prev[toolCall.id] }))}
                      >
                        {showRawJson[toolCall.id] ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                        Raw JSON
                      </Button>
                    </div>
                  </div>

                  {showRawJson[toolCall.id] && (
                    <pre className="text-xs bg-muted p-3 rounded overflow-auto max-h-48">
                      {JSON.stringify(toolCall.parameters, null, 2)}
                    </pre>
                  )}

                  <div className="space-y-3">
                    {Object.entries(args).map(([key, value]) => {
                      const errorKey = `${toolCall.tool_name}.${key}`;
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
                                onChange={(e) => handleArgChange(toolCall.tool_name, key, e.target.value)}
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
                                toolCall.tool_name,
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

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={handleCancel}>
              Cancel
            </Button>
            <Button variant="secondary" onClick={handleModify}>
              Modify & Send
            </Button>
            <Button onClick={handleConfirm}>
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ChatInterface;
