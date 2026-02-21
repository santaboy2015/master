import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth, API } from "../../App";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Shield, Loader2, Lock } from "lucide-react";
import { toast } from "sonner";
import axios from "axios";

export default function AdminLogin() {
  const { user, refreshUser } = useAuth();
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    
    if (!password) {
      toast.error("Please enter the admin password");
      return;
    }

    setLoading(true);

    try {
      await axios.post(
        `${API}/admin/login`,
        { email: user?.email, password },
        { withCredentials: true }
      );
      
      toast.success("Admin access granted");
      await refreshUser();
      navigate("/admin");
    } catch (error) {
      toast.error(error.response?.data?.detail || "Invalid admin password");
    } finally {
      setLoading(false);
    }
  };

  if (!user?.is_admin) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md rounded-3xl">
          <CardContent className="p-8 text-center">
            <Shield className="w-16 h-16 mx-auto mb-4 text-destructive" />
            <h2 className="font-heading text-2xl font-bold mb-2">Access Denied</h2>
            <p className="text-muted-foreground">You don't have admin privileges.</p>
            <Button onClick={() => navigate("/dashboard")} className="mt-6 rounded-xl">
              Go to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4" data-testid="admin-login-page">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <Card className="rounded-3xl border-border/50">
          <CardHeader className="text-center pb-2">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#FF0055] to-[#7000FF] flex items-center justify-center mx-auto mb-4 shadow-glow">
              <Shield className="w-8 h-8 text-white" />
            </div>
            <CardTitle className="font-heading text-2xl">Admin Access</CardTitle>
            <CardDescription>
              Enter your admin password to continue
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <form onSubmit={handleLogin} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="password">Admin Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter admin password"
                    className="pl-10 rounded-xl"
                    data-testid="admin-password-input"
                  />
                </div>
            <p className="text-sm text-muted-foreground">
              Default password: RizzAdmin2024!
            </p>
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl h-12 bg-gradient-to-r from-[#FF0055] to-[#7000FF] hover:opacity-90 text-white"
                data-testid="admin-login-btn"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  <>
                    <Shield className="w-5 h-5 mr-2" />
                    Access Admin Panel
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
