import { Message } from "./types";
import { cleanImageInputBlocks } from "./utils";

interface UserMessageProps {
  message: Message;
}

export const UserMessage = ({ message }: UserMessageProps) => {
  const cleanText = cleanImageInputBlocks(message.text);

  return (
    <div className="flex justify-end">
      <div className="max-w-[80%] p-4 rounded-2xl shadow-soft chat-bubble-enter bg-chat-user-bubble text-chat-user-foreground ml-4">
        {cleanText && (
          <div className="whitespace-pre-wrap">{cleanText}</div>
        )}
        {message.timestamp && (
          <div className="text-xs opacity-70 mt-2">
            {message.timestamp.toLocaleTimeString()}
          </div>
        )}
      </div>
    </div>
  );
};

