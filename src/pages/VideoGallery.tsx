import { useState, useEffect } from "react";
import { VideoCard } from "@/components/VideoCard";
import { VideoPlayerModal } from "@/components/VideoPlayerModal";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Video, AlertCircle } from "lucide-react";

//const VIDEO_BASE_URL = "http://localhost:8000";
const VIDEO_BASE_URL = "https://games-ai-studio-middleware-agentic-main-347148155332.us-central1.run.app";

interface Video {
  filename: string;
  name: string;
  url: string;
  thumbnail: string;
  duration: number;
  fps: number;
  size: number;
  modified: number;
  createdAt: string;
}

interface VideosResponse {
  videos: Video[];
  total: number;
}

export default function VideoGallery() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);
  const [playerOpen, setPlayerOpen] = useState(false);

  useEffect(() => {
    fetchVideos();
  }, []);

  const fetchVideos = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`${VIDEO_BASE_URL}/videos`);
      if (!response.ok) {
        throw new Error(`Failed to fetch videos: ${response.status}`);
      }
      const data = await response.json();
      setVideos(data.videos);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load videos");
    } finally {
      setLoading(false);
    }
  };

  const handleVideoClick = (video: Video) => {
    setSelectedVideo(video);
    setPlayerOpen(true);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Video className="h-8 w-8 text-primary" />
            <h1 className="text-4xl font-bold">Video Gallery</h1>
          </div>
          <p className="text-muted-foreground">
            Browse and play your video collection
          </p>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="space-y-3">
                <Skeleton className="aspect-video w-full" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            ))}
          </div>
        ) : videos.length === 0 ? (
          <div className="text-center py-12">
            <Video className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <p className="text-lg text-muted-foreground">No videos found</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {videos.map((video) => (
              <VideoCard
                key={video.filename}
                video={video}
                onClick={() => handleVideoClick(video)}
              />
            ))}
          </div>
        )}
      </div>

      <VideoPlayerModal
        video={selectedVideo}
        open={playerOpen}
        onOpenChange={setPlayerOpen}
      />
    </div>
  );
}
