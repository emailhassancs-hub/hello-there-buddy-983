import { Message } from "./types";
import { parseToolResponse, isImageUrl, is3DModelTool } from "./utils";
import { ImageWithFallback } from "./ImageWithFallback";

interface MessageImageRendererProps {
  message: Message;
  apiUrl: string;
  onImageZoom: (src: string) => void;
  onModelSelect?: (modelUrl: string, thumbnailUrl: string, workflow: string) => void;
}

export const MessageImageRenderer = ({
  message,
  apiUrl,
  onImageZoom,
  onModelSelect,
}: MessageImageRendererProps) => {
  if (typeof message.text !== 'string') {
    return null;
  }

  // Check for 3D model tool messages
  if (is3DModelTool(message.toolName)) {
    if (message.text.includes('Error executing tool') || message.text.includes('500 Server Error')) {
      return (
        <div className="space-y-2">
          <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20">
            <p className="text-sm text-destructive">Failed to generate 3D model. Please try again.</p>
          </div>
        </div>
      );
    }

    const parsed = parseToolResponse(message.text);
    if (parsed?.thumbnail_url && parsed?.model_url) {
      const workflow = message.toolName?.includes('image_to_3d') 
        ? 'image_to_3d' 
        : message.toolName?.includes('text_to_3d') 
        ? 'text_to_3d' 
        : 'post_processing';
      
      return (
        <div className="space-y-2">
          <img
            src={parsed.thumbnail_url}
            alt="3D Model Preview"
            className="rounded-lg max-w-full h-auto cursor-pointer hover:opacity-80 transition-opacity"
            onClick={() => onModelSelect?.(parsed.model_url!, parsed.thumbnail_url!, workflow)}
          />
          <p className="text-xs text-muted-foreground italic">Click thumbnail to view 3D model</p>
        </div>
      );
    }
    return null;
  }

  // Check if message is a plain URL
  if (isImageUrl(message.text)) {
    return (
      <div className="mt-3">
        <ImageWithFallback
          src={message.text.trim()}
          alt="Generated image"
          className="rounded-xl max-w-[320px] h-auto border border-border shadow-sm"
          style={{
            marginTop: '8px'
          }}
          onImageClick={onImageZoom}
        />
        <p className="text-xs text-muted-foreground italic mt-2">Click to zoom</p>
      </div>
    );
  }

  // Try to parse JSON response
  const parsed = parseToolResponse(message.text);
  if (!parsed) {
    return null;
  }

  // Check for thumbnail_url (priority)
  if (parsed.thumbnail_url) {
    return (
      <div className="space-y-2">
        <ImageWithFallback
          src={parsed.thumbnail_url}
          alt={parsed.prompt || parsed.job_id || 'Generated thumbnail'}
          className="rounded-xl max-w-[320px] h-auto"
          style={{ marginTop: '8px' }}
          onImageClick={onImageZoom}
        />
        {parsed.job_id && (
          <p className="text-xs text-muted-foreground italic">Job ID: {parsed.job_id}</p>
        )}
      </div>
    );
  }

  // Check for img_url
  if (parsed.img_url) {
    return (
      <div className="space-y-2">
        <ImageWithFallback
          src={parsed.img_url}
          alt={parsed.filename || 'Generated image'}
          className="rounded-xl max-w-[320px] h-auto"
          style={{ marginTop: '8px' }}
          onImageClick={onImageZoom}
        />
        {parsed.prompt && (
          <p className="text-xs text-muted-foreground italic whitespace-pre-wrap break-words">
            {parsed.prompt}
          </p>
        )}
      </div>
    );
  }

  // Check for type: "image"
  if (parsed.type === "image") {
    const imagePath = parsed.path || parsed.filename;
    const prompt = parsed.prompt || "Generated image";

    if (!imagePath) return null;

    return (
      <div className="space-y-2">
        <ImageWithFallback
          src={imagePath.startsWith('http') ? imagePath : `${apiUrl}/${imagePath}`}
          alt={prompt}
          className="rounded-lg max-w-full h-auto"
          onImageClick={onImageZoom}
        />
        <p className="text-xs text-muted-foreground italic">Generated image</p>
      </div>
    );
  }

  // Check if message is a plain image path
  const imagePathPattern = /^images[\\/][\w\-_.]+\.(png|jpg|jpeg|gif|webp)$/i;
  if (imagePathPattern.test(message.text.trim())) {
    const imagePath = message.text.trim().replace(/\\/g, '/');
    return (
      <div className="space-y-2">
        <ImageWithFallback
          src={`${apiUrl}/${imagePath}`}
          alt="Generated image"
          className="rounded-lg max-w-full h-auto"
          onImageClick={onImageZoom}
        />
        <p className="text-xs text-muted-foreground italic">Generated image</p>
      </div>
    );
  }

  return null;
};

