import { useState } from "react";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";

import { 
  ArrowRight, 
  CheckCircle, 
  ExternalLink, 
  RefreshCw, 
  Server, 
  Shield, 
  Database as DbIcon,
  AlertTriangle,
  Clock,
  BarChart3
} from "lucide-react";

interface SystemMetric {
  label: string;
  value: number;
  status: "healthy" | "warning" | "error";
  icon: React.ReactNode;
}

interface RecentActivity {
  id: string;
  type: string;
  description: string;
  timestamp: string;
  status: "success" | "pending" | "error";
}

export default function DashboardPage() {
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  const systemMetrics: SystemMetric[] = [
    {
      label: "API Server",
      value: 98,
      status: "healthy",
      icon: <Server className="h-5 w-5" />,
    },
    {
      label: "Database",
      value: 92,
      status: "healthy",
      icon: <DbIcon className="h-5 w-5" />,
    },
    {
      label: "Cache",
      value: 88,
      status: "healthy",
      icon: <Shield className="h-5 w-5" />,
    },
    {
      label: "Log Service",
      value: 75,
      status: "warning",
      icon: <AlertTriangle className="h-5 w-5" />,
    },
  ];

  const recentActivities: RecentActivity[] = [
    {
      id: "act1",
      type: "CONFIG_UPDATE",
      description: "Payment gateway configuration updated",
      timestamp: "10 mins ago",
      status: "success",
    },
    {
      id: "act2",
      type: "API_CALL",
      description: "API request to /payment-gateway/v1/status",
      timestamp: "15 mins ago",
      status: "success",
    },
    {
      id: "act3",
      type: "PLUGIN_REGISTER",
      description: "New plugin 'Stripe Auth' registered",
      timestamp: "1 hour ago",
      status: "success",
    },
    {
      id: "act4",
      type: "API_VERSION",
      description: "Created version v2 of payment-gateway API",
      timestamp: "2 hours ago",
      status: "success",
    },
    {
      id: "act5",
      type: "API_CALL",
      description: "Failed request to /analytics/v1/reports",
      timestamp: "3 hours ago",
      status: "error",
    },
  ];
  
  function getStatusColor(status: string) {
    switch (status) {
      case "healthy":
      case "success":
        return "text-green-500";
      case "warning":
      case "pending":
        return "text-amber-500";
      case "error":
        return "text-destructive";
      default:
        return "text-muted-foreground";
    }
  }

  function getProgressColor(value: number) {
    if (value >= 90) return "bg-green-500";
    if (value >= 75) return "bg-amber-500";
    return "bg-destructive";
  }

  function refreshData() {
    setIsRefreshing(true);
    // This would be replaced with actual data fetching
    setTimeout(() => {
      setIsRefreshing(false);
    }, 1000);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <Button 
          onClick={refreshData}
          disabled={isRefreshing}
          className="bg-background border border-input hover:bg-accent hover:text-accent-foreground h-9 rounded-md px-3 text-xs"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="apis">APIs</TabsTrigger>
          <TabsTrigger value="plugins">Plugins</TabsTrigger>
          <TabsTrigger value="logs">Logs</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* System Health */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xl">System Health</CardTitle>
              <CardDescription>
                Current status of all system components
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                {systemMetrics.map((metric) => (
                  <Card key={metric.label} className="border-none shadow-none">
                    <CardContent className="p-0">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <div className={getStatusColor(metric.status)}>
                            {metric.icon}
                          </div>
                          <span className="font-medium">{metric.label}</span>
                        </div>
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${metric.status === "healthy" ? "bg-green-500/10 text-green-500" : metric.status === "warning" ? "bg-amber-500/10 text-amber-500" : "bg-destructive/10 text-destructive"}`}>
                          {metric.status}
                        </span>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Health</span>
                          <span className="font-medium">{metric.value}%</span>
                        </div>
                        <Progress value={metric.value} className={getProgressColor(metric.value)} />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Stats Overview */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
                <CardTitle className="text-sm font-medium">Total APIs</CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">12</div>
                <p className="text-xs text-muted-foreground mt-1">
                  +2 from last month
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
                <CardTitle className="text-sm font-medium">Active Endpoints</CardTitle>
                <CheckCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">48</div>
                <p className="text-xs text-muted-foreground mt-1">
                  +5 from last month
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
                <CardTitle className="text-sm font-medium">Registered Plugins</CardTitle>
                <Shield className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">7</div>
                <p className="text-xs text-muted-foreground mt-1">
                  +1 from last month
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
                <CardTitle className="text-sm font-medium">Scheduled Tasks</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">24</div>
                <p className="text-xs text-muted-foreground mt-1">
                  +3 from last month
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Recent Activity */}
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-xl">Recent Activity</CardTitle>
                  <CardDescription>Latest system activities and events</CardDescription>
                </div>
                <Button className="hover:bg-accent hover:text-accent-foreground h-9 rounded-md px-3 text-xs gap-1">
                  View all <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentActivities.map((activity) => (
                  <div key={activity.id} className="flex items-start gap-4">
                    <div className={`mt-1 rounded-full p-1 ${
                      activity.status === "success" 
                        ? "bg-green-500/20" 
                        : activity.status === "error" 
                          ? "bg-destructive/20" 
                          : "bg-amber-500/20"
                    }`}>
                      <div className={`h-2 w-2 rounded-full ${
                        activity.status === "success" 
                          ? "bg-green-500" 
                          : activity.status === "error" 
                            ? "bg-destructive" 
                            : "bg-amber-500"
                      }`} />
                    </div>
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium leading-none">
                          {activity.description}
                        </p>
                        <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium border bg-background">
                          {activity.type}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {activity.timestamp}
                      </p>
                    </div>
                    <Button className="hover:bg-accent hover:text-accent-foreground h-8 w-8 p-0 rounded-md">
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="apis" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>API Configuration</CardTitle>
              <CardDescription>Manage your API configurations and versions</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                This section will show detailed API information and allow you to manage configurations.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="plugins" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Plugin Management</CardTitle>
              <CardDescription>View and configure installed plugins</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                This section will show installed plugins and their status.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="logs" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>System Logs</CardTitle>
              <CardDescription>View and search system logs</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                This section will show system logs with filtering capabilities.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
