import { Message, ParsedToolResponse, ToolCall } from "./types";

const IMAGE_INPUT_PATTERNS = [
  /\[IMAGE_INPUT\][\s\S]*?\[\/IMAGE_INPUT\]/gi,
  /\[IMAGE_INPUT_\d+\][\s\S]*?\[\/IMAGE_INPUT_\d+\]/gi,
];

const IMAGE_TAG_PATTERNS = [
  /\[IMAGE\][\s\S]*?\[\/IMAGE\]/gi,
  /\[IMAGE_INPUT\][\s\S]*?\[\/IMAGE_INPUT\]/gi,
  /\[IMAGE_INPUT_\d+\][\s\S]*?\[\/IMAGE_INPUT_\d+\]/gi,
  /\[Image:.*?\]/g,
];

const HIDDEN_PARAMS = ["output_path", "input_path", "random_seed", "filename"];

export const cleanImageInputBlocks = (text: string): string => {
  let cleaned = text;
  IMAGE_INPUT_PATTERNS.forEach(pattern => {
    cleaned = cleaned.replace(pattern, '');
  });
  return cleaned.trim();
};

export const cleanImageTags = (text: string): string => {
  let cleaned = text;
  IMAGE_TAG_PATTERNS.forEach(pattern => {
    cleaned = cleaned.replace(pattern, '');
  });
  return cleaned.trim();
};

export const is3DModelTool = (toolName?: string): boolean => {
  if (!toolName) return false;
  return (
    toolName.includes('image_to_3d') || 
    toolName.includes('text_to_3d') || 
    toolName.includes('post_processing')
  );
};

export const parseToolResponse = (text: string): ParsedToolResponse | null => {
  try {
    // Extract JSON from tool response format like "Tool: tool_name { ... }"
    let jsonText = text;
    const toolResponseMatch = text.match(/Tool:\s*\w+\s*(\{[\s\S]*\})/);
    if (toolResponseMatch) {
      jsonText = toolResponseMatch[1];
    }
    return JSON.parse(jsonText) as ParsedToolResponse;
  } catch {
    return null;
  }
};

export const isImageUrl = (text: string): boolean => {
  const trimmed = text.trim();
  const urlPattern = /^https?:\/\/.+/;
  const imageExtensionPattern = /\.(jpg|jpeg|png|gif|webp|svg)(\?.*)?$/i;
  const imagePathPattern = /^images[\\/][\w\-_.]+\.(png|jpg|jpeg|gif|webp)$/i;
  
  return (
    urlPattern.test(trimmed) ||
    imageExtensionPattern.test(trimmed) ||
    trimmed.includes('/model-images/') ||
    imagePathPattern.test(trimmed)
  );
};

export const filterMessages = (messages: Message[]): Message[] => {
  return messages
    .filter(msg => msg.role !== "system")
    .filter(msg => msg.role === "user" || msg.role === "assistant")
    .map(msg => {
      if (msg.role === "user") {
        return {
          ...msg,
          text: cleanImageInputBlocks(msg.text)
        };
      }
      return msg;
    })
    .filter(msg => msg.text.length > 0 || msg.imagePaths?.length);
};

export const validateToolArgs = (
  toolCalls: ToolCall[],
  editedArgs: Record<string, Record<string, unknown>>
): Record<string, string> => {
  const errors: Record<string, string> = {};

  toolCalls.forEach((tc) => {
    const original = (tc.args || {}) as Record<string, unknown>;
    const edits = (editedArgs[tc.name] || {}) as Record<string, unknown>;
    const merged = { ...original, ...edits };

    Object.entries(merged).forEach(([key, value]) => {
      const isNumeric = key.includes("num_") || key.includes("count") || key.includes("number");
      
      if (isNumeric && (value === "" || value === null || value === undefined || isNaN(Number(value)))) {
        errors[`${tc.name}.${key}`] = "Must be a number";
      }
      
      if (value === "" || value === null || value === undefined) {
        errors[`${tc.name}.${key}`] = "This field is required";
      }
    });
  });

  return errors;
};

export const getVisibleToolArgs = (args: Record<string, unknown>): Array<[string, unknown]> => {
  return Object.entries(args).filter(([key]) => !HIDDEN_PARAMS.includes(key));
};

export const formatArgLabel = (key: string): string => {
  return key.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase());
};

