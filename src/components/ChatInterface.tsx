import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Send, Sparkles, BookOpen, Plus, Upload, FileText } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface Message {
  role: "user" | "assistant";
  text: string;
  timestamp?: Date;
  needsConfirmation?: boolean;
  planSummary?: {
    action: string;
    tool: string;
    parameters: any;
    enhanced_prompt?: string;
    original_request?: string;
    question?: string;
  };
}

interface ChatInterfaceProps {
  messages: Message[];
  onSendMessage: (message: string, confirm?: boolean) => void;
  isGenerating?: boolean;
  apiUrl: string;
}

const ChatInterface = ({ messages, onSendMessage, isGenerating, apiUrl }: ChatInterfaceProps) => {
  const [inputValue, setInputValue] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [changeRequestInput, setChangeRequestInput] = useState("");
  const [showChangeInput, setShowChangeInput] = useState<number | null>(null);

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

  const handleSend = (confirm?: boolean) => {
    if (!inputValue.trim() || isGenerating) return;
    onSendMessage(inputValue, confirm);
    setInputValue("");
  };

  const handleConfirmation = (confirmed: boolean, messageIndex: number) => {
    if (confirmed) {
      onSendMessage("yes", true);
      setShowChangeInput(null);
      setChangeRequestInput("");
    } else {
      setShowChangeInput(messageIndex);
    }
  };

  const handleChangeRequest = () => {
    if (changeRequestInput.trim()) {
      onSendMessage(`no, ${changeRequestInput}`, true);
      setShowChangeInput(null);
      setChangeRequestInput("");
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
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
              
              {message.planSummary && (
                <div className="mt-4 space-y-3 border-l-4 border-primary/50 pl-4 bg-muted/30 rounded-r-lg p-3">
                  <div>
                    <p className="font-semibold text-sm">Action:</p>
                    <p className="text-sm">{message.planSummary.action}</p>
                  </div>
                  <div>
                    <p className="font-semibold text-sm">Tool:</p>
                    <p className="text-sm font-mono">{message.planSummary.tool}</p>
                  </div>
                  {message.planSummary.enhanced_prompt && (
                    <div>
                      <p className="font-semibold text-sm">Enhanced Prompt:</p>
                      <p className="text-sm italic">{message.planSummary.enhanced_prompt}</p>
                    </div>
                  )}
                  {message.planSummary.parameters && (
                    <details className="text-sm">
                      <summary className="font-semibold cursor-pointer">Parameters</summary>
                      <pre className="mt-2 text-xs bg-background p-2 rounded overflow-auto">
                        {JSON.stringify(message.planSummary.parameters, null, 2)}
                      </pre>
                    </details>
                  )}
                </div>
              )}
              
              {message.needsConfirmation && !isGenerating && (
                <div className="mt-4 space-y-3">
                  {showChangeInput !== index ? (
                    <div className="flex gap-2">
                      <Button
                        onClick={() => handleConfirmation(true, index)}
                        variant="default"
                        size="sm"
                        className="gap-1.5"
                      >
                        ✅ Approve
                      </Button>
                      <Button
                        onClick={() => handleConfirmation(false, index)}
                        variant="outline"
                        size="sm"
                        className="gap-1.5"
                      >
                        ✏️ Request Changes
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <textarea
                        value={changeRequestInput}
                        onChange={(e) => setChangeRequestInput(e.target.value)}
                        placeholder="Describe the changes you'd like..."
                        className="w-full min-h-[80px] px-3 py-2 text-sm border border-border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-primary bg-background"
                      />
                      <div className="flex gap-2">
                        <Button
                          onClick={handleChangeRequest}
                          size="sm"
                          variant="default"
                        >
                          Send Changes
                        </Button>
                        <Button
                          onClick={() => {
                            setShowChangeInput(null);
                            setChangeRequestInput("");
                          }}
                          size="sm"
                          variant="ghost"
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  )}
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
            onClick={() => handleSend()}
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