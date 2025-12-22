import { Message } from "./types";
import { Sparkles, ChevronDown } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { cleanImageTags, isImageUrl, parseToolResponse, is3DModelTool } from "./utils";
import TypewriterText from "../TypewriterText";
import { MessageImageRenderer } from "./MessageImageRenderer";
import { 
  ModelSelectionForm, 
  OptimizationConfigForm, 
  OptimizationResultForm, 
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
  if (typeof message.text !== 'string') {
    return null;
  }

  const cleanedText = cleanImageTags(message.text);
  
  // Check if message has image content
  const parsed = parseToolResponse(message.text);
  const isPlainImageUrl = isImageUrl(message.text.trim());
  const hasImageContent = Boolean(
    (parsed && (parsed.thumbnail_url || parsed.img_url || parsed.type === "image")) ||
    isPlainImageUrl ||
    is3DModelTool(message.toolName)
  );

  // Don't render text if message is just an image URL (hide the URL text, show only image)
  const shouldShowText = !isPlainImageUrl && cleanedText.length > 0;

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

        {/* Render image content after text */}
        <MessageImageRenderer
          message={message}
          apiUrl={apiUrl}
          onImageZoom={onImageZoom}
          onModelSelect={onModelSelect}
        />

        {/* Render tool response collapsible */}
        {message.toolName && message.text && !hasImageContent && (
          <ToolResponseCollapsible
            toolName={message.toolName}
            text={message.text}
            isImageUrl={isImageUrl(message.text.trim())}
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
        {message.toolName && 
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
    const formData = message.formData as { models: ModelInfo[] };
    return (
      <div className="mt-3">
        <ModelSelectionForm
          models={formData.models}
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

  return null;
};

