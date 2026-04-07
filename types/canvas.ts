export type NodeType = 'integration' | 'project' | 'document'
export type EdgeType = 'sync' | 'reference' | 'dependency'

export interface CanvasNodeData {
  label: string
  icon?: string
  status?: string
  metadata?: Record<string, any>
}

export interface CanvasNode {
  id: string
  type: NodeType
  position: { x: number; y: number }
  data: CanvasNodeData
}

export interface CanvasEdge {
  id: string
  type: EdgeType
  source: string
  target: string
  label?: string
}

export interface CanvasState {
  nodes: CanvasNode[]
  edges: CanvasEdge[]
}
