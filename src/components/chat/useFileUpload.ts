import { useState, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";

interface UploadOptions {
  apiUrl: string;
  userEmail?: string;
  sessionId?: string;
  accessToken?: string;
}

interface UploadResult {
  urls: string[];
  blobPaths: string[];
  aiResponse?: unknown;
  sessionId?: string;
}

export const useFileUpload = (options: UploadOptions) => {
  const { apiUrl, userEmail, sessionId, accessToken } = options;
  const { toast } = useToast();
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedImageUrls, setUploadedImageUrls] = useState<string[]>([]);
  const [uploadedImagePreviews, setUploadedImagePreviews] = useState<string[]>([]);

  const uploadImages = useCallback(async (
    files: File[],
    query?: string
  ): Promise<UploadResult> => {
    const formData = new FormData();

    if (userEmail) {
      formData.append("email", userEmail);
    }
    if (query) {
      formData.append("query", query);
    }
    if (sessionId) {
      formData.append("session_id", sessionId);
    }

    files.forEach((file) => {
      formData.append("files", file);
    });

    try {
      const headers: HeadersInit = {};
      if (accessToken) {
        headers["Authorization"] = `Bearer ${accessToken}`;
      }

      const response = await fetch(`${apiUrl}/upload`, {
        method: "POST",
        headers,
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.statusText}`);
      }

      const data = await response.json();
      const uploaded = data.uploaded || [];
      const imageUrls = uploaded.map((item: { url: string }) => item.url);
      const blobPaths = uploaded.map((item: { blob_path: string }) => item.blob_path);

      toast({
        title: "Success",
        description: `${imageUrls.length} image(s) uploaded successfully`,
      });

      return {
        urls: imageUrls,
        blobPaths,
        aiResponse: data.ai_response,
        sessionId: data.session_id,
      };
    } catch (error) {
      console.error("Upload error:", error);
      toast({
        title: "Error",
        description: "Failed to upload images",
        variant: "destructive",
      });
      return { urls: [], blobPaths: [] };
    }
  }, [apiUrl, userEmail, sessionId, accessToken, toast]);

  const handleFileSelect = useCallback(async (files: FileList | null) => {
    if (!files) return;

    const fileArray = Array.from(files).filter(file => file.type.startsWith('image/'));
    if (fileArray.length === 0) return;

    const MAX_FILES = 4;
    const currentCount = uploadedImageUrls.length;
    const remainingSlots = MAX_FILES - currentCount;

    if (remainingSlots <= 0) {
      toast({
        title: "Upload limit reached",
        description: `You can upload a maximum of ${MAX_FILES} files. Please remove some files before uploading more.`,
        variant: "destructive",
      });
      return;
    }

    // Only process files that fit within the limit
    const filesToProcess = fileArray.slice(0, remainingSlots);
    if (filesToProcess.length < fileArray.length) {
      toast({
        title: "Too many files",
        description: `Only ${filesToProcess.length} file(s) will be uploaded to stay within the ${MAX_FILES} file limit.`,
      });
    }

    setIsUploading(true);
    const previews = filesToProcess.map(file => URL.createObjectURL(file));
    setUploadedImagePreviews(prev => [...prev, ...previews]);

    try {
      const uploadResult = await uploadImages(filesToProcess);
      setUploadedImageUrls(prev => [...prev, ...uploadResult.urls]);
    } catch (error) {
      console.error("Upload error:", error);
      setUploadedImagePreviews(prev => prev.slice(0, -(previews.length)));
    } finally {
      setIsUploading(false);
    }
  }, [uploadImages, uploadedImageUrls.length, toast]);

  const removeUploadedUrl = useCallback((index: number) => {
    setUploadedImageUrls(prev => {
      const newUrls = [...prev];
      newUrls.splice(index, 1);
      return newUrls;
    });
    setUploadedImagePreviews(prev => {
      const newPreviews = [...prev];
      if (newPreviews[index]) {
        URL.revokeObjectURL(newPreviews[index]);
      }
      newPreviews.splice(index, 1);
      return newPreviews;
    });
  }, []);

  const clearUploads = useCallback(() => {
    uploadedImagePreviews.forEach(preview => URL.revokeObjectURL(preview));
    setUploadedImageUrls([]);
    setUploadedImagePreviews([]);
  }, [uploadedImagePreviews]);

  const addImageUrl = useCallback((imageUrl: string) => {
    const MAX_FILES = 4;
    if (uploadedImageUrls.length >= MAX_FILES) {
      toast({
        title: "Upload limit reached",
        description: `You can add a maximum of ${MAX_FILES} files. Please remove some files before adding more.`,
        variant: "destructive",
      });
      return;
    }
    // Add the image URL directly (no upload needed since it's already on the server)
    setUploadedImageUrls(prev => [...prev, imageUrl]);
    setUploadedImagePreviews(prev => [...prev, imageUrl]);
  }, [uploadedImageUrls.length, toast]);

  return {
    isUploading,
    uploadedImageUrls,
    uploadedImagePreviews,
    handleFileSelect,
    removeUploadedUrl,
    clearUploads,
    uploadImages,
    addImageUrl,
  };
};

