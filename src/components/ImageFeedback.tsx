import { useState } from "react";
import { ThumbsUp, ThumbsDown, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

interface ImageFeedbackProps {
  imageId?: string;
  onFeedback?: (type: "like" | "dislike", comment?: string) => void;
  className?: string;
}

const ImageFeedback = ({ imageId, onFeedback, className }: ImageFeedbackProps) => {
  const [feedback, setFeedback] = useState<"like" | "dislike" | null>(null);
  const [showInput, setShowInput] = useState(false);
  const [comment, setComment] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleFeedback = (type: "like" | "dislike") => {
    setFeedback(type);
    
    if (type === "like") {
      onFeedback?.(type);
      setSubmitted(true);
      setShowInput(false);
    } else {
      setShowInput(true);
    }
  };

  const handleSubmitComment = () => {
    onFeedback?.("dislike", comment);
    setSubmitted(true);
    setShowInput(false);
  };

  const handleSkipComment = () => {
    onFeedback?.("dislike");
    setSubmitted(true);
    setShowInput(false);
  };

  if (submitted) {
    return (
      <motion.div 
        initial={{ opacity: 0, y: -5 }}
        animate={{ opacity: 1, y: 0 }}
        className={cn("flex items-center gap-2 text-xs text-muted-foreground", className)}
      >
        <span className="flex items-center gap-1">
          {feedback === "like" ? (
            <>
              <ThumbsUp className="w-3 h-3 text-green-500 fill-green-500" />
              <span className="text-green-600 dark:text-green-400">Thanks for your feedback!</span>
            </>
          ) : (
            <>
              <ThumbsDown className="w-3 h-3 text-orange-500 fill-orange-500" />
              <span className="text-orange-600 dark:text-orange-400">Feedback recorded</span>
            </>
          )}
        </span>
      </motion.div>
    );
  }

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center gap-3">
        <span className="text-xs text-muted-foreground">Was this helpful?</span>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleFeedback("like")}
            className={cn(
              "h-7 px-2 gap-1 text-xs rounded-full transition-all",
              feedback === "like" 
                ? "bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400" 
                : "hover:bg-green-50 dark:hover:bg-green-900/20 hover:text-green-600"
            )}
          >
            <ThumbsUp className={cn("w-3.5 h-3.5", feedback === "like" && "fill-current")} />
            <span>Like</span>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleFeedback("dislike")}
            className={cn(
              "h-7 px-2 gap-1 text-xs rounded-full transition-all",
              feedback === "dislike" 
                ? "bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400" 
                : "hover:bg-orange-50 dark:hover:bg-orange-900/20 hover:text-orange-600"
            )}
          >
            <ThumbsDown className={cn("w-3.5 h-3.5", feedback === "dislike" && "fill-current")} />
            <span>Dislike</span>
          </Button>
        </div>
      </div>

      <AnimatePresence>
        {showInput && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="flex items-center gap-2 pt-1">
              <Input
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Tell us how we can improve..."
                className="h-8 text-xs flex-1 bg-muted/50 border-muted-foreground/20"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && comment.trim()) {
                    handleSubmitComment();
                  }
                }}
              />
              <Button
                size="sm"
                onClick={handleSubmitComment}
                disabled={!comment.trim()}
                className="h-8 px-3 text-xs"
              >
                <Send className="w-3 h-3" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSkipComment}
                className="h-8 px-2 text-xs text-muted-foreground hover:text-foreground"
              >
                Skip
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ImageFeedback;
