import { useState, useEffect, Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, PerspectiveCamera } from "@react-three/drei";
import { FBXLoader } from "three/addons/loaders/FBXLoader.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import * as THREE from "three";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { RefreshCw, Box, ZoomIn, Palette } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";

interface ModelData {
  workflow: string;
  filename: string;
  name: string;
  type: string;
  modelUrl: string;
  thumbnailUrl?: string;
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
  const { toast } = useToast();

  // Use external selected model if provided, otherwise use internal
  const selectedModel = externalSelectedModel ? {
    workflow: externalSelectedModel.workflow,
    filename: externalSelectedModel.modelUrl.split('/').pop() || '',
    name: externalSelectedModel.modelUrl.split('/').pop()?.replace(/\.[^/.]+$/, '') || '',
    type: externalSelectedModel.modelUrl.endsWith('.glb') ? '.glb' : '.fbx',
    modelUrl: externalSelectedModel.modelUrl,
    thumbnailUrl: externalSelectedModel.thumbnailUrl
  } : internalSelectedModel;

  const loadModels = async () => {
    try {
      const headers: HeadersInit = {
        "Content-Type": "application/json",
      };
      const authToken = (window as any).authToken;
      
      if (authToken) {
        headers["Authorization"] = `Bearer ${authToken}`;
      }

      const response = await fetch(`${apiUrl}/models`, { headers });
      if (!response.ok) throw new Error("Failed to load models");
      
      const data = await response.json();
      setModels(data.models || []);
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
    loadModels();
  }, [apiUrl]);

  useEffect(() => {
    setLoadError(null);
  }, [selectedModel]);

  const getThumbnailUrl = (thumbnailUrl?: string) => {
    if (!thumbnailUrl) return null;
    return `${apiUrl}${thumbnailUrl}`;
  };

  const getModelUrl = (modelUrl: string) => {
    return `${apiUrl}${modelUrl}`;
  };

  // Group models by workflow
  const groupedModels = models.reduce((acc, model) => {
    if (!acc[model.workflow]) {
      acc[model.workflow] = [];
    }
    acc[model.workflow].push(model);
    return acc;
  }, {} as Record<string, ModelData[]>);

  const workflowTitles: Record<string, string> = {
    text_to_3d: "🧱 Text to 3D Models",
    image_to_3d: "🖼️ Image to 3D Models",
    post_processing: "🧰 Post Processing Models"
  };

  return (
    <div className="flex flex-col h-full bg-background">
      {/* 3D Viewer - Top Section */}
      <div className="flex-1 flex flex-col" style={{ minHeight: '70%' }}>
        {selectedModel ? (
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
                  url={getModelUrl(selectedModel.modelUrl)} 
                  type={selectedModel.type} 
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

      {/* Workflow Sections - Bottom Section with Tabs */}
      <div className="border-t border-border/50 flex flex-col" style={{ height: '30%', maxHeight: '350px' }}>
        <div className="p-3 border-b border-border/50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Box className="w-4 h-4 text-primary" />
            <h2 className="text-base font-semibold">3D Models</h2>
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

        <Tabs defaultValue="text_to_3d" className="flex-1 flex flex-col">
          <TabsList className="mx-3 mt-2 w-auto">
            <TabsTrigger value="text_to_3d" className="text-xs">
              🧱 Text to 3D
            </TabsTrigger>
            <TabsTrigger value="image_to_3d" className="text-xs">
              🖼️ Image to 3D
            </TabsTrigger>
            <TabsTrigger value="post_processing" className="text-xs">
              🧰 Post Processing
            </TabsTrigger>
          </TabsList>

          {models.length === 0 ? (
            <div className="flex-1 flex items-center justify-center text-muted-foreground">
              No models available
            </div>
          ) : (
            <>
              <TabsContent value="text_to_3d" className="flex-1 mt-2">
                <ScrollArea className="h-full">
                  <div className="px-3 pb-3">
                    {groupedModels.text_to_3d && groupedModels.text_to_3d.length > 0 ? (
                      <div className="flex gap-2 flex-wrap">
                        {groupedModels.text_to_3d.map((model) => (
                          <div
                            key={`${model.workflow}-${model.filename}`}
                            className={`cursor-pointer rounded-lg border-2 transition-all hover:border-primary/50 hover:scale-105 ${
                              selectedModel?.filename === model.filename && selectedModel?.workflow === model.workflow
                                ? 'border-primary shadow-lg'
                                : 'border-border'
                            }`}
                            onClick={() => setInternalSelectedModel(model)}
                            style={{ width: '80px' }}
                          >
                            {model.thumbnailUrl ? (
                              <img 
                                src={getThumbnailUrl(model.thumbnailUrl) || ''} 
                                alt={model.name}
                                className="w-full h-20 object-cover rounded-t-md"
                                loading="lazy"
                              />
                            ) : (
                              <div className="w-full h-20 bg-muted rounded-t-md flex items-center justify-center">
                                <span className="text-xs font-medium text-muted-foreground">
                                  {model.type.toUpperCase()}
                                </span>
                              </div>
                            )}
                            <div className="p-1.5">
                              <p className="text-xs font-medium truncate">{model.name}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-6 text-muted-foreground text-sm">
                        No text to 3D models available
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </TabsContent>

              <TabsContent value="image_to_3d" className="flex-1 mt-2">
                <ScrollArea className="h-full">
                  <div className="px-3 pb-3">
                    {groupedModels.image_to_3d && groupedModels.image_to_3d.length > 0 ? (
                      <div className="flex gap-2 flex-wrap">
                        {groupedModels.image_to_3d.map((model) => (
                          <div
                            key={`${model.workflow}-${model.filename}`}
                            className={`cursor-pointer rounded-lg border-2 transition-all hover:border-primary/50 hover:scale-105 ${
                              selectedModel?.filename === model.filename && selectedModel?.workflow === model.workflow
                                ? 'border-primary shadow-lg'
                                : 'border-border'
                            }`}
                            onClick={() => setInternalSelectedModel(model)}
                            style={{ width: '80px' }}
                          >
                            {model.thumbnailUrl ? (
                              <img 
                                src={getThumbnailUrl(model.thumbnailUrl) || ''} 
                                alt={model.name}
                                className="w-full h-20 object-cover rounded-t-md"
                                loading="lazy"
                              />
                            ) : (
                              <div className="w-full h-20 bg-muted rounded-t-md flex items-center justify-center">
                                <span className="text-xs font-medium text-muted-foreground">
                                  {model.type.toUpperCase()}
                                </span>
                              </div>
                            )}
                            <div className="p-1.5">
                              <p className="text-xs font-medium truncate">{model.name}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-6 text-muted-foreground text-sm">
                        No image to 3D models available
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </TabsContent>

              <TabsContent value="post_processing" className="flex-1 mt-2">
                <ScrollArea className="h-full">
                  <div className="px-3 pb-3">
                    {groupedModels.post_processing && groupedModels.post_processing.length > 0 ? (
                      <div className="flex gap-2 flex-wrap">
                        {groupedModels.post_processing.map((model) => (
                          <div
                            key={`${model.workflow}-${model.filename}`}
                            className={`cursor-pointer rounded-lg border-2 transition-all hover:border-primary/50 hover:scale-105 ${
                              selectedModel?.filename === model.filename && selectedModel?.workflow === model.workflow
                                ? 'border-primary shadow-lg'
                                : 'border-border'
                            }`}
                            onClick={() => setInternalSelectedModel(model)}
                            style={{ width: '80px' }}
                          >
                            {model.thumbnailUrl ? (
                              <img 
                                src={getThumbnailUrl(model.thumbnailUrl) || ''} 
                                alt={model.name}
                                className="w-full h-20 object-cover rounded-t-md"
                                loading="lazy"
                              />
                            ) : (
                              <div className="w-full h-20 bg-muted rounded-t-md flex items-center justify-center">
                                <span className="text-xs font-medium text-muted-foreground">
                                  {model.type.toUpperCase()}
                                </span>
                              </div>
                            )}
                            <div className="p-1.5">
                              <p className="text-xs font-medium truncate">{model.name}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-6 text-muted-foreground text-sm">
                        No post processing models available
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </TabsContent>
            </>
          )}
        </Tabs>
      </div>
    </div>
  );
};

export default ModelViewer;
