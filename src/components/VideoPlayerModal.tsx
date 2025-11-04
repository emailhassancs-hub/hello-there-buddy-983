import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const BASE_URL = "https://games-ai-studio-be-nest-347148155332.us-central1.run.app";

interface VideoPlayerModalProps {
  video: {
    filename: string;
    name: string;
  } | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const VideoPlayerModal = ({ video, open, onOpenChange }: VideoPlayerModalProps) => {
  if (!video) return null;

  const videoUrl = `${BASE_URL}/videos/${video.filename}`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl p-0">
        <DialogHeader className="p-6 pb-4">
          <DialogTitle>{video.name}</DialogTitle>
        </DialogHeader>
        <div className="px-6 pb-6">
          <video
            src={videoUrl}
            controls
            autoPlay
            className="w-full rounded-lg bg-black"
            style={{ maxHeight: '70vh' }}
          >
            Your browser does not support the video tag.
          </video>
        </div>
      </DialogContent>
    </Dialog>
  );
};
