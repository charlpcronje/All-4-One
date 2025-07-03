// Path: frontend/src/components/orchestrator/VisualProcessEditor.tsx

import { useCallback, useState, useRef, useEffect } from 'react';
import ReactFlow, {
  MiniMap,
  Controls,
  Background,
  BackgroundVariant,
  addEdge,
  useNodesState,
  useEdgesState,
  Node,
  Edge,
  OnConnect,
  ReactFlowInstance,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { v4 as uuidv4 } from 'uuid';

import { ProcessDefinition } from '../../../../shared/schemas/process.schema';
import { EditorToolbar, DraggableNode } from './EditorToolbar';

interface VisualProcessEditorProps {
  definition: ProcessDefinition;
  onDefinitionChange: (newDefinition: ProcessDefinition) => void;
  availableNodes: DraggableNode[];
}

const definitionToFlow = (definition: ProcessDefinition): { nodes: Node[], edges: Edge[] } => {
  // This function will need to be improved to handle node positions later.
  // For now, it just maps the basic structure.
  const nodes = Object.values(definition.nodes).map((step, index) => {
    const typedStep = step as import('../../../../shared/schemas/process.schema').ProcessStep;
    return {
      id: typedStep.id,
    type: 'default',
    position: { x: (index % 5) * 200, y: Math.floor(index / 5) * 150 },
    data: { label: `${typedStep.label} (${typedStep.type})` },
  };
  });

  const edges: Edge[] = [];
  for (const step of Object.values(definition.nodes)) {
    const typedStep = step as import('../../../../shared/schemas/process.schema').ProcessStep;
    if (typedStep.connections.onSuccess) {
      edges.push({ id: `e-${typedStep.id}-success`, source: typedStep.id, target: typedStep.connections.onSuccess, label: 'onSuccess', type: 'smoothstep' });
    }
    if (typedStep.connections.onFailure) {
      edges.push({ id: `e-${typedStep.id}-failure`, source: typedStep.id, target: typedStep.connections.onFailure, label: 'onFailure', type: 'smoothstep', style: { stroke: '#f44336' } });
    }
  }
  return { nodes, edges };
};

export function VisualProcessEditor({
  definition,
  onDefinitionChange,
  availableNodes,
}: VisualProcessEditorProps) {
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const [reactFlowInstance, setReactFlowInstance] = useState<ReactFlowInstance | null>(null);

  const { nodes: initialNodes, edges: initialEdges } = definitionToFlow(definition);
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  // Sync React Flow state back to the parent component's definition state.
  useEffect(() => {
    // This is a simplified sync. A real implementation would be more robust.
    const newDefinition: ProcessDefinition = { ...definition, nodes: {} };
    nodes.forEach(node => {
        newDefinition.nodes[node.id] = {
            id: node.id,
            type: 'core:http_request', // Placeholder
            label: node.data.label,
            config: {},
            connections: { onSuccess: null, onFailure: null }
        };
    });
    // This part is complex and will be improved: syncing connections to edges.
    onDefinitionChange(newDefinition);
  }, [nodes, edges, onDefinitionChange, definition]);


  const onConnect: OnConnect = useCallback((params) => setEdges((eds) => addEdge(params, eds)), [setEdges]);

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();
      if (!reactFlowInstance || !reactFlowWrapper.current) return;

      const type = event.dataTransfer.getData('application/reactflow-type');
      const name = event.dataTransfer.getData('application/reactflow-name');
      if (!type) return;

      const position = reactFlowInstance.screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      const newNodeId = `step_${uuidv4().substring(0, 8)}`;
      const newNode: Node = {
        id: newNodeId,
        type: 'default',
        position,
        data: { label: name },
      };

      setNodes((nds) => nds.concat(newNode));
    },
    [reactFlowInstance, setNodes]
  );

  return (
    <div style={{ height: '600px' }} className="relative border rounded-lg bg-background" ref={reactFlowWrapper}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onInit={setReactFlowInstance}
        onDrop={onDrop}
        onDragOver={onDragOver}
        fitView
        proOptions={{ hideAttribution: true }}
      >
        <Controls />
        <MiniMap />
        <Background variant={BackgroundVariant.Dots} gap={12} size={1} />
        <EditorToolbar availableNodes={availableNodes} />
      </ReactFlow>
    </div>
  );
}