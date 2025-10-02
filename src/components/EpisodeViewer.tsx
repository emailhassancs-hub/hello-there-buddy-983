import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { 
  Plus, 
  BookOpen, 
  Users, 
  MapPin, 
  Star, 
  ChevronDown,
  FileText,
  Sparkles,
  Settings
} from "lucide-react";
import storyHero from "@/assets/story-hero.jpg";

interface Episode {
  episode_number: number;
  summary: string;
  characters?: string[];
  locations?: string[];
  highlights?: string[];
  episode_text: string;
}

interface StoryState {
  current_episode: string;
  episode_count: number;
}

interface EpisodeViewerProps {
  storyState: StoryState | null;
  episodes: string[];
  stories: string[];
  selectedEpisode: Episode | null;
  onExtendStory: (abstract?: string) => void;
  onLoadEpisode: (filename: string) => void;
  onLoadStory: (filename: string) => void;
  isGenerating?: boolean;
}

const EpisodeViewer = ({ 
  storyState, 
  episodes, 
  stories,
  selectedEpisode, 
  onExtendStory, 
  onLoadEpisode,
  onLoadStory,
  isGenerating 
}: EpisodeViewerProps) => {
  const [showPriorEpisodes, setShowPriorEpisodes] = useState(false);
  const [showStories, setShowStories] = useState(false);
  const [extendDialogOpen, setExtendDialogOpen] = useState(false);
  const [extendAbstract, setExtendAbstract] = useState("");
  const [isControlsOpen, setIsControlsOpen] = useState(true);

  return (
    <div className="flex flex-col h-full bg-episode-background">
      {/* Header */}
      <Collapsible open={isControlsOpen} onOpenChange={setIsControlsOpen}>
        <div className="p-6 border-b border-border/50 bg-background/80 backdrop-blur-sm">
          <CollapsibleTrigger asChild>
            <div className="flex items-center justify-between mb-4 cursor-pointer group">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-gradient-secondary">
                  <FileText className="w-6 h-6 text-secondary-foreground" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-foreground">Episode Viewer</h2>
                  <p className="text-sm text-muted-foreground">Your story unfolds here</p>
                </div>
              </div>
              <ChevronDown className={`w-5 h-5 text-muted-foreground transition-transform group-hover:text-foreground ${isControlsOpen ? "rotate-180" : ""}`} />
            </div>
          </CollapsibleTrigger>

          <CollapsibleContent className="space-y-4">
            {/* Action Buttons */}
            <div className="flex gap-3">
              <Dialog open={extendDialogOpen} onOpenChange={setExtendDialogOpen}>
                <DialogTrigger asChild>
                  <Button
                    disabled={!storyState || isGenerating}
                    className="bg-success text-success-foreground hover:bg-success/90 rounded-xl shadow-soft"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Generate Next Part
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>Extend Your Story</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="abstract">Enter story direction (optional)</Label>
                      <Input
                        id="abstract"
                        placeholder="What should happen next in the story..."
                        value={extendAbstract}
                        onChange={(e) => setExtendAbstract(e.target.value)}
                        className="mt-2"
                      />
                    </div>
                    <div className="flex gap-2 justify-end">
                      <Button
                        variant="outline"
                        onClick={() => setExtendDialogOpen(false)}
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={() => {
                          onExtendStory(extendAbstract);
                          setExtendAbstract("");
                          setExtendDialogOpen(false);
                        }}
                        className="bg-success text-success-foreground hover:bg-success/90"
                      >
                        Generate
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
              
              <Button
                onClick={() => setShowPriorEpisodes(!showPriorEpisodes)}
                variant="outline"
                className="rounded-xl border-border/50 hover:bg-muted"
              >
                <BookOpen className="w-4 h-4 mr-2" />
                Episodes
                <ChevronDown className={`w-4 h-4 ml-2 transition-transform ${showPriorEpisodes ? "rotate-180" : ""}`} />
              </Button>

              <Button
                onClick={() => setShowStories(!showStories)}
                variant="outline"
                className="rounded-xl border-border/50 hover:bg-muted"
              >
                <FileText className="w-4 h-4 mr-2" />
                Stories
                <ChevronDown className={`w-4 h-4 ml-2 transition-transform ${showStories ? "rotate-180" : ""}`} />
              </Button>

              <Button
                variant="outline"
                className="rounded-xl border-border/50 hover:bg-muted"
                onClick={() => window.open('/dashboard', '_blank')}
              >
                <Settings className="w-4 h-4 mr-2" />
                Tools Dashboard
              </Button>
            </div>

            {/* Episodes Dropdown */}
            {showPriorEpisodes && episodes.length > 0 && (
              <Card className="shadow-card">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">Available Episodes</CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="grid gap-2">
                    {episodes.map((filename, index) => (
                      <Button
                        key={index}
                        variant="ghost"
                        onClick={() => onLoadEpisode(filename)}
                        className="justify-start rounded-lg hover:bg-muted"
                      >
                        <FileText className="w-4 h-4 mr-2" />
                        {filename.replace('.txt', '')}
                      </Button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Stories Dropdown */}
            {showStories && stories.length > 0 && (
              <Card className="shadow-card">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">Available Stories</CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="grid gap-2">
                    {stories.map((filename, index) => (
                      <Button
                        key={index}
                        variant="ghost"
                        onClick={() => onLoadStory(filename)}
                        className="justify-start rounded-lg hover:bg-muted"
                      >
                        <BookOpen className="w-4 h-4 mr-2" />
                        {filename.replace('.txt', '')}
                      </Button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </CollapsibleContent>
        </div>
      </Collapsible>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {!storyState?.current_episode && !selectedEpisode ? (
          <div className="flex flex-col items-center justify-center h-full text-center space-y-6">
            <div className="relative">
              <img 
                src={storyHero} 
                alt="Magical storytelling" 
                className="w-64 h-48 object-cover rounded-2xl shadow-card"
              />
              <div className="absolute inset-0 bg-gradient-primary/20 rounded-2xl"></div>
            </div>
            <div>
              <h3 className="text-2xl font-bold text-foreground mb-2">
                Your Story Awaits
              </h3>
              <p className="text-muted-foreground max-w-md">
                Start a conversation in the chat to begin generating your magical story episodes.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Current Episode */}
            {storyState?.current_episode && (
              <Card className="story-card-hover shadow-card">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-primary" />
                      Episode {storyState.episode_count}
                    </CardTitle>
                    <Badge variant="secondary" className="bg-story-highlight text-secondary-foreground">
                      Latest
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="prose prose-gray max-w-none">
                    <p className="text-episode-card-foreground leading-relaxed whitespace-pre-line">
                      {storyState.current_episode}
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Selected Episode Details */}
            {selectedEpisode && (
              <Card className="story-card-hover shadow-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BookOpen className="w-5 h-5 text-primary" />
                    Episode {selectedEpisode.episode_number}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Summary */}
                  <div>
                    <h4 className="font-semibold text-foreground mb-2">📖 Summary</h4>
                    <p className="text-muted-foreground">{selectedEpisode.summary}</p>
                  </div>

                  <Separator />

                  {/* Characters and Locations */}
                  <div className="grid md:grid-cols-2 gap-4">
                    {selectedEpisode.characters && selectedEpisode.characters.length > 0 && (
                      <div>
                        <h4 className="font-semibold text-foreground mb-2 flex items-center gap-2">
                          <Users className="w-4 h-4" />
                          Characters
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {selectedEpisode.characters.map((character, index) => (
                            <Badge key={index} className="bg-story-character text-story-character">
                              {character}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {selectedEpisode.locations && selectedEpisode.locations.length > 0 && (
                      <div>
                        <h4 className="font-semibold text-foreground mb-2 flex items-center gap-2">
                          <MapPin className="w-4 h-4" />
                          Locations
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {selectedEpisode.locations.map((location, index) => (
                            <Badge key={index} className="bg-story-location text-story-location">
                              {location}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Highlights */}
                  {selectedEpisode.highlights && selectedEpisode.highlights.length > 0 && (
                    <>
                      <Separator />
                      <div>
                        <h4 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                          <Star className="w-4 h-4" />
                          Key Highlights
                        </h4>
                        <ul className="space-y-2">
                          {selectedEpisode.highlights.map((highlight, index) => (
                            <li key={index} className="flex items-start gap-2">
                              <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0"></div>
                              <span className="text-muted-foreground">{highlight}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </>
                  )}

                  <Separator />

                  {/* Full Episode Text */}
                  <div>
                    <h4 className="font-semibold text-foreground mb-3">📜 Full Episode</h4>
                    <div className="bg-muted/30 rounded-xl p-4">
                      <p className="text-episode-card-foreground leading-relaxed whitespace-pre-line">
                        {selectedEpisode.episode_text}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default EpisodeViewer;