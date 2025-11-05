import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FileExplorer } from "@/components/game-design/FileExplorer";
import { StoryGraph } from "@/components/game-design/StoryGraph";
import { StoryChatInterface } from "@/components/game-design/StoryChatInterface";
import { CharacterBar } from "@/components/game-design/CharacterBar";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";

const GameDesignPro = () => {
  const navigate = useNavigate();
  const [isStarted, setIsStarted] = useState(false);

  const handleStart = () => {
    setIsStarted(true);
  };

  return (
    <div className="h-screen w-full flex flex-col bg-background">
      <AnimatePresence mode="wait">
        {!isStarted ? (
          <motion.div
            key="landing"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="flex-1 flex flex-col items-center justify-center p-8"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5 }}
              className="text-center space-y-6 max-w-2xl"
            >
              <h1 className="text-5xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                Game Design Pro
              </h1>
              <p className="text-xl text-muted-foreground">
                AI-Assisted Story Branching for Games
              </p>
              <Button
                onClick={handleStart}
                size="lg"
                className="mt-8 text-lg px-8 py-6"
              >
                <Sparkles className="mr-2 h-5 w-5" />
                Start Story Generation
              </Button>
            </motion.div>
          </motion.div>
        ) : (
          <motion.div
            key="workspace"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.3 }}
            className="flex-1 flex flex-col"
          >
            {/* Header with Back Button */}
            <div className="h-14 border-b border-border flex items-center justify-between px-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate("/")}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Studio
              </Button>
              <h2 className="text-lg font-semibold">Story Generation Module</h2>
              <div className="w-24" /> {/* Spacer for centering */}
            </div>

            {/* Character Bar */}
            <CharacterBar />

            {/* Three Panel Layout */}
            <div className="flex-1 flex overflow-hidden">
              {/* Left Panel - File Explorer */}
              <motion.div
                initial={{ x: -300, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ duration: 0.4, delay: 0.5 }}
                className="w-1/4 border-r border-border overflow-auto"
              >
                <FileExplorer />
              </motion.div>

              {/* Middle Panel - Story Graph */}
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.4, delay: 0.6 }}
                className="flex-1 bg-muted/10"
              >
                <StoryGraph />
              </motion.div>

              {/* Right Panel - Chat Interface */}
              <motion.div
                initial={{ x: 300, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ duration: 0.4, delay: 0.5 }}
                className="w-1/4 border-l border-border flex flex-col"
              >
                <StoryChatInterface />
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default GameDesignPro;
