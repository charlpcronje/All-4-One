import { useState, useEffect } from "react";
import { 
  GitBranch, 
  GitCommit, 
  Clock, 
  User, 
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  ArrowLeftRight,
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
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";

interface CommitInfo {
  hash: string;
  shortHash: string;
  message: string;
  author: string;
  date: string;
  changes: {
    added: number;
    modified: number;
    deleted: number;
  };
}

interface VersionHistoryViewerProps {
  apiId: string;
  apiName: string;
  showFileDiff?: boolean;
  onVersionSelect?: (version: string) => void;
}

export default function VersionHistoryViewer({
  apiId,
  apiName,
  showFileDiff = false,
  onVersionSelect,
}: VersionHistoryViewerProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [commits, setCommits] = useState<CommitInfo[]>([]);
  const [selectedCommit, setSelectedCommit] = useState<CommitInfo | null>(null);
  const [diffDialogOpen, setDiffDialogOpen] = useState(false);
  const [diffContent, setDiffContent] = useState<string | null>(null);
  const [diffLoading, setDiffLoading] = useState(false);
  
  useEffect(() => {
    // In a real app, fetch from API
    fetchCommitHistory();
  }, [apiId]);
  
  const fetchCommitHistory = () => {
    setLoading(true);
    setError(null);
    
    // Simulate API call with mock data
    setTimeout(() => {
      try {
        const mockCommits: CommitInfo[] = [
          {
            hash: "a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0",
            shortHash: "a1b2c3d",
            message: "Update authentication parameters for weather API",
            author: "jane.doe@example.com",
            date: "2025-06-03T09:45:22+02:00",
            changes: { added: 5, modified: 12, deleted: 2 }
          },
          {
            hash: "b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1",
            shortHash: "b2c3d4e",
            message: "Add rate limiting configuration",
            author: "john.smith@example.com",
            date: "2025-06-02T14:32:15+02:00",
            changes: { added: 8, modified: 3, deleted: 0 }
          },
          {
            hash: "c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2",
            shortHash: "c3d4e5f",
            message: "Initial import from Postman collection",
            author: "system",
            date: "2025-06-01T11:15:08+02:00",
            changes: { added: 35, modified: 0, deleted: 0 }
          }
        ];
        
        setCommits(mockCommits);
        setLoading(false);
      } catch (err) {
        setError("Failed to load commit history");
        setLoading(false);
      }
    }, 1200);
  };
  
  const handleViewDiff = (commit: CommitInfo) => {
    setSelectedCommit(commit);
    setDiffLoading(true);
    setDiffDialogOpen(true);
    
    // Simulate API call for diff content
    setTimeout(() => {
      const mockDiff = `diff --git a/apis/weather-api/v1/config.json b/apis/weather-api/v1/config.json
--- a/apis/weather-api/v1/config.json
+++ b/apis/weather-api/v1/config.json
@@ -15,9 +15,14 @@
   "authentication": {
-    "type": "apiKey",
-    "headerName": "X-API-Key"
+    "type": "oauth2",
+    "tokenUrl": "https://api.weather.example.com/oauth/token",
+    "clientId": "{{CLIENT_ID}}",
+    "clientSecret": "{{CLIENT_SECRET}}",
+    "scopes": ["read", "write"]
   },
   "rateLimit": {
-    "requestsPerMinute": 60
+    "requestsPerMinute": 100,
+    "burstSize": 10,
+    "strategy": "token-bucket"
   }
 }`;
      
      setDiffContent(mockDiff);
      setDiffLoading(false);
    }, 800);
  };
  
  const handleSelectVersion = () => {
    if (selectedCommit && onVersionSelect) {
      onVersionSelect(selectedCommit.shortHash);
      setDiffDialogOpen(false);
    }
  };
  
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };
  
  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="text-xl flex items-center gap-2">
              <GitBranch className="h-5 w-5" />
              Version History
            </CardTitle>
            <CardDescription>
              Configuration changes for {apiName}
            </CardDescription>
          </div>
          <Button
            size="sm"
            className="flex items-center gap-1"
            onClick={fetchCommitHistory}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            {loading ? 'Loading...' : 'Refresh'}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {error && (
          <Alert className="mb-4 border-destructive/50 text-destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        <ScrollArea className="h-[350px]">
          {loading ? (
            // Loading skeleton
            Array(3).fill(0).map((_, i) => (
              <div key={i} className="flex flex-col space-y-3 mb-4">
                <div className="flex gap-2 items-center">
                  <Skeleton className="h-4 w-4 rounded-full" />
                  <Skeleton className="h-4 w-24" />
                </div>
                <Skeleton className="h-4 w-full" />
                <div className="flex gap-4">
                  <Skeleton className="h-3 w-32" />
                  <Skeleton className="h-3 w-24" />
                </div>
                {i < 2 && <Skeleton className="h-px w-full bg-border mt-2" />}
              </div>
            ))
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[100px]">Commit</TableHead>
                  <TableHead>Message</TableHead>
                  <TableHead>Author</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {commits.map((commit) => (
                  <TableRow key={commit.hash}>
                    <TableCell className="font-mono text-xs">
                      <div className="flex items-center gap-1">
                        <GitCommit className="h-3.5 w-3.5 text-muted-foreground" />
                        {commit.shortHash}
                      </div>
                    </TableCell>
                    <TableCell>{commit.message}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <User className="h-3.5 w-3.5 text-muted-foreground" />
                        {commit.author}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                        {formatDate(commit.date)}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button 
                        size="sm"
                        className="h-8 gap-1"
                        onClick={() => handleViewDiff(commit)}
                      >
                        <ArrowLeftRight className="h-3.5 w-3.5" />
                        View Changes
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </ScrollArea>
      </CardContent>
      
      {/* Diff Dialog */}
      <Dialog open={diffDialogOpen} onOpenChange={setDiffDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Changes for commit {selectedCommit?.shortHash}</DialogTitle>
            <DialogDescription>
              {selectedCommit?.message} - by {selectedCommit?.author} on {selectedCommit && formatDate(selectedCommit.date)}
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex-1 min-h-0 overflow-hidden my-4">
            {diffLoading ? (
              <div className="space-y-2 p-4">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-5/6" />
                <Skeleton className="h-4 w-2/3" />
              </div>
            ) : (
              <ScrollArea className="h-[400px] border rounded-md">
                <pre className="p-4 text-xs font-mono whitespace-pre-wrap bg-muted">
                  {diffContent}
                </pre>
              </ScrollArea>
            )}
          </div>
          
          <DialogFooter>
            <div className="flex justify-between w-full">
              <Button 
                className="bg-background border border-input hover:bg-accent hover:text-accent-foreground"
                onClick={() => setDiffDialogOpen(false)}
              >
                Close
              </Button>
              
              {showFileDiff && onVersionSelect && (
                <Button onClick={handleSelectVersion}>
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Use This Version
                </Button>
              )}
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
