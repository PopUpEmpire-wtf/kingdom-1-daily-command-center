import { UnifiedProject, UnifiedTask, DataSource } from '@/types/unified'

export function normalizeProject(
  source: DataSource,
  externalId: string,
  data: any
): Partial<UnifiedProject> {
  // Already normalized by source-specific transforms
  // This function can be used for additional normalization if needed
  return data
}

export function normalizeTask(
  source: DataSource,
  externalId: string,
  data: any
): Partial<UnifiedTask> {
  // Already normalized by source-specific transforms
  // This function can be used for additional normalization if needed
  return data
}

export function denormalizeForSource(
  source: DataSource,
  data: Partial<UnifiedProject> | Partial<UnifiedTask>
): any {
  // Convert unified data back to source-specific format
  // This is handled by source-specific transform functions
  return data
}

export function mergeConflicts(
  local: UnifiedTask | UnifiedProject,
  remote: UnifiedTask | UnifiedProject
): UnifiedTask | UnifiedProject {
  // Last-write-wins strategy based on updatedAt timestamp
  if (remote.updatedAt > local.updatedAt) {
    return remote
  }
  return local
}

export function validateUnifiedData(data: any): boolean {
  // Basic validation for unified data structure
  if (!data.id || !data.source || !data.externalId) {
    return false
  }

  if (!['NOTION', 'TASKADE'].includes(data.source)) {
    return false
  }

  return true
}
