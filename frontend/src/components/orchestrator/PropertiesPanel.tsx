
import { ProcessStep, CachingComponent, RetryComponent } from "../../../../shared/schemas/process.schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { PlusCircle, Trash2 } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
  } from "@/components/ui/accordion";
import { Switch } from "@/components/ui/switch";

interface PropertiesPanelProps {
  node: ProcessStep | null;
  onNodeDataChange: (nodeId: string, newNodeData: Partial<ProcessStep>) => void;
}

// Form for the 'core:http_request' node type
const HttpRequestProperties = ({ node, onNodeDataChange }: PropertiesPanelProps) => {
  if (!node) return null;

  const config = node.config || {};

  const handleChange = (field: string, value: any) => {
    const newConfig = { ...config, [field]: value };
    onNodeDataChange(node.id, { config: newConfig });
  };

  return (
    <div className="space-y-4 p-1">
      <div>
        <Label htmlFor="http-method">HTTP Method</Label>
        <Select
          value={config.method || "GET"}
          onValueChange={(value) => handleChange("method", value)}
        >
          <SelectTrigger id="http-method">
            <SelectValue placeholder="Select method" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="GET">GET</SelectItem>
            <SelectItem value="POST">POST</SelectItem>
            <SelectItem value="PUT">PUT</SelectItem>
            <SelectItem value="PATCH">PATCH</SelectItem>
            <SelectItem value="DELETE">DELETE</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label htmlFor="http-endpoint">Endpoint Path</Label>
        <Input
          id="http-endpoint"
          placeholder="/users/{id}"
          value={config.endpoint || ""}
          onChange={(e) => handleChange("endpoint", e.target.value)}
        />
      </div>
    </div>
  );
};

const CachingProperties = ({ node, onNodeDataChange }: PropertiesPanelProps) => {
    if (!node) return null;
    const componentData = (node.components?.caching || {}) as CachingComponent;

    const handleComponentChange = (newData: Partial<CachingComponent>) => {
        const newCompData = { ...node.components?.caching, ...newData };
        onNodeDataChange(node.id, { components: { ...node.components, caching: newCompData } });
    }

    return (
        <div className="space-y-4 p-1">
            <div className="flex items-center justify-between">
                <Label htmlFor="cache-enabled">Enable Caching</Label>
                <Switch id="cache-enabled" checked={componentData.enabled} onCheckedChange={(val) => handleComponentChange({ enabled: val })} />
            </div>
            {componentData.enabled && (
                <>
                    <div>
                        <Label htmlFor="cache-ttl">TTL (seconds)</Label>
                        <Input id="cache-ttl" type="number" placeholder="300" value={componentData.ttl} onChange={(e) => handleComponentChange({ ttl: parseInt(e.target.value) || 0 })} />
                    </div>
                    <div>
                        <Label htmlFor="cache-key">Cache Key</Label>
                        <Input id="cache-key" placeholder="$.request.body.id" value={componentData.key} onChange={(e) => handleComponentChange({ key: e.target.value })} />
                    </div>
                </>
            )}
        </div>
    );
}

const RetryProperties = ({ node, onNodeDataChange }: PropertiesPanelProps) => {
    if (!node) return null;
    const componentData = (node.components?.retry || {}) as RetryComponent;

    const handleComponentChange = (newData: Partial<RetryComponent>) => {
        const newCompData = { ...node.components?.retry, ...newData };
        onNodeDataChange(node.id, { components: { ...node.components, retry: newCompData } });
    }

    return (
        <div className="space-y-4 p-1">
            <div className="flex items-center justify-between">
                <Label htmlFor="retry-enabled">Enable Retries</Label>
                <Switch id="retry-enabled" checked={componentData.enabled} onCheckedChange={(val) => handleComponentChange({ enabled: val })} />
            </div>
            {componentData.enabled && (
                <>
                    <div>
                        <Label htmlFor="retry-count">Retry Count</Label>
                        <Input id="retry-count" type="number" placeholder="3" value={componentData.count} onChange={(e) => handleComponentChange({ count: parseInt(e.target.value) || 0 })} />
                    </div>
                    <div>
                        <Label htmlFor="retry-strategy">Strategy</Label>
                        <Select value={componentData.strategy} onValueChange={(val) => handleComponentChange({ strategy: val as any })}>
                            <SelectTrigger id="retry-strategy"><SelectValue /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="fixed">Fixed</SelectItem>
                                <SelectItem value="exponential">Exponential</SelectItem>
                                <SelectItem value="linear">Linear</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div>
                        <Label htmlFor="retry-delay">Initial Delay (ms)</Label>
                        <Input id="retry-delay" type="number" placeholder="1000" value={componentData.delay} onChange={(e) => handleComponentChange({ delay: parseInt(e.target.value) || 0 })} />
                    </div>
                </>
            )}
        </div>
    );
}

const NodePrimaryProperties = ({ node, onNodeDataChange }: PropertiesPanelProps) => {
  if (!node) return null;

  switch (node.type) {
    case "core:http_request":
      return <HttpRequestProperties node={node} onNodeDataChange={onNodeDataChange} />;
    // Add other primary types here
    default:
      return <p className="text-sm text-muted-foreground p-1">No primary properties for type: {node.type}</p>;
  }
};

const componentForms: Record<string, React.FC<PropertiesPanelProps>> = {
    caching: CachingProperties,
    retry: RetryProperties,
    // logging: LoggingProperties, // Add when created
};

export function PropertiesPanel({ node, onNodeDataChange }: PropertiesPanelProps) {
  const handleLabelChange = (newLabel: string) => {
    if (node) {
      onNodeDataChange(node.id, { label: newLabel });
    }
  };

  const availableComponents = ['caching', 'retry', 'logging'];

  const addComponent = (componentType: string) => {
    if(!node) return;
    const components = node.components || {};
    // Add with default values from schema if possible, for now just enabled
    const newComponents = {...components, [componentType]: { enabled: true }};
    onNodeDataChange(node.id, { components: newComponents });
  }

  const removeComponent = (componentType: string) => {
    if(!node || !node.components) return;
    const newComponents = {...node.components};
    delete newComponents[componentType as keyof typeof newComponents];
    onNodeDataChange(node.id, { components: newComponents });
  }

  return (
    <aside className="w-96 bg-background border rounded-lg shadow-lg flex flex-col">
      <CardHeader className="p-4 border-b">
        <CardTitle className="text-lg">Properties</CardTitle>
      </CardHeader>
      <CardContent className="flex-grow overflow-y-auto p-0">
        {!node ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-sm text-muted-foreground">Select a node to edit its properties</p>
          </div>
        ) : (
          <div className="divide-y">
            <div className="p-4 space-y-4">
                <Label htmlFor="node-label">Label</Label>
                <Input
                    id="node-label"
                    value={node.label}
                    onChange={(e) => handleLabelChange(e.target.value)}
                    className="text-md font-semibold"
                />
            </div>
            <Accordion type="multiple" defaultValue={['primary']} className="w-full">
                <AccordionItem value="primary">
                    <AccordionTrigger className="p-4 font-semibold">Primary Action: {node.type}</AccordionTrigger>
                    <AccordionContent className="p-4">
                        <NodePrimaryProperties node={node} onNodeDataChange={onNodeDataChange} />
                    </AccordionContent>
                </AccordionItem>
                
                {node.components && Object.keys(node.components).map(compKey => {
                    const ComponentForm = componentForms[compKey];
                    if (!ComponentForm) return null;
                    return (
                        <AccordionItem key={compKey} value={compKey}>
                            <AccordionTrigger className="p-4 font-semibold capitalize flex justify-between items-center">
                                {compKey.replace('_', ' ')}
                                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={(e) => { e.stopPropagation(); removeComponent(compKey); }}>
                                    <Trash2 className="h-4 w-4 text-destructive"/>
                                </Button>
                            </AccordionTrigger>
                            <AccordionContent className="p-4">
                               <ComponentForm node={node} onNodeDataChange={onNodeDataChange} />
                            </AccordionContent>
                        </AccordionItem>
                    )
                })}
            </Accordion>
            <div className="p-4">
                <h4 className="font-semibold mb-2 text-sm">Add Component</h4>
                <div className="flex flex-wrap gap-2">
                    {availableComponents.map(comp => (
                        <Button 
                            key={comp} 
                            variant="outline" 
                            size="sm" 
                            onClick={() => addComponent(comp)} 
                            className="flex items-center gap-1 capitalize"
                            disabled={!!(node.components && node.components[comp as keyof typeof node.components])}
                        >
                            <PlusCircle className="h-4 w-4"/> {comp}
                        </Button>
                    ))}
                </div>
            </div>
          </div>
        )}
      </CardContent>
    </aside>
  );
}
