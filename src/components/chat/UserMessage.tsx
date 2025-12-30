import { Message } from "./types";
import { cleanImageInputBlocks } from "./utils";

interface UserMessageProps {
  message: Message;
}

export const UserMessage = ({ message }: UserMessageProps) => {
  const cleanText = cleanImageInputBlocks(message.text);
  const imagePaths = message.imagePaths || [];

  return (
    <div className="flex flex-col items-end gap-2">
      {/* Images in their own bubble */}
      {imagePaths.length > 0 && (
        <div className="max-w-[80%] ml-4">
          <div className="flex flex-wrap gap-2">
            {imagePaths.map((imagePath, index) => (
              <div
                key={index}
                className="w-32 h-32 rounded-lg border border-border/50 overflow-hidden bg-muted/20 flex-shrink-0"
              >
                <img
                  src={imagePath}
                  alt={`Uploaded image ${index + 1}`}
                  className="w-full h-full object-cover"
                />
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Text in separate bubble */}
      {cleanText && (
        <div className="max-w-[80%] p-4 rounded-2xl shadow-soft chat-bubble-enter bg-chat-user-bubble text-chat-user-foreground ml-4">
          <div className="whitespace-pre-wrap">{cleanText}</div>
          {message.timestamp && (
            <div className="text-xs opacity-70 mt-2">
              {message.timestamp.toLocaleTimeString()}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

