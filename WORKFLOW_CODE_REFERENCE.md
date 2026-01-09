# Workflow Chain - Code Reference & Quick Guide

## 🎯 How It Works - High Level

```
┌─────────────────────────────────────────────────────────────┐
│                  User sends message                          │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ▼
        ┌──────────────────────────────────────┐
        │   Backend processes with /ask        │
        └────────────┬─────────────────────────┘
                     │
            ┌────────┴────────┐
            │                 │
            ▼                 ▼
    Single Job        Workflow Chain
    (existing)        (NEW)
            │                 │
            │                 ▼
            │          {"workflow_chain": {...}}
            │                 │
            │                 ▼
            │          handleWorkflowChain()
            │                 │
            │                 ▼
            │          Open SSE Connection
            │                 │
            │                 ▼
            │          Listen for Events
            │                 │
            │                 ▼
            │          Update UI Progress
            │                 │
            └─────────┬───────┘
                      │
                      ▼
              Display Results
```

## 📝 API Response Format

### Workflow Chain Response
```javascript
{
  "workflow_chain": {
    "chain_id": "abc-123-def-456",
    "total_tasks": 3,
    "stream_url": "http://backend:8080/stream/abc-123-def-456"
  },
  "session_id": "session-xyz",
  "messages": [
    {
      "type": "ai",
      "content": "Starting workflow chain for image generation and 3D modeling..."
    }
  ]
}
```

### Single Job Response (Original)
```javascript
{
  "pending_jobs": ["job-123"],
  "stream_urls": ["http://backend:8080/stream/job-123"],
  "session_id": "session-xyz"
}
```

## 🔌 SSE Event Examples

### Task Starting
```json
{
  "type": "task_starting",
  "task_number": 1,
  "total_tasks": 3,
  "prompt": "Generate an image of a red car",
  "task_type": "image_generation"
}
```

### Job Started
```json
{
  "type": "job_started",
  "job_id": "job-456",
  "task_number": 1,
  "total_tasks": 3
}
```

### Task Completed
```json
{
  "type": "task_completed",
  "task_number": 1,
  "total_tasks": 3,
  "job_id": "job-456",
  "image_path": "https://bucket/path/to/image.png",
  "status": "COMPLETED"
}
```

### Chain Completed
```json
{
  "type": "chain_completed",
  "total_tasks": 3,
  "outputs": {
    "images": [
      "https://bucket/image1.png",
      "https://bucket/image2.png",
      "https://bucket/image3.png"
    ],
    "models": [
      "https://bucket/model1.glb"
    ]
  }
}
```

### Task Failed
```json
{
  "type": "task_failed",
  "task_number": 2,
  "total_tasks": 3,
  "error": "CUDA out of memory",
  "job_id": "job-789"
}
```

## 💻 Key Code Sections

### 1. Detect Workflow Chain in Response
**Location:** `src/pages/Index.tsx` - `handleSendMessage()` function

```typescript
// ============================================
// CHECK: Is this a Workflow Chain?
// ============================================
if (data.workflow_chain) {
  console.log('🔗 Workflow Chain Detected!', data.workflow_chain);
  handleWorkflowChain(data.workflow_chain);
  setIsGenerating(false);
  return;
}

// ============================================
// ELSE: Single Job or Regular Response
// ============================================
// ... existing single job logic
```

### 2. Handle Workflow Chain
**Location:** `src/pages/Index.tsx` - `handleWorkflowChain()` callback

```typescript
const handleWorkflowChain = useCallback((chain: WorkflowChainData) => {
  console.log(`🔗 Starting workflow chain: ${chain.chain_id}`);
  
  setWorkflowChain(chain);
  setWorkflowProgress({ current: 0, total: chain.total_tasks });
  setWorkflowStatus("🔗 Starting workflow...");
  setIsWorkflowLoading(true);

  // Create SSE connection with event handlers
  const eventSource = createChainSSEConnection(
    chain.stream_url,
    chain.total_tasks,
    {
      onTaskStarting: (event) => { /* update UI */ },
      onTaskCompleted: (event) => { /* update UI */ },
      onChainCompleted: (event) => { /* show results */ },
      onTaskFailed: (event) => { /* show error */ },
      // ... more handlers
    }
  );

  chainSSERef.current = eventSource;
}, [toast]);
```

### 3. Process SSE Events
**Location:** `src/utils/workflowChainHandler.ts` - `handleChainEvent()`

```typescript
export function handleChainEvent(
  event: ChainEvent,
  eventSource: EventSource,
  results: ChainResults,
  totalTasks: number,
  handlers: ChainEventHandlers
): void {
  switch (event.type) {
    case "task_starting":
      handlers.onStatusUpdate?.(`⚡ Task ${event.task_number}/${totalTasks}...`);
      break;
      
    case "task_completed":
      results.images.push(event.image_path);
      handlers.onTaskCompleted?.(event);
      break;
      
    case "chain_completed":
      handlers.onChainCompleted?.(event);
      eventSource.close(); // Close after completion
      break;
      
    case "task_failed":
      handlers.onError?.(event.error);
      eventSource.close();
      break;
  }
}
```

### 4. Display Progress UI
**Location:** `src/pages/Index.tsx` - JSX return statement

```tsx
{/* Workflow Chain Progress/Results */}
{workflowChain && (
  <div className="border-b p-4 bg-muted/20">
    {workflowResults ? (
      <WorkflowChainResults
        chainId={workflowChain.chain_id}
        images={workflowResults.images}
        models={workflowResults.models}
        totalTasks={workflowChain.total_tasks}
        onClose={() => { /* reset state */ }}
      />
    ) : (
      <WorkflowProgressDisplay
        chainId={workflowChain.chain_id}
        totalTasks={workflowChain.total_tasks}
        currentTask={workflowProgress.current}
        currentStatus={workflowStatus}
        isLoading={isWorkflowLoading}
        error={workflowError}
      />
    )}
  </div>
)}
```

## 🧩 Component Props

### WorkflowProgressDisplay
```typescript
interface WorkflowProgressDisplayProps {
  chainId: string;                // Chain ID for display
  totalTasks: number;            // Total number of tasks
  currentTask?: number;          // Current task number
  currentStatus?: string;        // Status message
  isLoading?: boolean;           // Loading indicator
  error?: string | null;         // Error message if any
}
```

### WorkflowChainResults
```typescript
interface WorkflowChainResultsProps {
  images: string[];              // Array of image URLs
  models: string[];              // Array of model URLs
  totalTasks: number;            // Total tasks that ran
  chainId: string;               // Chain ID
  onClose?: () => void;          // Close callback
}
```

## 🔄 State Management

### Workflow State Variables
```typescript
// Main workflow state
const [workflowChain, setWorkflowChain] = useState<WorkflowChainData | null>(null);

// Progress tracking
const [workflowProgress, setWorkflowProgress] = useState({ current: 0, total: 0 });

// Status messages
const [workflowStatus, setWorkflowStatus] = useState<string>("");

// Error handling
const [workflowError, setWorkflowError] = useState<string | null>(null);

// Results aggregation
const [workflowResults, setWorkflowResults] = useState<ChainResults | null>(null);

// Loading state
const [isWorkflowLoading, setIsWorkflowLoading] = useState(false);

// SSE connection reference
const chainSSERef = useRef<EventSource | null>(null);
```

### State Transitions
```
┌─────────────────┐
│  No Workflow    │  workflowChain = null
└────────┬────────┘  workflowResults = null
         │
         │ User sends message
         ▼
┌─────────────────┐
│  Chain Active   │  workflowChain = {...}
│  Progress       │  isWorkflowLoading = true
│  Displaying     │  workflowProgress = {current: 0, total: 3}
└────────┬────────┘
         │
         │ Tasks complete
         ▼
┌─────────────────┐
│  Chain Done     │  workflowResults = {...}
│  Results        │  isWorkflowLoading = false
│  Showing        │
└────────┬────────┘
         │
         │ User closes results
         ▼
┌─────────────────┐
│  No Workflow    │  workflowChain = null
└─────────────────┘  workflowResults = null
```

## 🎨 UI States

### 1. Idle (No Workflow)
```
[Normal Tab Interface]
├─ Images
├─ 3D Models
├─ Optimization
└─ Videos
```

### 2. Active Workflow
```
┌──────────────────────────────┐
│  🔗 Workflow Chain: abc-123  │
│  ████████░░░░░░░░░░ 33%     │ 
│  Current: 1/3 | Total: 3    │
│  ⚡ Task 1/3: Generating...  │
└──────────────────────────────┘
[Normal Tab Interface Below]
```

### 3. Workflow Complete
```
┌──────────────────────────────┐
│  🎉 Workflow Chain Complete! │
│  Chain ID: abc-123...       │
│  ✓ 3/3 Tasks Completed      │
│  ✓ 3 Results Generated      │
│                              │
│  Generated Images (3)        │
│  [img] [img] [img]          │
│                              │
│  Generated Models (0)        │
│  (No models generated)       │
│  [Close]                    │
└──────────────────────────────┘
```

## 🐛 Debugging Tips

### Enable Console Logging
```javascript
// Browser console logs include:
🔗 Workflow Chain Detected!
🔗 Opening SSE connection to: http://...
⚡ Task 1/3 starting
🎧 Job started: job-123
✅ Task 1/3 completed!
🎉 Chain completed!
```

### Check State
```javascript
// In browser console
window.localStorage.getItem('mcp_session_id') // Session ID
// Check React DevTools for:
// - workflowChain state
// - workflowProgress state
// - workflowResults state
```

### Network Monitoring
1. Open DevTools → Network tab
2. Filter by "fetch" and "stream"
3. Look for SSE connection
4. Check EventSource messages

## ⚠️ Common Issues & Solutions

### Issue: Workflow not detected
**Check:**
- Backend returns `workflow_chain` field
- Correct response format
- Console shows "Workflow Chain Detected!"

### Issue: Progress doesn't update
**Check:**
- SSE connection in Network tab
- Events being received (EventSource messages)
- Event type matches expected types

### Issue: Results not showing
**Check:**
- `task_completed` events have `image_path` or `model_url`
- `chain_completed` event has `outputs` field
- URLs are valid and accessible

### Issue: CSS not styling properly
**Check:**
- Tailwind CSS compiled
- No conflicting styles
- Dark/light mode toggle working

## 📦 Import Checklist

### In Index.tsx, ensure these imports:
```typescript
import { useRef } from "react";  // For chainSSERef
import { WorkflowProgressDisplay } from "@/components/WorkflowProgressDisplay";
import { WorkflowChainResults } from "@/components/WorkflowChainResults";
import {
  createChainSSEConnection,
  WorkflowChainData,
  ChainResults,
} from "@/utils/workflowChainHandler";
```

### In Components, ensure these imports:
```typescript
// WorkflowProgressDisplay.tsx
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';

// WorkflowChainResults.tsx
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, ... } from '@/components/ui/dialog';
```

## ✅ Quick Validation

Run these checks:
```bash
# Check compilation
npm run build

# No TypeScript errors
npx tsc --noEmit

# Component imports work
grep -r "WorkflowProgressDisplay" src/

# Styling applied
grep -r "bg-gradient-to-br" src/components/Workflow*
```

## 📞 Quick Reference URLs

- Guide: `WORKFLOW_CHAIN_GUIDE.md`
- Checklist: `WORKFLOW_IMPLEMENTATION_CHECKLIST.md`
- Utility: `src/utils/workflowChainHandler.ts`
- Components: `src/components/Workflow*.tsx`
- Main: `src/pages/Index.tsx`
