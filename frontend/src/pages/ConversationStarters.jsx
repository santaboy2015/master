import { useState } from "react";
import { motion } from "framer-motion";
import { useAuth, API } from "../App";
import { PageLayout } from "../components/layout/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { Badge } from "../components/ui/badge";
import { Sparkles, Copy, RefreshCw, Loader2, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import axios from "axios";

const platforms = [
  { value: "tinder", label: "Tinder" },
  { value: "bumble", label: "Bumble" },
  { value: "hinge", label: "Hinge" },
  { value: "okcupid", label: "OkCupid" },
  { value: "coffee", label: "Coffee Meets Bagel" },
];

const tones = [
  { value: "playful", label: "Playful & Fun" },
  { value: "witty", label: "Witty & Clever" },
  { value: "sincere", label: "Sincere & Sweet" },
  { value: "bold", label: "Bold & Confident" },
  { value: "mysterious", label: "Mysterious" },
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

export default function ConversationStarters() {
  const { user, refreshUser } = useAuth();
  const [context, setContext] = useState("");
  const [platform, setPlatform] = useState("tinder");
  const [tone, setTone] = useState("playful");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [copiedIndex, setCopiedIndex] = useState(null);

  const handleGenerate = async () => {
    if (!context.trim()) {
      toast.error("Please describe the person or their profile");
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const response = await axios.post(
        `${API}/ai/conversation-starters`,
        {
          context: context.trim(),
          platform,
          tone,
        },
        { withCredentials: true }
      );
      setResult(response.data);
      await refreshUser();
      toast.success("Conversation starters generated!");
    } catch (error) {
      if (error.response?.status === 403) {
        toast.error("No credits remaining. Upgrade your plan!");
      } else {
        toast.error("Failed to generate. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text, index) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    toast.success("Copied to clipboard!");
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const creditsRemaining = user ? user.monthly_credits - user.credits_used : 0;

  return (
    <PageLayout>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12" data-testid="conversation-starters-page">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {/* Header */}
          <motion.div variants={itemVariants} className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-[#FF0055] to-[#FF6B6B] mb-6 shadow-glow">
              <Sparkles className="w-8 h-8 text-white" />
            </div>
            <h1 className="font-heading text-4xl font-bold mb-4">
              Conversation <span className="gradient-text">Starters</span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-xl mx-auto">
              Generate personalized openers that actually get responses. Tell us about their profile and we'll craft the perfect icebreaker.
            </p>
          </motion.div>

          {/* Form Card */}
          <motion.div variants={itemVariants}>
            <Card className="rounded-3xl border-border/50 mb-8" data-testid="starters-form">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Generate Openers</span>
                  <Badge variant="outline" className="rounded-full" data-testid="credits-badge">
                    {creditsRemaining} credits left
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="context">About Their Profile</Label>
                  <Textarea
                    id="context"
                    placeholder="e.g., They love hiking, have a golden retriever named Max, and their bio mentions they're a coffee addict who speaks 3 languages..."
                    value={context}
                    onChange={(e) => setContext(e.target.value)}
                    className="min-h-[120px] rounded-xl resize-none"
                    data-testid="context-input"
                  />
                  <p className="text-xs text-muted-foreground">
                    The more details you provide, the better the openers!
                  </p>
                </div>

                <div className="grid sm:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label>Platform</Label>
                    <Select value={platform} onValueChange={setPlatform}>
                      <SelectTrigger className="rounded-xl" data-testid="platform-select">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {platforms.map((p) => (
                          <SelectItem key={p.value} value={p.value}>
                            {p.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Tone</Label>
                    <Select value={tone} onValueChange={setTone}>
                      <SelectTrigger className="rounded-xl" data-testid="tone-select">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {tones.map((t) => (
                          <SelectItem key={t.value} value={t.value}>
                            {t.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <Button
                  onClick={handleGenerate}
                  disabled={loading || creditsRemaining <= 0}
                  className="w-full rounded-xl h-12 bg-gradient-to-r from-[#FF0055] to-[#7000FF] hover:opacity-90 text-white"
                  data-testid="generate-btn"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5 mr-2" />
                      Generate Openers
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </motion.div>

          {/* Results */}
          {result && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
              data-testid="results-section"
            >
              <div className="flex items-center justify-between">
                <h2 className="font-heading text-xl font-semibold">Your Openers</h2>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleGenerate}
                  disabled={loading || creditsRemaining <= 0}
                  className="rounded-full"
                  data-testid="regenerate-btn"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Regenerate
                </Button>
              </div>

              {result.suggestions && result.suggestions.length > 0 ? (
                <div className="space-y-3">
                  {result.suggestions.map((suggestion, index) => (
                    <Card 
                      key={index} 
                      className="rounded-2xl border-border/50 hover:border-primary/30 transition-colors"
                      data-testid={`suggestion-${index}`}
                    >
                      <CardContent className="p-4 flex items-start justify-between gap-4">
                        <p className="text-foreground leading-relaxed flex-1">{suggestion}</p>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => copyToClipboard(suggestion, index)}
                          className="shrink-0 rounded-xl"
                          data-testid={`copy-btn-${index}`}
                        >
                          {copiedIndex === index ? (
                            <CheckCircle2 className="w-5 h-5 text-green-500" />
                          ) : (
                            <Copy className="w-5 h-5" />
                          )}
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card className="rounded-2xl border-border/50">
                  <CardContent className="p-6">
                    <p className="text-foreground whitespace-pre-wrap">{result.content}</p>
                  </CardContent>
                </Card>
              )}
            </motion.div>
          )}
        </motion.div>
      </div>
    </PageLayout>
  );
}
