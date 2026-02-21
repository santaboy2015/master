import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth, API } from "../App";
import { PageLayout } from "../components/layout/Layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { CheckCircle2, Sparkles, Zap, Crown, Loader2 } from "lucide-react";
import { toast } from "sonner";
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

const planIcons = {
  free: Sparkles,
  pro: Zap,
  premium: Crown,
};

const planColors = {
  free: "from-slate-500 to-slate-600",
  pro: "from-[#FF0055] to-[#FF6B6B]",
  premium: "from-[#7000FF] to-[#A855F7]",
};

export default function Pricing() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingPlan, setProcessingPlan] = useState(null);

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const response = await axios.get(`${API}/subscriptions/plans`);
        setPlans(response.data);
      } catch (error) {
        console.error("Failed to fetch plans:", error);
        toast.error("Failed to load pricing plans");
      } finally {
        setLoading(false);
      }
    };
    fetchPlans();
  }, []);

  const handleSelectPlan = async (planId) => {
    if (!user) {
      login();
      return;
    }

    if (planId === "free") {
      navigate("/dashboard");
      return;
    }

    if (user.subscription_tier === planId) {
      toast.info("You're already on this plan!");
      return;
    }

    setProcessingPlan(planId);

    try {
      const response = await axios.post(
        `${API}/subscriptions/checkout`,
        {
          plan_id: planId,
          origin_url: window.location.origin,
        },
        { withCredentials: true }
      );

      // Redirect to Stripe Checkout
      window.location.href = response.data.url;
    } catch (error) {
      console.error("Checkout error:", error);
      toast.error("Failed to start checkout. Please try again.");
      setProcessingPlan(null);
    }
  };

  const isCurrentPlan = (planId) => user?.subscription_tier === planId;

  return (
    <PageLayout>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12" data-testid="pricing-page">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {/* Header */}
          <motion.div variants={itemVariants} className="text-center mb-16">
            <Badge variant="outline" className="mb-6 rounded-full px-4 py-1.5 border-primary/30 bg-primary/5">
              <Crown className="w-3 h-3 mr-2 text-primary" />
              Simple Pricing
            </Badge>
            <h1 className="font-heading text-4xl sm:text-5xl font-bold mb-4">
              Choose Your <span className="gradient-text">Love Level</span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-xl mx-auto">
              Start free and upgrade when you're ready. No hidden fees, cancel anytime.
            </p>
          </motion.div>

          {/* Plans Grid */}
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : (
            <motion.div
              variants={containerVariants}
              className="grid md:grid-cols-3 gap-8"
            >
              {plans.map((plan, index) => {
                const Icon = planIcons[plan.plan_id] || Sparkles;
                const colorClass = planColors[plan.plan_id] || planColors.free;
                const isPopular = plan.plan_id === "pro";
                const isCurrent = isCurrentPlan(plan.plan_id);

                return (
                  <motion.div key={plan.plan_id} variants={itemVariants}>
                    <Card 
                      className={`relative rounded-3xl border-border/50 h-full flex flex-col ${
                        isPopular ? "border-primary/50 shadow-glow" : ""
                      } ${isCurrent ? "ring-2 ring-primary" : ""}`}
                      data-testid={`plan-card-${plan.plan_id}`}
                    >
                      {isPopular && (
                        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                          <Badge className="rounded-full bg-gradient-to-r from-[#FF0055] to-[#7000FF] text-white border-0 px-4">
                            Most Popular
                          </Badge>
                        </div>
                      )}
                      
                      {isCurrent && (
                        <div className="absolute -top-3 right-4">
                          <Badge variant="outline" className="rounded-full bg-background">
                            Current Plan
                          </Badge>
                        </div>
                      )}

                      <CardHeader className="text-center pt-8">
                        <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${colorClass} flex items-center justify-center mx-auto mb-4 shadow-lg`}>
                          <Icon className="w-7 h-7 text-white" />
                        </div>
                        <CardTitle className="font-heading text-2xl">{plan.name}</CardTitle>
                        <CardDescription>
                          {plan.credits_per_month} AI responses/month
                        </CardDescription>
                      </CardHeader>

                      <CardContent className="flex-1">
                        <div className="text-center mb-8">
                          <span className="font-heading text-5xl font-bold">
                            ${plan.price.toFixed(0)}
                          </span>
                          {plan.price > 0 && (
                            <span className="text-muted-foreground">/month</span>
                          )}
                        </div>

                        <ul className="space-y-3">
                          {plan.features.map((feature, featureIndex) => (
                            <li key={featureIndex} className="flex items-start gap-3">
                              <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                              <span className="text-sm">{feature}</span>
                            </li>
                          ))}
                        </ul>
                      </CardContent>

                      <CardFooter className="pt-6">
                        <Button
                          onClick={() => handleSelectPlan(plan.plan_id)}
                          disabled={processingPlan !== null || isCurrent}
                          className={`w-full rounded-xl h-12 ${
                            isPopular
                              ? "bg-gradient-to-r from-[#FF0055] to-[#7000FF] hover:opacity-90 text-white"
                              : plan.plan_id === "premium"
                              ? "bg-gradient-to-r from-[#7000FF] to-[#A855F7] hover:opacity-90 text-white"
                              : ""
                          }`}
                          variant={!isPopular && plan.plan_id !== "premium" ? "outline" : "default"}
                          data-testid={`select-plan-${plan.plan_id}`}
                        >
                          {processingPlan === plan.plan_id ? (
                            <>
                              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                              Processing...
                            </>
                          ) : isCurrent ? (
                            "Current Plan"
                          ) : plan.price === 0 ? (
                            user ? "Go to Dashboard" : "Get Started Free"
                          ) : (
                            `Upgrade to ${plan.name}`
                          )}
                        </Button>
                      </CardFooter>
                    </Card>
                  </motion.div>
                );
              })}
            </motion.div>
          )}

          {/* FAQ or Additional Info */}
          <motion.div variants={itemVariants} className="mt-16 text-center">
            <p className="text-muted-foreground">
              All plans include access to all features. Higher tiers just give you more credits.
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              Credits reset monthly. Unused credits don't roll over.
            </p>
          </motion.div>
        </motion.div>
      </div>
    </PageLayout>
  );
}
