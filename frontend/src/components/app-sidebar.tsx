import React from "react";
import {
  Sidebar,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarFooter,
  SidebarHeader,
} from "@/components/ui/sidebar";
import {
  LayoutDashboard,
  Layers,
  Puzzle,
  FileText,
  Calendar,
  Users,
  Settings,
  Server,
  LogOut,
  Folder,
  BookOpen,
  ChevronDown,
  ChevronRight,
  Database,
  Cloud,
  HardDrive,
  Shield,
  Wrench,
  Activity,
} from "lucide-react";

// You can extend this with your actual navigation items/config
export function AppSidebar() {
  const [platformOpen, setPlatformOpen] = React.useState(true);
  const [projectsOpen, setProjectsOpen] = React.useState(false);
  const [settingsOpen, setSettingsOpen] = React.useState(false);

  return (
    <Sidebar>
      <SidebarHeader className="h-16 px-4 border-b flex items-center">
        <span className="font-bold text-lg">DCR Dashboard</span>
      </SidebarHeader>
      <SidebarMenu className="flex-1 px-2 py-4 space-y-2">
        {/* Platform Section */}
        <SidebarGroup>
          <SidebarGroupLabel onClick={() => setPlatformOpen(!platformOpen)} className="flex items-center cursor-pointer select-none">
            <Server className="w-4 h-4 mr-2" /> Platform
            {platformOpen ? <ChevronDown className="ml-auto w-4 h-4" /> : <ChevronRight className="ml-auto w-4 h-4" />}
          </SidebarGroupLabel>
          {platformOpen && (
            <SidebarMenuSub>
              <SidebarMenuSubButton href="/" isActive size="md"><LayoutDashboard className="mr-2 w-4 h-4" /> Dashboard</SidebarMenuSubButton>
              <SidebarMenuSubButton href="/orchestrator" size="md"><Layers className="mr-2 w-4 h-4" /> Orchestrator</SidebarMenuSubButton>
              <SidebarMenuSubButton href="/plugins" size="md"><Puzzle className="mr-2 w-4 h-4" /> Plugins</SidebarMenuSubButton>
              <SidebarMenuSubButton href="/logs" size="md"><FileText className="mr-2 w-4 h-4" /> Logs</SidebarMenuSubButton>
              <SidebarMenuSubButton href="/scheduler" size="md"><Calendar className="mr-2 w-4 h-4" /> Scheduler</SidebarMenuSubButton>
              <SidebarMenuSubButton href="/users" size="md"><Users className="mr-2 w-4 h-4" /> Users</SidebarMenuSubButton>
              <SidebarMenuSubButton href="/documentation" size="md"><BookOpen className="mr-2 w-4 h-4" /> Documentation</SidebarMenuSubButton>
              <SidebarMenuSubButton href="/activity" size="md"><Activity className="mr-2 w-4 h-4" /> Activity</SidebarMenuSubButton>
            </SidebarMenuSub>
          )}
        </SidebarGroup>
        {/* Projects Section */}
        <SidebarGroup>
          <SidebarGroupLabel onClick={() => setProjectsOpen(!projectsOpen)} className="flex items-center cursor-pointer select-none">
            <Folder className="w-4 h-4 mr-2" /> Projects
            {projectsOpen ? <ChevronDown className="ml-auto w-4 h-4" /> : <ChevronRight className="ml-auto w-4 h-4" />}
          </SidebarGroupLabel>
          {projectsOpen && (
            <SidebarMenuSub>
              <SidebarMenuSubButton href="/projects/design-engineering" size="md"><HardDrive className="mr-2 w-4 h-4" /> Design Engineering</SidebarMenuSubButton>
              <SidebarMenuSubButton href="/projects/sales-marketing" size="md"><Cloud className="mr-2 w-4 h-4" /> Sales & Marketing</SidebarMenuSubButton>
              <SidebarMenuSubButton href="/projects/travel" size="md"><Database className="mr-2 w-4 h-4" /> Travel</SidebarMenuSubButton>
              <SidebarMenuSubButton href="/projects/more" size="md"><ChevronRight className="mr-2 w-4 h-4" /> More...</SidebarMenuSubButton>
            </SidebarMenuSub>
          )}
        </SidebarGroup>
        {/* Settings Section */}
        <SidebarGroup>
          <SidebarGroupLabel onClick={() => setSettingsOpen(!settingsOpen)} className="flex items-center cursor-pointer select-none">
            <Settings className="w-4 h-4 mr-2" /> Settings
            {settingsOpen ? <ChevronDown className="ml-auto w-4 h-4" /> : <ChevronRight className="ml-auto w-4 h-4" />}
          </SidebarGroupLabel>
          {settingsOpen && (
            <SidebarMenuSub>
              <SidebarMenuSubButton href="/settings/profile" size="md"><Users className="mr-2 w-4 h-4" /> Profile</SidebarMenuSubButton>
              <SidebarMenuSubButton href="/settings/security" size="md"><Shield className="mr-2 w-4 h-4" /> Security</SidebarMenuSubButton>
              <SidebarMenuSubButton href="/settings/integrations" size="md"><Wrench className="mr-2 w-4 h-4" /> Integrations</SidebarMenuSubButton>
              <SidebarMenuSubButton href="/settings/storage" size="md"><HardDrive className="mr-2 w-4 h-4" /> Storage</SidebarMenuSubButton>
              <SidebarMenuSubButton href="/settings/logout" size="md"><LogOut className="mr-2 w-4 h-4" /> Logout</SidebarMenuSubButton>
            </SidebarMenuSub>
          )}
        </SidebarGroup>
      </SidebarMenu>
      <SidebarFooter className="p-4 border-t mt-auto">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-full bg-muted" />
          <div>
            <p className="text-sm font-medium leading-none">Admin User</p>
            <p className="text-xs leading-none text-muted-foreground">admin@example.com</p>
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}

export default AppSidebar;
