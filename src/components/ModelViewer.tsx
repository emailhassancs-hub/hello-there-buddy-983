import { useState, useEffect, Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, PerspectiveCamera } from "@react-three/drei";
import { FBXLoader } from "three/addons/loaders/FBXLoader.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import * as THREE from "three";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { RefreshCw, Box, ZoomIn, Palette, Download, ChevronDown, ChevronUp } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

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
}

interface ModelProps {
  url: string;
  type: string;
  onError: (error: string | null) => void;
}

function Model({ url, type, onError }: ModelProps) {
  const [model, setModel] = useState<THREE.Object3D | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setModel(null);
    setError(null);

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
          onError(null);
        }
      } catch (err) {
        console.error('Error loading model:', err);
        const errorMsg = 'Failed to load model. The file may be corrupted or in an unsupported format.';
        setError(errorMsg);
        onError(errorMsg);
      }
    };

    if (url) {
      loadModel();
    }
  }, [url, type, onError]);

  if (error || !model) {
    return null;
  }

  return <primitive object={model} />;
}

const ModelViewer = ({ apiUrl, selectedModel: externalSelectedModel }: ModelViewerProps) => {
  const [models, setModels] = useState<ModelData[]>([]);
  const [internalSelectedModel, setInternalSelectedModel] = useState<ModelData | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [lightAngleX, setLightAngleX] = useState([45]);
  const [lightAngleY, setLightAngleY] = useState([45]);
  const [lightIntensity, setLightIntensity] = useState([2.5]);
  const [cameraHeight, setCameraHeight] = useState([3]);
  const [bgColor, setBgColor] = useState("#e5e5e5");
  const [token, setToken] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"TEXT_TO_3D" | "IMAGE_TO_3D" | "POST_PROCESS">("TEXT_TO_3D");
  const [isViewerOpen, setIsViewerOpen] = useState(true);
  const { toast } = useToast();

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

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const accessToken = params.get("token");
    setToken(accessToken);
  }, []);

  // Use external selected model if provided, otherwise use internal
  const selectedModel = externalSelectedModel ? {
    id: '',
    generationType: externalSelectedModel.workflow.toUpperCase().replace('', '_') as any,
    status: "COMPLETED" as const,
    modelUrl: externalSelectedModel.modelUrl,
    thumbnailUrl: externalSelectedModel.thumbnailUrl,
    prompt: externalSelectedModel.modelUrl.split('/').pop()?.replace(/\.[^/.]+$/, '') || '',
    creditsUsed: 0,
    createdAt: new Date().toISOString()
  } : internalSelectedModel;

  const loadModels = async () => {
    if (!token) {
      toast({
        title: "No token found",
        description: "Please provide a token in the URL query parameter",
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await fetch(`${apiUrl}/model-history?limit=100&offset=0`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      if (!response.ok) throw new Error("Failed to load models");
      
      const data = await response.json();
      setModels(data.items || []);
    } catch (error) {
      console.error("Error loading models:", error);
      toast({
        title: "Load Failed",
        description: "Unable to load 3D models",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    if (token) {
      loadModels();
    }
  }, [apiUrl, token]);

  useEffect(() => {
    setLoadError(null);
  }, [selectedModel]);

  // Filter models by active tab
  const filteredModels = models.filter(m => m.generationType === activeTab && m.status === "COMPLETED");

  const getModelType = (url?: string) => {
    if (!url) return '.glb';
    if (url.endsWith('.fbx')) return '.fbx';
    if (url.endsWith('.gltf')) return '.gltf';
    return '.glb';
  };

  return (
    <div className="flex flex-col h-full bg-background">
      {/* 3D Viewer - Collapsible Section */}
      <Collapsible open={isViewerOpen} onOpenChange={setIsViewerOpen}>
        <div className="border-b border-border/50 p-3 flex items-center justify-between bg-background">
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
        
        <CollapsibleContent>
          <div className="flex flex-col" style={{ height: '500px' }}>
            {selectedModel && selectedModel.modelUrl ? (
              <div className="flex-1 relative bg-background">
                {loadError && (
                  <div className="absolute inset-0 flex items-center justify-center bg-background/80 z-10">
                    <div className="text-center p-6 rounded-lg bg-destructive/10 border border-destructive">
                      <p className="text-destructive">{loadError}</p>
                    </div>
                  </div>
                )}
                
                {/* Zoom indicator */}
                <div className="absolute bottom-4 right-4 z-10 bg-background/80 backdrop-blur-sm p-2 rounded-lg border border-border shadow-sm">
                  <ZoomIn className="w-4 h-4 text-foreground" />
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
                  <OrbitControls 
                    enableDamping
                    dampingFactor={0.05}
                    minDistance={1}
                    maxDistance={10}
                  />
                  
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
                      url={selectedModel.modelUrl} 
                      type={getModelType(selectedModel.modelUrl)} 
                      onError={setLoadError} 
                    />
                  </Suspense>
                  
                  <gridHelper args={[10, 10]} position={[0, 0, 0]} />
                </Canvas>
              </div>
            ) : (
              <div className="flex-1 flex items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <Box className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <p className="text-lg">Select a 3D model to view</p>
                </div>
              </div>
            )}
          </div>
        </CollapsibleContent>
      </Collapsible>

      {/* Category Tabs - Bottom Section */}
      <div className="border-t border-border/50 flex flex-col flex-1">
        <div className="p-3 border-b border-border/50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Box className="w-4 h-4 text-primary" />
            <h2 className="text-base font-semibold">Model Gallery</h2>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={loadModels}
            className="h-8 w-8"
          >
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="flex-1 flex flex-col">
          <TabsList className="mx-3 mt-2 w-auto gap-2">
            <TabsTrigger value="TEXT_TO_3D" className="text-xs">
              📝 Text to 3D
            </TabsTrigger>
            <TabsTrigger value="IMAGE_TO_3D" className="text-xs">
              🖼️ Image to 3D
            </TabsTrigger>
            <TabsTrigger value="POST_PROCESS" className="text-xs">
              🧰 Post Processing
            </TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="flex-1 mt-2 overflow-hidden">
            <ScrollArea className="h-full w-full">
              <div className="px-3 pb-3">
                {filteredModels.length === 0 ? (
                  <div className="text-center py-6 text-muted-foreground text-sm">
                    No {activeTab === "TEXT_TO_3D" ? "text to 3D" : activeTab === "IMAGE_TO_3D" ? "image to 3D" : "post processing"} models available
                  </div>
                ) : (
                  <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
                    {filteredModels.map((model) => (
                      <div
                        key={model.id}
                        className={`cursor-pointer rounded-lg border-2 transition-all hover:border-primary/50 hover:scale-105 ${
                          selectedModel?.id === model.id
                            ? 'border-primary shadow-lg'
                            : 'border-border'
                        }`}
                        onClick={() => setInternalSelectedModel(model)}
                      >
                        {model.thumbnailUrl ? (
                          <img 
                            src={model.thumbnailUrl} 
                            alt={model.prompt}
                            className="w-full h-32 object-cover rounded-t-md"
                            loading="lazy"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = "/placeholder.svg";
                            }}
                          />
                        ) : (
                          <div className="w-full h-32 bg-muted rounded-t-md flex items-center justify-center">
                            <span className="text-xs font-medium text-muted-foreground">
                              {getModelType(model.modelUrl).toUpperCase()}
                            </span>
                          </div>
                        )}
                        <div className="p-2">
                          <p className="text-xs font-medium truncate">{model.prompt}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default ModelViewer;
