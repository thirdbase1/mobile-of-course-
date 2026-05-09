# GITCODE Workspace - Quick Start Guide

## What Was Built

A complete, production-ready AI development workspace with 7 integrated systems:

### 🎨 Phase 1: Design System
- Color palette with semantic tokens
- Typography system (Geist Sans + Mono)
- Tailwind v4 configuration
- Component library foundation

### 🏗️ Phase 2: Desktop Shell
- Multi-panel workspace layout
- Sidebar navigation
- Panel state management
- Flexible resizable layout

### 📐 Phase 3: Docking System
- Resizable panel dividers
- Dynamic panel visibility
- Panel width/height state
- Smooth transitions

### 📊 Phase 4: Timeline & Tools
- AI operation visualization
- Real-time status updates
- Expandable tool cards
- Nested operation support
- Performance metrics

### 🔒 Phase 5: Permission System
- Conservative security model
- Per-tool permission rules
- Approval prompt UI
- Scope management (once, session, global)

### 💬 Phase 6: Chat & AI
- Conversation interface
- Streaming responses
- Embedded tool cards
- Structured response formatting
- Feedback system

### 📁 Phase 7: Files & Editor
- VS Code-style file explorer
- CodeMirror integration
- Multi-file tabs
- Syntax highlighting
- Status bar

## Quick Navigation

### Main Entry Point
```bash
/app/workspace/page.tsx
```

### Component Organization
```
/components
├── WorkspaceShell.tsx      (Main layout container)
├── Sidebar.tsx             (Navigation sidebar)
├── ChatInterface.tsx       (AI chat)
├── CodeEditor.tsx          (Code editing)
├── FileExplorer.tsx        (File tree)
├── panels/
│   ├── ChatPanel.tsx
│   ├── TimelinePanel.tsx
│   ├── InspectorPanel.tsx
│   ├── TerminalPanel.tsx
│   ├── GitPanel.tsx
│   └── EditorPanel.tsx
├── tools/
│   ├── ToolCard.tsx
│   ├── ReadFileCard.tsx
│   └── DiffCard.tsx
├── ApprovalPrompt.tsx
├── AIResponse.tsx
├── PermissionSettings.tsx
└── ResizablePanel.tsx
```

### Context/State
```
/lib
├── workspace-context.tsx   (Panel state)
├── permissions-context.tsx (Security & approvals)
└── utils.ts                (Utilities)
```

## Using the Components

### Basic Workspace Setup
```tsx
import { WorkspaceShell } from '@/components'
import { ChatInterface } from '@/components'
import { FileExplorer } from '@/components'
import { WorkspaceProvider } from '@/lib/workspace-context'
import { PermissionsProvider } from '@/lib/permissions-context'

export default function Workspace() {
  return (
    <WorkspaceProvider>
      <PermissionsProvider>
        <WorkspaceShell
          sidebar={<Sidebar />}
          chat={<ChatInterface />}
          editor={<FileExplorer />}
          timeline={<TimelinePanel />}
          inspector={<InspectorPanel />}
          terminal={<TerminalPanel />}
          git={<GitPanel />}
        />
      </PermissionsProvider>
    </WorkspaceProvider>
  )
}
```

### Using Permissions
```tsx
import { usePermissions } from '@/lib/permissions-context'

export function MyComponent() {
  const { checkPermission, requestApproval } = usePermissions()

  const handleExecute = async () => {
    // Check if allowed
    if (!await checkPermission('write_file')) {
      // Request approval
      const approved = await requestApproval({
        id: 'op-123',
        tool: 'write_file',
        description: 'Create new file src/App.tsx',
        details: { path: 'src/App.tsx' }
      })
      if (!approved) return
    }
    
    // Execute operation
    await executeWriteFile(...)
  }
}
```

### Using Workspace Context
```tsx
import { useWorkspace } from '@/lib/workspace-context'

export function MyPanel() {
  const { state, togglePanel } = useWorkspace()

  return (
    <button onClick={() => togglePanel('timeline')}>
      {state.activePanels.has('timeline') ? 'Hide' : 'Show'} Timeline
    </button>
  )
}
```

## Key Features

### 📱 Responsive Design
- Flexbox-based layouts
- Mobile-friendly components
- Keyboard shortcuts support
- Touch-optimized interactions

### ⚡ Performance
- Efficient re-renders with proper memoization
- CodeMirror lazy loading
- Timeline virtualization ready
- Incremental search results

### 🎯 Accessibility
- Full keyboard navigation
- ARIA labels and roles
- Semantic HTML
- Color contrast compliance
- Screen reader support

### 🔐 Security
- Conservative permission defaults
- All dangerous operations require approval
- User control over AI behavior
- Audit trail ready

### 🎨 Customization
- Color themes via design tokens
- Component variants
- Layout flexibility
- Easy to extend

## Common Tasks

### Add a New Panel Type
1. Create `components/panels/MyPanel.tsx`
2. Add to `WorkspaceShell`
3. Add toggle in `Sidebar`
4. Update `WorkspaceContext`

### Add a New Tool Card
1. Create `components/tools/MyToolCard.tsx`
2. Extend or use `ToolCard` base
3. Export from `tools/index.ts`

### Customize Colors
1. Edit `globals.css` color tokens
2. Update component classes
3. Components automatically adapt

### Add Keyboard Shortcut
1. Add `useEffect` with `keydown` listener
2. Check `e.key` or `e.code`
3. Call appropriate action

## API Integration

### WebSocket Events
```typescript
// Subscribe to AI operations
ws.on('tool_start', (event) => {
  // Update timeline
})

ws.on('tool_progress', (event) => {
  // Show progress
})

ws.on('tool_complete', (event) => {
  // Show result
})
```

### REST Endpoints
```typescript
// Execute tool with permission check
POST /api/tools/execute
{
  tool: 'write_file',
  params: { path, content },
  requiresApproval: true
}

// Get file list
GET /api/files?path=/src

// Get file content
GET /api/files/[path]
```

## Performance Tips

1. **Virtualize long lists**: Use react-window for large timelines
2. **Memoize components**: Prevent unnecessary re-renders
3. **Lazy load heavy editors**: CodeMirror only when visible
4. **Debounce search**: Reduce API calls while typing
5. **Cache file trees**: Reuse directory structures

## Testing

```bash
# Run tests
npm test

# Test specific component
npm test ChatInterface

# Test with coverage
npm test --coverage

# E2E tests
npm run test:e2e
```

## Deployment

```bash
# Build for production
npm run build

# Preview build
npm run preview

# Deploy to Vercel
vercel

# Deploy with custom domain
vercel --name gitcode.dev
```

## Troubleshooting

### Panels not showing
Check `WorkspaceContext.activePanels` - add panel to set
```tsx
togglePanel('timeline') // Shows timeline panel
```

### Permission stuck on "ask"
Set permission explicitly:
```tsx
setPermission('write_file', 'allow', 'session')
```

### Editor content not updating
Ensure file object has unique `id` and `path` properties

### CodeMirror not rendering
Verify DOM element exists and has height
```tsx
<div ref={editorRef} className="flex-1 overflow-hidden" />
```

## Resources

- **Implementation Details**: `WORKSPACE_IMPLEMENTATION.md`
- **Component Playground**: Visit `/workspace` route
- **Design System**: Check `globals.css` for tokens
- **Type Definitions**: All components are fully typed

---

**Built with**: Next.js 16 • React 19 • Tailwind CSS v4 • TypeScript • CodeMirror • Lucide Icons
