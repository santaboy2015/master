import { useState } from "react";
import { motion } from "framer-motion";
import { useAuth, API } from "../App";
import { PageLayout } from "../components/layout/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
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
import { Zap, Copy, RefreshCw, Loader2, CheckCircle2, AlertTriangle, ThumbsUp, Lightbulb } from "lucide-react";
import { toast } from "sonner";
import axios from "axios";

const platforms = [
  { value: "tinder", label: "Tinder" },
  { value: "bumble", label: "Bumble" },
  { value: "hinge", label: "Hinge" },
  { value: "okcupid", label: "OkCupid" },
  { value: "coffee", label: "Coffee Meets Bagel" },
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

export default function ProfileReview() {
  const { user, refreshUser } = useAuth();
  const [bio, setBio] = useState("");
  const [photosDescription, setPhotosDescription] = useState("");
  const [platform, setPlatform] = useState("tinder");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const handleGenerate = async () => {
    if (!bio.trim()) {
      toast.error("Please enter your current bio");
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const response = await axios.post(
        `${API}/ai/profile-review`,
        {
          bio: bio.trim(),
          photos_description: photosDescription.trim() || null,
          platform,
        },
        { withCredentials: true }
      );
      setResult(response.data);
      await refreshUser();
      toast.success("Profile review complete!");
    } catch (error) {
      if (error.response?.status === 403) {
        toast.error("No credits remaining. Upgrade your plan!");
      } else {
        toast.error("Failed to generate review. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard!");
  };

  const creditsRemaining = user ? user.monthly_credits - user.credits_used : 0;

  // Parse review sections
  const parseReview = (content) => {
    if (!content) return null;
    
    const sections = {
      strengths: [],
      improvements: [],
      tips: [],
      overall: ""
    };
    
    const lines = content.split('\n');
    let currentSection = "overall";
    
    for (const line of lines) {
      const lowerLine = line.toLowerCase();
      if (lowerLine.includes('strength') || lowerLine.includes('good') || lowerLine.includes('positive')) {
        currentSection = "strengths";
      } else if (lowerLine.includes('improve') || lowerLine.includes('red flag') || lowerLine.includes('remove') || lowerLine.includes('avoid')) {
        currentSection = "improvements";
      } else if (lowerLine.includes('tip') || lowerLine.includes('suggest') || lowerLine.includes('recommend') || lowerLine.includes('missing')) {
        currentSection = "tips";
      }
      
      if (line.trim().startsWith('-') || line.trim().startsWith('•') || line.trim().match(/^[0-9]+\./)) {
        const cleanLine = line.trim().replace(/^[-•0-9.]+\s*/, '');
        if (cleanLine) {
          sections[currentSection].push(cleanLine);
        }
      } else if (line.trim() && currentSection === "overall") {
        sections.overall += line.trim() + " ";
      }
    }
    
    return sections;
  };

  return (
    <PageLayout>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12" data-testid="profile-review-page">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {/* Header */}
          <motion.div variants={itemVariants} className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-[#FF0055] to-[#7000FF] mb-6 shadow-glow">
              <Zap className="w-8 h-8 text-white" />
            </div>
            <h1 className="font-heading text-4xl font-bold mb-4">
              Profile <span className="gradient-text">Review</span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-xl mx-auto">
              Get expert feedback on your dating profile to maximize your matches. We'll tell you what's working and what needs improvement.
            </p>
          </motion.div>

          {/* Form Card */}
          <motion.div variants={itemVariants}>
            <Card className="rounded-3xl border-border/50 mb-8" data-testid="review-form">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Review Your Profile</span>
                  <Badge variant="outline" className="rounded-full" data-testid="credits-badge">
                    {creditsRemaining} credits left
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="bio">Your Current Bio *</Label>
                  <Textarea
                    id="bio"
                    placeholder="Paste your current dating profile bio here..."
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    className="min-h-[150px] rounded-xl resize-none"
                    data-testid="bio-input"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="photos">Describe Your Photos (Optional)</Label>
                  <Textarea
                    id="photos"
                    placeholder="e.g., Main photo is at a beach, second is with friends at a bar, third is hiking..."
                    value={photosDescription}
                    onChange={(e) => setPhotosDescription(e.target.value)}
                    className="min-h-[80px] rounded-xl resize-none"
                    data-testid="photos-input"
                  />
                  <p className="text-xs text-muted-foreground">
                    Describing your photos helps us give more complete feedback
                  </p>
                </div>

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

                <Button
                  onClick={handleGenerate}
                  disabled={loading || creditsRemaining <= 0}
                  className="w-full rounded-xl h-12 bg-gradient-to-r from-[#FF0055] to-[#7000FF] hover:opacity-90 text-white"
                  data-testid="generate-btn"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <Zap className="w-5 h-5 mr-2" />
                      Get Profile Review
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
              className="space-y-6"
              data-testid="results-section"
            >
              <div className="flex items-center justify-between">
                <h2 className="font-heading text-xl font-semibold">Your Profile Review</h2>
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

              {/* Review Content */}
              <Card className="rounded-3xl border-border/50 overflow-hidden">
                <CardContent className="p-6 space-y-6">
                  {/* Full Review */}
                  <div className="prose prose-sm dark:prose-invert max-w-none">
                    <div className="whitespace-pre-wrap text-foreground leading-relaxed">
                      {result.content}
                    </div>
                  </div>
                  
                  <div className="pt-4 border-t border-border/50">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(result.content)}
                      className="rounded-full"
                      data-testid="copy-review-btn"
                    >
                      <Copy className="w-4 h-4 mr-2" />
                      Copy Full Review
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Quick Tips Cards */}
              <div className="grid md:grid-cols-3 gap-4">
                <Card className="rounded-2xl border-green-500/30 bg-green-500/5" data-testid="strengths-card">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <ThumbsUp className="w-5 h-5 text-green-500" />
                      <span className="font-semibold text-green-500">What's Working</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Look for highlighted strengths in your review above
                    </p>
                  </CardContent>
                </Card>

                <Card className="rounded-2xl border-yellow-500/30 bg-yellow-500/5" data-testid="improvements-card">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <AlertTriangle className="w-5 h-5 text-yellow-500" />
                      <span className="font-semibold text-yellow-500">To Improve</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Check the suggestions in your review to boost your profile
                    </p>
                  </CardContent>
                </Card>

                <Card className="rounded-2xl border-blue-500/30 bg-blue-500/5" data-testid="tips-card">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Lightbulb className="w-5 h-5 text-blue-500" />
                      <span className="font-semibold text-blue-500">Pro Tips</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Follow the expert recommendations for best results
                    </p>
                  </CardContent>
                </Card>
              </div>
            </motion.div>
          )}
        </motion.div>
      </div>
    </PageLayout>
  );
}
