import { useState } from 'react';
import { Dialog, DialogContent, DialogTitle, DialogDescription, DialogClose } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { X, Download, ZoomIn } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface WorkflowChainResultsProps {
  images: string[];
  models: string[];
  totalTasks: number;
  chainId: string;
  onClose?: () => void;
}

export const WorkflowChainResults = ({
  images,
  models,
  totalTasks,
  chainId,
  onClose,
}: WorkflowChainResultsProps) => {
  const [zoomedImage, setZoomedImage] = useState<string | null>(null);

  const handleDownload = (url: string, filename: string) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = filename || 'download';
    link.click();
  };

  return (
    <>
      <div className="w-full space-y-6 p-4 rounded-lg bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30 border-2 border-green-200 dark:border-green-800">
        {/* Header */}
        <div className="text-center space-y-2">
          <h3 className="text-xl font-bold text-green-900 dark:text-green-100 flex items-center justify-center gap-2">
            🎉 Workflow Chain Complete!
          </h3>
          <p className="text-sm text-green-700 dark:text-green-300">
            Chain ID: {chainId.substring(0, 12)}...
          </p>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-2 gap-4">
          <div className="p-3 rounded-lg bg-white/50 dark:bg-black/20 border border-green-200 dark:border-green-800">
            <span className="block text-xs text-green-600 dark:text-green-400">Tasks Completed</span>
            <span className="text-2xl font-bold text-green-900 dark:text-green-100">
              {totalTasks}/{totalTasks}
            </span>
          </div>
          <div className="p-3 rounded-lg bg-white/50 dark:bg-black/20 border border-green-200 dark:border-green-800">
            <span className="block text-xs text-green-600 dark:text-green-400">Results Generated</span>
            <span className="text-2xl font-bold text-green-900 dark:text-green-100">
              {images.length + models.length}
            </span>
          </div>
        </div>

        {/* Images Section */}
        {images.length > 0 && (
          <div className="space-y-3">
            <h4 className="font-semibold text-green-900 dark:text-green-100 text-sm">
              Generated Images ({images.length})
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {images.map((img, idx) => (
                <div
                  key={idx}
                  className="group relative rounded-lg overflow-hidden border-2 border-green-200 dark:border-green-800 bg-white/50 dark:bg-black/20"
                >
                  <img
                    src={img}
                    alt={`Result ${idx + 1}`}
                    className="w-full h-32 object-cover hover:scale-105 transition-transform"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                    <button
                      onClick={() => setZoomedImage(img)}
                      className="p-2 rounded-full bg-white/90 text-black hover:bg-white"
                      title="Zoom"
                    >
                      <ZoomIn className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 bg-black/50 p-1 flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => handleDownload(img, `result-${idx + 1}.png`)}
                      className="p-1 rounded text-white hover:bg-white/20"
                      title="Download"
                    >
                      <Download className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Models Section */}
        {models.length > 0 && (
          <div className="space-y-3">
            <h4 className="font-semibold text-green-900 dark:text-green-100 text-sm">
              Generated Models ({models.length})
            </h4>
            <div className="space-y-2">
              {models.map((model, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-3 rounded-lg bg-white/50 dark:bg-black/20 border border-green-200 dark:border-green-800"
                >
                  <span className="text-sm text-foreground">3D Model {idx + 1}</span>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDownload(model, `model-${idx + 1}.glb`)}
                    className="h-8"
                  >
                    <Download className="h-3 w-3 mr-1" />
                    Download
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {images.length === 0 && models.length === 0 && (
          <Alert className="bg-yellow-50 dark:bg-yellow-950/30 border-yellow-200 dark:border-yellow-800">
            <AlertDescription className="text-yellow-700 dark:text-yellow-300">
              No results were generated. Please check the workflow configuration.
            </AlertDescription>
          </Alert>
        )}

        {/* Close Button */}
        {onClose && (
          <Button
            onClick={onClose}
            className="w-full bg-green-600 hover:bg-green-700 text-white"
          >
            Close
          </Button>
        )}
      </div>

      {/* Image Zoom Dialog */}
      <Dialog open={!!zoomedImage} onOpenChange={() => setZoomedImage(null)}>
        <DialogContent className="max-w-4xl w-full p-0 overflow-hidden">
          <DialogTitle className="sr-only">Image Preview</DialogTitle>
          <DialogDescription className="sr-only">Full size image preview</DialogDescription>
          <DialogClose className="absolute right-4 top-4 z-10 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none">
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </DialogClose>
          {zoomedImage && (
            <div className="relative bg-muted/20 flex items-center justify-center p-8">
              <img
                src={zoomedImage}
                alt="Zoomed view"
                className="max-h-[80vh] w-auto object-contain rounded-lg"
              />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};
