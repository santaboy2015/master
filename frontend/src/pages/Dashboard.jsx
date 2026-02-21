import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth, API } from "../App";
import { PageLayout } from "../components/layout/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Progress } from "../components/ui/progress";
import { Badge } from "../components/ui/badge";
import {
  MessageCircle,
  Sparkles,
  User,
  Zap,
  ArrowRight,
  Crown,
  TrendingUp,
} from "lucide-react";
import { toast } from "sonner";
import axios from "axios";

const quickActions = [
  {
    title: "Conversation Starters",
    description: "Generate witty openers",
    icon: Sparkles,
    href: "/conversation-starters",
    color: "from-[#FF0055] to-[#FF6B6B]",
  },
  {
    title: "Chat Reply",
    description: "Get reply suggestions",
    icon: MessageCircle,
    href: "/chat-reply",
    color: "from-[#7000FF] to-[#A855F7]",
  },
  {
    title: "Bio Generator",
    description: "Create the perfect bio",
    icon: User,
    href: "/bio-generator",
    color: "from-[#00FFFF] to-[#22D3EE]",
  },
  {
    title: "Profile Review",
    description: "Optimize your profile",
    icon: Zap,
    href: "/profile-review",
    color: "from-[#FF0055] to-[#7000FF]",
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: "spring", stiffness: 260, damping: 20 },
  },
};

export default function Dashboard() {
  const { user, refreshUser } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [stats, setStats] = useState(null);
  const [checkingPayment, setCheckingPayment] = useState(false);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await axios.get(`${API}/stats`, { withCredentials: true });
        setStats(response.data);
      } catch (error) {
        console.error("Failed to fetch stats:", error);
      }
    };
    fetchStats();
  }, []);

  // Check payment status if session_id is in URL
  useEffect(() => {
    const sessionId = searchParams.get("session_id");
    if (sessionId && !checkingPayment) {
      setCheckingPayment(true);
      pollPaymentStatus(sessionId);
    }
  }, [searchParams]);

  const pollPaymentStatus = async (sessionId, attempts = 0) => {
    const maxAttempts = 5;
    const pollInterval = 2000;

    if (attempts >= maxAttempts) {
      toast.error("Payment status check timed out. Please check your email for confirmation.");
      setCheckingPayment(false);
      // Clear the session_id from URL
      window.history.replaceState({}, '', '/dashboard');
      return;
    }

    try {
      const response = await axios.get(`${API}/subscriptions/status/${sessionId}`, {
        withCredentials: true,
      });

      if (response.data.payment_status === "paid") {
        toast.success("Payment successful! Your subscription has been upgraded.");
        await refreshUser();
        // Clear the session_id from URL
        window.history.replaceState({}, '', '/dashboard');
        setCheckingPayment(false);
        // Refresh stats
        const statsResponse = await axios.get(`${API}/stats`, { withCredentials: true });
        setStats(statsResponse.data);
        return;
      } else if (response.data.status === "expired") {
        toast.error("Payment session expired. Please try again.");
        setCheckingPayment(false);
        window.history.replaceState({}, '', '/dashboard');
        return;
      }

      // Continue polling
      toast.info("Payment is being processed...");
      setTimeout(() => pollPaymentStatus(sessionId, attempts + 1), pollInterval);
    } catch (error) {
      console.error("Payment status check error:", error);
      if (attempts < maxAttempts - 1) {
        setTimeout(() => pollPaymentStatus(sessionId, attempts + 1), pollInterval);
      } else {
        toast.error("Error checking payment status.");
        setCheckingPayment(false);
        window.history.replaceState({}, '', '/dashboard');
      }
    }
  };

  const usagePercentage = stats ? stats.usage_percentage : 0;
  const creditsRemaining = stats ? stats.credits_remaining : user?.monthly_credits - user?.credits_used || 0;
  const totalCredits = stats ? stats.monthly_credits : user?.monthly_credits || 5;
  const subscriptionTier = stats ? stats.subscription_tier : user?.subscription_tier || "free";

  return (
    <PageLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12" data-testid="dashboard">
        {/* Welcome Header */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="mb-12"
        >
          <motion.div variants={itemVariants} className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="font-heading text-4xl font-bold mb-2" data-testid="dashboard-welcome">
                Welcome back, <span className="gradient-text">{user?.name?.split(" ")[0]}</span>
              </h1>
              <p className="text-muted-foreground">Ready to level up your dating game?</p>
            </div>
            
            <div className="flex items-center gap-3">
              <Badge 
                variant={subscriptionTier === "free" ? "outline" : "default"}
                className={`rounded-full px-4 py-1.5 ${
                  subscriptionTier !== "free" 
                    ? "bg-gradient-to-r from-[#FF0055] to-[#7000FF] text-white border-0" 
                    : ""
                }`}
                data-testid="subscription-badge"
              >
                <Crown className="w-3 h-3 mr-1.5" />
                {subscriptionTier.charAt(0).toUpperCase() + subscriptionTier.slice(1)}
              </Badge>
              {subscriptionTier === "free" && (
                <Button
                  onClick={() => navigate("/pricing")}
                  className="rounded-full bg-gradient-to-r from-[#FF0055] to-[#7000FF] hover:opacity-90 text-white"
                  data-testid="upgrade-btn"
                >
                  Upgrade
                </Button>
              )}
            </div>
          </motion.div>
        </motion.div>

        {/* Stats Cards */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid md:grid-cols-3 gap-6 mb-12"
        >
          <motion.div variants={itemVariants}>
            <Card className="rounded-3xl border-border/50" data-testid="credits-card">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Zap className="w-4 h-4 text-primary" />
                  Credits Remaining
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-baseline gap-2 mb-3">
                  <span className="font-heading text-4xl font-bold">{creditsRemaining}</span>
                  <span className="text-muted-foreground">/ {totalCredits}</span>
                </div>
                <Progress value={100 - usagePercentage} className="h-2" />
              </CardContent>
            </Card>
          </motion.div>

          <motion.div variants={itemVariants}>
            <Card className="rounded-3xl border-border/50" data-testid="usage-card">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-green-500" />
                  Usage This Month
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-baseline gap-2 mb-3">
                  <span className="font-heading text-4xl font-bold">{stats?.credits_used || 0}</span>
                  <span className="text-muted-foreground">AI responses</span>
                </div>
                <p className="text-sm text-muted-foreground">Keep up the great work!</p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div variants={itemVariants}>
            <Card className="rounded-3xl border-border/50 bg-gradient-to-br from-primary/10 to-secondary/10" data-testid="plan-card">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Crown className="w-4 h-4 text-yellow-500" />
                  Current Plan
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="font-heading text-2xl font-bold mb-2 capitalize">
                  {subscriptionTier}
                </div>
                {subscriptionTier === "free" ? (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => navigate("/pricing")}
                    className="rounded-full"
                  >
                    View Plans
                  </Button>
                ) : (
                  <p className="text-sm text-muted-foreground">Enjoy your premium features!</p>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <motion.h2 variants={itemVariants} className="font-heading text-2xl font-bold mb-6">
            Quick Actions
          </motion.h2>
          
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {quickActions.map((action, index) => {
              const Icon = action.icon;
              return (
                <motion.div key={index} variants={itemVariants}>
                  <Card
                    className="group cursor-pointer rounded-3xl border-border/50 hover:border-primary/50 transition-all h-full"
                    onClick={() => navigate(action.href)}
                    data-testid={`action-${action.title.toLowerCase().replace(/\s+/g, '-')}`}
                  >
                    <CardContent className="p-6">
                      <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${action.color} flex items-center justify-center mb-4 shadow-lg group-hover:scale-110 transition-transform`}>
                        <Icon className="w-6 h-6 text-white" />
                      </div>
                      <h3 className="font-heading text-lg font-semibold mb-1">{action.title}</h3>
                      <p className="text-sm text-muted-foreground mb-4">{action.description}</p>
                      <div className="flex items-center text-primary text-sm font-medium">
                        Get Started
                        <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </motion.div>

        {/* Low Credits Warning */}
        {creditsRemaining <= 2 && creditsRemaining > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-12"
          >
            <Card className="rounded-3xl border-yellow-500/50 bg-yellow-500/10" data-testid="low-credits-warning">
              <CardContent className="p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-yellow-500/20 flex items-center justify-center">
                    <Zap className="w-5 h-5 text-yellow-500" />
                  </div>
                  <div>
                    <p className="font-semibold">Running low on credits!</p>
                    <p className="text-sm text-muted-foreground">Upgrade to continue using RizzAI</p>
                  </div>
                </div>
                <Button
                  onClick={() => navigate("/pricing")}
                  className="rounded-full bg-yellow-500 hover:bg-yellow-600 text-black"
                >
                  Upgrade Now
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>
    </PageLayout>
  );
}
