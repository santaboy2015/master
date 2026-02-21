import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth, useTheme, API } from "../../App";
import { Button } from "../../components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../../components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "../../components/ui/avatar";
import { 
  Sun, 
  Moon, 
  LogOut, 
  LayoutDashboard,
  Sparkles,
  Settings,
  DollarSign,
  MessageSquare,
  Key,
  Users,
  Home,
  ArrowLeft
} from "lucide-react";
import axios from "axios";
import { toast } from "sonner";

const adminNavLinks = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/site-settings", label: "Site Settings", icon: Settings },
  { href: "/admin/pricing", label: "Pricing", icon: DollarSign },
  { href: "/admin/prompts", label: "AI Prompts", icon: MessageSquare },
  { href: "/admin/api-keys", label: "API Keys", icon: Key },
  { href: "/admin/users", label: "Users", icon: Users },
];

export const AdminNavbar = () => {
  const { user, logout, refreshUser } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  const handleAdminLogout = async () => {
    try {
      await axios.post(`${API}/admin/logout`, {}, { withCredentials: true });
      await refreshUser();
      toast.success("Admin session ended");
      navigate("/dashboard");
    } catch (error) {
      console.error("Admin logout error:", error);
    }
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass" data-testid="admin-navbar">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center gap-4">
            <Link to="/admin" className="flex items-center gap-2 group" data-testid="admin-nav-logo">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#FF0055] to-[#7000FF] flex items-center justify-center shadow-glow">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <span className="font-heading font-bold text-xl tracking-tight">
                <span className="gradient-text">LOVE</span>
                <span className="text-foreground">-AI</span>
                <span className="text-xs ml-2 text-muted-foreground">Admin</span>
              </span>
            </Link>
          </div>

          {/* Desktop Nav */}
          <div className="hidden lg:flex items-center gap-1">
            {adminNavLinks.map((link) => {
              const Icon = link.icon;
              const isActive = location.pathname === link.href;
              return (
                <Link
                  key={link.href}
                  to={link.href}
                  data-testid={`admin-nav-${link.label.toLowerCase().replace(' ', '-')}`}
                  className={`px-3 py-2 rounded-xl text-sm font-medium transition-all flex items-center gap-2 ${
                    isActive 
                      ? "bg-primary/10 text-primary" 
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {link.label}
                </Link>
              );
            })}
          </div>

          {/* Right side */}
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate("/dashboard")}
              className="rounded-xl"
              data-testid="back-to-app-btn"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to App
            </Button>
            
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              className="rounded-xl"
              data-testid="admin-theme-toggle"
            >
              {theme === "dark" ? (
                <Sun className="w-5 h-5" />
              ) : (
                <Moon className="w-5 h-5" />
              )}
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="rounded-xl p-1" data-testid="admin-user-menu">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={user?.picture} alt={user?.name} />
                    <AvatarFallback className="bg-primary text-primary-foreground">
                      {user?.name?.charAt(0)?.toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 rounded-2xl">
                <div className="px-3 py-2">
                  <p className="font-medium">{user?.name}</p>
                  <p className="text-sm text-muted-foreground">{user?.email}</p>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleAdminLogout}>
                  <LogOut className="w-4 h-4 mr-2" />
                  Exit Admin
                </DropdownMenuItem>
                <DropdownMenuItem onClick={logout} className="text-destructive">
                  <LogOut className="w-4 h-4 mr-2" />
                  Sign Out Completely
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </nav>
  );
};

export const AdminLayout = ({ children }) => {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <AdminNavbar />
      <main className="flex-1 pt-16">
        {children}
      </main>
    </div>
  );
};
