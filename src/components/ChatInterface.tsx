import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Send, Sparkles, BookOpen, Plus, FileText, Wand2, History } from "lucide-react";

interface Message {
  role: "user" | "assistant";
  text: string;
  timestamp?: Date;
}

interface ChatInterfaceProps {
  messages: Message[];
  onSendMessage: (message: string) => void;
  isGenerating?: boolean;
}

const ChatInterface = ({ messages, onSendMessage, isGenerating }: ChatInterfaceProps) => {
  const [inputValue, setInputValue] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(true);

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
              <DropdownMenuItem>
                <FileText className="w-4 h-4 mr-2" />
                New Episode
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Wand2 className="w-4 h-4 mr-2" />
                Story Generator
              </DropdownMenuItem>
              <DropdownMenuItem>
                <History className="w-4 h-4 mr-2" />
                Episode History
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          
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