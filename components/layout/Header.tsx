'use client'

import { RefreshCw } from 'lucide-react'

export function Header() {
  return (
    <header className="border-b bg-white px-6 py-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Dashboard</h2>
          <p className="text-sm text-gray-500">Unified view of Notion and Taskade</p>
        </div>
        <button
          className="flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          onClick={() => window.location.reload()}
        >
          <RefreshCw className="h-4 w-4" />
          Refresh
        </button>
      </div>
    </header>
  )
}
