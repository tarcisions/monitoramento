import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/store/useAppStore";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { 
  BarChart3, 
  Bot, 
  Play, 
  Send, 
  Settings,
  ChevronLeft,
  ChevronRight
} from "lucide-react";

const navigation = [
  {
    name: 'Dashboard',
    href: '/',
    icon: BarChart3
  },
  {
    name: 'Robôs',
    href: '/robots',
    icon: Bot
  },
  {
    name: 'Execuções',
    href: '/executions', 
    icon: Play
  },
  {
    name: 'Bots Telegram',
    href: '/telegram-bots',
    icon: Send
  },
  {
    name: 'Configurações',
    href: '/settings',
    icon: Settings
  }
];

export default function Sidebar() {
  const [location] = useLocation();
  const { user, robots, sidebarCollapsed, setSidebarCollapsed } = useAppStore();
  
  const activeRobotsCount = robots.filter(r => r.status !== 'idle').length;
  
  return (
    <aside className={cn(
      "bg-white shadow-lg flex flex-col border-r border-border transition-all duration-200",
      sidebarCollapsed ? "w-16" : "w-64"
    )}>
      {/* Header */}
      <div className="p-6 border-b border-border flex items-center justify-between">
        {!sidebarCollapsed && (
          <h1 className="text-xl font-bold text-gray-900 flex items-center">
            <Bot className="text-primary mr-3" size={24} />
            RPA Monitor
          </h1>
        )}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          className="p-2"
          data-testid="button-toggle-sidebar"
        >
          {sidebarCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </Button>
      </div>
      
      {/* Navigation */}
      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {navigation.map((item) => {
            const isActive = location === item.href || (item.href !== '/' && location.startsWith(item.href));
            const Icon = item.icon;
            
            return (
              <li key={item.name}>
                <Link href={item.href}>
                  <a
                    className={cn(
                      "flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors",
                      isActive
                        ? "text-white bg-primary"
                        : "text-gray-700 hover:bg-gray-100",
                      sidebarCollapsed && "justify-center px-2"
                    )}
                    data-testid={`nav-${item.name.toLowerCase().replace(/\s+/g, '-')}`}
                  >
                    <Icon size={20} className={cn(
                      sidebarCollapsed ? "mr-0" : "mr-3"
                    )} />
                    {!sidebarCollapsed && (
                      <>
                        {item.name}
                        {item.name === 'Robôs' && activeRobotsCount > 0 && (
                          <Badge 
                            className="ml-auto bg-success text-success-foreground"
                            data-testid="badge-active-robots"
                          >
                            {activeRobotsCount}
                          </Badge>
                        )}
                      </>
                    )}
                  </a>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
      
      {/* User Profile */}
      <div className="p-4 border-t border-border">
        <div className={cn(
          "flex items-center",
          sidebarCollapsed ? "justify-center" : ""
        )}>
          <Avatar className="w-8 h-8">
            <AvatarFallback className="bg-primary text-primary-foreground text-sm font-semibold">
              {user?.nome?.charAt(0)?.toUpperCase() || 'A'}
            </AvatarFallback>
          </Avatar>
          {!sidebarCollapsed && (
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-900" data-testid="text-user-name">
                {user?.nome || 'Admin'}
              </p>
              <p className="text-xs text-gray-500">
                {user?.role === 'admin' ? 'Administrador' : 
                 user?.role === 'operador' ? 'Operador' : 'Visualizador'}
              </p>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
