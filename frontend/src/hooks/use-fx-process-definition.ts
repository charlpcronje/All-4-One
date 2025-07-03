
import { useState, useEffect, useCallback } from 'react';
import fx from '@/core/fx.js'; // Assuming fx.js is accessible
import { ProcessDefinition, ProcessStep } from '@/shared/schemas/process.schema';
import { v4 as uuidv4 } from 'uuid';

// This hook manages the process definition as an FX node graph
export function useFxProcessDefinition(initialDefinition: ProcessDefinition, onDefinitionChange: (newDefinition: ProcessDefinition) => void) {
  // The master FX node for the entire process definition
  const [processFxNode, setProcessFxNode] = useState(() => fx.createNode().expand(initialDefinition));

  // Keep the internal FX node in sync if the external definition prop changes
  useEffect(() => {
    const newFxNode = fx.createNode().expand(initialDefinition);
    setProcessFxNode(newFxNode);
  }, [initialDefinition]);

  const commitChanges = useCallback((updatedFxNode: import('@/core/fx.js').FxNode) => {
    const newDefinition = updatedFxNode.wrap() as ProcessDefinition;
    onDefinitionChange(newDefinition);
  }, [onDefinitionChange]);

  const addNode = useCallback((nodeInfo: { type: string; label: string }) => {
    const newNodeId = uuidv4();
    const newStep: ProcessStep = {
      id: newNodeId,
      label: nodeInfo.label,
      type: nodeInfo.type,
      connections: {},
      config: {}, // Initialize with an empty config object
      position: { x: 100, y: 100 }, // Default position
    };

    // Use the FX API to add a new node
    processFxNode.nodes[newNodeId].expand(newStep);

    setProcessFxNode(processFxNode);
    commitChanges(processFxNode);
  }, [processFxNode, commitChanges]);

  const updateNodePosition = useCallback((nodeId: string, newPosition: { x: number; y: number }) => {
    const nodeToUpdate = processFxNode.nodes[nodeId];
    if (nodeToUpdate) {
      nodeToUpdate.position.set(newPosition);
      setProcessFxNode(processFxNode);
      // No need to commit on every position change for performance, 
      // but we will for simplicity for now.
      commitChanges(processFxNode);
    }
  }, [processFxNode, commitChanges]);

  const createConnection = useCallback((sourceId: string, targetId: string, sourceHandle: string) => {
    const sourceNode = processFxNode.nodes[sourceId];
    if (sourceNode) {
      if (sourceHandle === 'onSuccess') {
        sourceNode.connections.onSuccess.set(targetId);
      } else if (sourceHandle === 'onFailure') {
        sourceNode.connections.onFailure.set(targetId);
      }
      setProcessFxNode(processFxNode);
      commitChanges(processFxNode);
    }
  }, [processFxNode, commitChanges]);

  return {
    processFxNode,
    addNode,
    updateNodePosition,
    createConnection,
  };
}
