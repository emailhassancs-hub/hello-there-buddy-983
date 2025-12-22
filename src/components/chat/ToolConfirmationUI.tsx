import { ToolCall } from "./types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { validateToolArgs, getVisibleToolArgs, formatArgLabel } from "./utils";

interface ToolConfirmationUIProps {
  toolCalls: ToolCall[];
  editedArgs: Record<string, Record<string, unknown>>;
  validationErrors: Record<string, string>;
  interruptMessage?: string;
  onArgChange: (toolName: string, argKey: string, value: unknown) => void;
  onConfirm: (toolCalls: ToolCall[]) => void;
  onCancel: () => void;
}

export const ToolConfirmationUI = ({
  toolCalls,
  editedArgs,
  validationErrors,
  interruptMessage,
  onArgChange,
  onConfirm,
  onCancel,
}: ToolConfirmationUIProps) => {
  const handleConfirm = () => {
    const errors = validateToolArgs(toolCalls, editedArgs);
    if (Object.keys(errors).length > 0) {
      // Errors will be shown in the form fields
      return;
    }
    onConfirm(toolCalls);
  };

  return (
    <div className="flex justify-start mt-4">
      <div className="max-w-[70%] mr-4">
        <div className="bg-accent/10 border-2 border-accent rounded-xl p-3 shadow-soft space-y-3">
          {/* Header */}
          <div className="space-y-1">
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-accent" />
              Tool execution needs your approval
            </h3>
            {interruptMessage && (
              <p className="text-xs text-muted-foreground">{interruptMessage}</p>
            )}
          </div>

          {/* Tool calls */}
          <div className="space-y-2">
            {toolCalls.map((toolCall, idx) => {
              const args = editedArgs[toolCall.name] || toolCall.args || {};
              const visibleArgs = getVisibleToolArgs(args);

              return (
                <div key={`${toolCall.id}-${idx}`} className="bg-background border border-border rounded-lg p-2 space-y-2">
                  <div className="space-y-2">
                    {visibleArgs.map(([key, value]) => {
                      const errorKey = `${toolCall.name}.${key}`;
                      const hasError = !!validationErrors[errorKey];
                      const isNumeric = key.includes("num_") || key.includes("count") || key.includes("number");
                      const isLongText = typeof value === "string" && value.length > 100;

                      return (
                        <div key={key} className="space-y-0.5">
                          <Label htmlFor={`${toolCall.id}-${key}`} className="text-xs font-medium">
                            {formatArgLabel(key)}
                          </Label>
                          {isLongText ? (
                            <>
                              <Textarea
                                id={`${toolCall.id}-${key}`}
                                value={String(value)}
                                onChange={(e) => onArgChange(toolCall.name, key, e.target.value)}
                                className={cn("text-xs", hasError ? "border-destructive" : "")}
                                rows={3}
                              />
                              <p className="text-[10px] text-muted-foreground">
                                Preview: {String(value).slice(0, 150)}...
                              </p>
                            </>
                          ) : (
                            <Input
                              id={`${toolCall.id}-${key}`}
                              type={isNumeric ? "number" : "text"}
                              value={String(value)}
                              onChange={(e) =>
                                onArgChange(
                                  toolCall.name,
                                  key,
                                  isNumeric ? Number(e.target.value) : e.target.value
                                )
                              }
                              className={cn("text-xs h-7", hasError ? "border-destructive" : "")}
                            />
                          )}
                          {hasError && (
                            <p className="text-[10px] text-destructive">{validationErrors[errorKey]}</p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Action buttons */}
          <div className="flex gap-2 pt-1">
            <Button onClick={handleConfirm} className="w-full h-8 text-xs" size="sm">
              Confirm
            </Button>
            <Button onClick={onCancel} variant="outline" className="w-full h-8 text-xs" size="sm">
              Cancel
            </Button>
          </div>

          {/* Help text */}
          <p className="text-[10px] text-muted-foreground border-t border-border pt-2">
            <strong>Why am I asked?</strong> The AI needs to call a backend tool. Edit any parameters if needed, then confirm to execute or cancel to stop.
          </p>
        </div>
      </div>
    </div>
  );
};

