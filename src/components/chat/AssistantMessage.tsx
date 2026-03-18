import { useMemo } from "react";
import { Message } from "./types";
import { Sparkles, ChevronDown, Box, ZoomIn, Wand2, Settings, Scissors } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Skeleton } from "@/components/ui/skeleton";
import { cleanImageTags, isImageUrl, parseToolResponse, is3DModelTool } from "./utils";
import TypewriterText from "../TypewriterText";
import { MessageImageRenderer } from "./MessageImageRenderer";
import { 
  ModelSelectionForm, 
  OptimizationConfigForm, 
  OptimizationResultForm,
  OptimizedModelCard,
  type ModelInfo,
  type OptimizationPresets,
  type OptimizationResult
} from "../OptimizationForms";
import { OptimizationInlineForm } from "../OptimizationInlineForm";
import { ImageWithFallback } from "./ImageWithFallback";

const GENERATING_HINTS = [
  "Start your next generation while this one finishes. 🚀",
  "No queues. No waiting. Generate another in parallel. ⚡",
  "You can generate again while this one renders. 🎨",
  "This one's cooking. Fire up another. 🔥",
];

interface AssistantMessageProps {
  message: Message;
  apiUrl: string;
  onImageZoom: (src: string) => void;
  onModelSelect?: (modelUrl: string, thumbnailUrl: string, workflow: string) => void;
  onOptimizationFormSubmit?: (type: string, data: unknown) => void;
}

export const AssistantMessage = ({
  message,
  apiUrl,
  onImageZoom,
  onModelSelect,
  onOptimizationFormSubmit,
}: AssistantMessageProps) => {
  const isProd = import.meta.env.VITE_APP_ENV === "production";
  // Handle case where text might be null, undefined, or non-string (images/models come in separate fields)
  const messageText = typeof message.text === 'string' ? message.text : '';
  const cleanedText = cleanImageTags(messageText);
  
  // Check for actual image/model content (URLs, paths) - used for rendering actual content
  const hasActualContent = Boolean(
    message.image_path ||
    message.img_url ||
    message.thumbnail_url ||
    message.model_url
  );
  
  // Check for image/model content (including tool detection) - used for text display logic
  const hasImageContent = Boolean(
    hasActualContent ||
    message.type === "image" ||
    message.type === "image_generation" ||
    is3DModelTool(message.toolName)
  );
  
  // Check status directly on message object
  const status = message.status?.toLowerCase();
  const isListening = status === "listening";
  const isCompleted = status === "completed" || status === "complete";
  
  // Check if text is a plain image URL (for backward compatibility)
  const isPlainImageUrl = messageText ? isImageUrl(messageText.trim()) : false;
  
  // Only show text if:
  // - It's not a plain image URL
  // - There's no image/model content on the message object
  // - Status is not listening
  // - Text exists and is not empty
  const shouldShowText = !isPlainImageUrl && !hasImageContent && !isListening && cleanedText.length > 0;
  
  // Show placeholder when status is listening and no actual content exists (generic placeholder)
  // This works for both image and model generation, but exclude optimized-model which has its own placeholder
  const shouldShowImagePlaceholder = isListening && !hasActualContent && message.formType !== "optimized-model";

  const generatingHint = useMemo(() => {
    if (!shouldShowImagePlaceholder) return "";
    const seed = message.id
      ? message.id.split("").reduce((acc, ch) => acc + ch.charCodeAt(0), 0)
      : Math.floor(Math.random() * 10_000);
    return GENERATING_HINTS[seed % GENERATING_HINTS.length];
  }, [message.id, shouldShowImagePlaceholder]);

  return (
    <div className="flex justify-start">
      <div className="max-w-[80%] chat-bubble-enter">
        <div className="flex items-center gap-1.5 mb-2.5">
          <div className="w-5 h-5 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center flex-shrink-0">
            <Sparkles className="w-2.5 h-2.5 text-primary" />
          </div>
          <span className="text-[11px] font-semibold text-primary/70 tracking-wide">Rapid Assets Studio</span>
        </div>

        {/* Render text content first if it's not just an image URL */}
        {shouldShowText && (
          <TypewriterText text={cleanedText} speed={3} />
        )}

        {/* Render image placeholder when status is listening and no image content exists */}
        {shouldShowImagePlaceholder && (
          <>
          <div className="space-y-2 mt-3 mb-2">
            <div className="relative rounded-xl w-[320px] h-[320px] overflow-hidden shimmer-card gen-active border border-border/40">
              {/* Loading spinner and text */}
              <div className="absolute inset-0 flex items-center justify-center z-10">
                <div className="flex flex-col items-center gap-3">
                  <div className="relative w-10 h-10">
                    <div className="absolute inset-0 border-[3px] border-primary/15 rounded-full"></div>
                    <div className="absolute inset-0 border-[3px] border-transparent border-t-primary rounded-full animate-spin"></div>
                  </div>
                  <span className="text-xs text-muted-foreground font-medium tracking-wide">Generating…</span>
                </div>
              </div>
            </div>
          </div>
          {generatingHint && (
            <span className="text-xs text-muted-foreground/80 leading-relaxed">
              {generatingHint}
            </span>
          )}
          </>
        )}

        {/* Render image content after text - always render if image content exists */}
        {hasImageContent && (
          <MessageImageRenderer
            message={message}
            apiUrl={apiUrl}
            onImageZoom={onImageZoom}
            onModelSelect={onModelSelect}
          />
        )}

        {/* Suggestion pills — shown when generation completes */}
        {hasActualContent && isCompleted && (
          <SuggestionPills toolName={message.toolName || ""} />
        )}

        {/* Render tool response collapsible - only if not listening */}
        {message.toolName && messageText && !hasImageContent && !isListening && (
          <ToolResponseCollapsible
            toolName={message.toolName}
            text={messageText}
            isImageUrl={messageText ? isImageUrl(messageText.trim()) : false}
            onImageClick={onImageZoom}
          />
        )}

        {/* Render optimization forms */}
        <OptimizationForms
          message={message}
          apiUrl={apiUrl}
          onOptimizationFormSubmit={onOptimizationFormSubmit}
        />
         {/* Tool name badge - hide for plain image URLs */}
         {/* {!isProd &&
         message.toolName && 
         !message.toolName.match(/(image_to_3d|text_to_3d|post_processing)/) && 
         !isPlainImageUrl && (
          <div className="mt-2 text-xs text-muted-foreground bg-secondary/30 px-2 py-1 rounded inline-block">
            Tool result: {message.toolName}
          </div>
        )} */}

        {/* {message.timestamp && (
          <div className="text-xs opacity-70 mt-2">
            {message.timestamp.toLocaleTimeString()}
          </div>
        )} */}
      </div>
    </div>
  );
};

// ── Suggestion pills ────────────────────────────────────────────────────────

type Pill = { icon: React.ReactNode; label: string; query: string };

const getSuggestions = (toolName: string): Pill[] => {
  const tn = toolName.toLowerCase();
  if (tn.includes("background_remove")) {
    return [
      { icon: <Box className="w-3 h-3" />, label: "Convert to 3D", query: "Convert this image to a 3D model" },
      { icon: <ZoomIn className="w-3 h-3" />, label: "Upscale", query: "Upscale this image to higher resolution" },
    ];
  }
  if (tn.includes("upscal")) {
    return [
      { icon: <Wand2 className="w-3 h-3" />, label: "Edit image", query: "Edit this image" },
      { icon: <Box className="w-3 h-3" />, label: "Convert to 3D", query: "Convert this image to a 3D model" },
    ];
  }
  if (tn.includes("3d") || tn.includes("model")) {
    return [
      { icon: <Settings className="w-3 h-3" />, label: "Optimize for games", query: "Optimize this 3D model for game use" },
    ];
  }
  // Default: after image generation / editing
  return [
    { icon: <Scissors className="w-3 h-3" />, label: "Remove background", query: "Remove the background from this image" },
    { icon: <ZoomIn className="w-3 h-3" />, label: "Upscale", query: "Upscale this image to higher resolution" },
    { icon: <Box className="w-3 h-3" />, label: "Convert to 3D", query: "Convert this image to a 3D model" },
    { icon: <Wand2 className="w-3 h-3" />, label: "Edit image", query: "Edit this image" },
  ];
};

const SuggestionPills = ({ toolName }: { toolName: string }) => {
  const pills = getSuggestions(toolName);

  const handleClick = (query: string) => {
    window.dispatchEvent(new CustomEvent("suggestionSelected", { detail: { query } }));
  };

  return (
    <div className="flex flex-wrap gap-1.5 mt-3">
      {pills.map((p, i) => (
        <button key={i} className="suggestion-pill" onClick={() => handleClick(p.query)}>
          {p.icon}
          {p.label}
        </button>
      ))}
    </div>
  );
};

// ── Tool response collapsible ────────────────────────────────────────────────

interface ToolResponseCollapsibleProps {
  toolName: string;
  text: string;
  isImageUrl: boolean;
  onImageClick: (src: string) => void;
}

const ToolResponseCollapsible = ({
  toolName,
  text,
  isImageUrl,
  onImageClick,
}: ToolResponseCollapsibleProps) => {
  if (isImageUrl) {
    return (
      <div className="space-y-2 mt-3">
        <ImageWithFallback
          src={text.trim()}
          alt="Generated content"
          className="rounded-lg max-w-md h-auto border border-border shadow-sm"
          onImageClick={onImageClick}
        />
        <p className="text-xs text-muted-foreground italic">Click to zoom</p>
      </div>
    );
  }

  return (
    <Collapsible className="mt-3">
      <CollapsibleTrigger className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors">
        <ChevronDown className="w-3 h-3" />
        <span>View raw response</span>
      </CollapsibleTrigger>
      <CollapsibleContent className="mt-2">
        <div className="p-3 rounded-lg bg-muted/50 border border-border/50">
          <div className="text-xs font-mono text-muted-foreground mb-2">
            Tool: <span className="text-foreground font-semibold">{toolName}</span>
          </div>
          <pre className="text-xs overflow-x-auto whitespace-pre-wrap break-words">
            {(() => {
              try {
                return JSON.stringify(JSON.parse(text), null, 2);
              } catch {
                return text;
              }
            })()}
          </pre>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
};

interface OptimizationFormsProps {
  message: Message;
  apiUrl: string;
  onOptimizationFormSubmit?: (type: string, data: unknown) => void;
}

const OptimizationForms = ({
  message,
  apiUrl,
  onOptimizationFormSubmit,
}: OptimizationFormsProps) => {
  const authToken = (window as { authToken?: string }).authToken || null;

  if (message.formType === "model-selection" && message.formData) {
    const formData = message.formData as { models: ModelInfo[]; isUploading?: boolean; isDisabled?: boolean };
    return (
      <div className="mt-3">
        <ModelSelectionForm
          models={formData.models}
          isUploading={formData.isUploading || false}
          isDisabled={formData.isDisabled || false}
          onModelSelect={(modelId) => {
            onOptimizationFormSubmit?.("model-selected", { modelId });
          }}
          onUploadNew={() => {
            onOptimizationFormSubmit?.("upload-new", {});
          }}
        />
      </div>
    );
  }

  if (message.formType === "optimization-config" && message.formData) {
    const formData = message.formData as {
      modelId: number;
      presets: OptimizationPresets;
      isDisabled?: boolean;
    };
    return (
      <div className="mt-3">
        <OptimizationConfigForm
          presets={formData.presets}
          onSubmit={(type, strength) =>
            onOptimizationFormSubmit?.("start-optimization", {
              type,
              strength,
              modelId: formData.modelId,
              presets: formData.presets,
            })
          }
          isLoading={false}
          apiUrl={apiUrl}
          authToken={authToken}
          modelId={formData.modelId}
          isDisabled={formData.isDisabled || false}
        />
      </div>
    );
  }

  if (message.formType === "optimization-result" && message.formData) {
    const result = message.formData as OptimizationResult;
    return (
      <div className="mt-3">
        <OptimizationResultForm
          result={result}
          onDownload={(url) => {
            window.open(url, '_blank');
          }}
          onReset={() => onOptimizationFormSubmit?.("reset", {})}
        />
      </div>
    );
  }

  if (message.formType === "optimization-inline") {
    return (
      <OptimizationInlineForm
        apiUrl={apiUrl}
        authToken={authToken}
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
    );
  }

  if (message.formType === "optimized-model") {
    const status = message.status?.toLowerCase();
    const isOptimizing = status === "listening" || status === "processing";
    
    // Show placeholder while optimizing
    if (isOptimizing) {
      return (
        <div className="mt-3">
          <div className="p-3 bg-background border border-border rounded-lg space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin"></div>
              <h4 className="text-foreground font-medium text-sm">Optimizing model...</h4>
            </div>
            <p className="text-muted-foreground text-xs">Status: processing</p>
          </div>
        </div>
      );
    }
    
    // Show actual card when done
    if (message.formData) {
      const formData = message.formData as {
        preset_name: string;
        optimization_status: string;
        name: string;
        downloads: {
          glb?: string;
          usdz?: string;
          fbx?: string;
        };
      };
      return (
        <div className="mt-3">
          <OptimizedModelCard
            preset_name={formData.preset_name}
            optimization_status={formData.optimization_status}
            name={formData.name}
            downloads={formData.downloads}
          />
        </div>
      );
    }
  }

  return null;
};

