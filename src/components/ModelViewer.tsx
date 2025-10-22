import { useState, useEffect, Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, PerspectiveCamera } from "@react-three/drei";
import { FBXLoader } from "three/addons/loaders/FBXLoader.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import * as THREE from "three";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { RefreshCw, Box } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ModelData {
  filename: string;
  name: string;
  type: string;
  thumbnailUrl?: string;
}

interface ModelViewerProps {
  apiUrl: string;
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

const ModelViewer = ({ apiUrl }: ModelViewerProps) => {
  const [models, setModels] = useState<ModelData[]>([]);
  const [selectedModel, setSelectedModel] = useState<ModelData | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const { toast } = useToast();

  const loadModels = async () => {
    try {
      const response = await fetch(`${apiUrl}/models`);
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

  const getModelUrl = (filename: string) => {
    return `${apiUrl}/models/${filename}`;
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
            <Canvas shadows>
              <PerspectiveCamera makeDefault position={[3, 3, 3]} />
              <OrbitControls 
                enableDamping
                dampingFactor={0.05}
                minDistance={1}
                maxDistance={10}
              />
              
              <ambientLight intensity={0.5} />
              <directionalLight position={[10, 10, 5]} intensity={1} castShadow />
              <directionalLight position={[-10, -10, -5]} intensity={0.3} />
              
              <Suspense fallback={null}>
                <Model 
                  url={getModelUrl(selectedModel.filename)} 
                  type={selectedModel.type} 
                  onError={setLoadError} 
                />
              </Suspense>
              
              <gridHelper args={[10, 10]} />
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

      {/* Thumbnail Grid - Bottom Section */}
      <div className="border-t border-border/50 flex flex-col" style={{ height: '30%', maxHeight: '300px' }}>
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

        <ScrollArea className="flex-1">
          <div className="p-3 flex gap-3 overflow-x-auto">
            {models.length === 0 ? (
              <div className="w-full text-center py-6 text-muted-foreground">
                No models available
              </div>
            ) : (
              models.map((model) => (
                <div
                  key={model.filename}
                  className={`cursor-pointer rounded-lg border-2 transition-all hover:border-primary/50 flex-shrink-0 ${
                    selectedModel?.filename === model.filename
                      ? 'border-primary shadow-lg'
                      : 'border-border'
                  }`}
                  onClick={() => setSelectedModel(model)}
                  style={{ width: '140px' }}
                >
                  {model.thumbnailUrl ? (
                    <img 
                      src={getThumbnailUrl(model.thumbnailUrl) || ''} 
                      alt={model.name}
                      className="w-full h-24 object-cover rounded-t-md"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full h-24 bg-muted rounded-t-md flex items-center justify-center">
                      <span className="text-xs font-medium text-muted-foreground">
                        {model.type.toUpperCase()}
                      </span>
                    </div>
                  )}
                  <div className="p-2">
                    <p className="text-xs font-medium truncate">{model.name}</p>
                    <span className="text-xs text-muted-foreground">{model.type}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
};

export default ModelViewer;
