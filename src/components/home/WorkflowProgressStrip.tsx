import { useState } from "react";
import { X, Loader2, Check, Circle } from "lucide-react";

interface WorkflowStep {
  name: string;
  status: "completed" | "active" | "pending";
}

interface WorkflowProgressStripProps {
  workflowName: string;
  steps: WorkflowStep[];
  onStop?: () => void;
}

const WorkflowProgressStrip = ({ workflowName, steps, onStop }: WorkflowProgressStripProps) => {
  const [showConfirm, setShowConfirm] = useState(false);
  const allDone = steps.every((s) => s.status === "completed");

  return (
    <div className="fixed top-[52px] left-[54px] right-0 z-30 h-12 bg-card border-b border-border flex items-center px-6 gap-4">
      {/* Name */}
      <span className="text-[13px] font-medium text-foreground shrink-0">
        {allDone ? "✓ Workflow complete" : `Running: ${workflowName}`}
      </span>

      {/* Step indicators */}
      <div className="flex items-center gap-1.5 flex-1 min-w-0 overflow-x-auto scrollbar-hide">
        {steps.map((step, i) => (
          <div key={i} className="flex items-center">
            <span
              className={`inline-flex items-center gap-1 px-2.5 py-[3px] rounded-full text-[11px] font-medium border whitespace-nowrap ${
                step.status === "completed"
                  ? "bg-success/10 border-success/40 text-success"
                  : step.status === "active"
                  ? "bg-primary/15 border-primary text-primary"
                  : "bg-secondary border-border text-muted-foreground"
              }`}
            >
              {step.status === "completed" && <Check className="w-2.5 h-2.5" />}
              {step.status === "active" && <Loader2 className="w-2.5 h-2.5 animate-spin" />}
              {step.status === "pending" && <Circle className="w-2.5 h-2.5" />}
              {step.name}
            </span>
            {i < steps.length - 1 && (
              <span className="mx-1 text-xs text-border">›</span>
            )}
          </div>
        ))}
      </div>

      {/* Stop button */}
      {!allDone && (
        <div className="relative shrink-0">
          <button
            onClick={() => setShowConfirm(true)}
            className="text-xs font-medium text-red-400 border border-red-400/40 rounded-lg px-3 py-1 hover:bg-red-400/10 transition-colors"
          >
            Stop
          </button>
          {showConfirm && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowConfirm(false)} />
              <div className="absolute right-0 top-full mt-1 w-56 bg-popover border border-border rounded-xl shadow-xl z-50 p-3">
                <p className="text-xs text-foreground mb-2">Stop this workflow? Progress will be lost.</p>
                <div className="flex gap-2 justify-end">
                  <button onClick={() => setShowConfirm(false)} className="text-xs px-2 py-1 text-muted-foreground">Cancel</button>
                  <button
                    onClick={() => { setShowConfirm(false); onStop?.(); }}
                    className="text-xs px-2 py-1 bg-red-500 text-white rounded-lg"
                  >
                    Stop
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default WorkflowProgressStrip;
