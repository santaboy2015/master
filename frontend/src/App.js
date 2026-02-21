import { useEffect, useState, useCallback, createContext, useContext, useRef } from "react";
import "@/App.css";
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation } from "react-router-dom";
import axios from "axios";

// Pages
import LandingPage from "./pages/LandingPage";
import Dashboard from "./pages/Dashboard";
import ConversationStarters from "./pages/ConversationStarters";
import ChatReply from "./pages/ChatReply";
import BioGenerator from "./pages/BioGenerator";
import ProfileReview from "./pages/ProfileReview";
import Pricing from "./pages/Pricing";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsOfService from "./pages/TermsOfService";
import RefundPolicy from "./pages/RefundPolicy";
import CookiePolicy from "./pages/CookiePolicy";
import AIDisclosure from "./pages/AIDisclosure";
import Disclaimer from "./pages/Disclaimer";
import Contact from "./pages/Contact";

// Admin Pages
import AdminLogin from "./pages/admin/AdminLogin";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminSiteSettings from "./pages/admin/AdminSiteSettings";
import AdminPricing from "./pages/admin/AdminPricing";
import AdminPrompts from "./pages/admin/AdminPrompts";
import AdminApiKeys from "./pages/admin/AdminApiKeys";
import AdminUsers from "./pages/admin/AdminUsers";

// Components
import { Toaster } from "./components/ui/sonner";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Auth Context
const AuthContext = createContext(null);

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const checkAuth = useCallback(async () => {
    // CRITICAL: If returning from OAuth callback, skip the /me check.
    // AuthCallback will exchange the session_id and establish the session first.
    if (window.location.hash?.includes('session_id=')) {
      setLoading(false);
      return;
    }
    
    try {
      const response = await axios.get(`${API}/auth/me`, {
        withCredentials: true
      });
      setUser(response.data);
    } catch (error) {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const login = (intendedPath) => {
    // Store the intended destination before redirecting to OAuth
    const destination = intendedPath || window.location.pathname;
    if (destination !== '/' && destination !== '/dashboard') {
      localStorage.setItem('auth_redirect_path', destination);
    }
    // REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH
    const redirectUrl = window.location.origin + '/dashboard';
    window.location.href = `https://auth.emergentagent.com/?redirect=${encodeURIComponent(redirectUrl)}`;
  };

  const logout = async () => {
    try {
      await axios.post(`${API}/auth/logout`, {}, { withCredentials: true });
    } catch (error) {
      console.error("Logout error:", error);
    }
    setUser(null);
    window.location.href = '/';
  };

  const refreshUser = async () => {
    try {
      const response = await axios.get(`${API}/auth/me`, {
        withCredentials: true
      });
      setUser(response.data);
    } catch (error) {
      console.error("Refresh user error:", error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, setUser, loading, login, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};

// Auth Callback Component
const AuthCallback = () => {
  const navigate = useNavigate();
  const { setUser } = useAuth();
  const hasProcessed = useRef(false);

  useEffect(() => {
    if (hasProcessed.current) return;
    hasProcessed.current = true;

    const processAuth = async () => {
      const hash = window.location.hash;
      const sessionId = hash.split('session_id=')[1]?.split('&')[0];

      if (!sessionId) {
        navigate('/');
        return;
      }

      try {
        const response = await axios.post(`${API}/auth/session`, {
          session_id: sessionId
        }, { withCredentials: true });

        setUser(response.data);
        
        // Check for stored redirect path (deep linking support)
        const storedPath = localStorage.getItem('auth_redirect_path');
        localStorage.removeItem('auth_redirect_path');
        
        const redirectTo = storedPath || '/dashboard';
        
        // Clear the hash and navigate to intended destination
        window.history.replaceState(null, '', redirectTo);
        navigate(redirectTo, { replace: true, state: { user: response.data } });
      } catch (error) {
        console.error("Auth callback error:", error);
        navigate('/');
      }
    };

    processAuth();
  }, [navigate, setUser]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-muted-foreground">Authenticating...</p>
      </div>
    </div>
  );
};

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { user, loading, login } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  // If user passed from AuthCallback, use that
  if (location.state?.user) {
    return children;
  }

  if (!user) {
    // Store current path for deep linking and trigger login
    login(location.pathname);
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Redirecting to login...</p>
        </div>
      </div>
    );
  }

  return children;
};

// Admin Route Component
const AdminRoute = ({ children }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/" replace />;
  }

  if (!user.is_admin) {
    return <Navigate to="/dashboard" replace />;
  }

  // Check if admin has authenticated with password
  if (!user.has_admin_session && location.pathname !== '/admin/login') {
    return <Navigate to="/admin/login" replace />;
  }

  return children;
};

// Theme Provider
const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem('theme');
    return saved || 'dark';
  });

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

const ThemeContext = createContext({ theme: 'dark', toggleTheme: () => {} });
export const useTheme = () => useContext(ThemeContext);

// App Router
function AppRouter() {
  const location = useLocation();

  // Check URL fragment for session_id synchronously during render
  if (location.hash?.includes('session_id=')) {
    return <AuthCallback />;
  }

  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/pricing" element={<Pricing />} />
      <Route path="/privacy" element={<PrivacyPolicy />} />
      <Route path="/terms" element={<TermsOfService />} />
      <Route path="/refund" element={<RefundPolicy />} />
      <Route path="/cookies" element={<CookiePolicy />} />
      <Route path="/ai-disclosure" element={<AIDisclosure />} />
      <Route path="/disclaimer" element={<Disclaimer />} />
      <Route path="/contact" element={<Contact />} />
      <Route path="/dashboard" element={
        <ProtectedRoute><Dashboard /></ProtectedRoute>
      } />
      <Route path="/conversation-starters" element={
        <ProtectedRoute><ConversationStarters /></ProtectedRoute>
      } />
      <Route path="/chat-reply" element={
        <ProtectedRoute><ChatReply /></ProtectedRoute>
      } />
      <Route path="/bio-generator" element={
        <ProtectedRoute><BioGenerator /></ProtectedRoute>
      } />
      <Route path="/profile-review" element={
        <ProtectedRoute><ProfileReview /></ProtectedRoute>
      } />
      
      {/* Admin Routes */}
      <Route path="/admin/login" element={
        <ProtectedRoute><AdminLogin /></ProtectedRoute>
      } />
      <Route path="/admin" element={
        <AdminRoute><AdminDashboard /></AdminRoute>
      } />
      <Route path="/admin/site-settings" element={
        <AdminRoute><AdminSiteSettings /></AdminRoute>
      } />
      <Route path="/admin/pricing" element={
        <AdminRoute><AdminPricing /></AdminRoute>
      } />
      <Route path="/admin/prompts" element={
        <AdminRoute><AdminPrompts /></AdminRoute>
      } />
      <Route path="/admin/api-keys" element={
        <AdminRoute><AdminApiKeys /></AdminRoute>
      } />
      <Route path="/admin/users" element={
        <AdminRoute><AdminUsers /></AdminRoute>
      } />
      
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <AuthProvider>
          <AppRouter />
          <Toaster richColors position="top-right" />
        </AuthProvider>
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;
export { API };
