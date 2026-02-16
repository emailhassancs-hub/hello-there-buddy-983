import React, { useState, useEffect } from "react";
import { Image as ImageIcon, RefreshCw, X, Download, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogClose, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { LocalStorageKeys } from "@/enums/localstorage";

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
  onRemixImage?: (imageUrl: string) => void;
}

const ImageViewer = ({ apiUrl, refreshTrigger, onRemixImage }: ImageViewerProps) => {
  const [images, setImages] = useState<ImageItem[]>([]);
  const [editedImages, setEditedImages] = useState<EditedImageItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingEdited, setIsLoadingEdited] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isLoadingMoreEdited, setIsLoadingMoreEdited] = useState(false);
  const [selectedImage, setSelectedImage] = useState<ImageItem | null>(null);
  const [selectedEditedImage, setSelectedEditedImage] = useState<EditedImageItem | null>(null);
  const [activeTab, setActiveTab] = useState("generation");
  
  // Pagination state
  const [offset, setOffset] = useState(0);
  const [offsetEdited, setOffsetEdited] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [hasMoreEdited, setHasMoreEdited] = useState(true);
  const LIMIT = 20;
  
  const { toast } = useToast();

  const fetchImages = async (append = false) => {
    if (append) {
      setIsLoadingMore(true);
    } else {
      setIsLoading(true);
    }
    
    try {
      // Get auth token from localStorage
      let authToken = localStorage.getItem(LocalStorageKeys.AccessToken);

      if (!authToken) {
        console.warn("No auth token available for image history request");
        toast({
          title: "Not authenticated",
          description: "Missing access token. Launch the app with ?token=...",
          variant: "destructive",
        });
        setImages([]);
        setIsLoading(false);
        setIsLoadingMore(false);
        return;
      }

      // Cache globally for other components
      (window as any).authToken = authToken;

      const currentOffset = append ? offset : 0;
      const backendUrl = import.meta.env.VITE_API_BACKEND_URL;
      const response = await fetch(
        `${backendUrl}/api/image-generation/history?limit=${LIMIT}&offset=${currentOffset}`,
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
      
      // Use hasMore from API response instead of calculating from filtered length
      const apiHasMore = data.hasMore === true;
      
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

      if (append) {
        setImages(prev => [...prev, ...sorted]);
        setOffset(prev => prev + LIMIT);
        setHasMore(apiHasMore);
      } else {
        setImages(sorted);
        setOffset(LIMIT);
        setHasMore(apiHasMore);
      }
    } catch (error) {
      toast({
        title: "Failed to load images",
        description: "Unable to fetch image generation history.",
        variant: "destructive",
      });
      console.error("Error fetching images:", error);
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  };


  const fetchEditedImages = async (append = false) => {
    if (append) {
      setIsLoadingMoreEdited(true);
    } else {
      setIsLoadingEdited(true);
    }
    
    try {
      // Get auth token from localStorage
      let authToken = localStorage.getItem(LocalStorageKeys.AccessToken);

      if (!authToken) {
        console.warn("No auth token available for edited image history request");
        toast({
          title: "Not authenticated",
          description: "Missing access token. Launch the app with ?token=...",
          variant: "destructive",
        });
        setEditedImages([]);
        setIsLoadingEdited(false);
        setIsLoadingMoreEdited(false);
        return;
      }

      // Cache globally for other components
      (window as any).authToken = authToken;

      const currentOffset = append ? offsetEdited : 0;
      const backendUrl = import.meta.env.VITE_API_BACKEND_URL || "http://localhost:8000";
      const response = await fetch(
        `${backendUrl}/api/image-editing/history?limit=${LIMIT}&offset=${currentOffset}`,
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
      
      // Use hasMore from API response instead of calculating from filtered length
      const apiHasMore = data.hasMore === true;
      
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

      if (append) {
        setEditedImages(prev => [...prev, ...sorted]);
        setOffsetEdited(prev => prev + LIMIT);
        setHasMoreEdited(apiHasMore);
      } else {
        setEditedImages(sorted);
        setOffsetEdited(LIMIT);
        setHasMoreEdited(apiHasMore);
      }
    } catch (error) {
      toast({
        title: "Failed to load edited images",
        description: "Unable to fetch image editing history.",
        variant: "destructive",
      });
      console.error("Error fetching edited images:", error);
    } finally {
      setIsLoadingEdited(false);
      setIsLoadingMoreEdited(false);
    }
  };



  const handleDownloadImage = async (imageUrl: string, modelName: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      // Fetch the image as a blob
      const response = await fetch(imageUrl);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch image: ${response.status} ${response.statusText}`);
      }
      
      const blob = await response.blob();
      
      // Create a download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      
      // Generate filename with timestamp
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
      const filename = `${modelName}_${timestamp}.png`;
      
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      
      // Cleanup
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast({
        title: "Download started",
        description: "Image download has started",
      });
    } catch (error) {
      console.error('Error downloading image:', error);
      toast({
        title: "Download failed",
        description: error instanceof Error ? error.message : "Failed to download image. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Fetch on mount and when refreshTrigger changes
  useEffect(() => {
    setOffset(0);
    setOffsetEdited(0);
    setHasMore(true);
    setHasMoreEdited(true);
    fetchImages(false);
    fetchEditedImages(false);
  }, [refreshTrigger]);

  // Auto-refresh every 30 seconds (but not on initial mount)
  // useEffect(() => {
  //   const interval = setInterval(() => {
  //     setOffset(0);
  //     setOffsetEdited(0);
  //     setHasMore(true);
  //     setHasMoreEdited(true);
  //     fetchImages(false);
  //     fetchEditedImages(false);
  //   }, 30000);
  //   return () => clearInterval(interval);
  // }, []);

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
            setOffset(0);
            setOffsetEdited(0);
            setHasMore(true);
            setHasMoreEdited(true);
            fetchImages(false);
            fetchEditedImages(false);
          }}
          disabled={isLoading || isLoadingEdited}
          className="gap-2"
        >
          <RefreshCw className={`w-4 h-4 ${(isLoading || isLoadingEdited) ? "animate-spin" : ""}`} />
          Refresh Images
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
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {images.map((image, index) => (
                      <div
                        key={index}
                        className="group relative rounded-lg overflow-hidden border border-border/50 bg-card hover:shadow-lg transition-shadow cursor-pointer"
                        onClick={() => setSelectedImage(image)}
                      >
                        <div className="aspect-square overflow-hidden bg-muted/20 relative">
                          <img
                            src={image.url}
                            alt={image.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            onError={(e) => {
                              e.currentTarget.src = "/placeholder.svg";
                            }}
                          />
                          {/* Remix (left) + Download (right) icons inside same black pill */}
                          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                            <div className="h-9 px-3 bg-primary text-primary-foreground shadow-lg border-0 rounded-md flex items-center gap-2">
                              {onRemixImage && (
                                <button
                                  className="h-full flex items-center justify-center hover:bg-primary/80 rounded-l-md px-2 transition-colors"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onRemixImage(image.url);
                                  }}
                                  title="Remix image"
                                >
                                  <Pencil className="h-4 w-4" />
                                </button>
                              )}
                              <button
                                className="h-full flex items-center justify-center hover:bg-primary/80 rounded-r-md px-2 transition-colors"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDownloadImage(image.url, "generated_image", e);
                                }}
                                title="Download image"
                              >
                                <Download className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                        <div className="p-3 border-t border-border/50">
                          <p className="text-sm font-medium text-foreground line-clamp-2" title={image.name}>
                            {image.name}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                  {hasMore && (
                    <div className="flex justify-center mt-6">
                      <Button
                        variant="outline"
                        onClick={() => fetchImages(true)}
                        disabled={isLoadingMore}
                        className="gap-2"
                      >
                        {isLoadingMore ? (
                          <>
                            <RefreshCw className="w-4 h-4 animate-spin" />
                            Loading...
                          </>
                        ) : (
                          "Load More"
                        )}
                      </Button>
                    </div>
                  )}
                </>
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
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {editedImages.map((image, index) => (
                      <div
                        key={index}
                        className="group relative rounded-lg overflow-hidden border border-border/50 bg-card hover:shadow-lg transition-shadow cursor-pointer"
                        onClick={() => setSelectedEditedImage(image)}
                      >
                        <div className="aspect-square overflow-hidden bg-muted/20 relative">
                          <img
                            src={image.outputImagePath}
                            alt="Edited image"
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            onError={(e) => {
                              e.currentTarget.src = "/placeholder.svg";
                            }}
                          />
                          {/* Remix (left) + Download (right) icons inside same black pill */}
                          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                            <div className="h-9 px-3 bg-primary text-primary-foreground shadow-lg border-0 rounded-md flex items-center gap-2">
                              {onRemixImage && (
                                <button
                                  className="h-full flex items-center justify-center hover:bg-primary/80 rounded-l-md px-2 transition-colors"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onRemixImage(image.outputImagePath);
                                  }}
                                  title="Remix image"
                                >
                                  <Pencil className="h-4 w-4" />
                                </button>
                              )}
                              <button
                                className="h-full flex items-center justify-center hover:bg-primary/80 rounded-r-md px-2 transition-colors"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDownloadImage(image.outputImagePath, "edited_image", e);
                                }}
                                title="Download image"
                              >
                                <Download className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                        <div className="p-3 border-t border-border/50">
                          <p className="text-sm font-medium text-foreground line-clamp-2" title={image.prompt}>
                            {image.prompt}
                          </p>
                          {image.technique && (
                            <p className="text-xs text-muted-foreground mt-1">
                              {image.technique}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                  {hasMoreEdited && (
                    <div className="flex justify-center mt-6">
                      <Button
                        variant="outline"
                        onClick={() => fetchEditedImages(true)}
                        disabled={isLoadingMoreEdited}
                        className="gap-2"
                      >
                        {isLoadingMoreEdited ? (
                          <>
                            <RefreshCw className="w-4 h-4 animate-spin" />
                            Loading...
                          </>
                        ) : (
                          "Load More"
                        )}
                      </Button>
                    </div>
                  )}
                </>
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
            <div className="flex flex-col h-full max-h-[80vh]">
               <div className="relative bg-muted/20 p-8 flex-1 min-h-0">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-full">
                  {/* Input Image(s) Section */}
                  <div className="flex flex-col space-y-3 h-full min-h-0">
                    <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide flex-shrink-0">Original</h4>
                    <ScrollArea className="flex-1 min-h-0">
                      <div className="space-y-3 pr-4">
                        {selectedEditedImage.inputImage1Path && (
                          <div className="rounded-lg overflow-hidden border border-border/50 w-full aspect-square flex-shrink-0 bg-muted/10 flex items-center justify-center">
                            <img
                              src={selectedEditedImage.inputImage1Path}
                              alt="Original input 1"
                              className="max-w-full max-h-full w-auto h-auto object-contain"
                              onError={(e) => {
                                e.currentTarget.src = "/placeholder.svg";
                              }}
                            />
                          </div>
                        )}
                        {selectedEditedImage.inputImage2Path && (
                          <div className="rounded-lg overflow-hidden border border-border/50 w-full aspect-square flex-shrink-0 bg-muted/10 flex items-center justify-center">
                            <img
                              src={selectedEditedImage.inputImage2Path}
                              alt="Original input 2"
                              className="max-w-full max-h-full w-auto h-auto object-contain"
                              onError={(e) => {
                                e.currentTarget.src = "/placeholder.svg";
                              }}
                            />
                          </div>
                        )}
                        {selectedEditedImage.inputImage3Path && (
                          <div className="rounded-lg overflow-hidden border border-border/50 w-full aspect-square flex-shrink-0 bg-muted/10 flex items-center justify-center">
                            <img
                              src={selectedEditedImage.inputImage3Path}
                              alt="Original input 3"
                              className="max-w-full max-h-full w-auto h-auto object-contain"
                              onError={(e) => {
                                e.currentTarget.src = "/placeholder.svg";
                              }}
                            />
                          </div>
                        )}
                        {selectedEditedImage.inputImage4Path && (
                          <div className="rounded-lg overflow-hidden border border-border/50 w-full aspect-square flex-shrink-0 bg-muted/10 flex items-center justify-center">
                            <img
                              src={selectedEditedImage.inputImage4Path}
                              alt="Original input 4"
                              className="max-w-full max-h-full w-auto h-auto object-contain"
                              onError={(e) => {
                                e.currentTarget.src = "/placeholder.svg";
                              }}
                            />
                          </div>
                        )}
                      </div>
                    </ScrollArea>
                  </div>
                  
                  {/* Output Image Section */}
                  <div className="flex flex-col space-y-3 h-full min-h-0">
                    <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide flex-shrink-0">Edited Result</h4>
                    <div className="rounded-lg overflow-hidden border border-border/50 w-full aspect-square flex-shrink-0 bg-muted/10 flex items-center justify-center">
                      <img
                        src={selectedEditedImage.outputImagePath}
                        alt="Edited output"
                        className="max-w-full max-h-full w-auto h-auto object-contain"
                        onError={(e) => {
                          e.currentTarget.src = "/placeholder.svg";
                        }}
                      />
                    </div>
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
