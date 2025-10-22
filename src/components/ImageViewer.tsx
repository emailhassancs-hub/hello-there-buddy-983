import { useState, useEffect } from "react";
import { Image as ImageIcon, RefreshCw, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogClose } from "@/components/ui/dialog";

interface ImageItem {
  name: string;
  url: string;
  timestamp?: number;
}

interface ImageViewerProps {
  apiUrl: string;
}

const ImageViewer = ({ apiUrl }: ImageViewerProps) => {
  const [images, setImages] = useState<ImageItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState<ImageItem | null>(null);
  const { toast } = useToast();

  const fetchImages = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${apiUrl}/images`);
      if (!response.ok) {
        throw new Error("Failed to fetch images");
      }
      const data = await response.json();
      
      // Map into objects with name + url
      const mapped = (data.images || []).map((filename: string) => ({
        name: filename,
        url: `/images/${filename}`,   // relative to backend
        timestamp: Date.now(), // placeholder, will be replaced by actual file stats if available
      }));

      // Try to fetch file stats for each image to get creation time
      const imagesWithStats = await Promise.all(
        mapped.map(async (img: ImageItem) => {
          try {
            const statsResponse = await fetch(`${apiUrl}/image-stats/${img.name}`);
            if (statsResponse.ok) {
              const stats = await statsResponse.json();
              return { ...img, timestamp: stats.mtime || stats.ctime || Date.now() };
            }
          } catch (e) {
            // If stats endpoint doesn't exist, fallback to filename parsing
            // Try to extract timestamp from filename if it contains a date pattern
            const match = img.name.match(/(\d{10,13})/); // Unix timestamp
            if (match) {
              return { ...img, timestamp: parseInt(match[1]) };
            }
          }
          return img;
        })
      );

      // Sort by timestamp (newest first)
      const sorted = imagesWithStats.sort((a, b) => {
        const timeA = a.timestamp || 0;
        const timeB = b.timestamp || 0;
        return timeB - timeA; // Descending order (newest first)
      });

      setImages(sorted);
    } catch (error) {
      toast({
        title: "Failed to load images",
        description: "Unable to fetch images from the server.",
        variant: "destructive",
      });
      console.error("Error fetching images:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchImages();
  }, []);

  return (
    <div className="flex flex-col h-full min-h-0 bg-background">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-border/50">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-gradient-primary">
            <ImageIcon className="w-6 h-6 text-primary-foreground" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-foreground">Image Viewer</h2>
            <p className="text-sm text-muted-foreground">View generated images</p>
          </div>
        </div>
        <Button
          variant="black"
          size="sm"
          onClick={fetchImages}
          disabled={isLoading}
          className="gap-2"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {/* Content Area */}
      <ScrollArea className="flex-1 min-h-0">
        <div className="p-6">
          {isLoading && images.length === 0 ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center space-y-4">
                <RefreshCw className="w-8 h-8 text-muted-foreground animate-spin mx-auto" />
                <p className="text-muted-foreground">Loading images...</p>
              </div>
            </div>
          ) : images.length === 0 ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center space-y-4">
                <div className="p-4 rounded-full bg-muted/50 inline-block">
                  <ImageIcon className="w-12 h-12 text-muted-foreground" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">No Images Yet</h3>
                  <p className="text-muted-foreground max-w-md">
                    Generated images from your story will appear here.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {images.map((image, index) => (
                <div
                  key={index}
                  className="group relative rounded-lg overflow-hidden border border-border/50 bg-card hover:shadow-lg transition-shadow cursor-pointer"
                  onClick={() => setSelectedImage(image)}
                >
                  <div className="aspect-square overflow-hidden bg-muted/20">
                    <img
                      src={`${apiUrl}${image.url}`}
                      alt={image.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      onError={(e) => {
                        e.currentTarget.src = "/placeholder.svg";
                      }}
                    />
                  </div>
                  <div className="p-3 border-t border-border/50">
                    <p className="text-sm font-medium text-foreground truncate" title={image.name}>
                      {image.name}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Zoom Dialog */}
      <Dialog open={!!selectedImage} onOpenChange={() => setSelectedImage(null)}>
        <DialogContent className="max-w-5xl w-full p-0 overflow-hidden">
          <DialogClose className="absolute right-4 top-4 z-10 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground">
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </DialogClose>
          {selectedImage && (
            <div className="flex flex-col">
              <div className="relative bg-muted/20 flex items-center justify-center p-8">
                <img
                  src={`${apiUrl}${selectedImage.url}`}
                  alt={selectedImage.name}
                  className="max-h-[70vh] w-auto object-contain"
                  onError={(e) => {
                    e.currentTarget.src = "/placeholder.svg";
                  }}
                />
              </div>
              <div className="p-4 border-t border-border/50 bg-card">
                <p className="text-sm font-medium text-foreground">{selectedImage.name}</p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ImageViewer;
