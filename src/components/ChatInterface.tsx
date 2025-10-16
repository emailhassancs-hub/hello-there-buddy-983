import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

import { Label } from "@/components/ui/label";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Send, Sparkles, BookOpen, Plus, Upload, FileText, ChevronDown, ChevronUp } from "lucide-react";
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
          <div key={index}>
            {/* Regular message bubble */}
            <div className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
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
                            <div className="flex items-center justify-between">
                              <h4 className="font-semibold text-foreground">{toolCall.name}</h4>
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-muted-foreground font-mono">ID: {toolCall.id}</span>
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

    </div>
  );
};

export default ChatInterface;
