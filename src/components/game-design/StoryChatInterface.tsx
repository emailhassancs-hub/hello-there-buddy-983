import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Bot, User } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

interface ChatMessage {
  role: "bot" | "user";
  content: string;
  delay?: number;
}

const chatFlow: ChatMessage[] = [
  {
    role: "bot",
    content: "Welcome to the Story Generation Module! 🎮\n\nLet's start creating your game story. What is the main game idea and theme you want to work on? Describe it in natural language.",
    delay: 1000,
  },
  {
    role: "user",
    content: "I want to create a fighting game featuring a female fighter named Chun-Li who is on a journey to rescue her sister.",
    delay: 2000,
  },
  {
    role: "bot",
    content: "Great concept! Let me help you structure this. Here are some story framework options:\n\n1️⃣ **Revenge Quest**: Chun-Li seeks vengeance against those who wronged her family\n2️⃣ **Sacred Artifact Theft**: A powerful artifact is stolen from a temple, and Chun-Li must recover it\n3️⃣ **Tournament Arc**: Chun-Li enters a deadly tournament to save her sister\n4️⃣ **Rescue Mission**: Chun-Li's sister is kidnapped, and she must fight through enemies to save her\n\nWhich direction interests you most?",
    delay: 1500,
  },
  {
    role: "user",
    content: "Option 2 - the sacred artifact theft sounds perfect!",
    delay: 2000,
  },
  {
    role: "bot",
    content: "Excellent choice! Here's the detailed concept:\n\n**Title:** \"The Temple Diamond Heist\"\n\n**Core Story:**\nThe Diamond of Aeons, a sacred artifact holding infinite energy, is stolen from the Temple of Eternal Light. Mia Shiranui, Chun-Li's sister and temple guardian, is kidnapped during the theft. Chun-Li returns to find the temple destroyed and embarks on a dangerous journey to rescue her sister and recover the diamond.\n\n**Main Characters:**\n- **Chun-Li**: Skilled martial artist, protagonist\n- **Mia Shiranui**: Temple guardian, Chun-Li's sister (kidnapped)\n- **Madara**: Mercenary working for the villain syndicate\n- **Magma**: Powerful villain leader, final boss\n\n**Key Asset:**\n- Sacred Diamond of Aeons\n\nWould you like me to proceed with this concept?",
    delay: 2000,
  },
  {
    role: "user",
    content: "Yes, this is perfect! Generate the full story structure.",
    delay: 1500,
  },
  {
    role: "bot",
    content: "✅ Story abstract generated and saved to `/story/abstract.txt`\n\n**Abstract:**\n\"In the mystical Temple of Eternal Light, the sacred Diamond of Aeons is stolen by a villainous syndicate. Mia Shiranui, temple guardian and sister to renowned fighter Chun-Li, is kidnapped during the attack. When Chun-Li returns to find destruction and her sister missing, she vows to track down those responsible. Her journey takes her through confrontations with mercenary Madara and ultimately to the fortress of Magma, the syndicate's leader, where she must fight to rescue her sister and recover the stolen diamond.\"\n\nDo you have specific ideas about how the story should branch, or would you like me to generate the branching structure automatically?",
    delay: 2000,
  },
  {
    role: "user",
    content: "Generate it automatically for me.",
    delay: 1500,
  },
  {
    role: "bot",
    content: "🎨 Generating story branching graph...\n\n✅ Character profiles created (4 characters)\n✅ Asset definitions saved (1 asset)\n✅ Branching graph generated with 8 scenes\n✅ Multiple story paths created based on player choices\n\nAll files saved to the repository. Check the graph visualization to see the complete story flow!",
    delay: 2000,
  },
];

export const StoryChatInterface = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (currentIndex < chatFlow.length) {
      const timer = setTimeout(() => {
        setMessages((prev) => [...prev, chatFlow[currentIndex]]);
        setCurrentIndex((prev) => prev + 1);
      }, chatFlow[currentIndex].delay || 1000);

      return () => clearTimeout(timer);
    }
  }, [currentIndex]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  return (
    <div className="flex flex-col h-full">
      <div className="p-3 border-b border-border">
        <h3 className="text-sm font-semibold">Story Assistant</h3>
      </div>

      <ScrollArea className="flex-1 p-4" ref={scrollRef}>
        <div className="space-y-4">
          {messages.map((message, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className={cn(
                "flex gap-2",
                message.role === "user" && "flex-row-reverse"
              )}
            >
              <div
                className={cn(
                  "h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0",
                  message.role === "bot" ? "bg-primary" : "bg-secondary"
                )}
              >
                {message.role === "bot" ? (
                  <Bot className="h-4 w-4 text-primary-foreground" />
                ) : (
                  <User className="h-4 w-4 text-secondary-foreground" />
                )}
              </div>
              <div
                className={cn(
                  "rounded-lg px-3 py-2 max-w-[85%]",
                  message.role === "bot"
                    ? "bg-muted"
                    : "bg-primary text-primary-foreground"
                )}
              >
                <div className="text-xs whitespace-pre-wrap">{message.content}</div>
              </div>
            </motion.div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
};
