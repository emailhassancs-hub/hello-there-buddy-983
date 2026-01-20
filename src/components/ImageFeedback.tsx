import { useState } from "react";
import { ThumbsUp, ThumbsDown, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

interface ImageFeedbackProps {
  imageId?: string;
  onFeedback?: (type: "like" | "dislike", issueType?: string, comment?: string) => void;
  className?: string;
}

const issueTypes = [
  { value: "style", label: "Don't like the style" },
  { value: "reference", label: "Don't match my reference" },
  { value: "slow", label: "Slow generation" },
  { value: "instructions", label: "Didn't follow instructions" },
  { value: "credits", label: "High credit usage" },
  { value: "other", label: "Other" },
];

const ImageFeedback = ({ imageId, onFeedback, className }: ImageFeedbackProps) => {
  const [feedback, setFeedback] = useState<"like" | "dislike" | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [issueType, setIssueType] = useState<string>("");
  const [comment, setComment] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleFeedback = (type: "like" | "dislike") => {
    setFeedback(type);
    
    if (type === "like") {
      onFeedback?.(type);
      setSubmitted(true);
      setShowForm(false);
    } else {
      setShowForm(true);
    }
  };

  const handleSubmit = () => {
    if (!issueType) return;
    onFeedback?.("dislike", issueType, comment || undefined);
    setSubmitted(true);
    setShowForm(false);
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
    <div className={cn("space-y-3", className)}>
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
        {showForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="space-y-3 pt-1 p-3 rounded-lg bg-muted/30 border border-border/50">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground">
                  Issue Type <span className="text-destructive">*</span>
                </label>
                <Select value={issueType} onValueChange={setIssueType}>
                  <SelectTrigger className="h-9 text-xs bg-background">
                    <SelectValue placeholder="Select an issue..." />
                  </SelectTrigger>
                  <SelectContent className="bg-background z-50">
                    {issueTypes.map((issue) => (
                      <SelectItem key={issue.value} value={issue.value} className="text-xs">
                        {issue.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">
                  Additional Comments (optional)
                </label>
                <Textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Tell us more about the issue..."
                  className="min-h-[60px] text-xs bg-background resize-none"
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setShowForm(false);
                    setFeedback(null);
                    setIssueType("");
                    setComment("");
                  }}
                  className="h-8 px-3 text-xs"
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={handleSubmit}
                  disabled={!issueType}
                  className="h-8 px-3 text-xs gap-1"
                >
                  <Send className="w-3 h-3" />
                  Submit
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ImageFeedback;
