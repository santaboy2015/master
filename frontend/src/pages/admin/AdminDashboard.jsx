import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { API } from "../../App";
import { AdminLayout } from "../../components/layout/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { 
  Users, 
  DollarSign, 
  Zap, 
  TrendingUp,
  UserPlus,
  CreditCard,
  Loader2
} from "lucide-react";
import axios from "axios";

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

export default function AdminDashboard() {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const response = await axios.get(`${API}/admin/analytics`, {
          withCredentials: true
        });
        setAnalytics(response.data);
      } catch (error) {
        console.error("Failed to fetch analytics:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, []);

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </AdminLayout>
    );
  }

  const stats = [
    {
      title: "Total Users",
      value: analytics?.total_users || 0,
      icon: Users,
      color: "from-[#FF0055] to-[#FF6B6B]",
      description: "All registered users"
    },
    {
      title: "Total Revenue",
      value: `$${(analytics?.total_revenue || 0).toFixed(2)}`,
      icon: DollarSign,
      color: "from-[#00FF88] to-[#22D3EE]",
      description: "Lifetime earnings"
    },
    {
      title: "Credits Used",
      value: analytics?.total_credits_used || 0,
      icon: Zap,
      color: "from-[#7000FF] to-[#A855F7]",
      description: "AI responses generated"
    },
    {
      title: "Recent Signups",
      value: analytics?.recent_signups || 0,
      icon: UserPlus,
      color: "from-[#00FFFF] to-[#22D3EE]",
      description: "Last 7 days"
    },
  ];

  const subscriptionData = analytics?.subscription_breakdown || { free: 0, pro: 0, premium: 0 };

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12" data-testid="admin-dashboard">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {/* Header */}
          <motion.div variants={itemVariants} className="mb-12">
            <h1 className="font-heading text-4xl font-bold mb-2">
              Admin <span className="gradient-text">Dashboard</span>
            </h1>
            <p className="text-muted-foreground">Monitor and manage your platform</p>
          </motion.div>

          {/* Stats Grid */}
          <motion.div
            variants={containerVariants}
            className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12"
          >
            {stats.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <motion.div key={index} variants={itemVariants}>
                  <Card className="rounded-3xl border-border/50" data-testid={`stat-${stat.title.toLowerCase().replace(' ', '-')}`}>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${stat.color} flex items-center justify-center shadow-lg`}>
                          <Icon className="w-6 h-6 text-white" />
                        </div>
                      </div>
                      <div className="font-heading text-3xl font-bold mb-1">{stat.value}</div>
                      <p className="text-sm text-muted-foreground">{stat.title}</p>
                      <p className="text-xs text-muted-foreground mt-1">{stat.description}</p>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </motion.div>

          {/* Subscription Breakdown */}
          <motion.div variants={itemVariants}>
            <Card className="rounded-3xl border-border/50" data-testid="subscription-breakdown">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-primary" />
                  Subscription Breakdown
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid sm:grid-cols-3 gap-6">
                  <div className="text-center p-6 rounded-2xl bg-muted/50">
                    <div className="font-heading text-4xl font-bold mb-2">{subscriptionData.free}</div>
                    <p className="text-muted-foreground">Free Users</p>
                    <div className="mt-3 h-2 bg-muted rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-slate-500 rounded-full"
                        style={{ width: `${(subscriptionData.free / (analytics?.total_users || 1)) * 100}%` }}
                      />
                    </div>
                  </div>
                  <div className="text-center p-6 rounded-2xl bg-primary/5 border border-primary/20">
                    <div className="font-heading text-4xl font-bold mb-2 text-primary">{subscriptionData.pro}</div>
                    <p className="text-muted-foreground">Pro Users</p>
                    <div className="mt-3 h-2 bg-muted rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-primary rounded-full"
                        style={{ width: `${(subscriptionData.pro / (analytics?.total_users || 1)) * 100}%` }}
                      />
                    </div>
                  </div>
                  <div className="text-center p-6 rounded-2xl bg-secondary/5 border border-secondary/20">
                    <div className="font-heading text-4xl font-bold mb-2 text-secondary">{subscriptionData.premium}</div>
                    <p className="text-muted-foreground">Premium Users</p>
                    <div className="mt-3 h-2 bg-muted rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-secondary rounded-full"
                        style={{ width: `${(subscriptionData.premium / (analytics?.total_users || 1)) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Quick Stats */}
          <motion.div variants={itemVariants} className="mt-8">
            <Card className="rounded-3xl border-border/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-green-500" />
                  Platform Health
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid sm:grid-cols-2 gap-6">
                  <div className="flex items-center justify-between p-4 rounded-xl bg-muted/50">
                    <span className="text-muted-foreground">Total Payments</span>
                    <span className="font-semibold">{analytics?.total_payments || 0}</span>
                  </div>
                  <div className="flex items-center justify-between p-4 rounded-xl bg-muted/50">
                    <span className="text-muted-foreground">Avg Credits/User</span>
                    <span className="font-semibold">
                      {analytics?.total_users ? Math.round(analytics.total_credits_used / analytics.total_users) : 0}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>
      </div>
    </AdminLayout>
  );
}
