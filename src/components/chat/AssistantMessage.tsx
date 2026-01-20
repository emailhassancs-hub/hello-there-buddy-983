import { Message } from "./types";
import { Sparkles, ChevronDown } from "lucide-react";
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

  return (
    <div className="flex justify-start">
      <div className="max-w-[80%] chat-bubble-enter">
        <div className="flex items-center gap-1.5 mb-2">
          <Sparkles className="w-3.5 h-3.5 text-muted-foreground" />
          <span className="text-xs font-bold text-muted-foreground">Game AI Studio</span>
        </div>

        {/* Render text content first if it's not just an image URL */}
        {shouldShowText && (
          <TypewriterText text={cleanedText} speed={3} />
        )}

        {/* Render image placeholder when status is listening and no image content exists */}
        {shouldShowImagePlaceholder && (
          <div className="space-y-2 mt-3">
            <div className="relative rounded-xl w-[320px] h-[320px] overflow-hidden bg-muted">
              {/* Shimmer overlay */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent animate-shine"></div>
              {/* Loading spinner and text */}
              <div className="absolute inset-0 flex items-center justify-center z-10">
                <div className="flex flex-col items-center gap-2">
                  <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin"></div>
                  <span className="text-xs text-muted-foreground font-medium">Generating ...</span>
                </div>
              </div>
            </div>
          </div>
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
         {!isProd &&
         message.toolName && 
         !message.toolName.match(/(image_to_3d|text_to_3d|post_processing)/) && 
         !isPlainImageUrl && (
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
  );
};

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

