import { useState } from "react";
import { useParams } from "react-router-dom";
import { 
  Save, 
  Play, 
  AlertTriangle, 
  History, 
  ChevronDown,
  FileJson,
  Code
} from "lucide-react";

import JsonEditor from "@/components/editors/JsonEditor";
import { apiConfigSchema } from "@/lib/schemas/api-schema";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
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

// Sample API data (in a real app, this would come from an API)
const sampleApiConfig = {
  id: "f47ac10b-58cc-4372-a567-0e02b2c3d479",
  name: "Sample Weather API",
  description: "A sample API configuration for weather data",
  version: "1.0.0",
  basePath: "/api/weather",
  globalHeaders: [
    {
      name: "X-API-Key",
      value: "{{API_KEY}}",
      enabled: true
    }
  ],
  globalAuthentication: {
    required: false,
    type: "none"
  },
  endpoints: [
    {
      id: "6c84fb90-12c4-11e1-840d-7b25c5ee775a",
      path: "/current",
      method: "GET",
      description: "Get current weather data for a location",
      enabled: true,
      authentication: {
        required: false,
        type: "none"
      },
      headers: [],
      parameters: [
        {
          name: "location",
          type: "string",
          description: "City name or location coordinates",
          required: true
        },
        {
          name: "units",
          type: "string",
          description: "Units of measurement (metric, imperial)",
          required: false,
          default: "metric"
        }
      ],
      targetUrl: "https://api.weatherapi.com/v1/current.json",
      caching: {
        enabled: true,
        ttlSeconds: 300,
        strategy: "memory"
      },
      rateLimiting: {
        enabled: true,
        requestsPerMinute: 60
      },
      lifecycleHooks: [
        {
          phase: "beforeRequest",
          pluginId: "transform-params",
          enabled: true,
          config: {
            transforms: [
              {
                param: "location",
                transform: "lowercase"
              }
            ]
          }
        }
      ],
      responseTemplates: [],
      mockResponse: {
        enabled: false,
        status: 200,
        delay: 0,
        headers: []
      },
      errorHandling: {
        retryCount: 2,
        retryDelay: 1000,
        timeoutMs: 5000
      }
    }
  ],
  tags: ["weather", "sample"],
  createdAt: "2023-01-01T00:00:00Z",
  updatedAt: "2023-01-02T00:00:00Z",
  documentation: {
    enabled: true,
    title: "Weather API Documentation",
    description: "API for retrieving weather data",
    contactEmail: "support@example.com"
  }
};

// Sample API versions for history
const apiVersions = [
  { id: "v3", timestamp: "2023-02-15T14:23:10Z", author: "jane.doe@example.com" },
  { id: "v2", timestamp: "2023-02-10T09:45:22Z", author: "john.smith@example.com" },
  { id: "v1", timestamp: "2023-02-05T16:30:05Z", author: "john.smith@example.com" }
];

export default function ApiEditorPage() {
  useParams(); // Keep for future use when we implement real API loading
  const [apiConfig, setApiConfig] = useState(sampleApiConfig);
  const [editorContent, setEditorContent] = useState(JSON.stringify(sampleApiConfig, null, 2));
  const [isValid, setIsValid] = useState(true);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [showVersionDialog, setShowVersionDialog] = useState(false);
  const [selectedVersion, setSelectedVersion] = useState<string | null>(null);
  
  const handleEditorChange = (value: string) => {
    setEditorContent(value);
    try {
      const parsed = JSON.parse(value);
      setApiConfig(parsed);
    } catch (e) {
      // Invalid JSON, handled by validation
    }
  };
  
  const handleValidation = (isValid: boolean) => {
    setIsValid(isValid);
    
    if (!isValid) {
      try {
        const parsed = JSON.parse(editorContent);
        const result = apiConfigSchema.safeParse(parsed);
        
        if (!result.success) {
          const errors = result.error.errors.map(err => `${err.path.join('.')}: ${err.message}`);
          setValidationErrors(errors);
        }
      } catch (e) {
        setValidationErrors(["Invalid JSON format"]);
      }
    } else {
      setValidationErrors([]);
    }
  };
  
  const handleSave = async () => {
    if (!isValid) return;
    
    setIsSaving(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // In a real app, you would save the apiConfig to the backend
    console.log("Saving API config:", apiConfig);
    
    setIsSaving(false);
  };
  
  const handleTest = () => {
    // In a real app, this would test the API configuration
    console.log("Testing API config");
  };
  
  const handleLoadVersion = (versionId: string) => {
    setSelectedVersion(versionId);
    setShowVersionDialog(true);
  };
  
  const confirmLoadVersion = () => {
    // In a real app, this would load the selected version from the backend
    console.log(`Loading version ${selectedVersion}`);
    setShowVersionDialog(false);
  };
  
  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">{apiConfig.name}</h1>
          <p className="text-muted-foreground">
            {apiConfig.description || "No description"} • Version {apiConfig.version}
          </p>
        </div>
        
        <div className="flex space-x-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button className="bg-background border border-input hover:bg-accent hover:text-accent-foreground h-9 rounded-md px-3 flex items-center gap-1">
                <History className="h-4 w-4" />
                <span>History</span>
                <ChevronDown className="h-4 w-4 ml-1" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {apiVersions.map(version => (
                <DropdownMenuItem 
                  key={version.id} 
                  onClick={() => handleLoadVersion(version.id)}
                  className="flex flex-col items-start"
                >
                  <span className="font-medium">{version.id}</span>
                  <span className="text-xs text-muted-foreground">
                    {new Date(version.timestamp).toLocaleString()} by {version.author}
                  </span>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          
          <Button 
            className="flex items-center gap-1" 
            onClick={handleTest}
          >
            <Play className="h-4 w-4" />
            <span>Test</span>
          </Button>
          
          <Button 
            className="flex items-center gap-1 bg-primary text-primary-foreground hover:bg-primary/90" 
            onClick={handleSave}
            disabled={!isValid || isSaving}
          >
            <Save className="h-4 w-4" />
            <span>{isSaving ? "Saving..." : "Save"}</span>
          </Button>
        </div>
      </div>
      
      {validationErrors.length > 0 && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <div className="font-medium">Validation errors:</div>
            <ul className="list-disc list-inside pl-2 text-sm">
              {validationErrors.slice(0, 5).map((error, index) => (
                <li key={index}>{error}</li>
              ))}
              {validationErrors.length > 5 && (
                <li>...and {validationErrors.length - 5} more errors</li>
              )}
            </ul>
          </AlertDescription>
        </Alert>
      )}
      
      <Tabs defaultValue="json" className="w-full">
        <TabsList>
          <TabsTrigger value="json" className="flex items-center gap-1">
            <FileJson className="h-4 w-4" />
            <span>JSON Editor</span>
          </TabsTrigger>
          <TabsTrigger value="visual" className="flex items-center gap-1">
            <Code className="h-4 w-4" />
            <span>Visual Editor</span>
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="json" className="mt-4">
          <Card>
            <CardContent className="pt-6">
              <JsonEditor
                initialValue={editorContent}
                onChange={handleEditorChange}
                onValidate={handleValidation}
                schema={apiConfigSchema}
                height="600px"
              />
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="visual" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Visual Editor</CardTitle>
              <CardDescription>
                Edit API configuration using a visual interface
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground italic">
                Visual editor is not implemented yet. Please use the JSON editor for now.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      {/* Version Loading Dialog */}
      <Dialog open={showVersionDialog} onOpenChange={setShowVersionDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Load API Version</DialogTitle>
            <DialogDescription>
              Are you sure you want to load version {selectedVersion}? Unsaved changes will be lost.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button 
              className="bg-background border border-input hover:bg-accent hover:text-accent-foreground" 
              onClick={() => setShowVersionDialog(false)}
            >
              Cancel
            </Button>
            <Button onClick={confirmLoadVersion}>
              Load Version
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
