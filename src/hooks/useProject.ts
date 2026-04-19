import { useState, useEffect } from 'react'
import { getProject, getProjectScene, updateProject as updateProjectService } from '@/services/firestore'
import { ProjectDoc, SceneDoc } from '@/types/firebase'

interface UseProjectReturn {
  project: ProjectDoc | null
  scene: SceneDoc | null
  loading: boolean
  error: string | null
  updateProject: (data: Partial<ProjectDoc>) => Promise<void>
  refetch: () => Promise<void>
}

export function useProject(projectId: string | undefined): UseProjectReturn {
  const [project, setProject] = useState<ProjectDoc | null>(null)
  const [scene, setScene] = useState<SceneDoc | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchData = async () => {
    if (!projectId) {
      setProject(null)
      setScene(null)
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)

      const [projectData, sceneData] = await Promise.all([
        getProject(projectId),
        getProjectScene(projectId),
      ])

      setProject(projectData)
      setScene(sceneData)
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to fetch project'
      setError(errorMsg)
      setProject(null)
      setScene(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [projectId])

  const updateProject = async (data: Partial<ProjectDoc>) => {
    if (!projectId) {
      throw new Error('No project ID provided')
    }

    try {
      setError(null)
      await updateProjectService(projectId, data)
      setProject((prev) => prev ? { ...prev, ...data } : null)
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to update project'
      setError(errorMsg)
      throw err
    }
  }

  return {
    project,
    scene,
    loading,
    error,
    updateProject,
    refetch: fetchData,
  }
}
