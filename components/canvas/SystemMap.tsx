'use client'

import { useCallback, useState } from 'react'
import ReactFlow, {
  Node,
  Edge,
  addEdge,
  Background,
  Controls,
  MiniMap,
  Connection,
  useNodesState,
  useEdgesState,
} from 'reactflow'
import 'reactflow/dist/style.css'

const initialNodes: Node[] = [
  {
    id: 'notion',
    type: 'default',
    position: { x: 100, y: 100 },
    data: { label: '📘 Notion' },
    style: { background: '#3b82f6', color: 'white', border: '1px solid #2563eb', borderRadius: '8px', padding: '10px' },
  },
  {
    id: 'taskade',
    type: 'default',
    position: { x: 100, y: 250 },
    data: { label: '📋 Taskade' },
    style: { background: '#9333ea', color: 'white', border: '1px solid #7e22ce', borderRadius: '8px', padding: '10px' },
  },
  {
    id: 'infrastructure',
    type: 'default',
    position: { x: 100, y: 400 },
    data: { label: '⚙️ Infrastructure' },
    style: { background: '#ea580c', color: 'white', border: '1px solid #c2410c', borderRadius: '8px', padding: '10px' },
  },
  {
    id: 'ecosystem-bt',
    type: 'default',
    position: { x: 100, y: 550 },
    data: { label: '🌐 Ecosystem-BT' },
    style: { background: '#0d9488', color: 'white', border: '1px solid #0f766e', borderRadius: '8px', padding: '10px' },
  },
  {
    id: 'dashboard',
    type: 'default',
    position: { x: 450, y: 300 },
    data: { label: '🎯 Kingdom-1 Dashboard' },
    style: { background: '#10b981', color: 'white', border: '1px solid #059669', borderRadius: '8px', padding: '15px', fontWeight: 'bold' },
  },
  {
    id: 'database',
    type: 'default',
    position: { x: 750, y: 300 },
    data: { label: '💾 Local Cache (SQLite)' },
    style: { background: '#6b7280', color: 'white', border: '1px solid #4b5563', borderRadius: '8px', padding: '10px' },
  },
  {
    id: 'slack',
    type: 'default',
    position: { x: 450, y: 550 },
    data: { label: '💬 Slack' },
    style: { background: '#ec4899', color: 'white', border: '1px solid #db2777', borderRadius: '8px', padding: '10px' },
  },
  {
    id: 'google-calendar',
    type: 'default',
    position: { x: 750, y: 550 },
    data: { label: '📅 Google Calendar' },
    style: { background: '#f59e0b', color: 'white', border: '1px solid #d97706', borderRadius: '8px', padding: '10px' },
  },
]

const initialEdges: Edge[] = [
  {
    id: 'notion-dashboard',
    source: 'notion',
    target: 'dashboard',
    label: 'API Sync (polling)',
    animated: true,
    style: { stroke: '#3b82f6' },
  },
  {
    id: 'taskade-dashboard',
    source: 'taskade',
    target: 'dashboard',
    label: 'Webhooks (real-time)',
    animated: true,
    style: { stroke: '#9333ea' },
  },
  {
    id: 'infrastructure-dashboard',
    source: 'infrastructure',
    target: 'dashboard',
    label: 'GitHub API (polling)',
    animated: true,
    style: { stroke: '#ea580c' },
  },
  {
    id: 'ecosystem-bt-dashboard',
    source: 'ecosystem-bt',
    target: 'dashboard',
    label: 'REST API (polling)',
    animated: true,
    style: { stroke: '#0d9488' },
  },
  {
    id: 'dashboard-database',
    source: 'dashboard',
    target: 'database',
    label: 'Cache',
    style: { stroke: '#6b7280' },
  },
  {
    id: 'slack-dashboard',
    source: 'slack',
    target: 'dashboard',
    label: 'Integration',
    style: { stroke: '#ec4899', strokeDasharray: '5,5' },
  },
  {
    id: 'google-calendar-dashboard',
    source: 'google-calendar',
    target: 'dashboard',
    label: 'Calendar sync',
    style: { stroke: '#f59e0b', strokeDasharray: '5,5' },
  },
]

export function SystemMap() {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges)

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  )

  return (
    <div className="h-[600px] w-full rounded-lg border bg-white">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        fitView
      >
        <Background />
        <Controls />
        <MiniMap />
      </ReactFlow>
    </div>
  )
}
