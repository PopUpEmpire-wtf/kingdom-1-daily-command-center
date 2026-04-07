'use client'

import { useEffect, useState } from 'react'
import { UnifiedProject } from '@/types/unified'

export default function ProjectsPage() {
  const [projects, setProjects] = useState<UnifiedProject[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'notion' | 'taskade'>('all')

  useEffect(() => {
    const url = filter === 'all' ? '/api/unified/projects' : `/api/unified/projects?source=${filter.toUpperCase()}`

    fetch(url)
      .then(res => res.json())
      .then(data => {
        setProjects(data.projects || [])
        setLoading(false)
      })
      .catch(err => {
        console.error('Failed to fetch projects:', err)
        setLoading(false)
      })
  }, [filter])

  const projectsByStatus = {
    TODO: projects.filter(p => p.status === 'TODO'),
    IN_PROGRESS: projects.filter(p => p.status === 'IN_PROGRESS'),
    DONE: projects.filter(p => p.status === 'DONE'),
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium">Projects</h3>
          <p className="text-sm text-gray-500">
            Unified view of projects from Notion and Taskade
          </p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setFilter('all')}
            className={`rounded-lg px-4 py-2 text-sm font-medium ${
              filter === 'all'
                ? 'bg-gray-900 text-white'
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setFilter('notion')}
            className={`rounded-lg px-4 py-2 text-sm font-medium ${
              filter === 'notion'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            Notion
          </button>
          <button
            onClick={() => setFilter('taskade')}
            className={`rounded-lg px-4 py-2 text-sm font-medium ${
              filter === 'taskade'
                ? 'bg-purple-600 text-white'
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            Taskade
          </button>
        </div>
      </div>

      {loading ? (
        <div className="rounded-lg border bg-white p-12 text-center">
          <p className="text-gray-500">Loading projects...</p>
        </div>
      ) : projects.length === 0 ? (
        <div className="rounded-lg border bg-white p-12 text-center">
          <p className="text-gray-500">No projects found</p>
          <p className="mt-2 text-sm text-gray-400">
            Create projects in Notion or Taskade to see them here
          </p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-3">
          {/* TO DO Column */}
          <div className="rounded-lg border bg-gray-50 p-4">
            <h4 className="mb-4 font-semibold text-gray-900">
              To Do ({projectsByStatus.TODO.length})
            </h4>
            <div className="space-y-3">
              {projectsByStatus.TODO.map(project => (
                <div
                  key={project.id}
                  className="rounded-lg border bg-white p-4 shadow-sm"
                >
                  <div className="flex items-start justify-between">
                    <h5 className="font-medium text-gray-900">{project.title}</h5>
                    <span
                      className={`rounded-full px-2 py-1 text-xs font-medium ${
                        project.source === 'NOTION'
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-purple-100 text-purple-700'
                      }`}
                    >
                      {project.source}
                    </span>
                  </div>
                  {project.description && (
                    <p className="mt-2 text-sm text-gray-600 line-clamp-2">
                      {project.description}
                    </p>
                  )}
                  <p className="mt-2 text-xs text-gray-400">
                    Updated {new Date(project.updatedAt).toLocaleDateString()}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* IN PROGRESS Column */}
          <div className="rounded-lg border bg-gray-50 p-4">
            <h4 className="mb-4 font-semibold text-gray-900">
              In Progress ({projectsByStatus.IN_PROGRESS.length})
            </h4>
            <div className="space-y-3">
              {projectsByStatus.IN_PROGRESS.map(project => (
                <div
                  key={project.id}
                  className="rounded-lg border bg-white p-4 shadow-sm"
                >
                  <div className="flex items-start justify-between">
                    <h5 className="font-medium text-gray-900">{project.title}</h5>
                    <span
                      className={`rounded-full px-2 py-1 text-xs font-medium ${
                        project.source === 'NOTION'
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-purple-100 text-purple-700'
                      }`}
                    >
                      {project.source}
                    </span>
                  </div>
                  {project.description && (
                    <p className="mt-2 text-sm text-gray-600 line-clamp-2">
                      {project.description}
                    </p>
                  )}
                  <p className="mt-2 text-xs text-gray-400">
                    Updated {new Date(project.updatedAt).toLocaleDateString()}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* DONE Column */}
          <div className="rounded-lg border bg-gray-50 p-4">
            <h4 className="mb-4 font-semibold text-gray-900">
              Done ({projectsByStatus.DONE.length})
            </h4>
            <div className="space-y-3">
              {projectsByStatus.DONE.map(project => (
                <div
                  key={project.id}
                  className="rounded-lg border bg-white p-4 shadow-sm opacity-75"
                >
                  <div className="flex items-start justify-between">
                    <h5 className="font-medium text-gray-900">{project.title}</h5>
                    <span
                      className={`rounded-full px-2 py-1 text-xs font-medium ${
                        project.source === 'NOTION'
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-purple-100 text-purple-700'
                      }`}
                    >
                      {project.source}
                    </span>
                  </div>
                  {project.description && (
                    <p className="mt-2 text-sm text-gray-600 line-clamp-2">
                      {project.description}
                    </p>
                  )}
                  <p className="mt-2 text-xs text-gray-400">
                    Updated {new Date(project.updatedAt).toLocaleDateString()}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
