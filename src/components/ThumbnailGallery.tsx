import { useState, useEffect } from "react";
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
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const loadThumbnails = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${apiUrl}/thumbnails`);
      if (!response.ok) throw new Error("Failed to load thumbnails");
      
      const data = await response.json();
      setThumbnails(data.thumbnails || []);
    } catch (error) {
      console.error("Error loading thumbnails:", error);
      toast({
        title: "Load Failed",
        description: "Unable to load thumbnails",
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
    return `${apiUrl}/thumbnails/${filename}`;
  };

  const handleThumbnailClick = (filename: string) => {
    setSelectedImage(filename);
    onThumbnailClick?.(filename);
  };

  return (
    <div className="flex flex-col h-full bg-background">
      <div className="p-3 border-b border-border/50 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ImageIcon className="w-4 h-4 text-primary" />
          <h2 className="text-base font-semibold">Thumbnails</h2>
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
              <p className="text-lg">No thumbnails available</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {thumbnails.map((filename) => (
                <div
                  key={filename}
                  className="group cursor-pointer rounded-lg border-2 border-border overflow-hidden transition-all hover:border-primary/50 hover:shadow-lg hover:scale-105"
                  onClick={() => handleThumbnailClick(filename)}
                >
                  <div className="aspect-square bg-muted flex items-center justify-center overflow-hidden">
                    <img
                      src={getThumbnailUrl(filename)}
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
            <div className="p-4">
              <img
                src={getThumbnailUrl(selectedImage)}
                alt={selectedImage}
                className="w-full h-auto max-h-[80vh] object-contain rounded-lg"
              />
              <p className="mt-4 text-center text-sm font-medium">{selectedImage}</p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ThumbnailGallery;
