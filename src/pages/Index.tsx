import { useState, useEffect } from "react";
import ChatInterface from "@/components/ChatInterface";
import EpisodeViewer from "@/components/EpisodeViewer";
import ImageViewer from "@/components/ImageViewer";
import ModelViewer from "@/components/ModelViewer";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Image as ImageIcon, BookOpen, Box } from "lucide-react";

interface ToolCall {
  id: string;
  tool_name: string;
  parameters: Record<string, any>;
}

interface Message {
  role: "user" | "assistant";
  text: string;
  timestamp?: Date;
  toolCalls?: ToolCall[];
  conversationId?: string;
}

interface StoryState {
  current_episode: string;
  episode_count: number;
}

interface Episode {
  episode_number: number;
  summary: string;
  characters?: string[];
  locations?: string[];
  highlights?: string[];
  episode_text: string;
}

const Index = () => {
  const [storyState, setStoryState] = useState<StoryState | null>(null);
  const [episodes, setEpisodes] = useState<string[]>([]);
  const [stories, setStories] = useState<string[]>([]);
  const [selectedEpisode, setSelectedEpisode] = useState<Episode | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const { toast } = useToast();

  //const API = "http://35.209.183.202:8000";
  const API = "http://localhost:8000"; // Local backend for development

  // Load available episodes and stories on component mount
  useEffect(() => {
    const loadAvailableContent = async () => {
      try {
        // Load episodes
        const episodesRes = await fetch(`${API}/episodes`);
        if (episodesRes.ok) {
          const episodesData = await episodesRes.json();
          setEpisodes(episodesData.episodes || []);
        }

        // Load stories
        const storiesRes = await fetch(`${API}/stories`);
        if (storiesRes.ok) {
          const storiesData = await storiesRes.json();
          setStories(storiesData.stories || []);
        }
      } catch (error) {
        console.log("Could not load available content");
      }
    };

    loadAvailableContent();
  }, []);

  const addMessage = (role: "user" | "assistant", text: string) => {
    setMessages((prev) => [...prev, { role, text, timestamp: new Date() }]);
  };

  const handleSendMessage = async (message: string) => {
    addMessage("user", message);
    setIsGenerating(true);

    try {
      const res = await fetch(`${API}/ask`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: message }),
      });

      if (!res.ok) {
        throw new Error("Failed to process message");
      }

      const data = await res.json();

      if (data.status === "confirmation_required") {
        setConversationId(data.conversation_id);
        setMessages((prev) => {
          // Remove the last message if it exists and update it
          const updated = [...prev];
          updated[updated.length - 1] = {
            role: "assistant",
            text: "🤖 The agent has prepared the following actions for your approval:",
            timestamp: new Date(),
            toolCalls: data.tool_calls,
            conversationId: data.conversation_id,
          };
          return updated;
        });
      } else if (data.status === "completed") {
        addMessage("assistant", data.response || "✅ Task completed successfully!");
      }

      toast({
        title: "Message Processed",
        description: data.status === "confirmation_required" 
          ? "Please review and approve the proposed actions."
          : "Your request has been completed.",
      });
    } catch (error) {
      addMessage("assistant", "❌ Sorry, I couldn't process your message. Please check if the backend is running.");
      toast({
        title: "Processing Failed",
        description: "Unable to connect to the AI agent service.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleToolConfirmation = async (
    toolId: string,
    action: "yes" | "no" | "modify",
    parameters?: Record<string, any>
  ) => {
    if (!conversationId) return;

    setIsGenerating(true);

    try {
      const res = await fetch(`${API}/tool_confirm`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversation_id: conversationId,
          tool_id: toolId,
          action,
          parameters,
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to confirm tool");
      }

      const data = await res.json();

      if (data.status === "confirmation_required" && data.next_tool) {
        setMessages((prev) => {
          const updated = [...prev];
          updated[updated.length - 1] = {
            role: "assistant",
            text: "🤖 Next action requires your approval:",
            timestamp: new Date(),
            toolCalls: [data.next_tool],
            conversationId,
          };
          return updated;
        });
      } else if (data.status === "completed") {
        addMessage("assistant", data.final_response || "✅ All actions completed successfully!");
        setConversationId(null);
      }

      toast({
        title: action === "yes" ? "Action Approved" : action === "no" ? "Action Rejected" : "Action Modified",
        description: data.status === "completed" ? "Task completed!" : "Proceeding to next step...",
      });
    } catch (error) {
      addMessage("assistant", "❌ Failed to process your response. Please try again.");
      toast({
        title: "Confirmation Failed",
        description: "Unable to send your response to the backend.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleExtendStory = async (abstract?: string) => {
    const message = abstract ? `Generate the next episode with this direction: ${abstract}` : "Generate the next episode of the story";
    await handleSendMessage(message);
  };

  const handleLoadEpisode = async (filename: string) => {
    try {
      const res = await fetch(`${API}/episodes/${filename}`);
      
      if (!res.ok) {
        throw new Error("Failed to load episode");
      }

      const data = await res.json();
      
      // Convert the text content to episode format for display
      const episode: Episode = {
        episode_number: 1, // Default value, could be parsed from filename
        summary: "Episode content loaded from file",
        characters: [],
        locations: [],
        highlights: [],
        episode_text: data.content
      };
      
      setSelectedEpisode(episode);
      
      toast({
        title: "Episode Loaded",
        description: `Episode content from ${filename} is now displayed.`,
      });
    } catch (error) {
      toast({
        title: "Load Failed",
        description: "Unable to load the selected episode.",
        variant: "destructive",
      });
    }
  };

  const handleLoadStory = async (filename: string) => {
    try {
      const res = await fetch(`${API}/stories/${filename}`);
      
      if (!res.ok) {
        throw new Error("Failed to load story");
      }

      const data = await res.json();
      
      // Convert the text content to episode format for display
      const episode: Episode = {
        episode_number: 1, // Default value, could be parsed from filename
        summary: "Story content loaded from file",
        characters: [],
        locations: [],
        highlights: [],
        episode_text: data.content
      };
      
      setSelectedEpisode(episode);
      
      toast({
        title: "Story Loaded",
        description: `Story content from ${filename} is now displayed.`,
      });
    } catch (error) {
      toast({
        title: "Load Failed",
        description: "Unable to load the selected story.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="flex h-screen bg-background overflow-hidden max-h-screen">
      {/* Chat Interface - Left Half */}
      <div className="w-1/2 border-r border-border/50">
        <ChatInterface
          messages={messages}
          onSendMessage={handleSendMessage}
          onToolConfirmation={handleToolConfirmation}
          isGenerating={isGenerating}
          apiUrl={API}
        />
      </div>

      {/* Right Half - Tabs for Image Viewer, 3D Model Viewer, and Episode Viewer */}
      <div className="w-1/2 flex flex-col overflow-hidden">
        <Tabs defaultValue="images" className="flex-1 flex flex-col min-h-0">
          <TabsList className="w-full justify-start rounded-none border-b bg-background h-14 px-6">
            <TabsTrigger value="images" className="gap-2">
              <ImageIcon className="w-4 h-4" />
              Image Viewer
            </TabsTrigger>
            <TabsTrigger value="models" className="gap-2">
              <Box className="w-4 h-4" />
              3D Model Viewer
            </TabsTrigger>
            <TabsTrigger value="episodes" className="gap-2">
              <BookOpen className="w-4 h-4" />
              Episode Viewer
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="images" className="flex-1 m-0 overflow-hidden">
            <ImageViewer apiUrl={API} />
          </TabsContent>
          
          <TabsContent value="models" className="flex-1 m-0 overflow-hidden">
            <ModelViewer apiUrl={API} />
          </TabsContent>
          
          <TabsContent value="episodes" className="flex-1 m-0 overflow-hidden">
            <EpisodeViewer
              storyState={storyState}
              episodes={episodes}
              stories={stories}
              selectedEpisode={selectedEpisode}
              onExtendStory={handleExtendStory}
              onLoadEpisode={handleLoadEpisode}
              onLoadStory={handleLoadStory}
              isGenerating={isGenerating}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Index;
