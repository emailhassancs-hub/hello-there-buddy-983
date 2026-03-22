import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";

const modes = [
  { id: "assist", label: "✦ Assist", placeholder: "Ask anything — create images, 3D models, or get ideas…" },
  { id: "image", label: "🖼 Image", placeholder: "Describe the image you want to generate…" },
  { id: "3d", label: "📦 3D", placeholder: "Describe a 3D model — or switch to Image→3D above…" },
  { id: "edit", label: "✏️ Edit", placeholder: "Describe what you want to change in your image…" },
] as const;

type Mode = typeof modes[number]["id"];

const quickChips = [
  { emoji: "🎮", text: "A sci-fi weapon concept" },
  { emoji: "🏰", text: "A fantasy castle environment" },
  { emoji: "🤖", text: "A battle-worn robot character" },
  { emoji: "🌺", text: "A photorealistic rose in 4K" },
  { emoji: "🚀", text: "A futuristic space rocket" },
];

function getGreeting() {
  const h = new Date().getHours();
  if (h >= 6 && h < 12) return "Good morning. What are you building today?";
  if (h >= 12 && h < 17) return "Good afternoon. Ready to create something?";
  if (h >= 17 && h < 22) return "Good evening. What can I help you create?";
  return "Working late? Let's build something great.";
}

interface CreationWidgetProps {
  promptValue?: string;
  onPromptChange?: (val: string) => void;
  pulsePrompt?: boolean;
}

const CreationWidget = ({ promptValue, onPromptChange, pulsePrompt }: CreationWidgetProps) => {
  const [activeMode, setActiveMode] = useState<Mode>("assist");
  const [prompt, setPrompt] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const navigate = useNavigate();

  const currentPrompt = promptValue ?? prompt;
  const setCurrentPrompt = onPromptChange ?? setPrompt;

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 160) + "px";
    }
  }, [currentPrompt]);

  const currentMode = modes.find((m) => m.id === activeMode)!;

  const handleCreate = () => {
    if (!currentPrompt.trim()) return;
    const encoded = encodeURIComponent(currentPrompt.trim());
    switch (activeMode) {
      case "image":
        navigate(`/image?prompt=${encoded}`);
        break;
      case "3d":
        navigate(`/3d?prompt=${encoded}`);
        break;
      case "edit":
        navigate("/edit");
        break;
      case "assist":
      default:
        navigate(`/studio?prompt=${encoded}`);
        break;
    }
  };

  const handleChipClick = (text: string) => {
    setCurrentPrompt(text);
    setActiveMode("image");
    textareaRef.current?.focus();
  };

  return (
    <div
      className="rounded-2xl overflow-hidden border border-border"
      style={{
        background: "#141418",
        boxShadow: "0 0 0 1px rgba(124,90,246,0.1), 0 32px 64px rgba(0,0,0,0.5)",
      }}
    >
      {/* TOP — GREETING */}
      <div
        className="p-5 border-b border-border"
        style={{
          background: "linear-gradient(135deg, #1A0F2E 0%, #141418 100%)",
          minHeight: 160,
        }}
      >
        <div className="flex items-center gap-2 mb-4">
          <span className="text-xs font-medium" style={{ color: "#A78BFA" }}>
            ✦ Assist
          </span>
          <span
            className="w-1.5 h-1.5 rounded-full"
            style={{ background: "#22C55E", animation: "livePulse 2s ease-in-out infinite" }}
          />
          <span
            className="text-[10px] font-medium px-1.5 py-0.5 rounded-full"
            style={{
              background: "rgba(34,197,94,0.15)",
              border: "1px solid rgba(34,197,94,0.3)",
              color: "#4ADE80",
            }}
          >
            LIVE
          </span>
        </div>
        <p className="text-lg font-semibold text-foreground leading-snug max-w-xs">
          {getGreeting()}
        </p>
        <div className="mt-4 flex gap-2 overflow-x-auto" style={{ scrollbarWidth: "none" }}>
          {quickChips.map((chip) => (
            <button
              key={chip.text}
              onClick={() => handleChipClick(chip.text)}
              className="whitespace-nowrap text-xs font-medium px-3 py-1.5 rounded-full cursor-pointer transition-all duration-150 shrink-0"
              style={{
                background: "rgba(124,90,246,0.1)",
                border: "1px solid rgba(124,90,246,0.25)",
                color: "#C4B5FD",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "rgba(124,90,246,0.2)";
                e.currentTarget.style.borderColor = "rgba(124,90,246,0.5)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "rgba(124,90,246,0.1)";
                e.currentTarget.style.borderColor = "rgba(124,90,246,0.25)";
              }}
            >
              {chip.emoji} {chip.text}
            </button>
          ))}
        </div>
      </div>

      {/* MIDDLE — MODE SELECTOR */}
      <div className="px-6 py-3 border-b border-border flex items-center gap-2" style={{ background: "#141418" }}>
        <span className="text-xs" style={{ color: "#6B7280" }}>
          Create with:
        </span>
        {modes.map((m) => (
          <button
            key={m.id}
            onClick={() => setActiveMode(m.id)}
            className="text-xs font-medium px-3.5 py-1.5 rounded-full transition-all duration-150 cursor-pointer"
            style={
              activeMode === m.id
                ? { background: "#7C5AF6", color: "white", border: "none" }
                : { background: "#2A2A35", border: "1px solid #3D3D4D", color: "#9CA3AF" }
            }
          >
            {m.label}
          </button>
        ))}
      </div>

      {/* BOTTOM — PROMPT INPUT */}
      <div className="px-6 pt-4 pb-5" style={{ background: "#141418" }}>
        <textarea
          ref={textareaRef}
          value={currentPrompt}
          onChange={(e) => setCurrentPrompt(e.target.value)}
          placeholder={currentMode.placeholder}
          className={`w-full rounded-lg px-4 py-3 text-sm resize-none focus:outline-none transition-all duration-200 ${pulsePrompt ? "animate-prompt-pulse" : ""}`}
          style={{
            background: "#2A2A35",
            border: pulsePrompt ? "1px solid #7C5AF6" : "1px solid #3D3D4D",
            color: "#E5E7EB",
            minHeight: 80,
            boxShadow: pulsePrompt ? "0 0 0 3px rgba(124,90,246,0.25)" : "none",
          }}
          onFocus={(e) => {
            e.currentTarget.style.borderColor = "#7C5AF6";
            e.currentTarget.style.boxShadow = "0 0 0 2px rgba(124,90,246,0.2)";
          }}
          onBlur={(e) => {
            if (!pulsePrompt) {
              e.currentTarget.style.borderColor = "#3D3D4D";
              e.currentTarget.style.boxShadow = "none";
            }
          }}
        />
        <div className="flex items-center justify-between mt-3">
          <div className="flex items-center gap-2">
            {(activeMode === "image" || activeMode === "edit" || activeMode === "3d") && (
              <button className="text-xs transition-colors" style={{ color: "#9CA3AF" }}>
                + Add image
              </button>
            )}
          </div>
          <button
            onClick={handleCreate}
            disabled={!currentPrompt.trim() || isSubmitting}
            className="text-sm font-semibold px-6 py-2.5 rounded-lg transition-all duration-150 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.97]"
            style={{ background: "#7C5AF6", color: "white" }}
            onMouseEnter={(e) => { if (currentPrompt.trim()) e.currentTarget.style.background = "#6D4AE8"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "#7C5AF6"; }}
          >
            {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Create →"}
          </button>
        </div>
      </div>

      {/* FOOTNOTE */}
      <div className="text-center pb-3.5 px-6" style={{ background: "#141418" }}>
        <span className="text-[11px]" style={{ color: "#4B5563" }}>
          ✦ Powered by Qwen · Seedream4 · Flux · Nano Banana and more
        </span>
      </div>
    </div>
  );
};

export default CreationWidget;
