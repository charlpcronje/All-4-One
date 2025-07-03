// Path: frontend/src/components/orchestrator/EditorToolbar.tsx

import { z } from 'zod';

// Define the shape of a step as it will be used in the toolbar.
export const DraggableNodeSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  category: z.string(),
});
export type DraggableNode = z.infer<typeof DraggableNodeSchema>;

const EditorToolbarPropsSchema = z.object({
  availableNodes: z.array(DraggableNodeSchema),
});
type EditorToolbarProps = z.infer<typeof EditorToolbarPropsSchema>;

// This function attaches the necessary data to the drag event.
const onDragStart = (event: React.DragEvent, nodeType: string, nodeName: string) => {
  event.dataTransfer.setData('application/reactflow-type', nodeType);
  event.dataTransfer.setData('application/reactflow-name', nodeName);
  event.dataTransfer.effectAllowed = 'move';
};

export function EditorToolbar({ availableNodes }: EditorToolbarProps) {
  if (!availableNodes || availableNodes.length === 0) {
    return (
      <div className="p-4 text-sm text-muted-foreground">
        Loading available steps...
      </div>
    );
  }

  // Group nodes by category for a cleaner UI.
  const groupedNodes = availableNodes.reduce((acc, node) => {
    (acc[node.category] = acc[node.category] || []).push(node);
    return acc;
  }, {} as Record<string, DraggableNode[]>);

  return (
    <aside className="absolute top-4 left-4 z-10 w-64 bg-background/80 backdrop-blur-sm border rounded-lg shadow-lg p-2">
      <h3 className="text-lg font-semibold px-2 mb-2">Toolbox</h3>
      {Object.entries(groupedNodes).map(([category, nodes]) => (
        <div key={category}>
          <p className="text-xs font-bold uppercase text-muted-foreground px-2 mt-2 mb-1">{category}</p>
          {nodes.map((node) => (
            <div
              key={node.id}
              className="p-2 my-1 border rounded-md cursor-grab bg-card hover:bg-accent hover:shadow-md transition-all flex flex-col"
              onDragStart={(event) => onDragStart(event, node.id, node.name)}
              draggable
            >
              <div className="font-semibold text-sm">{node.name}</div>
              <div className="text-xs text-muted-foreground">{node.description}</div>
            </div>
          ))}
        </div>
      ))}
    </aside>
  );
}