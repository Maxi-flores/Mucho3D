import { useState, useEffect } from 'react'
import { getProjectGenerations } from '@/services/firestore'
import { GenerationDoc } from '@/types/firebase'

interface UseGenerationsReturn {
  generations: GenerationDoc[]
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
}

export function useGenerations(projectId: string | undefined): UseGenerationsReturn {
  const [generations, setGenerations] = useState<GenerationDoc[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchGenerations = async () => {
    if (!projectId) {
      setGenerations([])
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)
      const data = await getProjectGenerations(projectId)
      setGenerations(data)
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to fetch generations'
      setError(errorMsg)
      setGenerations([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchGenerations()
  }, [projectId])

  return {
    generations,
    loading,
    error,
    refetch: fetchGenerations,
  }
}
