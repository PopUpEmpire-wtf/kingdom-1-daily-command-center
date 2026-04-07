'use client'

import { SystemMap } from '@/components/canvas/SystemMap'

export default function CanvasPage() {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">System Map</h3>
        <p className="text-sm text-gray-500">
          Interactive canvas showing your integrations and data flow
        </p>
      </div>

      <SystemMap />

      <div className="rounded-lg border bg-white p-6">
        <h4 className="mb-4 font-semibold text-gray-900">Legend</h4>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="flex items-center gap-3">
            <div className="h-4 w-16 rounded bg-blue-500"></div>
            <span className="text-sm">Notion (Polling sync)</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="h-4 w-16 rounded bg-purple-500"></div>
            <span className="text-sm">Taskade (Webhook sync)</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="h-4 w-16 rounded bg-green-500"></div>
            <span className="text-sm">Dashboard (Central hub)</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="h-4 w-16 rounded bg-gray-500"></div>
            <span className="text-sm">Local cache (SQLite)</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="h-4 w-16 rounded border-2 border-dashed border-pink-500 bg-pink-50"></div>
            <span className="text-sm">Future integrations</span>
          </div>
        </div>
      </div>

      <div className="rounded-lg border bg-blue-50 p-6">
        <h4 className="mb-2 font-semibold text-blue-900">How it works</h4>
        <ul className="space-y-2 text-sm text-blue-800">
          <li>• <strong>Notion:</strong> Polls every 60 seconds for updates and syncs to local cache</li>
          <li>• <strong>Taskade:</strong> Receives real-time webhooks when tasks are created/updated</li>
          <li>• <strong>Dashboard:</strong> Aggregates data from both sources and displays unified view</li>
          <li>• <strong>Local Cache:</strong> SQLite database stores synced data for fast access</li>
        </ul>
      </div>
    </div>
  )
}
