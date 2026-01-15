import { useState, useEffect, Suspense, useRef, useCallback } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, PerspectiveCamera } from "@react-three/drei";
import { FBXLoader } from "three/addons/loaders/FBXLoader.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import * as THREE from "three";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { RefreshCw, Box, ZoomIn, ZoomOut, Palette, Download, ChevronDown, ChevronUp, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";
import { LocalStorageKeys } from "@/enums/localstorage";
import { apiFetch } from "@/lib/api";

interface ModelData {
  id: string;
  generationType: string;
  status: "COMPLETED" | "PENDING" | "QUEUED";
  modelUrl?: string;
  thumbnailUrl?: string;
  prompt: string;
  creditsUsed: number;
  createdAt: string;
}

interface ModelViewerProps {
  apiUrl: string;
  selectedModel?: { modelUrl: string; thumbnailUrl: string; workflow: string } | null;
  refreshTrigger?: number;
  onInternalModelSelect?: () => void;
}

interface ModelProps {
  url: string;
  type: string;
  onError: (error: string | null) => void;
  onLoad?: () => void;
}

function Model({ url, type, onError, onLoad }: ModelProps) {
  const [model, setModel] = useState<THREE.Object3D | null>(null);
  const [error, setError] = useState<string | null>(null);
  const hasNotifiedLoad = useRef(false);
  const modelRef = useRef<THREE.Object3D | null>(null);
  const frameCountRef = useRef(0);

  // Use useFrame to detect when model is actually rendered
  useFrame(() => {
    if (model && !hasNotifiedLoad.current) {
      frameCountRef.current++;
      
      // Check if model has geometry/children (actually rendered)
      let hasGeometry = false;
      model.traverse((child) => {
        if ((child as THREE.Mesh).isMesh && (child as THREE.Mesh).geometry) {
          hasGeometry = true;
        }
      });
      
      // Wait for geometry to be present AND wait at least 5 frames to ensure rendering
      if (hasGeometry && frameCountRef.current >= 5) {
        hasNotifiedLoad.current = true;
        // Wait for one more frame to ensure rendering is complete
        requestAnimationFrame(() => {
          onLoad?.();
        });
      }
    }
  });

  useEffect(() => {
    setModel(null);
    setError(null);
    hasNotifiedLoad.current = false;
    frameCountRef.current = 0;

    const loadModel = async () => {
      try {
        let loadedModel: THREE.Object3D;
        
        if (type === '.fbx') {
          const loader = new FBXLoader();
          loadedModel = await new Promise((resolve, reject) => {
            loader.load(
              url,
              (object) => resolve(object),
              undefined,
              (error) => reject(error)
            );
          });
        } else if (type === '.glb' || type === '.gltf') {
          const loader = new GLTFLoader();
          const gltf = await new Promise<any>((resolve, reject) => {
            loader.load(
              url,
              (gltf) => resolve(gltf),
              undefined,
              (error) => reject(error)
            );
          });
          loadedModel = gltf.scene;
        } else {
          throw new Error('Unsupported model type');
        }

        if (loadedModel) {
          const box = new THREE.Box3().setFromObject(loadedModel);
          const center = box.getCenter(new THREE.Vector3());
          const size = box.getSize(new THREE.Vector3());
          
          const maxDim = Math.max(size.x, size.y, size.z);
          const scale = 2 / maxDim;
          loadedModel.scale.multiplyScalar(scale);
          
          loadedModel.position.sub(center.multiplyScalar(scale));
          // Position model above the grid
          loadedModel.position.y += 1;
          
          setModel(loadedModel);
          modelRef.current = loadedModel;
          onError(null);
          // onLoad will be called by useFrame when model is actually rendered
        }
      } catch (err) {
        console.error('Error loading model:', err);
        const errorMsg = 'Failed to load model. The file may be corrupted or in an unsupported format.';
        setError(errorMsg);
        onError(errorMsg);
        onLoad?.(); // Still call onLoad to hide loader even on error
      }
    };

    if (url) {
      loadModel();
    }
  }, [url, type]); // Removed onError and onLoad from dependencies to prevent reload loop

  if (error || !model) {
    return null;
  }

  return <primitive object={model} />;
}

// Component to handle zoom controls
function ZoomControls({ onControlsReady }: { onControlsReady: (controls: any) => void }) {
  const controlsRef = useRef<any>(null);

  useEffect(() => {
    if (controlsRef.current) {
      // Access the underlying controls object
      const controls = controlsRef.current;
      onControlsReady(controls);
    }
  }, [onControlsReady]);

  return (
    <OrbitControls
      ref={controlsRef}
      enableDamping
      dampingFactor={0.05}
      minDistance={1}
      maxDistance={10}
    />
  );
}

const ModelViewer = ({ apiUrl, selectedModel: externalSelectedModel, refreshTrigger, onInternalModelSelect }: ModelViewerProps) => {
  const [models, setModels] = useState<ModelData[]>([]);
  const [internalSelectedModel, setInternalSelectedModel] = useState<ModelData | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isModelLoading, setIsModelLoading] = useState(false);
  const [lightAngleX, setLightAngleX] = useState([45]);
  const [lightAngleY, setLightAngleY] = useState([45]);
  const [lightIntensity, setLightIntensity] = useState([2.5]);
  const [cameraHeight, setCameraHeight] = useState([3]);
  const [bgColor, setBgColor] = useState("#e5e5e5");
  const [token, setToken] = useState<string | null>(null);
  const [isViewerOpen, setIsViewerOpen] = useState(true);
  const { toast } = useToast();

  // Pagination state
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const LIMIT = 20;
  const controlsRef = useRef<any>(null);

  const handleDownload = async (modelUrl: string) => {
    try {
      const response = await fetch(modelUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = modelUrl.split('/').pop() || 'model.glb';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast({
        title: "Download Started",
        description: "Your model is being downloaded",
      });
    } catch (error) {
      console.error("Download failed:", error);
      toast({
        title: "Download Failed",
        description: "Unable to download the model",
        variant: "destructive",
      });
    }
  };

  // Download model from card menu
  const handleDownloadModel = async (modelUrl: string | undefined, prompt: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card click
    if (!modelUrl) {
      toast({
        title: "Download Failed",
        description: "Model URL not available",
        variant: "destructive",
      });
      return;
    }
    
    try {
   
      const response = await fetch(modelUrl);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      const filename = modelUrl.split('/').pop() || `${prompt || 'model'}.glb`;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Clean up blob URL after a short delay
      setTimeout(() => {
        window.URL.revokeObjectURL(blobUrl);
      }, 100);
      
      toast({
        title: "Download Started",
        description: "Your model is being downloaded",
      });
    } catch (error) {
      console.error("Download failed:", error);
      toast({
        title: "Download Failed",
        description: "Unable to download the model",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    const accessToken = localStorage.getItem(LocalStorageKeys.AccessToken);
    setToken(accessToken);
  }, []);

  // Clear internal selection when external model is selected from chat
  useEffect(() => {
    if (externalSelectedModel) {
      // Clear internal selection so external model can be used
      setInternalSelectedModel(null);
    }
  }, [externalSelectedModel?.modelUrl]);

  // Use internal selected model (from gallery) if available, otherwise use external (from chat)
  // Gallery clicks set internalSelectedModel, which takes priority
  // Chat clicks set externalSelectedModel, and we clear internalSelectedModel to use it
  const selectedModel = internalSelectedModel ? internalSelectedModel : (externalSelectedModel ? {
    id: '',
    generationType: externalSelectedModel.workflow.toUpperCase().replace('', '_') as any,
    status: "COMPLETED" as const,
    modelUrl: externalSelectedModel.modelUrl,
    thumbnailUrl: externalSelectedModel.thumbnailUrl,
    prompt: externalSelectedModel.modelUrl.split('/').pop()?.replace(/\.[^/.]+$/, '') || '',
    creditsUsed: 0,
    createdAt: new Date().toISOString()
  } : null);

  const loadModels = async (append = false) => {
    if (append) {
      setIsLoadingMore(true);
    } else {
      setIsLoading(true);
    }

    try {
      const currentOffset = append ? offset : 0;
      const data = await apiFetch<any>(
        `/api/model-generate-3d/history?limit=${LIMIT}&offset=${currentOffset}`
      );
      // Handle different response structures: items, data, or direct array
      const rawModels = data.items || data.data || data || [];
      
      // Map API response to ModelData format if needed
      const newModels: ModelData[] = rawModels.map((item: any) => ({
        id: item.id || item._id || String(item.taskId || Date.now()),
        generationType: item.generationType || item.generation_type || item.type || "TEXT_TO_3D",
        status: item.status || "COMPLETED",
        modelUrl: item.modelUrl || item.model_url || item.modelPath || item.model_path,
        thumbnailUrl: item.thumbnailUrl || item.thumbnail_url || item.thumbnailPath || item.thumbnail_path,
        prompt: item.prompt || item.text || item.description || "",
        creditsUsed: item.creditsUsed || item.credits_used || 0,
        createdAt: item.createdAt || item.created_at || item.timestamp || new Date().toISOString(),
      }));
      
      // Check if there are more models to load
      // Use hasMore from API response if available, otherwise check by length
      const apiHasMore = data.hasMore !== undefined ? data.hasMore : newModels.length === LIMIT;
      
      if (append) {
        setModels(prev => [...prev, ...newModels]);
        setOffset(prev => prev + LIMIT);
        setHasMore(apiHasMore);
      } else {
        setModels(newModels);
        setOffset(LIMIT);
        setHasMore(apiHasMore);
      }
    } catch (error) {
      console.error("Error loading models:", error);
      toast({
        title: "Load Failed",
        description: "Unable to load 3D models",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  };

  useEffect(() => {

    if (token) {
      setOffset(0);
      setHasMore(true);
      loadModels(false);
    }
  }, [apiUrl, token, refreshTrigger]);

  useEffect(() => {
    if (selectedModel?.modelUrl) {
      setLoadError(null);
      setIsModelLoading(true);
    }
  }, [selectedModel?.modelUrl]);

  // Auto-select first model when models are loaded and no model is selected
  useEffect(() => {
    const filteredModels = models.filter(m => m.status === "COMPLETED");
    if (
      filteredModels.length > 0 &&
      !internalSelectedModel &&
      !externalSelectedModel &&
      filteredModels[0].modelUrl
    ) {
      setInternalSelectedModel(filteredModels[0]);
    }
  }, [models, internalSelectedModel, externalSelectedModel]);

  // Filter models by active tab
  const filteredModels = models.filter(m =>  m.status === "COMPLETED");

  const getModelType = (url?: string) => {
    if (!url) return '.glb';
    if (url.endsWith('.fbx')) return '.fbx';
    if (url.endsWith('.gltf')) return '.gltf';
    return '.glb';
  };

  return (
    <div className="flex flex-col h-full bg-background">
      <ResizablePanelGroup direction="vertical" className="h-full">
        {/* 3D Viewer Panel */}
        <ResizablePanel defaultSize={60} minSize={30}>
          <Collapsible open={isViewerOpen} onOpenChange={setIsViewerOpen} className="h-full flex flex-col">
            <div className="border-b border-border/50 p-3 flex items-center justify-between bg-background shrink-0">
              <div className="flex items-center gap-2">
                <Box className="w-4 h-4 text-primary" />
                <h2 className="text-base font-semibold">3D Viewer</h2>
              </div>
              <div className="flex items-center gap-2">
                {selectedModel && selectedModel.modelUrl && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDownload(selectedModel.modelUrl!)}
                    className="h-8 gap-2"
                  >
                    <Download className="w-4 h-4" />
                    Download
                  </Button>
                )}
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    {isViewerOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </Button>
                </CollapsibleTrigger>
              </div>
            </div>
            
            <CollapsibleContent className="flex-1 min-h-0">
              <div className="h-full">
                {selectedModel && selectedModel.modelUrl ? (
                  <div className="h-full relative bg-background">
                    {/* Loading overlay */}
                    {isModelLoading && !loadError && (
                      <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm z-20">
                        <div className="text-center p-6 rounded-lg bg-background border border-border shadow-lg">
                          <Loader2 className="w-12 h-12 mx-auto mb-4 text-primary animate-spin" />
                          <p className="text-foreground font-medium">Loading 3D model...</p>
                          <p className="text-sm text-muted-foreground mt-2">Please wait while we prepare your model</p>
                        </div>
                      </div>
                    )}
                    
                    {loadError && (
                      <div className="absolute inset-0 flex items-center justify-center bg-background/80 z-10">
                        <div className="text-center p-6 rounded-lg bg-destructive/10 border border-destructive">
                          <p className="text-destructive">{loadError}</p>
                        </div>
                      </div>
                    )}
                    
                    {/* Zoom Controls */}
                    <div className="absolute bottom-4 right-4 z-10 bg-background/80 backdrop-blur-sm rounded-lg border border-border shadow-sm flex flex-col gap-1 p-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => {
                          if (controlsRef.current) {
                            // Zoom in by reducing distance
                            // Access the underlying OrbitControls object
                            const controls = controlsRef.current;
                            const camera = controls.object || controls.camera;
                            const target = controls.target || new THREE.Vector3(0, 0, 0);
                            
                            if (camera && target) {
                              const direction = new THREE.Vector3().subVectors(camera.position, target).normalize();
                              const currentDistance = camera.position.distanceTo(target);
                              const newDistance = Math.max(1, currentDistance * 0.8);
                              camera.position.copy(target).add(direction.multiplyScalar(newDistance));
                              if (controls.update) {
                                controls.update();
                              }
                            }
                          }
                        }}
                        title="Zoom In"
                      >
                        <ZoomIn className="w-4 h-4 text-foreground" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => {
                          if (controlsRef.current) {
                            // Zoom out by increasing distance
                            // Access the underlying OrbitControls object
                            const controls = controlsRef.current;
                            const camera = controls.object || controls.camera;
                            const target = controls.target || new THREE.Vector3(0, 0, 0);
                            
                            if (camera && target) {
                              const direction = new THREE.Vector3().subVectors(camera.position, target).normalize();
                              const currentDistance = camera.position.distanceTo(target);
                              const newDistance = Math.min(10, currentDistance * 1.25);
                              camera.position.copy(target).add(direction.multiplyScalar(newDistance));
                              if (controls.update) {
                                controls.update();
                              }
                            }
                          }
                        }}
                        title="Zoom Out"
                      >
                        <ZoomOut className="w-4 h-4 text-foreground" />
                      </Button>
                    </div>

                    {/* Light Controls */}
                    <div className="absolute bottom-4 left-4 z-10 bg-background/90 backdrop-blur-sm p-2 rounded-lg border border-border shadow-lg space-y-2" style={{ width: '160px' }}>
                      <div className="space-y-1">
                        <label className="text-[10px] font-medium text-foreground">Angle X: {lightAngleX[0]}°</label>
                        <Slider
                          value={lightAngleX}
                          onValueChange={setLightAngleX}
                          min={0}
                          max={360}
                          step={5}
                          className="w-full"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-medium text-foreground">Angle Y: {lightAngleY[0]}°</label>
                        <Slider
                          value={lightAngleY}
                          onValueChange={setLightAngleY}
                          min={0}
                          max={360}
                          step={5}
                          className="w-full"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-medium text-foreground">Brightness: {lightIntensity[0]}</label>
                        <Slider
                          value={lightIntensity}
                          onValueChange={setLightIntensity}
                          min={0.5}
                          max={5}
                          step={0.5}
                          className="w-full"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-medium text-foreground">Camera Height: {cameraHeight[0]}</label>
                        <Slider
                          value={cameraHeight}
                          onValueChange={setCameraHeight}
                          min={1}
                          max={8}
                          step={0.5}
                          className="w-full"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-medium text-foreground flex items-center gap-1">
                          <Palette className="w-3 h-3" />
                          Background
                        </label>
                        <Input
                          type="color"
                          value={bgColor}
                          onChange={(e) => setBgColor(e.target.value)}
                          className="w-full h-6 p-0 border-0 cursor-pointer"
                        />
                      </div>
                    </div>

                    <Canvas shadows style={{ background: bgColor }}>
                      <PerspectiveCamera makeDefault position={[3, cameraHeight[0], 3]} />
                      <ZoomControls onControlsReady={(controls) => {
                        controlsRef.current = controls;
                      }} />
                      
                      <ambientLight intensity={0.5} />
                      <directionalLight 
                        position={[
                          10 * Math.cos((lightAngleX[0] * Math.PI) / 180),
                          10 * Math.sin((lightAngleY[0] * Math.PI) / 180),
                          10 * Math.sin((lightAngleX[0] * Math.PI) / 180)
                        ]} 
                        intensity={lightIntensity[0]} 
                        castShadow 
                      />
                      <directionalLight 
                        position={[
                          -10 * Math.cos((lightAngleX[0] * Math.PI) / 180),
                          -10 * Math.sin((lightAngleY[0] * Math.PI) / 180),
                          -10 * Math.sin((lightAngleX[0] * Math.PI) / 180)
                        ]} 
                        intensity={lightIntensity[0] * 0.4} 
                      />
                      
                      <Suspense fallback={null}>
                        <Model 
                          key={selectedModel.modelUrl}
                          url={selectedModel.modelUrl} 
                          type={getModelType(selectedModel.modelUrl)} 
                          onError={setLoadError}
                          onLoad={() => setIsModelLoading(false)}
                        />
                      </Suspense>
                      
                      <gridHelper args={[10, 10]} position={[0, 0, 0]} />
                    </Canvas>
                  </div>
                ) : (
                  <div className="h-full flex items-center justify-center text-muted-foreground">
                    <div className="text-center">
                      <Box className="w-16 h-16 mx-auto mb-4 opacity-50" />
                      <p className="text-lg">Select a 3D model to view</p>
                    </div>
                  </div>
                )}
              </div>
            </CollapsibleContent>
          </Collapsible>
        </ResizablePanel>

        <ResizableHandle withHandle />

        {/* Generated Models Panel */}
        <ResizablePanel defaultSize={40} minSize={20}>
          <div className="h-full flex flex-col bg-background">
            <div className="px-3 pt-3 pb-2 shrink-0">
              <h3 className="text-base font-semibold">Generated models</h3>
            </div>
            <ScrollArea className="h-full px-3 flex-1">
              <div className="pb-3">
                {isLoading && filteredModels.length === 0 ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="text-center space-y-4">
                      <RefreshCw className="w-8 h-8 text-muted-foreground animate-spin mx-auto" />
                      <p className="text-muted-foreground">Loading models...</p>
                    </div>
                  </div>
                ) : filteredModels.length === 0 ? (
                  <div className="text-center py-6 text-muted-foreground text-sm">
                    No models available
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                      {filteredModels.map((model) => (
                      <div
                        key={model.id}
                        className={`group cursor-pointer rounded-lg border-2 transition-all hover:border-primary/50 relative overflow-hidden ${
                          selectedModel?.id === model.id
                            ? 'border-primary shadow-lg'
                            : 'border-border'
                        }`}
                        onClick={() => {
                          setInternalSelectedModel(model);
                          // Clear external model selection when clicking from gallery
                          onInternalModelSelect?.();
                        }}
                      >
                        <div className="relative">
                          {model.thumbnailUrl ? (
                            <div className="aspect-square overflow-hidden bg-muted/20 relative rounded-t-md">
                              <img 
                                src={model.thumbnailUrl} 
                                alt={model.prompt}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                loading="lazy"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).src = "/placeholder.svg";
                                }}
                              />
                            </div>
                          ) : (
                            <div className="aspect-square bg-muted rounded-t-md flex items-center justify-center">
                              <span className="text-xs font-medium text-muted-foreground">
                                {getModelType(model.modelUrl).toUpperCase()}
                              </span>
                            </div>
                          )}
                          {/* Download button - prominent on hover */}
                          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity z-20">
                            <Button
                              variant="default"
                              size="sm"
                              className="h-8 px-2.5 bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg border-0 gap-1.5 font-medium text-xs"
                              onClick={(e) => handleDownloadModel(model.modelUrl, 'model', e)}
                              disabled={!model.modelUrl}
                            >
                              <Download className="h-3.5 w-3.5" />
                              Download
                            </Button>
                          </div>
                        </div>
                        <div className="p-2">
                          <p className="text-xs font-medium truncate">{model.prompt}</p>
                        </div>
                      </div>
                      ))}
                    </div>
                    {hasMore && (
                      <div className="flex justify-center mt-6">
                        <Button
                          variant="outline"
                          onClick={() => loadModels(true)}
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
              <ScrollBar orientation="vertical" />
            </ScrollArea>
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
};

export default ModelViewer;
