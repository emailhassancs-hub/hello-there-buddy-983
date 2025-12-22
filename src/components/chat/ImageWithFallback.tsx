import { useState } from "react";
import { cn } from "@/lib/utils";

interface ImageWithFallbackProps {
  src: string;
  alt: string;
  className?: string;
  style?: React.CSSProperties;
  onImageClick?: (src: string) => void;
  fallbackMessage?: string;
  showLink?: boolean;
}

export const ImageWithFallback = ({
  src,
  alt,
  className,
  style,
  onImageClick,
  fallbackMessage = "Image preview unavailable.",
  showLink = true,
}: ImageWithFallbackProps) => {
  const [hasError, setHasError] = useState(false);

  if (hasError) {
    return (
      <div className="text-sm text-muted-foreground">
        {fallbackMessage}
        {showLink && (
          <>
            {' '}
            <a
              href={src}
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-primary"
            >
              View image
            </a>
          </>
        )}
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      className={cn("cursor-pointer hover:opacity-90 transition-opacity", className)}
      style={style}
      onError={() => setHasError(true)}
      onClick={() => onImageClick?.(src)}
    />
  );
};

