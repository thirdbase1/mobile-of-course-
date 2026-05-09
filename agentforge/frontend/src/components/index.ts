// Core Workspace
export { WorkspaceShell, type WorkspaceShellProps } from './WorkspaceShell'
export { default as Sidebar } from './Sidebar'
export { ResizablePanel, type ResizablePanelProps } from './ResizablePanel'

// Panels
export { ChatPanel } from './panels/ChatPanel'
export { TimelinePanel } from './panels/TimelinePanel'
export { InspectorPanel } from './panels/InspectorPanel'
export { TerminalPanel } from './panels/TerminalPanel'
export { GitPanel } from './panels/GitPanel'
export { EditorPanel } from './panels/EditorPanel'

// Chat & AI
export { ChatInterface, type Message } from './ChatInterface'
export { AIResponse, type AIResponseProps, type AIResponseSection } from './AIResponse'

// File Management
export { FileExplorer, type FileNode, type FileExplorerProps } from './FileExplorer'
export { default as CodeEditor, type CodeEditorProps, type EditorFile } from './CodeEditor'

// Tools & Operations
export { ToolCard, type ToolCardProps, type ToolType } from './tools/ToolCard'
export { ReadFileCard, type ReadFileCardProps } from './tools/ReadFileCard'
export { DiffCard, type DiffCardProps, type DiffLine } from './tools/DiffCard'

// Permissions & Security
export { ApprovalPrompt } from './ApprovalPrompt'
export { PermissionSettings } from './PermissionSettings'
