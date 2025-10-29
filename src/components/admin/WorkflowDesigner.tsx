import React, { useState, useCallback, useRef, useEffect } from 'react'
import {
  Play,
  Pause,
  Save,
  Trash2,
  Plus,
  Settings,
  Mail,
  MessageSquare,
  Smartphone,
  Clock,
  GitBranch,
  Database,
  TestTube,
  Webhook,
  Tag,
  Target,
  Eye,
  EyeOff,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Download,
  Upload
} from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { useToast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'


import type {
  MarketingWorkflow,
  WorkflowNode,
  WorkflowEdge,
  NodeType,
  TriggerConfig,
  SegmentCriteria,
  WorkflowDesignerState
} from '@/types/marketing-automation'

interface WorkflowDesignerProps {
  workflow?: MarketingWorkflow
  onSave: (workflow: MarketingWorkflow) => Promise<void>
  onTest: (workflow: MarketingWorkflow) => Promise<void>
  className?: string
}

const NODE_TYPES: { type: NodeType; label: string; icon: React.ReactNode; color: string }[] = [
  { type: 'send_email', label: 'Send Email', icon: <Mail className="h-4 w-4" />, color: 'bg-blue-500' },
  { type: 'send_sms', label: 'Send SMS', icon: <Smartphone className="h-4 w-4" />, color: 'bg-green-500' },
  { type: 'send_whatsapp', label: 'Send WhatsApp', icon: <MessageSquare className="h-4 w-4" />, color: 'bg-green-600' },
  { type: 'wait', label: 'Wait/Delay', icon: <Clock className="h-4 w-4" />, color: 'bg-yellow-500' },
  { type: 'branch', label: 'Branch/Condition', icon: <GitBranch className="h-4 w-4" />, color: 'bg-purple-500' },
  { type: 'update_data', label: 'Update Data', icon: <Database className="h-4 w-4" />, color: 'bg-orange-500' },
  { type: 'ab_test', label: 'A/B Test', icon: <TestTube className="h-4 w-4" />, color: 'bg-pink-500' },
  { type: 'webhook', label: 'Webhook', icon: <Webhook className="h-4 w-4" />, color: 'bg-gray-500' },
  { type: 'tag_customer', label: 'Tag Customer', icon: <Tag className="h-4 w-4" />, color: 'bg-teal-500' }
]

export const WorkflowDesigner: React.FC<WorkflowDesignerProps> = ({
  workflow,
  onSave,
  onTest,
  className
}) => {
  const { t } = useTranslation()
  const { toast } = useToast()
  const canvasRef = useRef<HTMLDivElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [draggedNode, setDraggedNode] = useState<string | null>(null)
  const [selectedNode, setSelectedNode] = useState<string | null>(null)
  const [selectedEdge, setSelectedEdge] = useState<string | null>(null)
  const [showNodeDialog, setShowNodeDialog] = useState(false)
  const [editingNode, setEditingNode] = useState<WorkflowNode | null>(null)
  const [showSettingsDialog, setShowSettingsDialog] = useState(false)
  const [isConnecting, setIsConnecting] = useState(false)
  const [connectionStart, setConnectionStart] = useState<string | null>(null)
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 })
  const [scale, setScale] = useState(1)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [isPanning, setIsPanning] = useState(false)
  const [panStart, setPanStart] = useState({ x: 0, y: 0 })

  const [workflowState, setWorkflowState] = useState<Partial<MarketingWorkflow>>({
    name: workflow?.name || '',
    description: workflow?.description || '',
    type: workflow?.type || 'custom',
    status: workflow?.status || 'draft',
    trigger_config: workflow?.trigger_config || { trigger_type: 'manual' },
    workflow_nodes: workflow?.workflow_nodes || [],
    workflow_edges: workflow?.workflow_edges || [],
    segment_criteria: workflow?.segment_criteria || {}
  })

  const [nodeConfig, setNodeConfig] = useState<Partial<WorkflowNode>>({
    type: 'send_email',
    config: {}
  })

  // Calculate connection line position
  const getConnectionLine = (edge: WorkflowEdge) => {
    const sourceNode = workflowState.workflow_nodes?.find(n => n.id === edge.source)
    const targetNode = workflowState.workflow_nodes?.find(n => n.id === edge.target)

    if (!sourceNode || !targetNode) return null

    const sourceX = (sourceNode.position.x + 100) * scale + pan.x
    const sourceY = (sourceNode.position.y + 40) * scale + pan.y
    const targetX = targetNode.position.x * scale + pan.x
    const targetY = targetNode.position.y * scale + pan.y

    const midX = (sourceX + targetX) / 2
    const midY = (sourceY + targetY) / 2

    return `M ${sourceX} ${sourceY} C ${midX} ${sourceY}, ${midX} ${targetY}, ${targetX} ${targetY}`
  }

  // Handle node drag
  const handleNodeMouseDown = (e: React.MouseEvent, nodeId: string) => {
    e.stopPropagation()
    if (e.shiftKey) {
      // Start connection
      setIsConnecting(true)
      setConnectionStart(nodeId)
    } else {
      setIsDragging(true)
      setDraggedNode(nodeId)
      setSelectedNode(nodeId)
      setSelectedEdge(null)
    }
  }

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    const rect = canvasRef.current?.getBoundingClientRect()
    if (!rect) return

    const x = (e.clientX - rect.left - pan.x) / scale
    const y = (e.clientY - rect.top - pan.y) / scale
    setMousePos({ x, y })

    if (isDragging && draggedNode) {
      setWorkflowState(prev => ({
        ...prev,
        workflow_nodes: prev.workflow_nodes?.map(node =>
          node.id === draggedNode
            ? { ...node, position: { x: Math.max(0, x - 50), y: Math.max(0, y - 20) } }
            : node
        )
      }))
    }

    if (isPanning) {
      setPan({
        x: e.clientX - panStart.x,
        y: e.clientY - panStart.y
      })
    }
  }, [isDragging, draggedNode, isPanning, panStart, scale, pan])

  const handleMouseUp = useCallback((e: React.MouseEvent) => {
    const rect = canvasRef.current?.getBoundingClientRect()
    if (!rect) return

    if (isConnecting && connectionStart) {
      // Find node under cursor
      const x = (e.clientX - rect.left - pan.x) / scale
      const y = (e.clientY - rect.top - pan.y) / scale

      const targetNode = workflowState.workflow_nodes?.find(node => {
        const nodeX = node.position.x
        const nodeY = node.position.y
        return x >= nodeX && x <= nodeX + 100 && y >= nodeY && y <= nodeY + 40
      })

      if (targetNode && targetNode.id !== connectionStart) {
        // Create connection
        const newEdge: WorkflowEdge = {
          id: `edge-${Date.now()}`,
          source: connectionStart,
          target: targetNode.id
        }

        setWorkflowState(prev => ({
          ...prev,
          workflow_edges: [...(prev.workflow_edges || []), newEdge]
        }))
      }
    }

    setIsDragging(false)
    setDraggedNode(null)
    setIsConnecting(false)
    setConnectionStart(null)
    setIsPanning(false)
  }, [isConnecting, connectionStart, workflowState.workflow_nodes, scale, pan])

  const handleCanvasMouseDown = (e: React.MouseEvent) => {
    if (e.target === canvasRef.current) {
      setSelectedNode(null)
      setSelectedEdge(null)
      if (e.button === 1 || (e.button === 0 && e.altKey)) {
        setIsPanning(true)
        setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y })
      }
    }
  }

  const handleCanvasClick = (e: React.MouseEvent) => {
    const rect = canvasRef.current?.getBoundingClientRect()
    if (!rect) return

    // Check if clicking on an edge
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    workflowState.workflow_edges?.forEach(edge => {
      const line = getConnectionLine(edge)
      if (line) {
        // Simple distance check (would need proper path distance calculation in production)
        const sourceNode = workflowState.workflow_nodes?.find(n => n.id === edge.source)
        const targetNode = workflowState.workflow_nodes?.find(n => n.id === edge.target)

        if (sourceNode && targetNode) {
          const sourceX = (sourceNode.position.x + 100) * scale + pan.x
          const sourceY = (sourceNode.position.y + 40) * scale + pan.y
          const targetX = targetNode.position.x * scale + pan.x
          const targetY = targetNode.position.y * scale + pan.y

          const dist = pointToLineDistance(
            { x, y },
            { x: sourceX, y: sourceY },
            { x: targetX, y: targetY }
          )

          if (dist < 10) {
            setSelectedEdge(edge.id)
            setSelectedNode(null)
            e.stopPropagation()
          }
        }
      }
    })
  }

  const pointToLineDistance = (point: { x: number; y: number }, lineStart: { x: number; y: number }, lineEnd: { x: number; y: number }) => {
    const A = point.x - lineStart.x
    const B = point.y - lineStart.y
    const C = lineEnd.x - lineStart.x
    const D = lineEnd.y - lineStart.y

    const dot = A * C + B * D
    const lenSq = C * C + D * D
    let param = -1

    if (lenSq !== 0) param = dot / lenSq

    let xx, yy

    if (param < 0) {
      xx = lineStart.x
      yy = lineStart.y
    } else if (param > 1) {
      xx = lineEnd.x
      yy = lineEnd.y
    } else {
      xx = lineStart.x + param * C
      yy = lineStart.y + param * D
    }

    const dx = point.x - xx
    const dy = point.y - yy

    return Math.sqrt(dx * dx + dy * dy)
  }

  const addNode = (type: NodeType) => {
    const newNode: WorkflowNode = {
      id: `node-${Date.now()}`,
      type,
      config: getDefaultConfigForType(type),
      position: {
        x: 100 + (workflowState.workflow_nodes?.length || 0) * 150,
        y: 100
      }
    }

    setWorkflowState(prev => ({
      ...prev,
      workflow_nodes: [...(prev.workflow_nodes || []), newNode]
    }))
  }

  const getDefaultConfigForType = (type: NodeType): Record<string, any> => {
    switch (type) {
      case 'send_email':
        return { template_id: '', personalization: {} }
      case 'send_sms':
        return { message: '', personalization: {} }
      case 'send_whatsapp':
        return { template_name: '', parameters: {} }
      case 'wait':
        return { duration: { value: 1, unit: 'hour' } }
      case 'branch':
        return { conditions: [], default_path: '' }
      case 'update_data':
        return { updates: {} }
      case 'ab_test':
        return { variants: [], split_type: 'percentage' }
      case 'webhook':
        return { url: '', method: 'POST', headers: {} }
      case 'tag_customer':
        return { tags: [] }
      default:
        return {}
    }
  }

  const deleteNode = (nodeId: string) => {
    setWorkflowState(prev => ({
      ...prev,
      workflow_nodes: prev.workflow_nodes?.filter(n => n.id !== nodeId) || [],
      workflow_edges: prev.workflow_edges?.filter(e => e.source !== nodeId && e.target !== nodeId) || []
    }))
    setSelectedNode(null)
  }

  const deleteEdge = (edgeId: string) => {
    setWorkflowState(prev => ({
      ...prev,
      workflow_edges: prev.workflow_edges?.filter(e => e.id !== edgeId) || []
    }))
    setSelectedEdge(null)
  }

  const editNode = (nodeId: string) => {
    const node = workflowState.workflow_nodes?.find(n => n.id === nodeId)
    if (node) {
      setEditingNode(node)
      setNodeConfig(node)
      setShowNodeDialog(true)
    }
  }

  const saveNode = () => {
    if (!editingNode) return

    setWorkflowState(prev => ({
      ...prev,
      workflow_nodes: prev.workflow_nodes?.map(node =>
        node.id === editingNode.id ? { ...editingNode, ...nodeConfig } : node
      ) || []
    }))

    setShowNodeDialog(false)
    setEditingNode(null)
    setNodeConfig({ type: 'send_email', config: {} })
  }

  const handleSave = async () => {
    try {
      if (!workflowState.name) {
        toast({
          title: t('error', 'Error'),
          description: t('workflow_name_required', 'Workflow name is required'),
          variant: 'destructive'
        })
        return
      }

      const completeWorkflow: MarketingWorkflow = {
        id: workflow?.id || `workflow-${Date.now()}`,
        name: workflowState.name!,
        description: workflowState.description,
        type: workflowState.type || 'custom',
        status: workflowState.status || 'draft',
        trigger_config: workflowState.trigger_config!,
        workflow_nodes: workflowState.workflow_nodes || [],
        workflow_edges: workflowState.workflow_edges || [],
        segment_criteria: workflowState.segment_criteria || {},
        created_by: workflow?.created_by,
        created_at: workflow?.created_at || new Date().toISOString(),
        updated_at: new Date().toISOString(),
        metadata: workflow?.metadata || {}
      }

      await onSave(completeWorkflow)

      toast({
        title: t('success', 'Success'),
        description: t('workflow_saved', 'Workflow saved successfully')
      })
    } catch (error) {
      console.error('Failed to save workflow:', error)
      toast({
        title: t('error', 'Error'),
        description: t('failed_to_save_workflow', 'Failed to save workflow'),
        variant: 'destructive'
      })
    }
  }

  const handleTest = async () => {
    try {
      const completeWorkflow: MarketingWorkflow = {
        id: workflow?.id || `workflow-test-${Date.now()}`,
        name: workflowState.name || 'Test Workflow',
        description: workflowState.description,
        type: workflowState.type || 'custom',
        status: 'draft',
        trigger_config: workflowState.trigger_config!,
        workflow_nodes: workflowState.workflow_nodes || [],
        workflow_edges: workflowState.workflow_edges || [],
        segment_criteria: workflowState.segment_criteria || {},
        created_by: workflow?.created_by,
        created_at: workflow?.created_at || new Date().toISOString(),
        updated_at: new Date().toISOString(),
        metadata: workflow?.metadata || {}
      }

      await onTest(completeWorkflow)

      toast({
        title: t('test_started', 'Test Started'),
        description: t('workflow_test_started', 'Workflow test has been started')
      })
    } catch (error) {
      console.error('Failed to test workflow:', error)
      toast({
        title: t('error', 'Error'),
        description: t('failed_to_test_workflow', 'Failed to test workflow'),
        variant: 'destructive'
      })
    }
  }

  const handleZoom = (delta: number) => {
    setScale(prev => Math.max(0.1, Math.min(2, prev + delta)))
  }

  const resetView = () => {
    setScale(1)
    setPan({ x: 0, y: 0 })
  }

  const exportWorkflow = () => {
    const dataStr = JSON.stringify(workflowState, null, 2)
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr)

    const exportFileDefaultName = `${workflowState.name || 'workflow'}.json`

    const linkElement = document.createElement('a')
    linkElement.setAttribute('href', dataUri)
    linkElement.setAttribute('download', exportFileDefaultName)
    linkElement.click()
  }

  const importWorkflow = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      try {
        const imported = JSON.parse(event.target?.result as string)
        setWorkflowState(imported)
        toast({
          title: t('import_successful', 'Import Successful'),
          description: t('workflow_imported', 'Workflow imported successfully')
        })
      } catch (error) {
        toast({
          title: t('import_failed', 'Import Failed'),
          description: t('invalid_workflow_file', 'Invalid workflow file'),
          variant: 'destructive'
        })
      }
    }
    reader.readAsText(file)
  }

  const getNodeIcon = (type: NodeType) => {
    const nodeType = NODE_TYPES.find(n => n.type === type)
    return nodeType?.icon || <Settings className="h-4 w-4" />
  }

  const getNodeColor = (type: NodeType) => {
    const nodeType = NODE_TYPES.find(n => n.type === type)
    return nodeType?.color || 'bg-gray-500'
  }

  return (
    <div className={cn("flex flex-col h-full", className)}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-4">
          <Input
            placeholder={t('workflow_name', 'Workflow Name')}
            value={workflowState.name || ''}
            onChange={(e) => setWorkflowState(prev => ({ ...prev, name: e.target.value }))}
            className="w-64"
          />
          <Badge variant={workflowState.status === 'active' ? 'default' : 'secondary'}>
            {t(workflowState.status || 'draft', workflowState.status || 'draft')}
          </Badge>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setShowSettingsDialog(true)}>
            <Settings className="h-4 w-4 mr-1" />
            {t('settings', 'Settings')}
          </Button>
          <Button variant="outline" size="sm" onClick={exportWorkflow}>
            <Download className="h-4 w-4 mr-1" />
            {t('export', 'Export')}
          </Button>
          <Button variant="outline" size="sm" asChild>
            <label>
              <Upload className="h-4 w-4 mr-1" />
              {t('import', 'Import')}
              <input type="file" accept=".json" onChange={importWorkflow} className="hidden" />
            </label>
          </Button>
          <Button variant="outline" size="sm" onClick={handleTest}>
            <Play className="h-4 w-4 mr-1" />
            {t('test', 'Test')}
          </Button>
          <Button size="sm" onClick={handleSave}>
            <Save className="h-4 w-4 mr-1" />
            {t('save', 'Save')}
          </Button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <div className="w-64 border-r bg-muted/30">
          <div className="p-4">
            <h3 className="font-semibold mb-3">{t('components', 'Components')}</h3>
            <div className="space-y-2">
              {NODE_TYPES.map(nodeType => (
                <Button
                  key={nodeType.type}
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => addNode(nodeType.type)}
                >
                  <div className={cn("w-3 h-3 rounded-full mr-2", nodeType.color)} />
                  {nodeType.icon}
                  <span className="ml-2">{t(nodeType.type, nodeType.label)}</span>
                </Button>
              ))}
            </div>

            <Separator className="my-4" />

            <h3 className="font-semibold mb-3">{t('shortcuts', 'Shortcuts')}</h3>
            <div className="text-sm text-muted-foreground space-y-1">
              <p>• {t('drag_to_move', 'Drag nodes to move')}</p>
              <p>• {t('shift_click_to_connect', 'Shift+Click to connect')}</p>
              <p>• {t('alt_drag_to_pan', 'Alt+Drag to pan')}</p>
              <p>• {t('scroll_to_zoom', 'Scroll to zoom')}</p>
            </div>
          </div>
        </div>

        {/* Canvas */}
        <div className="flex-1 relative overflow-hidden">
          <div className="absolute top-4 left-4 z-10 flex items-center gap-2 bg-white rounded-lg shadow-md p-1">
            <Button variant="ghost" size="sm" onClick={() => handleZoom(-0.1)}>
              <ZoomOut className="h-4 w-4" />
            </Button>
            <span className="text-sm px-2 min-w-[60px] text-center">
              {Math.round(scale * 100)}%
            </span>
            <Button variant="ghost" size="sm" onClick={() => handleZoom(0.1)}>
              <ZoomIn className="h-4 w-4" />
            </Button>
            <Separator orientation="vertical" className="h-6" />
            <Button variant="ghost" size="sm" onClick={resetView}>
              <Maximize2 className="h-4 w-4" />
            </Button>
          </div>

          <div
            ref={canvasRef}
            className="w-full h-full bg-grid"
            style={{
              backgroundImage: `
                radial-gradient(circle, #e5e7eb 1px, transparent 1px)
              `,
              backgroundSize: `${20 * scale}px ${20 * scale}px`,
              backgroundPosition: `${pan.x}px ${pan.y}px`
            }}
            onMouseDown={handleCanvasMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onClick={handleCanvasClick}
            onWheel={(e) => {
              e.preventDefault()
              handleZoom(e.deltaY * -0.001)
            }}
          >
            <svg
              className="absolute inset-0 w-full h-full pointer-events-none"
              style={{ zIndex: 1 }}
            >
              {/* Render edges */}
              {workflowState.workflow_edges?.map(edge => (
                <g key={edge.id}>
                  <path
                    d={getConnectionLine(edge) || ''}
                    fill="none"
                    stroke={selectedEdge === edge.id ? '#3b82f6' : '#9ca3af'}
                    strokeWidth={selectedEdge === edge.id ? 3 : 2}
                  />
                  <circle
                    cx={(workflowState.workflow_nodes?.find(n => n.id === edge.target)?.position.x || 0) * scale + pan.x}
                    cy={(workflowState.workflow_nodes?.find(n => n.id === edge.target)?.position.y || 0) * scale + pan.y}
                    r="8"
                    fill="#3b82f6"
                    stroke="white"
                    strokeWidth="2"
                  />
                </g>
              ))}

              {/* Connection line while dragging */}
              {isConnecting && connectionStart && (
                <path
                  d={`M ${(workflowState.workflow_nodes?.find(n => n.id === connectionStart)?.position.x! + 100) * scale + pan.x} ${(workflowState.workflow_nodes?.find(n => n.id === connectionStart)?.position.y! + 40) * scale + pan.y} L ${mousePos.x * scale + pan.x} ${mousePos.y * scale + pan.y}`}
                  fill="none"
                    stroke="#3b82f6"
                  strokeWidth="2"
                  strokeDasharray="5,5"
                />
              )}
            </svg>

            {/* Render nodes */}
            {workflowState.workflow_nodes?.map(node => (
              <div
                key={node.id}
                className={cn(
                  "absolute bg-white rounded-lg shadow-lg border-2 cursor-move select-none transition-shadow",
                  selectedNode === node.id ? "border-blue-500 shadow-xl" : "border-gray-200 hover:shadow-md"
                )}
                style={{
                  left: `${node.position.x * scale + pan.x}px`,
                  top: `${node.position.y * scale + pan.y}px`,
                  width: `${100 * scale}px`,
                  minHeight: `${40 * scale}px`,
                  zIndex: selectedNode === node.id ? 10 : 2
                }}
                onMouseDown={(e) => handleNodeMouseDown(e, node.id)}
                onDoubleClick={() => editNode(node.id)}
              >
                <div className={cn("p-2 text-white text-center rounded-t-lg", getNodeColor(node.type))}>
                  <div className="flex items-center justify-center gap-1">
                    {getNodeIcon(node.type)}
                    <span className="text-xs font-medium truncate">
                      {t(node.type, node.type.replace('_', ' '))}
                    </span>
                  </div>
                </div>
                <div className="p-2">
                  <p className="text-xs text-center text-gray-600 truncate">
                    {node.config.name || t('unnamed', 'Unnamed')}
                  </p>
                </div>

                {/* Connection point */}
                <div className="absolute -right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 bg-blue-500 rounded-full border-2 border-white" />

                {/* Delete button */}
                {selectedNode === node.id && (
                  <Button
                    variant="destructive"
                    size="sm"
                    className="absolute -top-2 -right-2 h-6 w-6 p-0"
                    onClick={(e) => {
                      e.stopPropagation()
                      deleteNode(node.id)
                    }}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Node Configuration Dialog */}
      <Dialog open={showNodeDialog} onOpenChange={setShowNodeDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {t('configure_node', 'Configure Node')}: {editingNode?.type}
            </DialogTitle>
          </DialogHeader>

          <Tabs defaultValue="config" className="w-full">
            <TabsList>
              <TabsTrigger value="config">{t('configuration', 'Configuration')}</TabsTrigger>
              <TabsTrigger value="advanced">{t('advanced', 'Advanced')}</TabsTrigger>
            </TabsList>

            <TabsContent value="config" className="space-y-4">
              <div>
                <Label>{t('node_name', 'Node Name')}</Label>
                <Input
                  value={nodeConfig.config?.name || ''}
                  onChange={(e) => setNodeConfig(prev => ({
                    ...prev,
                    config: { ...prev.config, name: e.target.value }
                  }))}
                  placeholder={t('enter_node_name', 'Enter node name...')}
                />
              </div>

              {editingNode?.type === 'send_email' && (
                <>
                  <div>
                    <Label>{t('email_template', 'Email Template')}</Label>
                    <Select
                      value={nodeConfig.config?.template_id || ''}
                      onValueChange={(value) => setNodeConfig(prev => ({
                        ...prev,
                        config: { ...prev.config, template_id: value }
                      }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={t('select_template', 'Select template...')} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="welcome">Welcome Email</SelectItem>
                        <SelectItem value="review">Review Request</SelectItem>
                        <SelectItem value="aftercare">Aftercare Instructions</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>{t('personalization', 'Personalization')}</Label>
                    <Textarea
                      value={JSON.stringify(nodeConfig.config?.personalization || {}, null, 2)}
                      onChange={(e) => setNodeConfig(prev => ({
                        ...prev,
                        config: { ...prev.config, personalization: JSON.parse(e.target.value) }
                      }))}
                      placeholder={t('personalization_json', 'Personalization JSON...')}
                      rows={4}
                    />
                  </div>
                </>
              )}

              {editingNode?.type === 'wait' && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>{t('duration_value', 'Duration Value')}</Label>
                    <Input
                      type="number"
                      value={nodeConfig.config?.duration?.value || 1}
                      onChange={(e) => setNodeConfig(prev => ({
                        ...prev,
                        config: {
                          ...prev.config,
                          duration: { ...prev.config.duration, value: parseInt(e.target.value) }
                        }
                      }))}
                    />
                  </div>
                  <div>
                    <Label>{t('duration_unit', 'Duration Unit')}</Label>
                    <Select
                      value={nodeConfig.config?.duration?.unit || 'hours'}
                      onValueChange={(value) => setNodeConfig(prev => ({
                        ...prev,
                        config: {
                          ...prev.config,
                          duration: { ...prev.config.duration, unit: value }
                        }
                      }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="minutes">{t('minutes', 'Minutes')}</SelectItem>
                        <SelectItem value="hours">{t('hours', 'Hours')}</SelectItem>
                        <SelectItem value="days">{t('days', 'Days')}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}

              {editingNode?.type === 'branch' && (
                <div>
                  <Label>{t('branch_conditions', 'Branch Conditions')}</Label>
                  <Textarea
                    value={JSON.stringify(nodeConfig.config?.conditions || [], null, 2)}
                    onChange={(e) => setNodeConfig(prev => ({
                      ...prev,
                      config: { ...prev.config, conditions: JSON.parse(e.target.value) }
                    }))}
                    placeholder={t('conditions_json', 'Conditions JSON...')}
                    rows={6}
                  />
                </div>
              )}
            </TabsContent>

            <TabsContent value="advanced" className="space-y-4">
              <div className="flex items-center space-x-2">
                <Switch
                  id="enable-retry"
                  checked={nodeConfig.config?.enable_retry || false}
                  onCheckedChange={(checked) => setNodeConfig(prev => ({
                    ...prev,
                    config: { ...prev.config, enable_retry: checked }
                  }))}
                />
                <Label htmlFor="enable-retry">{t('enable_retry', 'Enable Retry')}</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="track-analytics"
                  checked={nodeConfig.config?.track_analytics !== false}
                  onCheckedChange={(checked) => setNodeConfig(prev => ({
                    ...prev,
                    config: { ...prev.config, track_analytics: checked }
                  }))}
                />
                <Label htmlFor="track-analytics">{t('track_analytics', 'Track Analytics')}</Label>
              </div>

              <div>
                <Label>{t('custom_data', 'Custom Data')}</Label>
                <Textarea
                  value={JSON.stringify(nodeConfig.config?.custom_data || {}, null, 2)}
                  onChange={(e) => setNodeConfig(prev => ({
                    ...prev,
                    config: { ...prev.config, custom_data: JSON.parse(e.target.value) }
                  }))}
                  placeholder={t('custom_data_json', 'Custom data JSON...')}
                  rows={4}
                />
              </div>
            </TabsContent>
          </Tabs>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowNodeDialog(false)}>
              {t('cancel', 'Cancel')}
            </Button>
            <Button onClick={saveNode}>
              {t('save_node', 'Save Node')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Workflow Settings Dialog */}
      <Dialog open={showSettingsDialog} onOpenChange={setShowSettingsDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{t('workflow_settings', 'Workflow Settings')}</DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            <div>
              <Label>{t('workflow_type', 'Workflow Type')}</Label>
              <Select
                value={workflowState.type || 'custom'}
                onValueChange={(value: any) => setWorkflowState(prev => ({ ...prev, type: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="welcome_series">{t('welcome_series', 'Welcome Series')}</SelectItem>
                  <SelectItem value="aftercare_reminders">{t('aftercare_reminders', 'Aftercare Reminders')}</SelectItem>
                  <SelectItem value="review_requests">{t('review_requests', 'Review Requests')}</SelectItem>
                  <SelectItem value="re_engagement">{t('re_engagement', 'Re-engagement')}</SelectItem>
                  <SelectItem value="birthday_anniversary">{t('birthday_anniversary', 'Birthday/Anniversary')}</SelectItem>
                  <SelectItem value="abandoned_booking">{t('abandoned_booking', 'Abandoned Booking')}</SelectItem>
                  <SelectItem value="custom">{t('custom', 'Custom')}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>{t('trigger_type', 'Trigger Type')}</Label>
              <Select
                value={workflowState.trigger_config?.trigger_type || 'manual'}
                onValueChange={(value) => setWorkflowState(prev => ({
                  ...prev,
                  trigger_config: { ...prev.trigger_config!, trigger_type: value }
                }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="manual">{t('manual_trigger', 'Manual Trigger')}</SelectItem>
                  <SelectItem value="customer_created">{t('customer_created', 'Customer Created')}</SelectItem>
                  <SelectItem value="booking_created">{t('booking_created', 'Booking Created')}</SelectItem>
                  <SelectItem value="booking_completed">{t('booking_completed', 'Booking Completed')}</SelectItem>
                  <SelectItem value="scheduled">{t('scheduled_trigger', 'Scheduled')}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>{t('description', 'Description')}</Label>
              <Textarea
                value={workflowState.description || ''}
                onChange={(e) => setWorkflowState(prev => ({ ...prev, description: e.target.value }))}
                placeholder={t('workflow_description', 'Describe what this workflow does...')}
                rows={3}
              />
            </div>

            <div>
              <Label>{t('segment_criteria', 'Segment Criteria')}</Label>
              <Textarea
                value={JSON.stringify(workflowState.segment_criteria || {}, null, 2)}
                onChange={(e) => setWorkflowState(prev => ({
                  ...prev,
                  segment_criteria: JSON.parse(e.target.value)
                }))}
                placeholder={t('segment_criteria_json', 'Segment criteria JSON...')}
                rows={4}
              />
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowSettingsDialog(false)}>
              {t('cancel', 'Cancel')}
            </Button>
            <Button onClick={() => setShowSettingsDialog(false)}>
              {t('save_settings', 'Save Settings')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}