import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Upload,
  FileJson,
  AlertCircle,
  CheckCircle,
  Loader2,
} from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";

interface ImportedEndpoint {
  path: string;
  method: string;
  description?: string;
  params?: any[];
  headers?: any[];
  valid: boolean;
}

interface ParsedCollection {
  name: string;
  description?: string;
  baseUrl?: string;
  endpoints: ImportedEndpoint[];
}

export default function ApiImportPage() {
  const navigate = useNavigate();
  const [importMethod, setImportMethod] = useState<"file" | "json">("file");
  const [file, setFile] = useState<File | null>(null);
  const [jsonInput, setJsonInput] = useState("");
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [importError, setImportError] = useState<string | null>(null);
  const [parsedCollection, setParsedCollection] = useState<ParsedCollection | null>(null);
  const [importComplete, setImportComplete] = useState(false);
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
      setImportError(null);
    }
  };
  
  const handleJsonInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setJsonInput(e.target.value);
    setImportError(null);
  };
  
  const parsePostmanCollection = (json: any): ParsedCollection | null => {
    try {
      // Basic validation
      if (!json.info || !json.info.name || !json.item || !Array.isArray(json.item)) {
        throw new Error("Invalid Postman collection format");
      }
      
      const collection: ParsedCollection = {
        name: json.info.name,
        description: json.info.description?.content || json.info.description,
        baseUrl: json.variable?.find((v: any) => v.key === "baseUrl")?.value || "",
        endpoints: []
      };
      
      // Process all items (folders and requests)
      const processItems = (items: any[], basePath = "") => {
        items.forEach(item => {
          if (item.item && Array.isArray(item.item)) {
            // This is a folder
            const folderPath = basePath + (basePath ? "/" : "") + item.name;
            processItems(item.item, folderPath);
          } else if (item.request) {
            // This is an endpoint
            const request = item.request;
            const method = request.method || "GET";
            
            // Handle path
            let path = "";
            if (typeof request.url === "string") {
              path = request.url;
            } else if (request.url && request.url.path) {
              path = Array.isArray(request.url.path) 
                ? request.url.path.join("/") 
                : request.url.path;
            }
            
            // Format path
            if (path && !path.startsWith("/")) {
              path = "/" + path;
            }
            
            if (basePath) {
              path = "/" + basePath + path;
            }
            
            // Extract headers
            const headers = request.header?.map((h: any) => ({
              key: h.key,
              value: h.value,
              enabled: h.disabled !== true
            })) || [];
            
            // Extract params
            const params = request.url?.query?.map((p: any) => ({
              key: p.key,
              value: p.value,
              enabled: p.disabled !== true
            })) || [];
            
            collection.endpoints.push({
              path,
              method,
              description: item.name || "",
              headers,
              params,
              valid: !!path && !!method
            });
          }
        });
      };
      
      processItems(json.item);
      return collection;
    } catch (err) {
      console.error("Error parsing Postman collection:", err);
      setImportError(err instanceof Error ? err.message : "Failed to parse collection");
      return null;
    }
  };
  
  const handleParseCollection = async () => {
    setImportError(null);
    setIsImporting(true);
    setImportProgress(10);
    
    try {
      let jsonData: any;
      
      // Get JSON content based on import method
      if (importMethod === "file") {
        if (!file) {
          throw new Error("Please select a file to import");
        }
        
        const fileContent = await file.text();
        setImportProgress(30);
        try {
          jsonData = JSON.parse(fileContent);
        } catch (err) {
          throw new Error("Invalid JSON file. Please check the file format.");
        }
      } else {
        if (!jsonInput.trim()) {
          throw new Error("Please enter JSON content to import");
        }
        
        try {
          jsonData = JSON.parse(jsonInput);
        } catch (err) {
          throw new Error("Invalid JSON content. Please check the format.");
        }
      }
      
      setImportProgress(50);
      
      // Parse the collection
      const collection = parsePostmanCollection(jsonData);
      setImportProgress(80);
      
      if (!collection) {
        throw new Error("Failed to parse Postman collection");
      }
      
      if (collection.endpoints.length === 0) {
        throw new Error("No valid endpoints found in the collection");
      }
      
      setParsedCollection(collection);
      setImportProgress(100);
      setImportComplete(true);
    } catch (err) {
      setImportError(err instanceof Error ? err.message : "An unknown error occurred");
    } finally {
      setIsImporting(false);
    }
  };
  
  const handleImport = () => {
    // In a real implementation, this would make an API call to the backend
    // to create the API and endpoints in the database
    console.log("Importing API:", parsedCollection);
    
    // Mock success - in a real app, navigate after successful API response
    setTimeout(() => {
      navigate("/orchestrator/apis");
    }, 1000);
  };
  
  const goBack = () => {
    navigate("/orchestrator/apis");
  };
  
  return (
    <div className="container py-6 max-w-5xl">
      <div className="mb-6">
        <Button 
          variant="ghost" 
          onClick={goBack}
          className="gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to APIs
        </Button>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Import API</CardTitle>
          <CardDescription>
            Import an existing API from a Postman Collection (v2.1)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!importComplete ? (
            <>
              <Tabs value={importMethod} onValueChange={(v) => setImportMethod(v as "file" | "json")}>
                <TabsList className="mb-4">
                  <TabsTrigger value="file" className="flex items-center gap-2">
                    <Upload className="h-4 w-4" />
                    Upload File
                  </TabsTrigger>
                  <TabsTrigger value="json" className="flex items-center gap-2">
                    <FileJson className="h-4 w-4" />
                    Paste JSON
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="file">
                  <div className="grid gap-4">
                    <Label htmlFor="import-file">Postman Collection File</Label>
                    <Input 
                      id="import-file" 
                      type="file" 
                      accept=".json,application/json" 
                      onChange={handleFileChange}
                      disabled={isImporting}
                    />
                    <p className="text-sm text-muted-foreground">
                      Upload a Postman Collection v2.1 JSON file
                    </p>
                  </div>
                </TabsContent>
                
                <TabsContent value="json">
                  <div className="grid gap-4">
                    <Label htmlFor="json-content">Postman Collection JSON</Label>
                    <Textarea 
                      id="json-content" 
                      placeholder='Paste your Postman Collection JSON here...'
                      className="min-h-[200px] font-mono text-sm"
                      onChange={handleJsonInputChange}
                      disabled={isImporting}
                    />
                  </div>
                </TabsContent>
              </Tabs>
              
              {importError && (
                <Alert className="mt-4 border-destructive/50 text-destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>{importError}</AlertDescription>
                </Alert>
              )}
              
              {isImporting && (
                <div className="mt-6">
                  <div className="flex items-center gap-2 mb-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Processing collection...</span>
                  </div>
                  <Progress value={importProgress} className="h-2" />
                </div>
              )}
            </>
          ) : (
            <>
              <Alert className="mb-6">
                <CheckCircle className="h-4 w-4" />
                <AlertTitle>Collection Parsed Successfully</AlertTitle>
                <AlertDescription>
                  Found {parsedCollection?.endpoints.length} endpoints in the collection.
                </AlertDescription>
              </Alert>
              
              <div className="grid gap-4 mb-6">
                <div>
                  <h3 className="text-lg font-medium">API Details</h3>
                  <div className="grid grid-cols-2 gap-4 mt-2">
                    <div>
                      <Label>Name</Label>
                      <p className="text-sm font-medium">{parsedCollection?.name}</p>
                    </div>
                    {parsedCollection?.baseUrl && (
                      <div>
                        <Label>Base URL</Label>
                        <p className="text-sm font-medium">{parsedCollection?.baseUrl}</p>
                      </div>
                    )}
                    {parsedCollection?.description && (
                      <div className="col-span-2">
                        <Label>Description</Label>
                        <p className="text-sm">{parsedCollection?.description}</p>
                      </div>
                    )}
                  </div>
                </div>
                
                <div>
                  <h3 className="text-lg font-medium mb-2">Endpoints</h3>
                  <div className="border rounded-md">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Method</TableHead>
                          <TableHead>Path</TableHead>
                          <TableHead>Description</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {parsedCollection?.endpoints.map((endpoint, index) => (
                          <TableRow key={`${endpoint.method}-${endpoint.path}-${index}`}>
                            <TableCell>
                              <div 
                                className={`inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold 
                                  ${endpoint.method === "GET" ? "bg-blue-500/10 text-blue-600 border-blue-200" :
                                  endpoint.method === "POST" ? "bg-green-500/10 text-green-600 border-green-200" :
                                  endpoint.method === "PUT" ? "bg-amber-500/10 text-amber-600 border-amber-200" :
                                  endpoint.method === "DELETE" ? "bg-red-500/10 text-red-600 border-red-200" :
                                  "bg-gray-500/10 text-gray-600 border-gray-200"
                                }`}
                              >
                                {endpoint.method}
                              </div>
                            </TableCell>
                            <TableCell className="font-mono text-xs">
// ...
                            </TableCell>
                            <TableCell className="max-w-[200px] truncate">
                              {endpoint.description || "-"}
                            </TableCell>
                            <TableCell>
                              {endpoint.valid ? (
                                <div className="inline-flex items-center rounded-md border border-green-200 bg-green-500/10 px-2.5 py-0.5 text-xs font-semibold text-green-600">
                                  Valid
                                </div>
                              ) : (
                                <div className="inline-flex items-center rounded-md border border-red-200 bg-red-500/10 px-2.5 py-0.5 text-xs font-semibold text-red-600">
                                  Invalid
                                </div>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              </div>
            </>
          )}
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button
            className="border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground"
            onClick={goBack}
          >
            Cancel
          </Button>
          
          {!importComplete ? (
            <Button 
              onClick={handleParseCollection} 
              disabled={isImporting || (importMethod === "file" && !file) || (importMethod === "json" && !jsonInput.trim())}
            >
              {isImporting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Parse Collection
            </Button>
          ) : (
            <Button onClick={handleImport}>
              Import API
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}
