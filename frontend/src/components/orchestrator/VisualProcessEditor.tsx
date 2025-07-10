// Path: frontend/src/components/orchestrator/VisualProcessEditor.tsx

import { useCallback, useState, useRef, useEffect, useMemo } from 'react';
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
  NodeMouseHandler,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { v4 as uuidv4 } from 'uuid';

import { ProcessDefinition, ProcessStep } from '../../../../shared/schemas/process.schema';
import { EditorToolbar, DraggableNode } from './EditorToolbar';
import ProcessStepNode from './nodes/ProcessStepNode';

interface VisualProcessEditorProps {
  definition: ProcessDefinition;
  onDefinitionChange: (newDefinition: ProcessDefinition) => void;
  availableNodes: DraggableNode[];
  selectedNodeId: string | null;
  onNodeSelect: (nodeId: string | null) => void;
  onNodePositionChange: (nodeId: string, newPosition: { x: number, y: number }) => void;
}

const definitionToFlow = (definition: ProcessDefinition, selectedNodeId: string | null): { nodes: Node<ProcessStep>[], edges: Edge[] } => {
  const nodes = Object.values(definition.nodes).map((step, index) => {
    const isSelected = step.id === selectedNodeId;
    return {
      id: step.id,
      type: 'processStep', // Use our custom node type
      position: step.position || { x: (index % 4) * 280, y: Math.floor(index / 4) * 200 },
      data: step,
      style: {
        borderWidth: isSelected ? 2 : 1,
        borderColor: isSelected ? '#10b981' : 'transparent',
        boxShadow: isSelected ? '0 0 10px #10b981' : 'none',
        borderRadius: '0.5rem',
      },
    };
  });

  const edges: Edge[] = [];
  for (const step of Object.values(definition.nodes)) {
    if (step.connections.onSuccess) {
      edges.push({ id: `e-${step.id}-success`, source: step.id, sourceHandle: 'onSuccess', target: step.connections.onSuccess, label: 'Success', type: 'smoothstep' });
    }
    if (step.connections.onFailure) {
      edges.push({ id: `e-${step.id}-failure`, source: step.id, sourceHandle: 'onFailure', target: step.connections.onFailure, label: 'Failure', type: 'smoothstep', markerEnd: { type: 'arrowclosed', color: '#f44336' }, style: { stroke: '#f44336' } });
    }
  }
  return { nodes, edges };
};

export function VisualProcessEditor({
  definition,
  onDefinitionChange,
  availableNodes,
  selectedNodeId,
  onNodeSelect,
  onNodePositionChange,
}: VisualProcessEditorProps) {
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const [reactFlowInstance, setReactFlowInstance] = useState<ReactFlowInstance | null>(null);

  const nodeTypes = useMemo(() => ({ processStep: ProcessStepNode }), []);

  const { nodes: initialNodes, edges: initialEdges } = definitionToFlow(definition, selectedNodeId);
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  useEffect(() => {
    const { nodes: newNodes, edges: newEdges } = definitionToFlow(definition, selectedNodeId);
    setNodes(newNodes);
    setEdges(newEdges);
  }, [definition, selectedNodeId, setNodes, setEdges]);


  const onConnect: OnConnect = useCallback((params) => {
    setEdges((eds) => addEdge({ ...params, type: 'smoothstep' }, eds));
    const { source, sourceHandle, target } = params;
    const newDefinition = { ...definition };
    if(source && target) {
        const sourceNode = newDefinition.nodes[source];
        if(sourceHandle === 'onSuccess') sourceNode.connections.onSuccess = target;
        if(sourceHandle === 'onFailure') sourceNode.connections.onFailure = target;
        onDefinitionChange(newDefinition);
    }
  }, [setEdges, definition, onDefinitionChange]);

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
      
      const newDefinition = { ...definition };
      newDefinition.nodes[newNodeId] = {
        id: newNodeId,
        type: type,
        label: name,
        config: {},
        connections: { onSuccess: null, onFailure: null },
        position: position,
        components: {}
      };
      onDefinitionChange(newDefinition);
      onNodeSelect(newNodeId);
    },
    [reactFlowInstance, definition, onDefinitionChange, onNodeSelect]
  );

  const handleNodeClick: NodeMouseHandler = useCallback((_event, node) => {
    onNodeSelect(node.id);
  }, [onNodeSelect]);

  const handlePaneClick = useCallback(() => {
    onNodeSelect(null);
  }, [onNodeSelect]);

  const handleNodeDragStop: NodeMouseHandler = useCallback((_event, node) => {
    if (node.position) {
        onNodePositionChange(node.id, node.position);
    }
  }, [onNodePositionChange]);

  return (
    <div className="h-full w-full relative border rounded-lg bg-background" ref={reactFlowWrapper}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onInit={setReactFlowInstance}
        onDrop={onDrop}
        onDragOver={onDragOver}
        onNodeClick={handleNodeClick}
        onPaneClick={handlePaneClick}
        onNodeDragStop={handleNodeDragStop}
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