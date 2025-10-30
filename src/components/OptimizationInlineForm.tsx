import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from "lucide-react";

interface Model {
  id: number;
  name: string;
  image: string;
  creationDate: string;
}

interface OptimizationPreset {
  id: string;
  text: string;
}

interface OptimizationInlineFormProps {
  apiUrl: string;
  authToken: string | null;
  onOptimizationStart: () => void;
  onOptimizationComplete: (result: any) => void;
  onOptimizationError: (error: string) => void;
}

const OPTIMIZATION_TYPES = ["Simple", "Batch", "Hard Surface", "Foliage", "Animated"];

export const OptimizationInlineForm = ({
  apiUrl,
  authToken,
  onOptimizationStart,
  onOptimizationComplete,
  onOptimizationError
}: OptimizationInlineFormProps) => {
  const [instanceKey] = useState(() => Date.now());
  const [currentStep, setCurrentStep] = useState<"modelSelection" | "optimizationOptions">("modelSelection");
  const [models, setModels] = useState<Model[]>([]);
  const [selectedModel, setSelectedModel] = useState<string>("");
  const [optimizationType, setOptimizationType] = useState<string>("");
  const [optimizationStrength, setOptimizationStrength] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingModels, setIsFetchingModels] = useState(true);
  const [presets, setPresets] = useState<Record<string, OptimizationPreset[]>>({});

  useEffect(() => {
    fetchModels();
    fetchPresets();
  }, []);

  const fetchModels = async () => {
    try {
      setIsFetchingModels(true);
      const response = await fetch(`${apiUrl}/api/model-optimization/models`, {
        headers: {
          "Authorization": `Bearer ${authToken}`,
          "Content-Type": "application/json"
        }
      });

      if (!response.ok) throw new Error("Failed to fetch models");

      const data = await response.json();
      setModels(data.models || []);
    } catch (error) {
      console.error("Error fetching models:", error);
    } finally {
      setIsFetchingModels(false);
    }
  };

  const fetchPresets = async () => {
    try {
      const response = await fetch(`${apiUrl}/api/model-optimization/presets`, {
        headers: {
          "Authorization": `Bearer ${authToken}`,
          "Content-Type": "application/json"
        }
      });

      if (!response.ok) throw new Error("Failed to fetch presets");

      const data = await response.json();
      setPresets(data.presets || {});
    } catch (error) {
      console.error("Error fetching presets:", error);
    }
  };

  const handleModelSelect = (modelId: string) => {
    console.log("handleModelSelect called → modelId:", modelId);
    
    if (modelId === "upload_new") {
      document.getElementById('model-file-input')?.click();
      return;
    }
    
    setSelectedModel(modelId);
    console.log("currentStep changing to → optimizationOptions");
    setCurrentStep("optimizationOptions");
  };

  console.log("OptimizationInlineForm rendering, currentStep:", currentStep);

  const handleOptimize = async () => {
    if (!selectedModel || !optimizationType || !optimizationStrength) {
      onOptimizationError("Please select all options");
      return;
    }

    if (selectedModel === "upload_new") {
      document.getElementById('model-file-input')?.click();
      return;
    }

    setIsLoading(true);
    onOptimizationStart();

    try {
      // Send structured message to /ask endpoint asking agent to invoke optimize_single_model_tool
      const optimizationMessage = {
        tool_call: "optimize_single_model_tool",
        params: {
          model_id: selectedModel,
          preset_id: optimizationStrength,
          export_name: `optimized_${Date.now()}`,
          ACCESS_TOKEN: authToken
        }
      };

      const response = await fetch(`${apiUrl}/ask`, {
        method: 'POST',
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${authToken}`
        },
        body: JSON.stringify({
          message: `Please invoke the optimize_single_model_tool MCP function with these parameters: ${JSON.stringify(optimizationMessage.params)}`,
          conversationId: `optimization_${Date.now()}`,
          tool_call: optimizationMessage
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Optimization request failed");
      }

      const data = await response.json();
      
      // The agent should return the optimization result
      if (data.response) {
        onOptimizationComplete({
          message: data.response,
          modelId: selectedModel,
          presetId: optimizationStrength
        });
      } else {
        throw new Error("No response from agent");
      }
    } catch (error) {
      console.error("Optimization failed:", error);
      onOptimizationError(error instanceof Error ? error.message : "Unknown error");
    } finally {
      setIsLoading(false);
    }
  };


  return (
    <div key={instanceKey} className="space-y-4 p-4 bg-secondary/20 rounded-lg border border-border mt-3">
      <h3 className="text-sm font-semibold text-foreground">Model Optimization Settings</h3>
      
      {isFetchingModels ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="grid gap-4">
          {/* Step 1: Model Selection */}
          {currentStep === "modelSelection" && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-sm">Select Model</Label>
                <Select value={selectedModel} onValueChange={handleModelSelect}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a model" />
                  </SelectTrigger>
                  <SelectContent>
                    {models.map((model) => (
                      <SelectItem key={model.id} value={model.id.toString()}>
                        {model.name}
                      </SelectItem>
                    ))}
                    <SelectItem value="upload_new">+ Upload new model for optimization</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {/* Step 2: Optimization Options */}
          {currentStep === "optimizationOptions" && (
            <div className="space-y-4">
              <div className="text-sm text-muted-foreground mb-2">
                Selected Model ID: <span className="font-medium text-foreground">{selectedModel}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setCurrentStep("modelSelection")}
                  className="ml-2 h-6 text-xs"
                >
                  Change
                </Button>
              </div>

              <div className="space-y-2">
                <Label className="text-sm">Optimization Type</Label>
                <Select value={optimizationType} onValueChange={setOptimizationType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    {OPTIMIZATION_TYPES.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-sm">Optimization Strength</Label>
                <Select 
                  value={optimizationStrength} 
                  onValueChange={setOptimizationStrength}
                  disabled={!optimizationType}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select strength" />
                  </SelectTrigger>
                  <SelectContent>
                    {optimizationType && presets[optimizationType]?.map((preset) => (
                      <SelectItem key={preset.id} value={preset.id}>
                        {preset.text}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Button
                onClick={handleOptimize}
                disabled={!optimizationType || !optimizationStrength || isLoading}
                className="w-full"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  "Optimize Model"
                )}
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
