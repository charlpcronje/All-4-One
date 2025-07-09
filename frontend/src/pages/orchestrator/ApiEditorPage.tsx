// Path: frontend/src/pages/orchestrator/ApiEditorPage.tsx

import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import {
    Save,
    Play,
    History,
    ChevronDown,
    FileJson,
    Code
} from "lucide-react";

import JsonEditor from "@/components/editors/JsonEditor";

import {
    Card,
    CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";

import { VisualProcessEditor } from "@/components/orchestrator/VisualProcessEditor";
import { DraggableNode } from "@/components/orchestrator/EditorToolbar";
import { ProcessDefinition } from "../../../../shared/schemas/process.schema";

const sampleProcessDefinition: ProcessDefinition = {
    id: "proc_1",
    name: "Sample Weather API Flow",
    startNode: "step_1_auth",
    nodes: {
        "step_1_auth": {
            id: "step_1_auth",
            type: "plugin:jwt-verify",
            label: "Verify Token",
            config: {},
            connections: { onSuccess: "step_2_http", onFailure: "step_fail_auth" }
        },
        "step_2_http": {
            id: "step_2_http",
            type: "core:http_request",
            label: "Fetch Weather",
            config: { apiId: 1, endpoint: "/current", method: "GET" },
            connections: { onSuccess: "step_3_respond", onFailure: "step_fail_fetch" }
        },
        "step_3_respond": {
            id: "step_3_respond",
            type: "core:response",
            label: "Send Success Response",
            config: { statusCode: 200, body: "$.steps.step_2_http.result" },
            connections: { onSuccess: null, onFailure: null }
        },
        "step_fail_auth": {
            id: "step_fail_auth",
            type: "core:response",
            label: "Auth Failure",
            config: { statusCode: 401, body: { error: "Unauthorized" } },
            connections: { onSuccess: null, onFailure: null }
        },
        "step_fail_fetch": {
            id: "step_fail_fetch",
            type: "core:response",
            label: "Fetch Failure",
            config: { statusCode: 502, body: { error: "Upstream service error" } },
            connections: { onSuccess: null, onFailure: null }
        }
    }
};

const apiVersions = [
    { id: "v3", timestamp: "2023-02-15T14:23:10Z", author: "jane.doe@example.com" },
    { id: "v2", timestamp: "2023-02-10T09:45:22Z", author: "john.smith@example.com" },
    { id: "v1", timestamp: "2023-02-05T16:30:05Z", author: "john.smith@example.com" }
];

export default function ApiEditorPage() {
    useParams();
    const [editorContent, setEditorContent] = useState(JSON.stringify(sampleProcessDefinition, null, 2));
    const [isValid, setIsValid] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [showVersionDialog, setShowVersionDialog] = useState(false);
    const [selectedVersion, setSelectedVersion] = useState<string | null>(null);
    const [processDefinition, setProcessDefinition] = useState<ProcessDefinition>(sampleProcessDefinition);
    const [availableNodes, setAvailableNodes] = useState<DraggableNode[]>([]);
    const [setIsLoadingNodes] = useState(true);

    useEffect(() => {
        const fetchAvailableNodes = async () => {
            try {
                setIsLoadingNodes(true);
                const response = await fetch('/api/process-steps');
                const result = await response.json();

                if (result.success) {
                    const nodesForToolbar = result.data.map((step: any) => ({
                        id: step.id,
                        name: step.name,
                        description: step.description,
                        category: step.category,
                    }));
                    setAvailableNodes(nodesForToolbar);
                } else {
                    console.error("Failed to fetch process steps:", result.error);
                }
            } catch (error) {
                console.error("Error fetching process steps:", error);
            } finally {
                setIsLoadingNodes(false);
            }
        };

        fetchAvailableNodes();
    }, []);

    const handleDefinitionChange = (newDefinition: ProcessDefinition) => {
        setProcessDefinition(newDefinition);
        setEditorContent(JSON.stringify(newDefinition, null, 2));
    };

    const handleSave = async () => {
        if (!isValid) return;
        setIsSaving(true);
        await new Promise(resolve => setTimeout(resolve, 1000));
        console.log("Saving Process Definition:", processDefinition);
        setIsSaving(false);
    };

    const handleTest = () => console.log("Testing Process Definition");
    const handleLoadVersion = (versionId: string) => {
        setSelectedVersion(versionId);
        setShowVersionDialog(true);
    };
    const confirmLoadVersion = () => {
        console.log(`Loading version ${selectedVersion}`);
        setShowVersionDialog(false);
    };
    
    // In a real app, this would use a proper validation library and provide more detailed errors.
    const handleValidation = (isValid: boolean) => {
        setIsValid(isValid);
    };
    
    return (
        <div className="container mx-auto py-6 space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold">{processDefinition.name || 'Untitled API'}</h1>
                    <p className="text-muted-foreground">
                        Visually design and configure the execution flow for this API endpoint.
                    </p>
                </div>

                <div className="flex space-x-2">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button className="bg-background border border-input hover:bg-accent text-primary hover:text-accent-foreground h-9 rounded-md px-3 flex items-center gap-1">
                                <History className="h-4 w-4" />
                                <span>History</span>
                                <ChevronDown className="h-4 w-4 ml-1" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            {apiVersions.map(version => (
                                <DropdownMenuItem key={version.id} onClick={() => handleLoadVersion(version.id)} className="flex flex-col items-start">
                                    <span className="font-medium">{version.id}</span>
                                    <span className="text-xs text-muted-foreground">{new Date(version.timestamp).toLocaleString()} by {version.author}</span>
                                </DropdownMenuItem>
                            ))}
                        </DropdownMenuContent>
                    </DropdownMenu>

                    <Button className="flex items-center gap-1" onClick={handleTest}>
                        <Play className="h-4 w-4" />
                        <span>Test</span>
                    </Button>

                    <Button className="flex items-center gap-1" onClick={handleSave} disabled={!isValid || isSaving}>
                        <Save className="h-4 w-4" />
                        <span>{isSaving ? "Saving..." : "Save"}</span>
                    </Button>
                </div>
            </div>

            <Tabs defaultValue="visual" className="w-full">
                <TabsList>
                    <TabsTrigger value="visual" className="flex items-center gap-1"><Code className="h-4 w-4" /><span>Visual Editor</span></TabsTrigger>
                    <TabsTrigger value="json" className="flex items-center gap-1"><FileJson className="h-4 w-4" /><span>JSON Editor</span></TabsTrigger>
                </TabsList>

                <TabsContent value="visual" className="mt-4">
                    <VisualProcessEditor
                        definition={processDefinition}
                        onDefinitionChange={handleDefinitionChange}
                        availableNodes={availableNodes}
                    />
                </TabsContent>

                <TabsContent value="json" className="mt-4">
                    <Card>
                        <CardContent className="pt-6">
                            <JsonEditor
                                initialValue={editorContent}
                                onChange={(value) => {
                                    setEditorContent(value);
                                    try {
                                        setProcessDefinition(JSON.parse(value));
                                    } catch (e) { /* ignore parse errors while typing */ }
                                }}
                                onValidate={handleValidation}
                                height="600px"
                            />
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            <Dialog open={showVersionDialog} onOpenChange={setShowVersionDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Load API Version</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to load version {selectedVersion}? Unsaved changes will be lost.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowVersionDialog(false)}>Cancel</Button>
                        <Button onClick={confirmLoadVersion}>Load Version</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}