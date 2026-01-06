import { AlertCircle } from 'lucide-react';

interface ImagePlaceholderProps {
  message?: string;
  showIcon?: boolean;
  className?: string;
}

export const ImagePlaceholder = ({
  message = "No image available",
  showIcon = true,
  className = "",
}: ImagePlaceholderProps) => {
  return (
    <div
      className={`
        flex flex-col items-center justify-center
        w-full h-full min-h-[200px]
        bg-gradient-to-br from-muted/20 to-muted/5
        border-2 border-dashed border-border/40
        rounded-lg
        text-center
        p-6
        ${className}
      `}
    >
      {showIcon && (
        <AlertCircle className="w-12 h-12 text-muted-foreground/40 mb-3" />
      )}
      <p className="text-muted-foreground text-sm">{message}</p>
    </div>
  );
};

export const ImageGridPlaceholder = ({ count = 4 }: { count?: number }) => {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 p-4">
      {Array.from({ length: count }).map((_, idx) => (
        <div key={idx} className="aspect-square">
          <ImagePlaceholder
            message="No image"
            showIcon={true}
            className="h-full"
          />
        </div>
      ))}
    </div>
  );
};
