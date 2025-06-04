import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Plus,
  Search,
  Filter,
  ArrowUpDown,
  MoreHorizontal,
  FileEdit,
  Copy,
  Trash2,
  CheckCircle,
  AlertCircle,
  Download,
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
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

// Sample API data (in a real app, this would come from an API)
const sampleApis = [
  {
    id: "f47ac10b-58cc-4372-a567-0e02b2c3d479",
    name: "Weather API",
    description: "External weather data API",
    version: "1.0.0",
    endpoints: 3,
    status: "active",
    lastUpdated: "2023-02-15T14:23:10Z",
    updatedBy: "jane.doe@example.com",
  },
  {
    id: "7d793789-f369-45c1-a7d5-8c4bb4b3a7f9",
    name: "User Service",
    description: "Internal user management service",
    version: "2.1.0",
    endpoints: 12,
    status: "active",
    lastUpdated: "2023-02-10T09:45:22Z",
    updatedBy: "john.smith@example.com",
  },
  {
    id: "e57ac3f5-0591-4d2c-98a0-c54d12c0623e",
    name: "Payment Gateway",
    description: "Integration with payment providers",
    version: "1.2.0",
    endpoints: 5,
    status: "inactive",
    lastUpdated: "2023-01-25T11:32:45Z",
    updatedBy: "john.smith@example.com",
  },
  {
    id: "a23b7c1d-e8f9-4g0h-1i2j-3k4l5m6n7o8p",
    name: "Product Catalog",
    description: "Product information and management",
    version: "3.0.1",
    endpoints: 8,
    status: "active",
    lastUpdated: "2023-02-12T16:40:18Z",
    updatedBy: "jane.doe@example.com",
  },
  {
    id: "9q8r7s6t-5u4v-3w2x-1y0z-abcdefghijkl",
    name: "Analytics Service",
    description: "Data analytics and reporting",
    version: "1.0.0",
    endpoints: 4,
    status: "draft",
    lastUpdated: "2023-02-14T08:15:30Z",
    updatedBy: "jane.doe@example.com",
  }
];

export default function ApiListPage() {
  const navigate = useNavigate();
  const [apis, setApis] = useState(sampleApis);
  const [searchQuery, setSearchQuery] = useState("");
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [apiToDelete, setApiToDelete] = useState<string | null>(null);
  
  const filteredApis = apis.filter(api => 
    api.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    api.description.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  const handleCreateApi = () => {
    navigate("/orchestrator/apis/new");
  };
  
  const handleImportApi = () => {
    navigate("/orchestrator/apis/import");
  };
  
  const handleEditApi = (apiId: string) => {
    navigate(`/orchestrator/apis/${apiId}`);
  };
  
  const handleDuplicateApi = (apiId: string) => {
    // In a real app, this would duplicate the API configuration
    console.log(`Duplicating API ${apiId}`);
  };
  
  const handleDeleteClick = (apiId: string) => {
    setApiToDelete(apiId);
    setShowDeleteDialog(true);
  };
  
  const confirmDelete = () => {
    if (apiToDelete) {
      // In a real app, this would delete the API configuration
      setApis(apis.filter(api => api.id !== apiToDelete));
      setShowDeleteDialog(false);
      setApiToDelete(null);
    }
  };
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "text-green-500 bg-green-500/10 border-green-500/20";
      case "inactive":
        return "text-amber-500 bg-amber-500/10 border-amber-500/20";
      case "draft":
        return "text-blue-500 bg-blue-500/10 border-blue-500/20";
      default:
        return "text-gray-500 bg-gray-500/10 border-gray-500/20";
    }
  };
  
  const getStatusIcon = (status: string) => {
    switch (status) {
      case "active":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "inactive":
        return <AlertCircle className="h-4 w-4 text-amber-500" />;
      default:
        return null;
    }
  };
  
  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">API Orchestrator</h1>
          <p className="text-muted-foreground">
            Manage and configure your API definitions
          </p>
          <div className="flex items-center space-x-2">
            <Button onClick={handleCreateApi} className="gap-1">
              <Plus className="h-4 w-4" />
              Create API
            </Button>
            <Button 
              className="border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground gap-1"
              onClick={handleImportApi}
            >
              <Download className="h-4 w-4" />
              Import API
            </Button>
          </div>
        </div>
        
      </div>
      
      <Card>
        <CardHeader className="pb-3">
          <CardTitle>API Configurations</CardTitle>
          <CardDescription>
            List of all API configurations in the system
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search APIs..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Button className="h-9 w-9 p-0 ml-2 border border-input rounded-md">
              <Filter className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[250px]">
                    <div className="flex items-center gap-1 cursor-pointer hover:text-primary">
                      Name
                      <ArrowUpDown className="h-3 w-3" />
                    </div>
                  </TableHead>
                  <TableHead>Version</TableHead>
                  <TableHead>Endpoints</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Last Updated</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredApis.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-6 text-muted-foreground">
                      No APIs found. Create a new API to get started.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredApis.map((api) => (
                    <TableRow key={api.id}>
                      <TableCell>
                        <div className="font-medium">{api.name}</div>
                        <div className="text-sm text-muted-foreground truncate max-w-[230px]">
                          {api.description}
                        </div>
                      </TableCell>
                      <TableCell>{api.version}</TableCell>
                      <TableCell>{api.endpoints}</TableCell>
                      <TableCell>
                        <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(api.status)}`}>
                          {getStatusIcon(api.status)}
                          <span className="capitalize">{api.status}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          {new Date(api.lastUpdated).toLocaleDateString()}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          by {api.updatedBy.split('@')[0]}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button className="h-8 w-8 p-0 hover:bg-accent hover:text-accent-foreground rounded-md">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem 
                              onClick={() => handleEditApi(api.id)}
                              className="flex items-center gap-2"
                            >
                              <FileEdit className="h-4 w-4" />
                              <span>Edit</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => handleDuplicateApi(api.id)}
                              className="flex items-center gap-2"
                            >
                              <Copy className="h-4 w-4" />
                              <span>Duplicate</span>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="flex items-center gap-2 text-destructive focus:text-destructive"
                              onClick={() => handleDeleteClick(api.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                              <span>Delete</span>
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <div className="text-sm text-muted-foreground">
            Showing {filteredApis.length} of {apis.length} APIs
          </div>
        </CardFooter>
      </Card>
      
      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete API Configuration</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this API configuration? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button 
              className="bg-background border border-input hover:bg-accent hover:text-accent-foreground" 
              onClick={() => setShowDeleteDialog(false)}
            >
              Cancel
            </Button>
            <Button 
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90" 
              onClick={confirmDelete}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
