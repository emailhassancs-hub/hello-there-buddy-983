import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, Upload, Download, CheckCircle, Loader2 } from "lucide-react";

export interface ModelInfo {
  id: number;
  name: string;
  image: string;
  creationDate: string;
}

export interface OptimizationPresets {
  presets: Record<string, { text: string; id: string }[]>;
}

export interface OptimizationResult {
  id: string;
  name: string;
  preset_name: string;
  optimization_status: string;
  downloads: {
    glb?: string;
    usdz?: string;
    fbx?: string;
  };
}

interface ModelSelectionFormProps {
  models: ModelInfo[];
  onModelSelect: (modelId: number) => void;
  onUploadNew: () => void;
  isUploading?: boolean;
  isDisabled?: boolean;
}

export const ModelSelectionForm = ({ models, onModelSelect, onUploadNew, isUploading = false, isDisabled = false }: ModelSelectionFormProps) => {
  const [selectedModel, setSelectedModel] = useState<number | null>(null);
  const [confirmedModelId, setConfirmedModelId] = useState<number | null>(null);

  const handleConfirm = () => {
    console.log("Confirm button clicked, selectedModel:", selectedModel);
    if (selectedModel && confirmedModelId !== selectedModel) {
      console.log("Calling onModelSelect with modelId:", selectedModel);
      setConfirmedModelId(selectedModel);
      onModelSelect(selectedModel);
    } else {
      console.log("No model selected or already confirmed");
    }
  };

  return (
    <div className="space-y-4 p-4 bg-secondary/20 rounded-lg border border-border">
      <h3 className="text-sm font-semibold text-foreground">Select a Model to Optimize</h3>
      <div className="grid grid-cols-2 gap-3 max-h-64 overflow-y-auto">
        {models.map((model) => (
          <Card
            key={model.id}
            className={`transition-all ${
              isDisabled 
                ? "cursor-not-allowed opacity-50"
                : "cursor-pointer"
            } ${
              selectedModel === model.id
                ? "border-primary bg-primary/10"
                : "border-border hover:border-primary/50"
            }`}
            onClick={() => !isDisabled && setSelectedModel(model.id)}
          >
            <CardContent className="p-3">
              <div className="flex items-center gap-3">
                <img
                  src={model.image || "/placeholder.svg"}
                  alt={model.name}
                  className="w-12 h-12 rounded-lg object-cover bg-secondary"
                />
                <div className="flex-1 min-w-0">
                  <h4 className="text-foreground font-medium text-sm truncate">{model.name}</h4>
                  <div className="flex items-center gap-1 text-muted-foreground text-xs">
                    <Calendar className="h-3 w-3" />
                    {model.creationDate}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      
      <div className="flex gap-2">
        <Button
          onClick={handleConfirm}
          disabled={!selectedModel || isUploading || confirmedModelId === selectedModel || isDisabled}
          className="flex-1"
        >
          {confirmedModelId === selectedModel ? "Confirmed Model" : "Confirm Selection"}
        </Button>
        <Button
          onClick={onUploadNew}
          variant="outline"
          disabled={isUploading || isDisabled}
          className="flex-1"
        >
          {isUploading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Uploading...
            </>
          ) : (
            <>
              <Upload className="h-4 w-4 mr-2" />
              Upload New
            </>
          )}
        </Button>
      </div>
    </div>
  );
};

interface OptimizationConfigFormProps {
  presets: OptimizationPresets;
  onSubmit: (type: string, strength: string) => void;
  isLoading: boolean;
  apiUrl?: string;
  authToken?: string | null;
  modelId?: number;
  isDisabled?: boolean;
}

export const OptimizationConfigForm = ({ presets, onSubmit, isLoading, apiUrl, authToken, modelId, isDisabled = false }: OptimizationConfigFormProps) => {
  const [optimizationType, setOptimizationType] = useState("");
  const [optimizationStrength, setOptimizationStrength] = useState("");

  const handleSubmit = () => {
    if (optimizationType && optimizationStrength) {
      onSubmit(optimizationType, optimizationStrength);
    }
  };

  const isFormDisabled = !optimizationType || !optimizationStrength || isLoading;

  return (
    <div className="space-y-4 p-4 bg-secondary/20 rounded-lg border border-border">
      <h3 className="text-sm font-semibold text-foreground">Configure Optimization Settings</h3>
      
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label className="text-sm">Optimization Type</Label>
          <Select 
            value={optimizationType} 
            onValueChange={(value) => {
              setOptimizationType(value);
              setOptimizationStrength(""); // reset strength when type changes
            }}
            disabled={isDisabled}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select type" />
            </SelectTrigger>
            <SelectContent className="bg-white">
              {Object.keys(presets.presets).map((type) => (
                <SelectItem key={type} value={type}>
                  {type}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label className="text-sm">Reduction Strength</Label>
          <Select 
            value={optimizationStrength} 
            onValueChange={setOptimizationStrength}
            disabled={!optimizationType || isDisabled}
          >
            <SelectTrigger>
              <SelectValue placeholder={
                optimizationType ? "Select strength" : "Select optimization type first"
              } />
            </SelectTrigger>
            <SelectContent className="bg-white">
              {optimizationType && 
                presets.presets[optimizationType]?.map((preset) => (
                  <SelectItem key={preset.id} value={preset.id}>
                    {preset.text}
                  </SelectItem>
                ))
              }
            </SelectContent>
          </Select>
        </div>
      </div>

      <Button
        onClick={handleSubmit}
        disabled={isFormDisabled || isDisabled}
        className="w-full"
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Optimizing Model...
          </>
        ) : (
          "Optimize Model"
        )}
      </Button>
    </div>
  );
};

interface OptimizationResultFormProps {
  result: OptimizationResult;
  onDownload: (url: string, filename: string) => void;
  onReset: () => void;
}

export const OptimizationResultForm = ({ result, onDownload, onReset }: OptimizationResultFormProps) => {
  return (
    <div className="space-y-4 p-4 bg-secondary/20 rounded-lg border border-border">
      <div className="flex items-center gap-3 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
        <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
        <div>
          <h3 className="text-green-900 dark:text-green-100 font-semibold text-sm">Optimization Complete!</h3>
          <p className="text-green-700 dark:text-green-300 text-xs">Your model has been optimized successfully.</p>
        </div>
      </div>

      <div className="p-3 bg-background border border-border rounded-lg space-y-3">
        <h4 className="text-foreground font-medium text-sm">{result.preset_name}</h4>
        <p className="text-muted-foreground text-xs">Status: {result.optimization_status}</p>
        <div className="flex gap-2 flex-wrap">
          {result.downloads.glb && (
            <Button
              size="sm"
              onClick={() => onDownload(result.downloads.glb!, `${result.name}.glb`)}
            >
              <Download className="h-3 w-3 mr-1" />
              Download GLB
            </Button>
          )}
          {result.downloads.usdz && (
            <Button
              size="sm"
              onClick={() => onDownload(result.downloads.usdz!, `${result.name}.usdz`)}
            >
              <Download className="h-3 w-3 mr-1" />
              Download USDZ
            </Button>
          )}
          {result.downloads.fbx && (
            <Button
              size="sm"
              onClick={() => onDownload(result.downloads.fbx!, `${result.name}.fbx`)}
            >
              <Download className="h-3 w-3 mr-1" />
              Download FBX
            </Button>
          )}
        </div>
      </div>

      <Button
        onClick={onReset}
        variant="outline"
        className="w-full"
      >
        Start New Optimization
      </Button>
    </div>
  );
};

interface OptimizedModelCardProps {
  preset_name: string;
  optimization_status: string;
  name: string;
  downloads: {
    glb?: string;
    usdz?: string;
    fbx?: string;
  };
}

export const OptimizedModelCard = ({ preset_name, optimization_status, name, downloads }: OptimizedModelCardProps) => {
  const handleDownload = (url: string, filename: string) => {
    window.open(url, '_blank');
  };

  return (
    <div className="p-3 bg-background border border-border rounded-lg space-y-3">
      <h4 className="text-foreground font-medium text-sm">{preset_name}</h4>
      <p className="text-muted-foreground text-xs">Status: {optimization_status}</p>
      <div className="flex gap-2 flex-wrap">
        {downloads.glb && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleDownload(downloads.glb!, `${name}.glb`)}
            className="border-black/20 text-black hover:bg-black/10 bg-transparent"
          >
            <Download className="h-3 w-3 mr-1" />
            GLB
          </Button>
        )}
        {downloads.usdz && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleDownload(downloads.usdz!, `${name}.usdz`)}
            className="border-black/20 text-black hover:bg-black/10 bg-transparent"
          >
            <Download className="h-3 w-3 mr-1" />
            USDZ
          </Button>
        )}
        {downloads.fbx && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleDownload(downloads.fbx!, `${name}.fbx`)}
            className="border-black/20 text-black hover:bg-black/10 bg-transparent"
          >
            <Download className="h-3 w-3 mr-1" />
            FBX
          </Button>
        )}
      </div>
    </div>
  );
};
