import { useState } from "react";
import { X, Plus, Clock, Sparkles, Image, Wand2, Box, GitBranch, Send } from "lucide-react";

interface AssistPanelProps {
  onClose: () => void;
}

const quickActions = [
  { icon: Image, title: "Generate something", desc: "Turn your idea into an image" },
  { icon: Wand2, title: "Edit my image", desc: "Upload and modify an existing image" },
  { icon: Box, title: "Create a 3D model", desc: "From text or image" },
  { icon: GitBranch, title: "Run a workflow", desc: "Chain multiple tools" },
];

const AssistPanel = ({ onClose }: AssistPanelProps) => {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<{ role: "user" | "assistant"; text: string }[]>([]);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  };

  const handleSend = () => {
    if (!input.trim()) return;
    setMessages((prev) => [...prev, { role: "user", text: input.trim() }]);
    setInput("");
    // Simulate response
    setTimeout(() => {
      setMessages((prev) => [...prev, { role: "assistant", text: "I'll help you with that! Let me set things up..." }]);
    }, 1000);
  };

  return (
    <div className="fixed top-[52px] left-[54px] bottom-0 w-[380px] z-30 bg-card border-r border-border flex flex-col animate-slide-in-left">
      {/* Header */}
      <div className="flex items-center justify-between px-4 h-12 border-b border-border shrink-0">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-primary" />
          <span className="text-sm font-semibold text-foreground">Assist</span>
        </div>
        <div className="flex items-center gap-1">
          <button className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors">
            <Plus className="w-4 h-4" />
          </button>
          <button className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors">
            <Clock className="w-4 h-4" />
          </button>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {messages.length === 0 ? (
          <>
            <p className="text-sm text-muted-foreground mb-1">{getGreeting()}</p>
            <h3 className="text-lg font-semibold text-foreground mb-4">What do you want to create?</h3>

            <div className="grid grid-cols-2 gap-2">
              {quickActions.map((action) => (
                <button
                  key={action.title}
                  onClick={() => {
                    setInput(action.title.toLowerCase());
                  }}
                  className="p-3 rounded-xl border border-border bg-background hover:border-primary/40 transition-all text-left group"
                >
                  <action.icon className="w-5 h-5 text-primary mb-2" />
                  <p className="text-xs font-medium text-foreground">{action.title}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">{action.desc}</p>
                </button>
              ))}
            </div>
          </>
        ) : (
          <div className="space-y-3">
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[80%] px-3 py-2 rounded-xl text-sm ${
                  msg.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-foreground"
                }`}>
                  {msg.text}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Input */}
      <div className="p-3 border-t border-border shrink-0">
        <div className="flex items-center gap-2 bg-background border border-border rounded-xl px-3 py-2">
          <button className="text-muted-foreground hover:text-foreground shrink-0">
            <Plus className="w-4 h-4" />
          </button>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            placeholder="Ask anything, create anything"
            className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
          />
          <button
            onClick={handleSend}
            className={`shrink-0 w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${
              input.trim() ? "bg-primary text-primary-foreground" : "text-muted-foreground"
            }`}
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default AssistPanel;
