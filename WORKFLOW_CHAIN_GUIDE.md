# Workflow Chain Integration Guide

## Overview
This document describes the complete workflow chain implementation for the frontend, allowing the system to handle sequential multi-task workflows with real-time progress tracking and result aggregation.

## Components Created

### 1. **WorkflowChainHandler Utility** (`src/utils/workflowChainHandler.ts`)
Central utility module that handles workflow chain event processing and SSE connection management.

**Key Functions:**
- `handleChainEvent()` - Parses and handles individual chain events
- `createChainSSEConnection()` - Initializes SSE connection with proper handlers
- `formatChainSummary()` - Formats results for display

**Event Types Handled:**
- `task_starting` - Task begins
- `job_started` - Job ID assigned
- `task_completed` - Individual task finishes
- `chain_completed` - All tasks complete successfully
- `task_failed` - Task fails with error

### 2. **WorkflowProgressDisplay Component** (`src/components/WorkflowProgressDisplay.tsx`)
Real-time progress indicator for active workflow chains.

**Features:**
- Progress bar with percentage
- Current/Total task display
- Status message updates
- Error display
- Loading animation

### 3. **WorkflowChainResults Component** (`src/components/WorkflowChainResults.tsx`)
Displays final results after workflow completion.

**Features:**
- Summary statistics (tasks completed, results generated)
- Image gallery with zoom capability
- Model download links
- Success/error states
- Result organization by type

### 4. **ImagePlaceholder Component** (`src/components/ImagePlaceholder.tsx`)
Reusable placeholder component for missing images.

**Features:**
- Customizable message
- Optional icon
- Grid layout support
- Styling variants

## State Management (Index.tsx)

Added to manage workflow chain state:

```typescript
// Workflow chain state
const [workflowChain, setWorkflowChain] = useState<WorkflowChainData | null>(null);
const [workflowProgress, setWorkflowProgress] = useState({ current: 0, total: 0 });
const [workflowStatus, setWorkflowStatus] = useState<string>("");
const [workflowError, setWorkflowError] = useState<string | null>(null);
const [workflowResults, setWorkflowResults] = useState<ChainResults | null>(null);
const [isWorkflowLoading, setIsWorkflowLoading] = useState(false);
const chainSSERef = useRef<EventSource | null>(null);
```

## API Integration Flow

### Request Format
```typescript
{
  "query": "user prompt",
  "email": "user@example.com",
  "session_id": "session-123"
}
```

### Response Format (Workflow Chain)
```typescript
{
  "workflow_chain": {
    "chain_id": "chain-123",
    "total_tasks": 3,
    "stream_url": "http://backend/stream/chain-123"
  },
  "session_id": "session-123",
  "messages": [...]
}
```

### SSE Event Format
```typescript
{
  "type": "task_starting",
  "task_number": 1,
  "total_tasks": 3,
  "prompt": "generate red car"
}
```

## Workflow Chain Handler (`handleWorkflowChain`)

Called when backend returns `workflow_chain` in response:

1. **Initialization**
   - Sets workflow state
   - Closes any existing SSE connection
   - Displays progress UI

2. **Event Processing**
   - Listens to SSE events
   - Updates progress bar
   - Accumulates results

3. **Completion**
   - Aggregates all results
   - Displays summary
   - Shows success/error toast

## UI Integration

### Main Layout
The workflow components are integrated into the right panel:

```
┌─────────────────────────────────────────┐
│     Workflow Progress Display (if active)  │
├─────────────────────────────────────────┤
│  Tabs: Images | Models | Optimization  │
├─────────────────────────────────────────┤
│                                         │
│    Tab Content (ImageViewer, etc.)      │
│                                         │
└─────────────────────────────────────────┘
```

### Conditional Rendering
Workflow UI shows based on state:
- **No Workflow**: Display normal tabs
- **Workflow Active**: Show `WorkflowProgressDisplay`
- **Workflow Complete**: Show `WorkflowChainResults`

## Error Handling

### Connection Errors
- SSE connection drops
- Shows error message
- Stops loading state
- Toast notification

### Task Failures
- Individual task failure stops chain
- Error message displayed
- Task number and error details shown

### Cleanup
- Automatic SSE connection cleanup on unmount
- Manual cleanup available via close button

## Usage Example

### Backend sends workflow chain:
```json
{
  "workflow_chain": {
    "chain_id": "abc123",
    "total_tasks": 2,
    "stream_url": "http://localhost:8080/stream/abc123"
  }
}
```

### Frontend automatically:
1. Detects `workflow_chain` in response
2. Calls `handleWorkflowChain()`
3. Opens SSE connection to stream URL
4. Displays progress UI
5. Listens for events:
   - Task starting
   - Task completed
   - Chain completed
6. Aggregates results
7. Shows final results with download options

## Testing the Implementation

### Test Case 1: Single Workflow Chain
```javascript
// Send prompt that triggers workflow
"generate an image of a red car using qwen, then make it blue using flux"
```

Expected:
1. Progress bar appears
2. Tasks update as they complete
3. Images display in gallery
4. Summary shows at end

### Test Case 2: Error Handling
```javascript
// Prompt with potential error
"create image with invalid model xyz"
```

Expected:
1. Error message appears
2. SSE connection closes
3. Error toast shown
4. Progress stops

### Test Case 3: Mixed Results
```javascript
// Multiple types of outputs
"generate image then create 3d model"
```

Expected:
1. Results section shows both images and models
2. Download buttons work
3. Zoom works for images
4. Model download links functional

## Browser Console Debugging

The implementation includes detailed logging:

```
🔗 Workflow Chain Detected!
🔗 Opening SSE connection to: http://...
⚡ Task 1/3 starting
🎧 Job started: job-123
✅ Task 1/3 completed!
🎉 Chain completed!
```

## Performance Considerations

1. **SSE Connection**
   - One connection per chain
   - Automatic cleanup on unmount
   - Manual close on completion

2. **State Updates**
   - Batched where possible
   - Progress updates are throttled naturally by backend events
   - Results stored incrementally

3. **UI Rendering**
   - Conditional rendering prevents unnecessary DOM updates
   - Memoization used for callbacks
   - Grid layouts are responsive

## Future Enhancements

1. **Workflow History**
   - Store completed chains
   - Replay workflows
   - Chain templates

2. **Advanced Monitoring**
   - Time estimates per task
   - Resource usage tracking
   - Performance metrics

3. **User Controls**
   - Pause/resume workflows
   - Skip tasks
   - Modify parameters mid-chain

4. **Result Organization**
   - Folder/project grouping
   - Tagging system
   - Search/filter capabilities

## Troubleshooting

### Progress doesn't update
1. Check browser console for SSE errors
2. Verify stream URL is accessible
3. Check backend logs for event emission

### Results not showing
1. Verify event.data contains correct format
2. Check JSON parsing in browser console
3. Verify image/model URLs are valid

### CSS Issues
1. Ensure Tailwind classes are compiled
2. Check component imports
3. Verify color scheme (dark/light mode)

## File Structure

```
src/
├── components/
│   ├── WorkflowProgressDisplay.tsx
│   ├── WorkflowChainResults.tsx
│   └── ImagePlaceholder.tsx
├── utils/
│   └── workflowChainHandler.ts
└── pages/
    └── Index.tsx (modified)
```

## Dependencies

- React hooks (useState, useEffect, useRef, useCallback)
- Tailwind CSS for styling
- Lucide icons for UI elements
- Custom UI components (Progress, Alert, Dialog, Button)
- Toast notifications
