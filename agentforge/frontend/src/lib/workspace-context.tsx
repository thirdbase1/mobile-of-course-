'use client'

import React, { createContext, useContext, useState } from 'react'

export type PanelType = 'sidebar' | 'chat' | 'editor' | 'terminal' | 'git' | 'context' | 'timeline' | 'inspector'

export interface WorkspaceState {
  activePanels: Set<PanelType>
  focusedPanel: PanelType | null
  sidebarCollapsed: boolean
  panelWidths: Record<PanelType, number>
}

interface WorkspaceContextType {
  state: WorkspaceState
  togglePanel: (panel: PanelType) => void
  setFocusedPanel: (panel: PanelType | null) => void
  toggleSidebar: () => void
  setPanelWidth: (panel: PanelType, width: number) => void
}

const WorkspaceContext = createContext<WorkspaceContextType | undefined>(undefined)

export function WorkspaceProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<WorkspaceState>({
    activePanels: new Set(['sidebar', 'chat', 'editor']),
    focusedPanel: 'editor',
    sidebarCollapsed: false,
    panelWidths: {
      sidebar: 250,
      chat: 350,
      editor: 800,
      terminal: 300,
      git: 300,
      context: 300,
      timeline: 400,
      inspector: 300,
    },
  })

  const togglePanel = (panel: PanelType) => {
    setState(prev => ({
      ...prev,
      activePanels: new Set(
        prev.activePanels.has(panel)
          ? Array.from(prev.activePanels).filter(p => p !== panel)
          : [...prev.activePanels, panel]
      ),
    }))
  }

  const setFocusedPanel = (panel: PanelType | null) => {
    setState(prev => ({
      ...prev,
      focusedPanel: panel,
    }))
  }

  const toggleSidebar = () => {
    setState(prev => ({
      ...prev,
      sidebarCollapsed: !prev.sidebarCollapsed,
    }))
  }

  const setPanelWidth = (panel: PanelType, width: number) => {
    setState(prev => ({
      ...prev,
      panelWidths: {
        ...prev.panelWidths,
        [panel]: width,
      },
    }))
  }

  return (
    <WorkspaceContext.Provider
      value={{
        state,
        togglePanel,
        setFocusedPanel,
        toggleSidebar,
        setPanelWidth,
      }}
    >
      {children}
    </WorkspaceContext.Provider>
  )
}

export function useWorkspace() {
  const context = useContext(WorkspaceContext)
  if (!context) {
    throw new Error('useWorkspace must be used within a WorkspaceProvider')
  }
  return context
}
