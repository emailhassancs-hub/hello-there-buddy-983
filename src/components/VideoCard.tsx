import { Clock, HardDrive, Calendar, Play } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

interface VideoCardProps {
  video: {
    filename: string;
    name: string;
    thumbnail: string;
    duration: number;
    size: number;
    createdAt: string;
  };
  onClick: () => void;
}

export const VideoCard = ({ video, onClick }: VideoCardProps) => {
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const formatSize = (bytes: number) => {
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(1)} MB`;
  };

  return (
    <Card 
      className="group cursor-pointer overflow-hidden transition-all duration-300 hover:scale-105 hover:shadow-lg"
      onClick={onClick}
    >
      <div className="relative aspect-video overflow-hidden bg-muted">
        <img
          src={video.thumbnail}
          alt={video.name}
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-black/40 opacity-0 transition-opacity duration-300 group-hover:opacity-100 flex items-center justify-center">
          <div className="rounded-full bg-primary p-4">
            <Play className="h-8 w-8 text-primary-foreground fill-current" />
          </div>
        </div>
        <Badge className="absolute top-2 right-2 bg-black/60 text-white">
          {formatDuration(video.duration)}
        </Badge>
      </div>
      
      <CardContent className="p-4">
        <h3 className="font-semibold truncate mb-2">{video.name}</h3>
        <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <HardDrive className="h-3 w-3" />
            <span>{formatSize(video.size)}</span>
          </div>
          <div className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            <span>{format(new Date(video.createdAt), "MMM d, yyyy")}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
