'use client'

import { useEffect, useState } from 'react'
import { FolderKanban, ListTodo, CheckCircle2 } from 'lucide-react'

interface Stats {
  totalProjects: number
  totalTasks: number
  bySource: {
    notion: { projects: number; tasks: number }
    taskade: { projects: number; tasks: number }
  }
  byStatus: {
    todo: number
    inProgress: number
    done: number
  }
}

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/unified/stats')
      .then(res => res.json())
      .then(data => {
        setStats(data)
        setLoading(false)
      })
      .catch(err => {
        console.error('Failed to fetch stats:', err)
        setLoading(false)
      })
  }, [])

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-gray-500">Loading dashboard...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Welcome to Kingdom-1 Command Center</h3>
        <p className="text-sm text-gray-500">
          Your unified dashboard for managing projects across Notion and Taskade
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="rounded-lg border bg-white p-6">
          <div className="flex items-center gap-3">
            <FolderKanban className="h-8 w-8 text-blue-500" />
            <div>
              <h4 className="font-semibold text-gray-900">Total Projects</h4>
              <p className="mt-1 text-3xl font-bold">{stats?.totalProjects || 0}</p>
              <p className="text-xs text-gray-500">
                Notion: {stats?.bySource.notion.projects || 0} | Taskade: {stats?.bySource.taskade.projects || 0}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-lg border bg-white p-6">
          <div className="flex items-center gap-3">
            <ListTodo className="h-8 w-8 text-orange-500" />
            <div>
              <h4 className="font-semibold text-gray-900">Active Tasks</h4>
              <p className="mt-1 text-3xl font-bold">{stats?.byStatus.inProgress || 0}</p>
              <p className="text-xs text-gray-500">In progress</p>
            </div>
          </div>
        </div>

        <div className="rounded-lg border bg-white p-6">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="h-8 w-8 text-green-500" />
            <div>
              <h4 className="font-semibold text-gray-900">Total Tasks</h4>
              <p className="mt-1 text-3xl font-bold">{stats?.totalTasks || 0}</p>
              <p className="text-xs text-gray-500">
                Todo: {stats?.byStatus.todo || 0} | Done: {stats?.byStatus.done || 0}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-lg border bg-white p-6">
        <h4 className="mb-4 font-semibold text-gray-900">Quick Actions</h4>
        <div className="grid gap-4 md:grid-cols-3">
          <a
            href="/projects"
            className="rounded-lg border border-gray-200 p-4 transition-colors hover:bg-gray-50"
          >
            <h5 className="font-medium">View Projects</h5>
            <p className="text-sm text-gray-500">Kanban board and list views</p>
          </a>
          <a
            href="/calendar"
            className="rounded-lg border border-gray-200 p-4 transition-colors hover:bg-gray-50"
          >
            <h5 className="font-medium">Calendar</h5>
            <p className="text-sm text-gray-500">See all events and deadlines</p>
          </a>
          <a
            href="/canvas"
            className="rounded-lg border border-gray-200 p-4 transition-colors hover:bg-gray-50"
          >
            <h5 className="font-medium">System Map</h5>
            <p className="text-sm text-gray-500">Visualize integrations</p>
          </a>
        </div>
      </div>

      <div className="rounded-lg border bg-white p-6">
        <h4 className="mb-4 font-semibold text-gray-900">Data Sources</h4>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
            <h5 className="font-medium text-blue-900">Notion</h5>
            <p className="mt-2 text-sm text-blue-700">
              Projects: {stats?.bySource.notion.projects || 0} | Tasks: {stats?.bySource.notion.tasks || 0}
            </p>
            <p className="mt-1 text-xs text-blue-600">Syncs every 60 seconds</p>
          </div>
          <div className="rounded-lg border border-purple-200 bg-purple-50 p-4">
            <h5 className="font-medium text-purple-900">Taskade</h5>
            <p className="mt-2 text-sm text-purple-700">
              Projects: {stats?.bySource.taskade.projects || 0} | Tasks: {stats?.bySource.taskade.tasks || 0}
            </p>
            <p className="mt-1 text-xs text-purple-600">Real-time webhooks</p>
          </div>
        </div>
      </div>
    </div>
  )
}
