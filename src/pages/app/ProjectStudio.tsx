import { useEffect, useRef, useState, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Timestamp } from 'firebase/firestore'
import { useAuth } from '@/hooks/useAuth'
import { useStudioStore } from '@/store/studioStore'
import { StudioNode, NodeType } from '@/types/studio'
import { ProjectDoc } from '@/types/firebase'
import { getProject, saveProjectStudio } from '@/services/firestore'
import { compileNodesToPrompt, isProjectReadyForExecution } from '@/services/nodeCompiler'
import { generateScenePlan } from '@/services/ai/ollamaService'
import { v4 as uuidv4 } from 'uuid'

import { StudioHeader } from '@/components/studio/StudioHeader'
import { StudioLeftPanel } from '@/components/studio/StudioLeftPanel'
import { StudioCanvas } from '@/components/studio/StudioCanvas'
import { StudioRightPanel } from '@/components/studio/StudioRightPanel'
import { StudioBottomBar } from '@/components/studio/StudioBottomBar'

export function ProjectStudio() {
  const { projectId } = useParams<{ projectId: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()

  const [project, setProject] = useState<ProjectDoc | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | undefined>()
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [currentPipelineStep, setCurrentPipelineStep] = useState<'concept' | 'structure' | 'validated' | 'executing' | 'complete'>('concept')
  const [isExecuting, setIsExecuting] = useState(false)
  const [executionError, setExecutionError] = useState<string>()

  const nodes = useStudioStore((state) => state.nodes)
  const viewport = useStudioStore((state) => state.viewport)
  const isDirty = useStudioStore((state) => state.isDirty)

  const setNodes = useStudioStore((state) => state.setNodes)
  const setViewport = useStudioStore((state) => state.setViewport)
  const addNode = useStudioStore((state) => state.addNode)
  const markClean = useStudioStore((state) => state.markClean)
  const selectNode = useStudioStore((state) => state.selectNode)

  // Load project from Firestore
  useEffect(() => {
    const loadProject = async () => {
      if (!projectId || !user) return

      try {
        const data = await getProject(projectId)

        if (!data || data.userId !== user.id) {
          navigate('/app/projects')
          return
        }

        setProject(data)
        setNodes(data.studioNodes || [])
        setViewport(data.studioViewport || { x: 0, y: 0, zoom: 1 })

        // If no nodes, seed with concept node
        if (!data.studioNodes || data.studioNodes.length === 0) {
          const initialNode: StudioNode = {
            id: uuidv4(),
            type: 'CONCEPT',
            label: 'Main concept',
            description: '',
            tags: [],
            status: 'draft',
            position: { x: 100, y: 100 },
            linkedTo: [],
            createdAt: Timestamp.now(),
            updatedAt: Timestamp.now(),
          }
          setNodes([initialNode])
        }

        setLastSaved(new Date())
        markClean()
      } catch (error) {
        console.error('Error loading project:', error)
        navigate('/app/projects')
      } finally {
        setIsLoading(false)
      }
    }

    loadProject()
  }, [projectId, user, navigate, setNodes, setViewport, markClean])

  // Debounced save to Firestore
  const saveProject = useCallback(async () => {
    if (!projectId || !project || !isDirty) return

    setIsSaving(true)

    try {
      await saveProjectStudio(projectId, nodes, viewport)

      setLastSaved(new Date())
      markClean()
    } catch (error) {
      console.error('Error saving project:', error)
    } finally {
      setIsSaving(false)
    }
  }, [projectId, project, isDirty, nodes, viewport, markClean])

  // Debounced save trigger
  useEffect(() => {
    if (!isDirty) return

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current)
    }

    saveTimeoutRef.current = setTimeout(() => {
      saveProject()
    }, 500)

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }
    }
  }, [isDirty, saveProject])

  // Handle node addition
  const handleAddNode = (type: NodeType) => {
    const newNode: StudioNode = {
      id: uuidv4(),
      type,
      label: `New ${type}`,
      description: '',
      tags: [],
      status: 'draft',
      position: { x: Math.random() * 400 + 200, y: Math.random() * 300 + 150 },
      linkedTo: [],
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    }
    addNode(newNode)
  }

  // Handle canvas right-click context menu
  const handleCanvasContextMenu = (_e: React.MouseEvent, _x: number, _y: number) => {
    // This would open a context menu in a real implementation
    // TODO: Implement context menu for adding nodes at cursor position
  }

  // Handle execute pipeline
  const handleExecutePipeline = async () => {
    const readiness = isProjectReadyForExecution(nodes)
    if (!readiness.ready) {
      setExecutionError(readiness.reason)
      return
    }

    setIsExecuting(true)
    setExecutionError(undefined)
    setCurrentPipelineStep('structure')

    try {
      // Compile nodes to prompt
      const prompt = compileNodesToPrompt(nodes, project?.name || 'Untitled')

      // Send to generation pipeline
      setCurrentPipelineStep('validated')

      const result = await generateScenePlan(prompt)

      if (!result.success) {
        setExecutionError(result.error || 'Failed to generate scene plan')
        setCurrentPipelineStep('concept')
        return
      }

      // TODO: Save generation to Firestore
      setCurrentPipelineStep('executing')

      // TODO: Wait for execution completion
      setTimeout(() => {
        setCurrentPipelineStep('complete')
        setIsExecuting(false)
      }, 2000)
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error'
      setExecutionError(errorMsg)
      setCurrentPipelineStep('concept')
      setIsExecuting(false)
    }
  }

  const handleSaveNow = async () => {
    await saveProject()
  }

  const handleViewScene = () => {
    navigate(`/app/studio?project=${projectId}`)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-white">Loading studio...</div>
      </div>
    )
  }

  if (!project) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-white">Project not found</div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-black">
      {/* Header */}
      <StudioHeader
        projectId={projectId!}
        projectName={project.name}
        projectStatus={currentPipelineStep === 'concept' ? 'Draft' : currentPipelineStep}
        projectTags={project.projectTags || []}
        isDirty={isDirty}
        isSaving={isSaving}
        lastSaved={lastSaved}
        nodeCount={nodes.length}
        onSaveNow={handleSaveNow}
        onExecutePipeline={handleExecutePipeline}
        onViewScene={handleViewScene}
      />

      {/* Main workspace */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left panel */}
        <StudioLeftPanel onAddNode={handleAddNode} onSelectNode={(nodeId) => selectNode(nodeId)} />

        {/* Center canvas */}
        <StudioCanvas onContextMenu={handleCanvasContextMenu} />

        {/* Right panel */}
        <StudioRightPanel
          projectName={project.name}
          projectDescription={project.description || ''}
          projectTags={project.projectTags || []}
          targetFormat={project.targetFormat || 'glb'}
          complexityEstimate={project.complexityEstimate || 'low'}
          referenceLinks={project.referenceLinks || []}
        />
      </div>

      {/* Bottom bar */}
      <StudioBottomBar
        currentStep={currentPipelineStep}
        isExecuting={isExecuting}
        executionError={executionError}
        onExecute={handleExecutePipeline}
      />
    </div>
  )
}
