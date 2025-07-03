
import { Handle, Position, NodeProps } from 'reactflow';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

// Define a more specific data structure for our nodes
import { z } from "zod";

export const CustomNodeDataSchema = z.object({
  label: z.string(),
  type: z.string(),
  icon: z.any().optional(), // React.ReactNode is hard to represent directly in Zod
  config: z.record(z.any()).optional(),
});

export type CustomNodeData = z.infer<typeof CustomNodeDataSchema>;

export type CustomNodeProps = NodeProps<z.infer<typeof CustomNodeDataSchema>>; // Update this line

const nodeTypeStyles: Record<string, { border: string; background: string; icon: string }> = {
  'http-request': { border: 'border-blue-500', background: 'bg-blue-50', icon: '🌐' },
  'response': { border: 'border-green-500', background: 'bg-green-50', icon: '📤' },
  'webhook': { border: 'border-purple-500', background: 'bg-purple-50', icon: '🔔' },
  'lifecycle-hook': { border: 'border-yellow-500', background: 'bg-yellow-50', icon: '🔄' },
  'plugin': { border: 'border-indigo-500', background: 'bg-indigo-50', icon: '🔌' },
  'default': { border: 'border-gray-400', background: 'bg-gray-50', icon: '⚙️' },
};

export function CustomNode({ data, isConnectable }: CustomNodeProps) {
  const { label, type, icon, config } = data;
  const style = nodeTypeStyles[type] || nodeTypeStyles['default'];

  return (
    <Card className={cn('w-64 shadow-md', style.border)}>
      <Handle
        type="target"
        position={Position.Top}
        isConnectable={isConnectable}
        className="w-16 !bg-teal-500"
      />
      <CardHeader className="flex flex-row items-center justify-between p-3 space-y-0">
        <CardTitle className="text-sm font-medium">{label}</CardTitle>
        <span className="text-2xl">{icon || style.icon}</span>
      </CardHeader>
      <CardContent className="p-3 pt-0">
        <Badge variant="outline" className="mb-2">{type}</Badge>
        {config && Object.keys(config).length > 0 && (
          <div className="text-xs text-gray-600">
            {Object.entries(config).map(([key, value]) => (
              <div key={key}>
                <strong>{key}:</strong> {JSON.stringify(value)}
              </div>
            ))}
          </div>
        )}
      </CardContent>
      <Handle
        type="source"
        position={Position.Bottom}
        id="onSuccess"
        style={{ left: '35%', background: '#555' }}
        isConnectable={isConnectable}
      />
      <Handle
        type="source"
        position={Position.Bottom}
        id="onFailure"
        style={{ left: '65%', background: '#FF5A5A' }}
        isConnectable={isConnectable}
      />
    </Card>
  );
}
