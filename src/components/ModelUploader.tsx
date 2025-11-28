import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Upload, Loader2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface ModelUploaderProps {
  apiUrl: string;
  authToken: string;
  onUploadComplete?: (assetId: number) => void;
}

export const ModelUploader = ({ apiUrl, authToken, onUploadComplete }: ModelUploaderProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [modelName, setModelName] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      // Set model name to filename without extension if not already set
      if (!modelName) {
        setModelName(file.name.replace(/\.[^/.]+$/, ""));
      }
    }
  };

  const uploadToSignedUrl = async (signedUrl: string, file: File) => {
    const response = await fetch(signedUrl, {
      method: "PUT",
      headers: { "Content-Type": "application/octet-stream" },
      body: file,
    });

    if (!response.ok) {
      throw new Error("Failed to upload model to S3");
    }
  };

  const completeUpload = async (assetId: number) => {
    const response = await fetch(`${apiUrl}/api/model-optimization/complete-upload/${assetId}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    });

    if (!response.ok) {
      throw new Error("Model registration failed");
    }

    return response.json();
  };

  const handleUpload = async () => {
    if (!modelName || !selectedFile) {
      toast({
        title: "Missing information",
        description: "Please provide a model name and select a file.",
        variant: "destructive",
      });
      return;
    }

    if (!authToken) {
      toast({
        title: "Authentication required",
        description: "Please authenticate first.",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);

    try {
      // Step 1: Get signed URL
      const signedUrlResponse = await fetch(`${apiUrl}/api/model-optimization/get-signed-url`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          model_name: modelName,
          filename: selectedFile.name,
        }),
      });

      if (!signedUrlResponse.ok) {
        throw new Error("Failed to get signed URL");
      }

      const { s3_upload_url, asset_id } = await signedUrlResponse.json();

      // Step 2: Upload to S3
      toast({
        title: "Uploading...",
        description: "Uploading your model to storage.",
      });

      await uploadToSignedUrl(s3_upload_url, selectedFile);

      // Step 3: Complete upload/register model
      toast({
        title: "Registering...",
        description: "Registering your model for optimization.",
      });

      const result = await completeUpload(asset_id);

      toast({
        title: "Success!",
        description: "Your model has been uploaded and registered for optimization.",
      });

      console.log("Model registered successfully:", result);

      // Reset form
      setModelName("");
      setSelectedFile(null);
      setIsOpen(false);

      // Callback for parent component
      if (onUploadComplete) {
        onUploadComplete(asset_id);
      }
    } catch (error) {
      console.error("Upload error:", error);
      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : "Failed to upload model",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="default" className="gap-2">
          <Upload className="h-4 w-4" />
          Upload Model
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Upload 3D Model</DialogTitle>
          <DialogDescription>
            Upload your 3D model for optimization. Supported formats: .glb, .fbx, .obj
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="model-name">Model Name</Label>
            <Input
              id="model-name"
              value={modelName}
              onChange={(e) => setModelName(e.target.value)}
              placeholder="Enter model name"
              disabled={isUploading}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="file-upload">Select File</Label>
            <Input
              id="file-upload"
              type="file"
              accept=".glb,.fbx,.obj,.gltf"
              onChange={handleFileSelect}
              disabled={isUploading}
            />
            {selectedFile && (
              <p className="text-sm text-muted-foreground">
                Selected: {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
              </p>
            )}
          </div>
        </div>
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => setIsOpen(false)}
            disabled={isUploading}
          >
            Cancel
          </Button>
          <Button onClick={handleUpload} disabled={isUploading}>
            {isUploading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Uploading...
              </>
            ) : (
              "Upload"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
