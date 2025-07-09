import { Outlet } from "react-router-dom";
import { ThemeToggle } from "@/components/theme-toggle";
import { AppSidebar } from "@/components/app-sidebar";
import {
  SidebarProvider,
  SidebarInset,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { RefreshCw } from "lucide-react";

interface SidebarNavProps extends React.HTMLAttributes<HTMLElement> {
  items: {
    href: string;
    title: string;
    icon: React.ReactNode;
  }[];
}

export function SidebarNav({ className, items, ...props }: z.infer<typeof SidebarNavPropsSchema>) {
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
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2">
          <div className="flex items-center gap-2 px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 data-[orientation=vertical]:h-4" />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem className="hidden md:block">
                  <BreadcrumbLink href="#">Building Your Application</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator className="hidden md:block" />
                <BreadcrumbItem>
                  <BreadcrumbPage>Data Fetching</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
          <div className="flex-1" />
          <div className="flex items-center gap-4 pr-4">
            <button 
              className="flex items-center justify-center p-2 rounded-md border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground" 
              title="Refresh"
            >
              <RefreshCw className="h-4 w-4" />
            </button>
            <ThemeToggle />
          </div>
        </header>
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
          <Outlet />
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
