import { useState, useEffect } from "react";
import { Image as ImageIcon, RefreshCw, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogClose, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

interface ImageItem {
  name: string;
  url: string;
  timestamp?: number;
}

interface EditedImageItem {
  id: string;
  outputImagePath: string;
  inputImage1Path?: string;
  inputImage2Path?: string;
  inputImage3Path?: string;
  inputImage4Path?: string;
  prompt: string;
  technique?: string;
  modelName?: string;
  status: string;
  timestamp?: number;
}

interface ImageViewerProps {
  apiUrl: string;
  refreshTrigger?: number;
}

const ImageViewer = ({ apiUrl, refreshTrigger }: ImageViewerProps) => {
  const [images, setImages] = useState<ImageItem[]>([]);
  const [editedImages, setEditedImages] = useState<EditedImageItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingEdited, setIsLoadingEdited] = useState(false);
  const [selectedImage, setSelectedImage] = useState<ImageItem | null>(null);
  const [selectedEditedImage, setSelectedEditedImage] = useState<EditedImageItem | null>(null);
  const [activeTab, setActiveTab] = useState("generation");
  const { toast } = useToast();

  const fetchImages = async () => {
    setIsLoading(true);
    try {
      // Resolve auth token from URL first, then window, then localStorage
      const params = new URLSearchParams(window.location.search);
      let authToken = params.get("token") || (window as any).authToken || localStorage.getItem("auth_token");

      if (!authToken) {
        console.warn("No auth token available for image history request");
        toast({
          title: "Not authenticated",
          description: "Missing access token. Launch the app with ?token=...",
          variant: "destructive",
        });
        setImages([]);
        setIsLoading(false);
        return;
      }

      // Cache globally for other components
      (window as any).authToken = authToken;

      const response = await fetch(
        "https://games-ai-studio-be-nest-347148155332.us-central1.run.app/api/image-generation/history?limit=50&offset=0",
        {
          method: "GET",
          headers: {
            accept: "*/*",
            Authorization: `Bearer ${authToken}`,
          },
        },
      );
      
      if (!response.ok) {
        throw new Error("Failed to fetch image history");
      }
      
      const data = await response.json();
      
      // Extract images from the nested data property
      const imageList = data.data || [];
      
      // Map the response to ImageItem format
      const mapped: ImageItem[] = imageList.map((item: any) => ({
        name: item.prompt || item.id || 'generated-image.png',
        url: item.imagePath || item.img_url || '',
        timestamp: item.createdAt ? new Date(item.createdAt).getTime() : Date.now(),
      })).filter((item: ImageItem) => item.url);

      // Sort by timestamp (newest first)
      const sorted = mapped.sort((a, b) => {
        const timeA = a.timestamp || 0;
        const timeB = b.timestamp || 0;
        return timeB - timeA;
      });

      setImages(sorted);
    } catch (error) {
      toast({
        title: "Failed to load images",
        description: "Unable to fetch image generation history.",
        variant: "destructive",
      });
      console.error("Error fetching images:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchEditedImages = async () => {
    setIsLoadingEdited(true);
    try {
      // Resolve auth token from URL first, then window, then localStorage
      const params = new URLSearchParams(window.location.search);
      let authToken = params.get("token") || (window as any).authToken || localStorage.getItem("auth_token");

      if (!authToken) {
        console.warn("No auth token available for edited image history request");
        toast({
          title: "Not authenticated",
          description: "Missing access token. Launch the app with ?token=...",
          variant: "destructive",
        });
        setEditedImages([]);
        setIsLoadingEdited(false);
        return;
      }

      // Cache globally for other components
      (window as any).authToken = authToken;

      const response = await fetch(
        "https://games-ai-studio-be-nest-347148155332.us-central1.run.app/api/image-editing/history?limit=50&offset=0",
        {
          method: "GET",
          headers: {
            accept: "*/*",
            Authorization: `Bearer ${authToken}`,
          },
        },
      );
      
      if (!response.ok) {
        throw new Error("Failed to fetch edited image history");
      }
      
      const data = await response.json();
      
      // Extract images from the nested data property
      const imageList = data.data || [];
      
      // Map the response to EditedImageItem format - only COMPLETED items
      const mapped: EditedImageItem[] = imageList
        .filter((item: any) => item.status === "COMPLETED")
        .map((item: any) => ({
          id: item.id,
          outputImagePath: item.outputImagePath,
          inputImage1Path: item.inputImage1Path,
          inputImage2Path: item.inputImage2Path,
          inputImage3Path: item.inputImage3Path,
          inputImage4Path: item.inputImage4Path,
          prompt: item.prompt || 'No description',
          technique: item.technique,
          modelName: item.modelName,
          status: item.status,
          timestamp: item.createdAt ? new Date(item.createdAt).getTime() : Date.now(),
        }))
        .filter((item: EditedImageItem) => item.outputImagePath);

      // Sort by timestamp (newest first)
      const sorted = mapped.sort((a, b) => {
        const timeA = a.timestamp || 0;
        const timeB = b.timestamp || 0;
        return timeB - timeA;
      });

      setEditedImages(sorted);
    } catch (error) {
      toast({
        title: "Failed to load edited images",
        description: "Unable to fetch image editing history.",
        variant: "destructive",
      });
      console.error("Error fetching edited images:", error);
    } finally {
      setIsLoadingEdited(false);
    }
  };

  // Fetch on mount and when refreshTrigger changes
  useEffect(() => {
    fetchImages();
    fetchEditedImages();
  }, [refreshTrigger]);

  // Auto-refresh every 30 seconds (but not on initial mount)
  useEffect(() => {
    const interval = setInterval(() => {
      fetchImages();
      fetchEditedImages();
    }, 30000);
    return () => clearInterval(interval);
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
          onClick={() => {
            fetchImages();
            fetchEditedImages();
          }}
          disabled={isLoading || isLoadingEdited}
          className="gap-2"
        >
          <RefreshCw className={`w-4 h-4 ${(isLoading || isLoadingEdited) ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {/* Content Area with Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0">
        <div className="px-6 pt-4">
          <TabsList className="w-full max-w-md">
            <TabsTrigger value="generation" className="flex-1">Image Generation</TabsTrigger>
            <TabsTrigger value="editing" className="flex-1">Image Editing</TabsTrigger>
          </TabsList>
        </div>

        {/* Image Generation Tab */}
        <TabsContent value="generation" className="flex-1 min-h-0 mt-0">
          <ScrollArea className="h-full">
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
                      <h3 className="text-lg font-semibold text-foreground mb-2">No generated images yet.</h3>
                      <p className="text-muted-foreground max-w-md">
                        Generated images from your conversations will appear here.
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
                          src={image.url}
                          alt={image.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          onError={(e) => {
                            e.currentTarget.src = "/placeholder.svg";
                          }}
                        />
                      </div>
                      <div className="p-3 border-t border-border/50">
                        <p className="text-sm font-medium text-foreground line-clamp-2" title={image.name}>
                          {image.name}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </ScrollArea>
        </TabsContent>

        {/* Image Editing Tab */}
        <TabsContent value="editing" className="flex-1 min-h-0 mt-0">
          <ScrollArea className="h-full">
            <div className="p-6">
              {isLoadingEdited && editedImages.length === 0 ? (
                <div className="flex items-center justify-center h-64">
                  <div className="text-center space-y-4">
                    <RefreshCw className="w-8 h-8 text-muted-foreground animate-spin mx-auto" />
                    <p className="text-muted-foreground">Loading edited images...</p>
                  </div>
                </div>
              ) : editedImages.length === 0 ? (
                <div className="flex items-center justify-center h-64">
                  <div className="text-center space-y-4">
                    <div className="p-4 rounded-full bg-muted/50 inline-block">
                      <ImageIcon className="w-12 h-12 text-muted-foreground" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-foreground mb-2">No edited images yet.</h3>
                      <p className="text-muted-foreground max-w-md">
                        Edited images from your conversations will appear here.
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  {editedImages.map((image, index) => {
                    const inputImages = [
                      image.inputImage1Path,
                      image.inputImage2Path,
                      image.inputImage3Path,
                      image.inputImage4Path,
                    ].filter(Boolean);

                    return (
                      <div
                        key={index}
                        className="rounded-lg border border-border/50 bg-card hover:shadow-lg transition-shadow p-6"
                      >
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {/* Input Images */}
                          {inputImages.length > 0 && (
                            <div className="space-y-3">
                              <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                                Original Image{inputImages.length > 1 ? 's' : ''}
                              </h4>
                              <div className="grid grid-cols-2 gap-3">
                                {inputImages.map((inputUrl, idx) => (
                                  <div
                                    key={idx}
                                    className="aspect-square rounded-lg overflow-hidden border border-border/50 bg-muted/20 cursor-pointer hover:ring-2 hover:ring-primary transition-all"
                                    onClick={() => setSelectedImage({ name: 'Input Image', url: inputUrl!, timestamp: image.timestamp })}
                                  >
                                    <img
                                      src={inputUrl!}
                                      alt={`Input ${idx + 1}`}
                                      className="w-full h-full object-cover"
                                      onError={(e) => {
                                        e.currentTarget.src = "/placeholder.svg";
                                      }}
                                    />
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Output Image */}
                          <div className="space-y-3">
                            <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                              Edited Result
                            </h4>
                            <div
                              className="aspect-square rounded-lg overflow-hidden border border-border/50 bg-muted/20 cursor-pointer hover:ring-2 hover:ring-primary transition-all"
                              onClick={() => setSelectedEditedImage(image)}
                            >
                              <img
                                src={image.outputImagePath}
                                alt="Edited output"
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  e.currentTarget.src = "/placeholder.svg";
                                }}
                              />
                            </div>
                          </div>
                        </div>

                        {/* Metadata */}
                        <div className="mt-4 pt-4 border-t border-border/50 space-y-2">
                          <p className="text-sm text-foreground font-medium">
                            {image.prompt}
                          </p>
                          {(image.technique || image.modelName) && (
                            <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                              {image.technique && (
                                <span className="px-2 py-1 rounded bg-muted/50">
                                  {image.technique}
                                </span>
                              )}
                              {image.modelName && (
                                <span className="px-2 py-1 rounded bg-muted/50">
                                  {image.modelName}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>

      {/* Zoom Dialog for Generated Images */}
      <Dialog open={!!selectedImage} onOpenChange={() => setSelectedImage(null)}>
        <DialogContent className="max-w-5xl w-full p-0 overflow-hidden">
          <DialogTitle className="sr-only">Full Size Image Preview</DialogTitle>
          <DialogDescription className="sr-only">
            View the selected image in full resolution
          </DialogDescription>
          <DialogClose className="absolute right-4 top-4 z-10 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground">
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </DialogClose>
          {selectedImage && (
            <div className="flex flex-col">
              <div className="relative bg-muted/20 flex items-center justify-center p-8">
                <img
                  src={selectedImage.url}
                  alt={selectedImage.name}
                  className="max-h-[70vh] w-auto object-contain"
                  onError={(e) => {
                    e.currentTarget.src = "/placeholder.svg";
                  }}
                />
              </div>
              <div className="p-4 border-t border-border/50 bg-card">
                <p className="text-sm font-medium text-foreground whitespace-pre-wrap break-words">{selectedImage.name}</p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Zoom Dialog for Edited Images */}
      <Dialog open={!!selectedEditedImage} onOpenChange={() => setSelectedEditedImage(null)}>
        <DialogContent className="max-w-6xl w-full p-0 overflow-hidden">
          <DialogTitle className="sr-only">Edited Image Details</DialogTitle>
          <DialogDescription className="sr-only">
            View the edited image with input and output comparison
          </DialogDescription>
          <DialogClose className="absolute right-4 top-4 z-10 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground">
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </DialogClose>
          {selectedEditedImage && (
            <div className="flex flex-col">
              <div className="relative bg-muted/20 p-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Input Images */}
                  {selectedEditedImage.inputImage1Path && (
                    <div className="space-y-3">
                      <h4 className="text-sm font-semibold text-muted-foreground">Original</h4>
                      <img
                        src={selectedEditedImage.inputImage1Path}
                        alt="Original input"
                        className="w-full h-auto object-contain rounded-lg"
                        onError={(e) => {
                          e.currentTarget.src = "/placeholder.svg";
                        }}
                      />
                    </div>
                  )}
                  {/* Output Image */}
                  <div className="space-y-3">
                    <h4 className="text-sm font-semibold text-muted-foreground">Edited</h4>
                    <img
                      src={selectedEditedImage.outputImagePath}
                      alt="Edited output"
                      className="w-full h-auto object-contain rounded-lg"
                      onError={(e) => {
                        e.currentTarget.src = "/placeholder.svg";
                      }}
                    />
                  </div>
                </div>
              </div>
              <div className="p-4 border-t border-border/50 bg-card space-y-2">
                <p className="text-sm font-medium text-foreground">{selectedEditedImage.prompt}</p>
                {(selectedEditedImage.technique || selectedEditedImage.modelName) && (
                  <div className="flex gap-2 text-xs text-muted-foreground">
                    {selectedEditedImage.technique && <span>Technique: {selectedEditedImage.technique}</span>}
                    {selectedEditedImage.modelName && <span>Model: {selectedEditedImage.modelName}</span>}
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ImageViewer;
