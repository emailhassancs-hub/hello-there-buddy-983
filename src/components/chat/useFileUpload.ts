import { useState, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";
import { apiFetch } from "@/lib/api";

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
    try {
      // Safety check: Reject WebP files
      const webpFiles = files.filter(file => file.type === 'image/webp' || file.name.toLowerCase().endsWith('.webp'));
      if (webpFiles.length > 0) {
        const fileNames = webpFiles.map(f => f.name).join(', ');
        throw new Error(`WebP format is not supported. Please use PNG, JPEG, or GIF format instead. The following file(s) were rejected: ${fileNames}`);
      }

      // Safety check: Validate file sizes before uploading
      const MAX_FILE_SIZE = 28 * 1024 * 1024; // 28MB
      const oversizedFiles = files.filter(file => file.size > MAX_FILE_SIZE);
      
      if (oversizedFiles.length > 0) {
        const fileNames = oversizedFiles.map(f => f.name).join(', ');
        throw new Error(`File size must be less than 28MB. The following file(s) exceed this limit: ${fileNames}`);
      }

      // Upload each file to Nest endpoint /api/v1/upload-image using apiFetch
      const uploadPromises = files.map(async (file) => {
        const formData = new FormData();
        formData.append("file", file);

        const data = await apiFetch<{ success: boolean; filename?: string; url?: string }>(
          "/api/v1/upload-image",
          {
            method: "POST",
            body: formData,
          }
        );
        
        if (!data.success || !data.url) {
          throw new Error("Invalid response from upload endpoint");
        }

        return data.url;
      });

      const imageUrls = await Promise.all(uploadPromises);

      toast({
        title: "Success",
        description: `${imageUrls.length} image(s) uploaded successfully`,
      });

      return {
        urls: imageUrls,
        blobPaths: imageUrls, // Use URLs as blob paths for consistency
        aiResponse: undefined,
        sessionId: sessionId,
      };
    } catch (error) {
      console.error("Upload error:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to upload images",
        variant: "destructive",
      });
      return { urls: [], blobPaths: [] };
    }
  }, [sessionId, toast]);

  const handleFileSelect = useCallback(async (files: FileList | null) => {
    if (!files) return;

    let fileArray = Array.from(files).filter(file => file.type.startsWith('image/'));
    if (fileArray.length === 0) return;

    // Reject WebP files
    const webpFiles = fileArray.filter(file => file.type === 'image/webp' || file.name.toLowerCase().endsWith('.webp'));
    if (webpFiles.length > 0) {
      toast({
        title: "WebP format not supported",
        description: `WebP format is not supported. Please use PNG, JPEG, or GIF format instead. The following file(s) were rejected: ${webpFiles.map(file => file.name).join(', ')}`,
        variant: "destructive",
      });
      // Remove WebP files from the array
      fileArray = fileArray.filter(file => file.type !== 'image/webp' && !file.name.toLowerCase().endsWith('.webp'));
      if (fileArray.length === 0) return;
    }

    // Check file size (28MB = 28 * 1024 * 1024 bytes)
    const MAX_FILE_SIZE = 28 * 1024 * 1024; // 28MB
    const oversizedFiles = fileArray.filter(file => file.size > MAX_FILE_SIZE);
    
    if (oversizedFiles.length > 0) {
      toast({
        title: "File too large",
        description: `File size must be less than 28MB. The following file(s) exceed this limit: ${oversizedFiles.map(file => file.name).join(', ')}`,
        variant: "destructive",
      });
      return;
    }

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
    // Avoid duplicates (e.g. remix event fired multiple times)
    setUploadedImageUrls(prev => {
      if (prev.includes(imageUrl)) return prev;
      return [...prev, imageUrl];
    });
    setUploadedImagePreviews(prev => {
      if (prev.includes(imageUrl)) return prev;
      return [...prev, imageUrl];
    });
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

