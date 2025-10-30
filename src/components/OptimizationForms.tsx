import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, Upload, Download, CheckCircle, Loader2 } from "lucide-react";

interface ModelInfo {
  id: number;
  name: string;
  image: string;
  creationDate: string;
}

interface OptimizationPresets {
  presets: Record<string, { text: string; id: string }[]>;
}

interface OptimizationResult {
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
}

export const ModelSelectionForm = ({ models, onModelSelect, onUploadNew }: ModelSelectionFormProps) => {
  const [selectedModel, setSelectedModel] = useState<number | null>(null);

  const handleSelect = (modelId: number) => {
    setSelectedModel(modelId);
    onModelSelect(modelId);
  };

  return (
    <div className="space-y-4 p-4 bg-secondary/20 rounded-lg border border-border">
      <h3 className="text-sm font-semibold text-foreground">Select a Model to Optimize</h3>
      <div className="grid grid-cols-2 gap-3 max-h-64 overflow-y-auto">
        {models.map((model) => (
          <Card
            key={model.id}
            className={`cursor-pointer transition-all ${
              selectedModel === model.id
                ? "border-primary bg-primary/10"
                : "border-border hover:border-primary/50"
            }`}
            onClick={() => handleSelect(model.id)}
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
      <Button
        onClick={onUploadNew}
        variant="outline"
        className="w-full"
      >
        <Upload className="h-4 w-4 mr-2" />
        Upload a new model instead
      </Button>
    </div>
  );
};

interface OptimizationConfigFormProps {
  presets: OptimizationPresets;
  onSubmit: (type: string, strength: string) => void;
  isLoading: boolean;
}

export const OptimizationConfigForm = ({ presets, onSubmit, isLoading }: OptimizationConfigFormProps) => {
  const [optimizationType, setOptimizationType] = useState("");
  const [optimizationStrength, setOptimizationStrength] = useState("");

  const handleSubmit = () => {
    if (optimizationType && optimizationStrength) {
      onSubmit(optimizationType, optimizationStrength);
    }
  };

  return (
    <div className="space-y-4 p-4 bg-secondary/20 rounded-lg border border-border">
      <h3 className="text-sm font-semibold text-foreground">Configure Optimization Settings</h3>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label className="text-sm">Optimization Type</Label>
          <Select value={optimizationType} onValueChange={setOptimizationType}>
            <SelectTrigger>
              <SelectValue placeholder="Select type" />
            </SelectTrigger>
            <SelectContent>
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
            disabled={!optimizationType}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select strength" />
            </SelectTrigger>
            <SelectContent>
              {optimizationType && 
                presets.presets[optimizationType]?.map((option) => (
                  <SelectItem key={option.id} value={option.id}>
                    {option.text}
                  </SelectItem>
                ))
              }
            </SelectContent>
          </Select>
        </div>
      </div>

      <Button
        onClick={handleSubmit}
        disabled={!optimizationType || !optimizationStrength || isLoading}
        className="w-full"
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Optimizing...
          </>
        ) : (
          "Start Optimization"
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
