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
  // Check status - only hide images when processing/listening, show otherwise
  const status = message.status?.toLowerCase();
  if (status && (status === "processing" || status === "listening")) {
    return null;
  }
  
  // If we have image content, show it (status check above already filtered out processing/listening)

  // Check for 3D model tool messages - check message object first
  if (is3DModelTool(message.toolName)) {
    if (message.text?.includes('Error executing tool') || message.text?.includes('500 Server Error')) {
      return (
        <div className="space-y-2">
          <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20">
            <p className="text-sm text-destructive">Failed to generate 3D model. Please try again.</p>
          </div>
        </div>
      );
    }

    // Check message object first for model_url and thumbnail_url
    if (message.model_url && message.thumbnail_url) {
      const workflow = message.toolName?.includes('image_to_3d') 
        ? 'image_to_3d' 
        : message.toolName?.includes('text_to_3d') 
        ? 'text_to_3d' 
        : 'post_processing';
      
      return (
        <div className="space-y-2">
          <img
            src={message.thumbnail_url}
            alt="3D Model Preview"
            className="rounded-lg max-w-full h-auto cursor-pointer hover:opacity-80 transition-opacity"
            onClick={() => onModelSelect?.(message.model_url!, message.thumbnail_url!, workflow)}
          />
          <p className="text-xs text-muted-foreground italic">Click thumbnail to view 3D model</p>
        </div>
      );
    }
    
    // Fallback to parsing text for backward compatibility
    if (typeof message.text === 'string') {
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
    }
    return null;
  }

  // Check message object first for image fields (new structure)
  if (message.thumbnail_url) {
    return (
      <div className="space-y-2">
        <ImageWithFallback
          src={message.thumbnail_url}
          alt={message.prompt || message.jobId || 'Generated thumbnail'}
          className="rounded-xl max-w-[320px] h-auto"
          style={{ marginTop: '8px' }}
          onImageClick={onImageZoom}
        />
        {message.jobId && (
          <p className="text-xs text-muted-foreground italic">Job ID: {message.jobId}</p>
        )}
      </div>
    );
  }

  if (message.image_path) {
    return (
      <div className="space-y-2">
        <ImageWithFallback
          src={message.image_path}
          alt={message.prompt || message.jobId || 'Generated image'}
          className="rounded-xl max-w-[320px] h-auto"
          style={{ marginTop: '8px' }}
          onImageClick={onImageZoom}
        />
        {message.jobId && (
          <p className="text-xs text-muted-foreground italic">Job ID: {message.jobId}</p>
        )}
        {message.prompt && (
          <p className="text-xs text-muted-foreground italic whitespace-pre-wrap break-words">
            {message.prompt}
          </p>
        )}
      </div>
    );
  }

  if (message.img_url) {
    return (
      <div className="space-y-2">
        <ImageWithFallback
          src={message.img_url}
          alt={message.prompt || 'Generated image'}
          className="rounded-xl max-w-[320px] h-auto"
          style={{ marginTop: '8px' }}
          onImageClick={onImageZoom}
        />
        {message.prompt && (
          <p className="text-xs text-muted-foreground italic whitespace-pre-wrap break-words">
            {message.prompt}
          </p>
        )}
      </div>
    );
  }

  // Fallback to parsing text for backward compatibility
  if (typeof message.text === 'string') {
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

    // Try to parse JSON response (backward compatibility)
    const parsed = parseToolResponse(message.text);
    if (parsed) {
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

      // Check for image_path
      if (parsed.image_path) {
        return (
          <div className="space-y-2">
            <ImageWithFallback
              src={parsed.image_path}
              alt={parsed.prompt || parsed.job_id || 'Generated image'}
              className="rounded-xl max-w-[320px] h-auto"
              style={{ marginTop: '8px' }}
              onImageClick={onImageZoom}
            />
            {parsed.job_id && (
              <p className="text-xs text-muted-foreground italic">Job ID: {parsed.job_id}</p>
            )}
            {parsed.prompt && (
              <p className="text-xs text-muted-foreground italic whitespace-pre-wrap break-words">
                {parsed.prompt}
              </p>
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

      // Check for type: "image" or "image_generation"
      if (parsed.type === "image" || parsed.type === "image_generation") {
        const imagePath = parsed.path || parsed.filename;
        const prompt = parsed.prompt || "Generated image";

        if (imagePath) {
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
      }
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
  }

  return null;
};

