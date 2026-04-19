import { useState, useEffect } from 'react'
import { useAuth } from './useAuth'
import { getUserProjects, createProject as createProjectService } from '@/services/firestore'
import { ProjectDoc } from '@/types/firebase'

interface UseProjectsReturn {
  projects: ProjectDoc[]
  loading: boolean
  error: string | null
  createProject: (name: string, description?: string) => Promise<ProjectDoc>
  refetch: () => Promise<void>
}

export function useProjects(): UseProjectsReturn {
  const { user } = useAuth()
  const [projects, setProjects] = useState<ProjectDoc[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchProjects = async () => {
    if (!user) {
      setProjects([])
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)
      const data = await getUserProjects(user.id)
      setProjects(data)
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to fetch projects'
      setError(errorMsg)
      setProjects([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchProjects()
  }, [user])

  const createProject = async (name: string, description?: string): Promise<ProjectDoc> => {
    if (!user) {
      throw new Error('Must be logged in to create a project')
    }

    try {
      setError(null)
      const newProject = await createProjectService(user.id, name, description)
      setProjects((prev) => [newProject, ...prev])
      return newProject
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to create project'
      setError(errorMsg)
      throw err
    }
  }

  return {
    projects,
    loading,
    error,
    createProject,
    refetch: fetchProjects,
  }
}
