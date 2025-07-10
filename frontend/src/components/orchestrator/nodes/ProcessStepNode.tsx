import { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { GitCommit, Zap, Repeat, ShieldCheck, MessageSquare, Database, Clock, Cloud } from 'lucide-react';
import { ProcessStep } from '../../../../shared/schemas/process.schema';

const typeIcons: Record<string, React.ReactNode> = {
    'core:http_request': <Zap className="h-5 w-5" />,
    'core:response': <MessageSquare className="h-5 w-5" />,
    'core:data_transform': <GitCommit className="h-5 w-5" />,
    'plugin:jwt-verify': <ShieldCheck className="h-5 w-5" />,
    'default': <Zap className="h-5 w-5" />,
};

const componentBadges: Record<string, React.ReactNode> = {
    caching: <Badge variant="secondary"><Clock className="h-3 w-3 mr-1"/>Cache</Badge>,
    retry: <Badge variant="secondary"><Repeat className="h-3 w-3 mr-1"/>Retry</Badge>,
    logging: <Badge variant="secondary"><Database className="h-3 w-3 mr-1"/>Log</Badge>,
}

const ProcessStepNode = ({ data }: NodeProps<ProcessStep>) => {
    const icon = typeIcons[data.type] || typeIcons.default;
    const activeComponents = data.components ? Object.keys(data.components).filter(key => data.components?.[key as keyof typeof data.components]?.enabled) : [];

    return (
        <Card className="w-64 border-2 bg-background shadow-md rounded-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 p-3 bg-muted/50 rounded-t-lg">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                    {icon}
                    <span>{data.label}</span>
                </CardTitle>
            </CardHeader>
            <CardContent className="p-3">
                <p className="text-xs text-muted-foreground mb-2">Type: {data.type}</p>
                {activeComponents.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                        {activeComponents.map(key => (
                            <div key={key}>{componentBadges[key]}</div>
                        ))}
                    </div>
                )}
            </CardContent>

            <Handle
                type="target"
                position={Position.Top}
                className="w-16 !bg-teal-500"
            />
            <Handle
                type="source"
                position={Position.Bottom}
                id="onSuccess"
                style={{ left: '35%' }}
                className="w-8 !bg-green-500"
            />
            <Handle
                type="source"
                position={Position.Bottom}
                id="onFailure"
                style={{ left: '65%' }}
                className="w-8 !bg-red-500"
            />
        </Card>
    );
};

export default memo(ProcessStepNode);
