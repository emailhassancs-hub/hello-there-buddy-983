import { useState, useEffect } from "react";
import ChatInterface from "@/components/ChatInterface";
import EpisodeViewer from "@/components/EpisodeViewer";
import ImageViewer from "@/components/ImageViewer";
import ModelViewer from "@/components/ModelViewer";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Image as ImageIcon, BookOpen, Box } from "lucide-react";

interface Message {
  role: "user" | "assistant";
  text: string;
  timestamp?: Date;
  needsConfirmation?: boolean;
}

interface ConversationState {
  stage: "initial" | "awaiting_params_confirmation" | "awaiting_prompt_confirmation" | "executing" | "completed";
  context?: any;
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
  const [conversationState, setConversationState] = useState<ConversationState>({
    stage: "initial"
  });
  const { toast } = useToast();

  const API = "http://35.209.183.202:8000";

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

  const handleSendMessage = async (message: string, isConfirmation: boolean = false) => {
    addMessage("user", message);
    setIsGenerating(true);

    try {
      // Remove the temporary "Processing..." message from previous calls
      setMessages((prev) => prev.filter((msg) => msg.text !== "✨ Processing your message..."));
      
      addMessage("assistant", "✨ Processing your message...");
      
      const res = await fetch(`${API}/ask`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          query: message,
          conversation_state: conversationState,
          is_confirmation: isConfirmation
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to process message");
      }

      const data = await res.json();
      
      // Update conversation state from backend response
      if (data.conversation_state) {
        setConversationState(data.conversation_state);
      }
      
      // Extract assistant response from messages
      const assistantMessages = data.messages?.filter((msg: any) => 
        msg.type === "ai" || msg.type === "assistant"
      );
      
      const assistantText = assistantMessages?.length > 0 ? 
        assistantMessages[assistantMessages.length - 1].content || "Message processed!" 
        : "Message processed successfully!";

      // Handle images if present
      let responseText = assistantText;
      if (data.images && data.images.length > 0) {
        const imageElements = data.images.map((imageObj: any) => {
          // Convert backslashes to forward slashes for web URLs
          const imagePath = imageObj.path ? imageObj.path.replace(/\\/g, '/') : '';
          return `<img src="${API}/${imagePath}" alt="Generated image" style="max-width: 300px; margin: 10px 0; border-radius: 8px;" />`;
        }).join('');
        responseText = `${assistantText}\n\n${imageElements}`;
      }

      // Remove the "Processing..." message and add the actual response
      setMessages((prev) => prev.filter((msg) => msg.text !== "✨ Processing your message..."));
      addMessage("assistant", responseText);
      
      // Set needsConfirmation flag if backend indicates it
      if (data.needs_confirmation) {
        setMessages((prev) => {
          const updated = [...prev];
          if (updated.length > 0) {
            updated[updated.length - 1].needsConfirmation = true;
          }
          return updated;
        });
      }
      
      toast({
        title: "Message Processed!",
        description: "Your message has been processed by the AI agent.",
      });
    } catch (error) {
      setMessages((prev) => prev.filter((msg) => msg.text !== "✨ Processing your message..."));
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
