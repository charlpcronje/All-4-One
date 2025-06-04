import { Link, Outlet } from "react-router-dom";
import { ThemeToggle } from "@/components/theme-toggle";
import { cn } from "@/lib/utils";
import { 
  LayoutDashboard, 
  Settings, 
  Layers, 
  FileText, 
  Calendar, 
  Users, 
  LogOut, 
  PuzzleIcon,
  RefreshCw
} from "lucide-react";
// Button component replaced with regular buttons
import { ScrollArea } from "@/components/ui/scroll-area";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useState } from "react";

interface SidebarNavProps extends React.HTMLAttributes<HTMLElement> {
  items: {
    href: string;
    title: string;
    icon: React.ReactNode;
  }[];
}

export function SidebarNav({ className, items, ...props }: SidebarNavProps) {
  return (
    <nav className={cn("flex flex-col", className)} {...props}>
      {items.map((item) => {
        return (
          <Link 
            key={item.href} 
            to={item.href} 
            className="flex h-10 items-center justify-start px-4 py-2 my-1 w-full rounded-md text-sm font-medium transition-colors hover:bg-sidebar-accent/20 hover:text-sidebar-foreground"
          >
            <span className="mr-2">{item.icon}</span>
            {item.title}
          </Link>
        );
      })}
    </nav>
  );
}

export default function DashboardLayout() {
  const [collapsed, setCollapsed] = useState(false);

  const sidebarNavItems = [
    {
      title: "Dashboard",
      href: "/",
      icon: <LayoutDashboard className="h-5 w-5" />,
    },
    {
      title: "Orchestrator",
      href: "/orchestrator",
      icon: <Layers className="h-5 w-5" />,
    },
    {
      title: "Plugins",
      href: "/plugins",
      icon: <PuzzleIcon className="h-5 w-5" />,
    },
    {
      title: "Logs",
      href: "/logs",
      icon: <FileText className="h-5 w-5" />,
    },
    {
      title: "Scheduler",
      href: "/scheduler",
      icon: <Calendar className="h-5 w-5" />,
    },
    {
      title: "Users",
      href: "/users",
      icon: <Users className="h-5 w-5" />,
    },
    {
      title: "Settings",
      href: "/settings",
      icon: <Settings className="h-5 w-5" />,
    },
  ];

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-background text-foreground">
      {/* Sidebar */}
      <aside
        className={cn(
          "bg-sidebar border-r border-sidebar-border flex flex-col",
          collapsed ? "w-16" : "w-64"
        )}
      >
        {/* Logo */}
        <div className="h-16 flex items-center px-4 border-b border-sidebar-border">
          <h1 className={cn("font-bold text-lg text-sidebar-foreground", 
            collapsed && "sr-only"
          )}>
            DCR Dashboard
          </h1>
          {collapsed && <span className="text-xl font-bold">DCR</span>}
          <button
            className="ml-auto p-2 rounded-md hover:bg-sidebar-accent/20 transition-colors"
            onClick={() => setCollapsed(!collapsed)}
          >
            <svg
              width="15"
              height="15"
              viewBox="0 0 15 15"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4 rotate-180"
            >
              <path
                d="M8.84182 3.13514C9.04327 3.32401 9.05348 3.64042 8.86462 3.84188L5.43521 7.49991L8.86462 11.1579C9.05348 11.3594 9.04327 11.6758 8.84182 11.8647C8.64036 12.0535 8.32394 12.0433 8.13508 11.8419L4.38508 7.84188C4.20477 7.64955 4.20477 7.35027 4.38508 7.15794L8.13508 3.15794C8.32394 2.95648 8.64036 2.94628 8.84182 3.13514Z"
                fill="currentColor"
                fillRule="evenodd"
                clipRule="evenodd"
              ></path>
            </svg>
          </button>
        </div>

        {/* Navigation */}
        <div className="flex-1 flex flex-col">
          <ScrollArea className="py-4">
            <SidebarNav
              items={sidebarNavItems}
              className={cn("px-2", collapsed && "items-center")}
            />
          </ScrollArea>
        </div>

        {/* User */}
        <div className="mt-auto p-4 border-t border-sidebar-border">
          <div className="flex items-center gap-3">
            <Avatar className="h-9 w-9">
              <AvatarImage src="/avatar.jpg" alt="User" />
              <AvatarFallback>AD</AvatarFallback>
            </Avatar>
            {!collapsed && (
              <div className="space-y-1">
                <p className="text-sm font-medium leading-none text-sidebar-foreground">
                  Admin User
                </p>
                <p className="text-xs leading-none text-sidebar-foreground/70">
                  admin@example.com
                </p>
              </div>
            )}
            {!collapsed && (
              <button className="ml-auto p-2 rounded-md hover:bg-sidebar-accent/20 transition-colors">
                <LogOut className="h-5 w-5" />
              </button>
            )}
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="h-16 border-b flex items-center px-6 sticky top-0 z-10 bg-background/95 backdrop-blur">
          <div className="flex-1" />
          <div className="flex items-center gap-4">
            <button 
              className="flex items-center justify-center p-2 rounded-md border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground" 
              title="Refresh"
            >
              <RefreshCw className="h-4 w-4" />
            </button>
            <ThemeToggle />
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
