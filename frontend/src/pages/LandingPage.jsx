import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useAuth, API } from "../App";
import { PageLayout } from "../components/layout/Layout";
import { Button } from "../components/ui/button";
import { Card, CardContent } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import {
  MessageCircle,
  Sparkles,
  User,
  Zap,
  Heart,
  Star,
  ArrowRight,
  CheckCircle2,
  Shield,
  Clock,
} from "lucide-react";
import axios from "axios";

const iconMap = {
  Sparkles,
  MessageCircle,
  User,
  Zap,
  Heart,
  Star,
  Shield,
  Clock,
};

const defaultFeatures = [
  {
    icon: "Sparkles",
    title: "Conversation Starters",
    description: "AI-crafted pickup lines that actually work. Personalized based on their profile.",
    color: "from-[#FF0055] to-[#FF6B6B]",
  },
  {
    icon: "MessageCircle",
    title: "Chat Reply Suggestions",
    description: "Stuck on what to say? Get witty, engaging replies that keep the conversation flowing.",
    color: "from-[#7000FF] to-[#A855F7]",
  },
  {
    icon: "User",
    title: "Bio Generator",
    description: "Stand out from the crowd with a bio that showcases your personality perfectly.",
    color: "from-[#00FFFF] to-[#22D3EE]",
  },
  {
    icon: "Zap",
    title: "Profile Optimizer",
    description: "Get expert feedback on your dating profile to maximize your matches.",
    color: "from-[#FF0055] to-[#7000FF]",
  },
];

const defaultStats = [
  { value: "10M+", label: "Messages Generated" },
  { value: "500K+", label: "Happy Users" },
  { value: "89%", label: "More Matches" },
  { value: "4.9", label: "App Store Rating" },
];

const defaultTestimonials = [
  {
    name: "Alex M.",
    avatar: "A",
    text: "Finally landed a date with someone way out of my league. LOVE-AI made me sound charming!",
    rating: "5",
  },
  {
    name: "Sarah K.",
    avatar: "S",
    text: "The bio generator is incredible. Got 3x more matches after updating my profile.",
    rating: "5",
  },
  {
    name: "Mike R.",
    avatar: "M",
    text: "No more awkward silences in chats. The reply suggestions are always on point.",
    rating: "5",
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: "spring",
      stiffness: 260,
      damping: 20,
    },
  },
};

export default function LandingPage() {
  const { login, user } = useAuth();
  const navigate = useNavigate();
  const [settings, setSettings] = useState({
    hero_title: "Level Up Your Dating Game",
    hero_subtitle: "Get AI-powered conversation starters, witty replies, and profile optimization that actually work. Because first impressions matter.",
    hero_cta: "Start for Free",
    features: defaultFeatures,
    stats: defaultStats,
    testimonials: defaultTestimonials,
  });
  const [plans, setPlans] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [settingsRes, plansRes] = await Promise.all([
          axios.get(`${API}/settings/site`),
          axios.get(`${API}/subscriptions/plans`)
        ]);
        setSettings(prev => ({ ...prev, ...settingsRes.data }));
        setPlans(plansRes.data);
      } catch (error) {
        console.log("Using default settings");
      }
    };
    fetchData();
  }, []);

  const handleGetStarted = () => {
    if (user) {
      navigate("/dashboard");
    } else {
      login();
    }
  };

  const features = settings.features?.length > 0 ? settings.features : defaultFeatures;
  const stats = settings.stats?.length > 0 ? settings.stats : defaultStats;
  const testimonials = settings.testimonials?.length > 0 ? settings.testimonials : defaultTestimonials;

  return (
    <PageLayout>
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-24 sm:pt-20 sm:pb-32" data-testid="hero-section">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-[#FF0055]/20 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-[#7000FF]/20 rounded-full blur-3xl" />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="text-center"
          >
            <motion.div variants={itemVariants}>
              <Badge variant="outline" className="mb-6 rounded-full px-4 py-1.5 border-primary/30 bg-primary/5">
                <Sparkles className="w-3 h-3 mr-2 text-primary" />
                AI-Powered Dating Assistant
              </Badge>
            </motion.div>
            
            <motion.h1 
              variants={itemVariants}
              className="font-heading text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight mb-6"
            >
              {settings.hero_title?.split(" ").map((word, i, arr) => (
                i >= arr.length - 2 ? (
                  <span key={i} className="gradient-text">{word} </span>
                ) : (
                  <span key={i}>{word} </span>
                )
              ))}
            </motion.h1>
            
            <motion.p 
              variants={itemVariants}
              className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-10"
            >
              {settings.hero_subtitle}
            </motion.p>
            
            <motion.div variants={itemVariants} className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button
                size="lg"
                onClick={handleGetStarted}
                className="rounded-full bg-gradient-to-r from-[#FF0055] to-[#7000FF] hover:opacity-90 text-white px-8 py-6 text-lg font-semibold shadow-glow hover:shadow-glow-lg transition-all"
                data-testid="hero-cta-btn"
              >
                {user ? "Go to Dashboard" : settings.hero_cta}
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={() => navigate("/pricing")}
                className="rounded-full px-8 py-6 text-lg"
                data-testid="hero-pricing-btn"
              >
                View Pricing
              </Button>
            </motion.div>

            <motion.div 
              variants={itemVariants}
              className="flex flex-wrap items-center justify-center gap-6 mt-12 text-sm text-muted-foreground"
            >
              <span className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-green-500" />
                Privacy First
              </span>
              <span className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-blue-500" />
                Instant Results
              </span>
              <span className="flex items-center gap-2">
                <Heart className="w-4 h-4 text-primary" />
                Made with Love
              </span>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 border-y border-border/50 bg-muted/30" data-testid="stats-section">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid grid-cols-2 md:grid-cols-4 gap-8"
          >
            {stats.map((stat, index) => (
              <motion.div 
                key={index} 
                variants={itemVariants}
                className="text-center"
              >
                <div className="font-heading text-4xl sm:text-5xl font-bold gradient-text mb-2">
                  {stat.value}
                </div>
                <div className="text-muted-foreground">{stat.label}</div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 sm:py-32" data-testid="features-section">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <motion.h2 variants={itemVariants} className="font-heading text-4xl sm:text-5xl font-bold mb-4">
              Everything You Need to{" "}
              <span className="gradient-text">Get More Dates</span>
            </motion.h2>
            <motion.p variants={itemVariants} className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Our AI understands the art of attraction. Get personalized help at every step of your dating journey.
            </motion.p>
          </motion.div>

          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid md:grid-cols-2 gap-6"
          >
            {features.map((feature, index) => {
              const Icon = iconMap[feature.icon] || Sparkles;
              return (
                <motion.div key={index} variants={itemVariants}>
                  <Card className="group relative overflow-hidden rounded-3xl border-border/50 hover:border-primary/50 transition-all h-full" data-testid={`feature-card-${index}`}>
                    <CardContent className="p-8">
                      <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${feature.color || "from-[#FF0055] to-[#7000FF]"} flex items-center justify-center mb-6 shadow-lg group-hover:scale-110 transition-transform`}>
                        <Icon className="w-7 h-7 text-white" />
                      </div>
                      <h3 className="font-heading text-2xl font-semibold mb-3">{feature.title}</h3>
                      <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-24 sm:py-32 bg-muted/30" data-testid="testimonials-section">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <motion.h2 variants={itemVariants} className="font-heading text-4xl sm:text-5xl font-bold mb-4">
              Real People,{" "}
              <span className="gradient-text">Real Results</span>
            </motion.h2>
            <motion.p variants={itemVariants} className="text-lg text-muted-foreground">
              Join thousands who've transformed their dating life
            </motion.p>
          </motion.div>

          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid md:grid-cols-3 gap-6"
          >
            {testimonials.map((testimonial, index) => (
              <motion.div key={index} variants={itemVariants}>
                <Card className="rounded-3xl border-border/50 h-full" data-testid={`testimonial-card-${index}`}>
                  <CardContent className="p-8">
                    <div className="flex items-center gap-1 mb-4">
                      {[...Array(parseInt(testimonial.rating) || 5)].map((_, i) => (
                        <Star key={i} className="w-5 h-5 fill-yellow-500 text-yellow-500" />
                      ))}
                    </div>
                    <p className="text-foreground mb-6 leading-relaxed">"{testimonial.text}"</p>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#FF0055] to-[#7000FF] flex items-center justify-center text-white font-semibold">
                        {testimonial.avatar}
                      </div>
                      <span className="font-medium">{testimonial.name}</span>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 sm:py-32" data-testid="cta-section">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-[#FF0055]/20 via-[#7000FF]/20 to-[#00FFFF]/20 rounded-3xl blur-3xl" />
              <Card className="relative rounded-3xl border-primary/20 bg-card/80 backdrop-blur-sm overflow-hidden">
                <CardContent className="p-12 sm:p-16">
                  <h2 className="font-heading text-4xl sm:text-5xl font-bold mb-4">
                    Ready to Find{" "}
                    <span className="gradient-text">Your Match?</span>
                  </h2>
                  <p className="text-lg text-muted-foreground mb-8 max-w-xl mx-auto">
                    Start free and upgrade anytime. No credit card required.
                  </p>
                  <Button
                    size="lg"
                    onClick={handleGetStarted}
                    className="rounded-full bg-gradient-to-r from-[#FF0055] to-[#7000FF] hover:opacity-90 text-white px-10 py-6 text-lg font-semibold shadow-glow hover:shadow-glow-lg transition-all"
                    data-testid="cta-btn"
                  >
                    Get Started Free
                    <ArrowRight className="ml-2 w-5 h-5" />
                  </Button>
                  
                  <div className="flex flex-wrap items-center justify-center gap-6 mt-8 text-sm text-muted-foreground">
                    <span className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-green-500" />
                      5 free credits
                    </span>
                    <span className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-green-500" />
                      No credit card
                    </span>
                    <span className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-green-500" />
                      Cancel anytime
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </motion.div>
        </div>
      </section>
    </PageLayout>
  );
}
