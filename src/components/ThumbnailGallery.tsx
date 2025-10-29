import { useState, useEffect, useRef } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { RefreshCw, ImageIcon, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogClose } from "@/components/ui/dialog";

interface ThumbnailGalleryProps {
  apiUrl: string;
  onThumbnailClick?: (filename: string) => void;
}

const ThumbnailGallery = ({ apiUrl, onThumbnailClick }: ThumbnailGalleryProps) => {
  const [thumbnails, setThumbnails] = useState<string[]>([]);
  const [convertedImages, setConvertedImages] = useState<Map<string, string>>(new Map());
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const loadThumbnails = async () => {
    setLoading(true);
    try {
      const authToken = (window as any).authToken;
      
      if (!authToken) {
        console.warn("No auth token available");
        setThumbnails([]);
        setLoading(false);
        return;
      }

      const response = await fetch(
        "https://games-ai-studio-be-nest-347148155332.us-central1.run.app/api/image-generation/history?limit=6&offset=0",
        {
          method: "GET",
          headers: {
            "accept": "*/*",
            "Authorization": `Bearer ${authToken}`,
          },
        }
      );
      
      if (!response.ok) throw new Error("Failed to load image history");
      
      const data = await response.json();
      // Extract image URLs from the response
      const imageUrls = data.map((item: any) => item.img_url || item.image_url || item.path).filter(Boolean);
      setThumbnails(imageUrls);
    } catch (error) {
      console.error("Error loading image history:", error);
      toast({
        title: "Load Failed",
        description: "Unable to load image history",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadThumbnails();
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(loadThumbnails, 30000);
    return () => clearInterval(interval);
  }, [apiUrl]);

  const getThumbnailUrl = (filename: string) => {
    // If filename is already a full URL, return it directly
    if (filename.startsWith('http://') || filename.startsWith('https://')) {
      return filename;
    }
    return `${apiUrl}/thumbnails/${filename}`;
  };

  const convertWebpToPng = async (filename: string, url: string): Promise<string> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Could not get canvas context'));
          return;
        }
        
        ctx.drawImage(img, 0, 0);
        
        canvas.toBlob((blob) => {
          if (blob) {
            const pngUrl = URL.createObjectURL(blob);
            resolve(pngUrl);
          } else {
            reject(new Error('Could not convert to PNG'));
          }
        }, 'image/png');
      };
      
      img.onerror = () => {
        reject(new Error('Could not load image'));
      };
      
      img.src = url;
    });
  };

  const getDisplayUrl = async (filename: string) => {
    const url = getThumbnailUrl(filename);
    
    if (filename.toLowerCase().endsWith('.webp')) {
      if (convertedImages.has(filename)) {
        return convertedImages.get(filename)!;
      }
      
      try {
        const pngUrl = await convertWebpToPng(filename, url);
        setConvertedImages(prev => new Map(prev).set(filename, pngUrl));
        return pngUrl;
      } catch (error) {
        console.error('Error converting webp to png:', error);
        return url; // Fallback to original
      }
    }
    
    return url;
  };

  const handleThumbnailClick = (filename: string) => {
    setSelectedImage(filename);
    onThumbnailClick?.(filename);
  };

  // Cleanup object URLs on unmount
  useEffect(() => {
    return () => {
      convertedImages.forEach((url) => {
        if (url.startsWith('blob:')) {
          URL.revokeObjectURL(url);
        }
      });
    };
  }, [convertedImages]);

  return (
    <div className="flex flex-col h-full bg-background">
      <div className="p-3 border-b border-border/50 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ImageIcon className="w-4 h-4 text-primary" />
          <h2 className="text-base font-semibold">Image History</h2>
          <span className="text-xs text-muted-foreground">
            ({thumbnails.length})
          </span>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={loadThumbnails}
          disabled={loading}
          className="h-8 w-8"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4">
          {thumbnails.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <ImageIcon className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p className="text-lg">No previous images found.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {thumbnails.map((url, index) => (
                <ThumbnailCard
                  key={`${url}-${index}`}
                  filename={url}
                  getDisplayUrl={getDisplayUrl}
                  onClick={() => handleThumbnailClick(url)}
                />
              ))}
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Enlarged View Dialog */}
      <Dialog open={!!selectedImage} onOpenChange={() => setSelectedImage(null)}>
        <DialogContent className="max-w-4xl p-0">
          <DialogClose className="absolute right-4 top-4 z-10 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground">
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </DialogClose>
          {selectedImage && (
            <EnlargedImage filename={selectedImage} getDisplayUrl={getDisplayUrl} />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

const ThumbnailCard = ({ filename, getDisplayUrl, onClick }: {
  filename: string;
  getDisplayUrl: (filename: string) => Promise<string>;
  onClick: () => void;
}) => {
  const [imgSrc, setImgSrc] = useState<string>("");

  useEffect(() => {
    getDisplayUrl(filename).then(setImgSrc);
  }, [filename]);

  return (
    <div
      className="group cursor-pointer rounded-lg border-2 border-border overflow-hidden transition-all hover:border-primary/50 hover:shadow-lg hover:scale-105"
      onClick={onClick}
    >
      <div className="aspect-square bg-muted flex items-center justify-center overflow-hidden">
        <img
          src={imgSrc}
          alt={filename}
          className="w-full h-full object-cover transition-transform group-hover:scale-110"
          loading="lazy"
        />
      </div>
      <div className="p-2 bg-card">
        <p className="text-xs font-medium truncate" title={filename}>
          {filename}
        </p>
      </div>
    </div>
  );
};

const EnlargedImage = ({ filename, getDisplayUrl }: {
  filename: string;
  getDisplayUrl: (filename: string) => Promise<string>;
}) => {
  const [imgSrc, setImgSrc] = useState<string>("");

  useEffect(() => {
    getDisplayUrl(filename).then(setImgSrc);
  }, [filename]);

  return (
    <div className="p-4">
      <img
        src={imgSrc}
        alt={filename}
        className="w-full h-auto max-h-[80vh] object-contain rounded-lg"
      />
      <p className="mt-4 text-center text-sm font-medium">{filename}</p>
    </div>
  );
};

export default ThumbnailGallery;
