import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
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

  const handleConfirm = () => {
    console.log("Confirm button clicked, selectedModel:", selectedModel);
    if (selectedModel) {
      console.log("Calling onModelSelect with modelId:", selectedModel);
      onModelSelect(selectedModel);
    } else {
      console.log("No model selected");
    }
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
            onClick={() => setSelectedModel(model.id)}
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
          disabled={!selectedModel}
          className="flex-1"
        >
          Confirm Selection
        </Button>
        <Button
          onClick={onUploadNew}
          variant="outline"
          className="flex-1"
        >
          <Upload className="h-4 w-4 mr-2" />
          Upload New
        </Button>
      </div>
    </div>
  );
};

interface RunningJob {
  optimize_id: number;
  asset_id: number | null;
  preset_id: number | null;
}

interface OptimizationConfigFormProps {
  presets: OptimizationPresets;
  onSubmit: (type: string, strength: string) => void;
  isLoading: boolean;
  apiUrl?: string;
  authToken?: string | null;
  modelId?: number;
}

export const OptimizationConfigForm = ({ presets, onSubmit, isLoading, apiUrl, authToken, modelId }: OptimizationConfigFormProps) => {
  const [optimizationType, setOptimizationType] = useState("");
  const [optimizationStrength, setOptimizationStrength] = useState("");
  const [pollingStatus, setPollingStatus] = useState<string>("");
  const [isPolling, setIsPolling] = useState(false);

  const fetchRunningJobs = async (): Promise<RunningJob[]> => {
    if (!apiUrl || !authToken) return [];
    
    try {
      const response = await fetch(`${apiUrl}/api/model-optimization/jobs/running`, {
        headers: {
          "Authorization": `Bearer ${authToken}`,
          "Content-Type": "application/json"
        }
      });

      if (!response.ok) throw new Error("Failed to fetch running jobs");
      const data = await response.json();
      return data.jobs || [];
    } catch (error) {
      console.error("Error fetching running jobs:", error);
      return [];
    }
  };

  const pollUntilComplete = async (
    assetId: number,
    presetId: number,
    pollIntervalSeconds: number = 5,
    timeoutSeconds: number = 1800
  ): Promise<void> => {
    const deadline = Date.now() + timeoutSeconds * 1000;

    while (Date.now() < deadline) {
      setPollingStatus("🔍 Checking optimization status...");
      
      const jobs = await fetchRunningJobs();
      let found = false;

      for (const job of jobs) {
        if (job.asset_id === assetId && job.preset_id === presetId) {
          found = true;
          setPollingStatus(`⚙️ Optimizing model... (Job ID: ${job.optimize_id})`);
          break;
        }
      }

      if (!found) {
        setPollingStatus("✅ Optimization complete!");
        return;
      }

      await new Promise(resolve => setTimeout(resolve, pollIntervalSeconds * 1000));
    }

    throw new Error("Optimization timed out");
  };

  const handleSubmit = async () => {
    if (optimizationType && optimizationStrength) {
      setIsPolling(true);
      setPollingStatus("🚀 Starting optimization...");
      
      onSubmit(optimizationType, optimizationStrength);
      
      // Start polling if we have the necessary data
      if (apiUrl && authToken && modelId) {
        try {
          await pollUntilComplete(modelId, parseInt(optimizationStrength));
        } catch (error) {
          console.error("Polling error:", error);
          setPollingStatus("❌ Optimization failed");
        } finally {
          setIsPolling(false);
          setTimeout(() => setPollingStatus(""), 3000);
        }
      }
    }
  };

  const isFormDisabled = !optimizationType || !optimizationStrength || isLoading || isPolling;

  return (
    <div className="space-y-4 p-4 bg-secondary/20 rounded-lg border border-border">
      <h3 className="text-sm font-semibold text-foreground">Configure Optimization Settings</h3>
      
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label className="text-sm">Optimization Type</Label>
          <Select value={optimizationType} onValueChange={setOptimizationType} disabled={isPolling}>
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
            disabled={!optimizationType || isPolling}
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

      {pollingStatus && (
        <Alert className="bg-primary/10 border-primary/20">
          <div className="flex items-center gap-2">
            {isPolling && <Loader2 className="h-4 w-4 animate-spin" />}
            <AlertDescription className="text-sm">
              {pollingStatus}
            </AlertDescription>
          </div>
        </Alert>
      )}

      <Button
        onClick={handleSubmit}
        disabled={isFormDisabled}
        className="w-full"
      >
        {isLoading || isPolling ? (
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
