"use client"

import { useMemo, useState } from 'react'
import { Play, Webhook, Clock, Mail, Globe, Database, Braces, Timer, GitBranch, Shuffle, RotateCcw, Filter, ChevronDown, Rocket } from 'lucide-react'
import { NodeType, TriggerType, ActionType, LogicType, WorkflowNode } from '@/types/workflow'
import { v4 as uuidv4 } from 'uuid'
import { Button } from '@/components/ui/button'
import { useToast } from '@/components/ui/toaster'
import { useWorkflowStore } from '@/hooks/use-workflow-store'
import { getDefaultConfigForNode } from '@/lib/node-definitions'
import { EMAIL_NODE_DEFINITION } from '@/nodes/EmailNode'
import { HTTP_NODE_DEFINITION } from '@/nodes/HttpNode'
import { SCHEDULE_NODE_DEFINITION } from '@/nodes/ScheduleNode'
import { WEBHOOK_NODE_DEFINITION } from '@/nodes/WebhookNode'
import { getWorkflowTemplates } from '@/templates'

interface NodeTemplate {
  type: NodeType
  subType: TriggerType | ActionType | LogicType
  label: string
  icon: React.ReactNode
  description: string
}

const nodeTemplates: NodeTemplate[] = [
  // Triggers
  {
    type: NodeType.TRIGGER,
    subType: TriggerType.MANUAL,
    label: 'Manual Trigger',
    icon: <Play className="w-5 h-5" />,
    description: 'Start workflow manually'
  },
  {
    type: NodeType.TRIGGER,
    subType: TriggerType.WEBHOOK,
    label: 'Webhook',
    icon: <Webhook className="w-5 h-5" />,
    description: 'Trigger via HTTP webhook'
  },
  {
    type: NodeType.TRIGGER,
    subType: TriggerType.SCHEDULE,
    label: 'Schedule',
    icon: <Clock className="w-5 h-5" />,
    description: 'Run on a schedule'
  },
  {
    type: NodeType.TRIGGER,
    subType: TriggerType.EMAIL,
    label: 'Email Trigger',
    icon: <Mail className="w-5 h-5" />,
    description: 'Trigger on email receipt'
  },
  // Actions
  {
    type: NodeType.ACTION,
    subType: ActionType.HTTP,
    label: 'HTTP Request',
    icon: <Globe className="w-5 h-5" />,
    description: 'Make HTTP API calls'
  },
  {
    type: NodeType.ACTION,
    subType: ActionType.EMAIL,
    label: 'Send Email',
    icon: <Mail className="w-5 h-5" />,
    description: 'Send email messages'
  },
  {
    type: NodeType.ACTION,
    subType: ActionType.DATABASE,
    label: 'Database',
    icon: <Database className="w-5 h-5" />,
    description: 'Query or update database'
  },
  {
    type: NodeType.ACTION,
    subType: ActionType.TRANSFORM,
    label: 'Transform Data',
    icon: <Braces className="w-5 h-5" />,
    description: 'Transform and map data'
  },
  {
    type: NodeType.ACTION,
    subType: ActionType.DELAY,
    label: 'Delay',
    icon: <Timer className="w-5 h-5" />,
    description: 'Wait for specified time'
  },
  // Logic
  {
    type: NodeType.LOGIC,
    subType: LogicType.IF,
    label: 'If/Else',
    icon: <GitBranch className="w-5 h-5" />,
    description: 'Conditional branching'
  },
  {
    type: NodeType.LOGIC,
    subType: LogicType.SWITCH,
    label: 'Switch',
    icon: <Shuffle className="w-5 h-5" />,
    description: 'Multiple condition branches'
  },
  {
    type: NodeType.LOGIC,
    subType: LogicType.LOOP,
    label: 'Loop',
    icon: <RotateCcw className="w-5 h-5" />,
    description: 'Iterate over items'
  },
  {
    type: NodeType.LOGIC,
    subType: LogicType.FILTER,
    label: 'Filter',
    icon: <Filter className="w-5 h-5" />,
    description: 'Filter array items'
  },
]

interface NodePaletteProps {
  onNodeDrag: (event: React.DragEvent, nodeTemplate: NodeTemplate) => void
  onNodeAdded?: () => void // Callback for when a node is added (to close mobile modal)
}

export function NodePalette({ onNodeDrag, onNodeAdded }: NodePaletteProps) {
  const { addNode, addEdges } = useWorkflowStore()
  const { toast } = useToast()
  const [open, setOpen] = useState<{[k: string]: boolean}>({
    Triggers: true,
    Actions: true,
    Logic: true,
    Templates: true,
  })
  const toggle = (key: string) => setOpen((s) => ({ ...s, [key]: !s[key] }))
  
  const templates = useMemo(() => getWorkflowTemplates(), [])

  const insertTemplate = (key: string) => {
    const tpl = templates.find(t => t.key === key)
    if (!tpl) return
    const built = tpl.buildAt({ x: 150, y: 80 })
    built.nodes.forEach(n => addNode(n))
    addEdges(built.edges)
    toast({ title: 'Template added', description: tpl.label, variant: 'success' })
    onNodeAdded?.()
  }

  const insertSingleNode = (nodeTemplate: NodeTemplate) => {
    const id = uuidv4()
    const base = {
      id,
      type: nodeTemplate.type.toLowerCase(),
      position: { x: 180, y: 140 },
    } as const
    let data: WorkflowNode['data']
    if (nodeTemplate.type === NodeType.TRIGGER) {
      data = {
        label: nodeTemplate.label,
        nodeType: NodeType.TRIGGER,
        triggerType: nodeTemplate.subType as TriggerType,
        config: nodeTemplate.subType === TriggerType.SCHEDULE 
          ? SCHEDULE_NODE_DEFINITION.getDefaults()
          : nodeTemplate.subType === TriggerType.WEBHOOK
          ? WEBHOOK_NODE_DEFINITION.getDefaults()
          : getDefaultConfigForNode(NodeType.TRIGGER, nodeTemplate.subType as TriggerType) || {},
      }
    } else if (nodeTemplate.type === NodeType.ACTION) {
      data = {
        label: nodeTemplate.label,
        nodeType: NodeType.ACTION,
        actionType: nodeTemplate.subType as ActionType,
        config: nodeTemplate.subType === ActionType.EMAIL 
          ? EMAIL_NODE_DEFINITION.getDefaults()
          : nodeTemplate.subType === ActionType.HTTP
          ? HTTP_NODE_DEFINITION.getDefaults() as unknown as Record<string, unknown>
          : getDefaultConfigForNode(NodeType.ACTION, nodeTemplate.subType as ActionType) || {},
      }
    } else {
      data = {
        label: nodeTemplate.label,
        nodeType: NodeType.LOGIC,
        logicType: nodeTemplate.subType as LogicType,
        config: getDefaultConfigForNode(NodeType.LOGIC, nodeTemplate.subType as LogicType) || {},
      }
    }
    const node: WorkflowNode = { ...base, data } as WorkflowNode
    addNode(node)
    toast({ title: 'Node added', description: nodeTemplate.label, variant: 'success' })
    onNodeAdded?.() // Close mobile modal after adding single node
  }
  const triggerNodes = nodeTemplates.filter(n => n.type === NodeType.TRIGGER)
  const actionNodes = nodeTemplates.filter(n => n.type === NodeType.ACTION)
  const logicNodes = nodeTemplates.filter(n => n.type === NodeType.LOGIC)

  const SectionHeader = ({ title }: { title: string }) => (
    <button
      className="w-full flex items-center justify-between text-sm font-medium text-gray-700 py-2"
      aria-expanded={open[title]}
      onClick={() => toggle(title)}
    >
      <span>{title}</span>
      <span className="transition-transform duration-200" style={{ transform: open[title] ? 'rotate(0deg)' : 'rotate(-90deg)' }}>
        <ChevronDown className="w-4 h-4" />
      </span>
    </button>
  )

  const connectionGuide = (text: string) => (
    <div className="text-xs text-gray-500 mt-1">{text}</div>
  )



  const renderPaletteContent = () => (
    <>
      {/* Templates */}
      <div className="mb-2">
        <SectionHeader title="Templates" />
        <div className={`grid transition-all duration-200 ${open.Templates ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'} overflow-hidden`}>
          <div className="overflow-hidden">
            <div className="space-y-2">
              {templates.map((t) => (
                                  <div
                    key={t.key}
                    className="p-3 border border-gray-200 rounded-md hover:border-purple-500 hover:bg-purple-50 active:bg-purple-100 transition-colors cursor-pointer"
                    onClick={() => insertTemplate(t.key)}
                    draggable
                    onDragStart={(e) => {
                      e.dataTransfer.setData('templateKey', t.key)
                      e.dataTransfer.effectAllowed = 'move'
                    }}
                  >
                    <div className="flex items-center gap-2">
                      <div className="text-purple-600"><Rocket className="w-5 h-5" /></div>
                      <div className="flex-1">
                        <div className="text-sm font-medium">{t.label}</div>
                        <div className="text-xs text-gray-500">{t.description}</div>
                      </div>
                    </div>
                    <div className="mt-2">
                      <Button size="sm" onClick={(e) => { e.stopPropagation(); insertTemplate(t.key); }} className="bg-white text-gray-900 border border-gray-300 hover:bg-gray-50">Insert</Button>
                    </div>
                  </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      <div className="my-3 h-px bg-gray-200" />

      {/* Triggers */}
      <div className="mb-2">
        <SectionHeader title="Triggers" />
        <div className={`grid transition-all duration-200 ${open.Triggers ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'} overflow-hidden`}>
          <div className="overflow-hidden">
            <div className="space-y-2">
              {triggerNodes.map((node) => (
                <div
                  key={`${node.type}-${node.subType}`}
                  className="p-3 border border-gray-200 rounded-md cursor-move hover:border-green-500 hover:bg-green-50 active:bg-green-100 transition-colors"
                  draggable
                  onDragStart={(e) => onNodeDrag(e, node)}
                  onClick={() => insertSingleNode(node)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => { if (e.key === 'Enter') insertSingleNode(node) }}
                >
                  <div className="flex items-center gap-2">
                    <div className="text-green-600">{node.icon}</div>
                    <div className="flex-1">
                      <div className="text-sm font-medium">{node.label}</div>
                      <div className="text-xs text-gray-500">{node.description}</div>
                      {node.subType === TriggerType.WEBHOOK && connectionGuide('Connect to an action (e.g., HTTP) to process incoming events.')}
                      {node.subType === TriggerType.SCHEDULE && connectionGuide('Connect to any action to run it on a schedule.')}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      <div className="my-3 h-px bg-gray-200" />

      {/* Actions */}
      <div className="mb-2">
        <SectionHeader title="Actions" />
        <div className={`grid transition-all duration-200 ${open.Actions ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'} overflow-hidden`}>
          <div className="overflow-hidden">
            <div className="space-y-2">
              {actionNodes.map((node) => (
                <div
                  key={`${node.type}-${node.subType}`}
                  className="p-3 border border-gray-200 rounded-md cursor-move hover:border-blue-500 hover:bg-blue-50 active:bg-blue-100 transition-colors"
                  draggable
                  onDragStart={(e) => onNodeDrag(e, node)}
                  onClick={() => insertSingleNode(node)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => { if (e.key === 'Enter') insertSingleNode(node) }}
                >
                  <div className="flex items-center gap-2">
                    <div className="text-blue-600">{node.icon}</div>
                    <div className="flex-1">
                      <div className="text-sm font-medium">{node.label}</div>
                      <div className="text-xs text-gray-500">{node.description}</div>
                      {node.subType === ActionType.HTTP && connectionGuide('Connect from a trigger or logic node to call external APIs.')}
                      {node.subType === ActionType.EMAIL && connectionGuide('Connect from any node to send a notification email.')}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      <div className="my-3 h-px bg-gray-200" />

      {/* Logic */}
      <div className="mb-2">
        <SectionHeader title="Logic" />
        <div className={`grid transition-all duration-200 ${open.Logic ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'} overflow-hidden`}>
          <div className="overflow-hidden">
            <div className="space-y-2">
              {logicNodes.map((node) => (
                <div
                  key={`${node.type}-${node.subType}`}
                  className="p-3 border border-gray-200 rounded-md cursor-move hover:border-amber-500 hover:bg-amber-50 active:bg-amber-100 transition-colors"
                  draggable
                  onDragStart={(e) => onNodeDrag(e, node)}
                  onClick={() => insertSingleNode(node)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => { if (e.key === 'Enter') insertSingleNode(node) }}
                >
                  <div className="flex items-center gap-2">
                    <div className="text-amber-600">{node.icon}</div>
                    <div className="flex-1">
                      <div className="text-sm font-medium">{node.label}</div>
                      <div className="text-xs text-gray-500">{node.description}</div>
                      {node.subType === LogicType.IF && connectionGuide('Connect after an action to branch based on its result.')}
                      {node.subType === LogicType.LOOP && connectionGuide('Connect after a node that outputs an array to iterate items.')}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  )

  return (
    <div className="bg-white text-gray-900 border-r border-gray-200 w-full md:w-72 h-full flex flex-col">
      <div className="flex-shrink-0 bg-white border-b border-gray-200 px-4 py-3">
        <h3 className="text-base font-semibold">Add Nodes</h3>
      </div>
      <div className="flex-1 overflow-y-auto p-4">
        {renderPaletteContent()}
      </div>
    </div>
  )


}

export type { NodeTemplate }
