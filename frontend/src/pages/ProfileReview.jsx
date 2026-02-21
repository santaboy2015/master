import { useState, useRef } from "react";
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
import { Zap, Copy, RefreshCw, Loader2, CheckCircle2, AlertTriangle, ThumbsUp, Lightbulb, Upload, X, Image as ImageIcon } from "lucide-react";
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
  const [imageData, setImageData] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const fileInputRef = useRef(null);

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error("Image must be less than 10MB");
      return;
    }

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await axios.post(`${API}/upload/image`, formData, {
        withCredentials: true,
        headers: { "Content-Type": "multipart/form-data" }
      });

      setImageData(response.data.image_data);
      setImagePreview(URL.createObjectURL(file));
      toast.success("Image uploaded!");
    } catch (error) {
      toast.error("Failed to upload image");
    }
  };

  const removeImage = () => {
    setImageData(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

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
          image_data: imageData
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
              Get expert feedback on your dating profile. Upload a photo for AI-powered visual analysis.
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
                {/* Image Upload */}
                <div className="space-y-2">
                  <Label>Profile Photo (Optional)</Label>
                  <p className="text-xs text-muted-foreground mb-2">
                    Upload your profile photo for AI-powered visual feedback
                  </p>
                  
                  {imagePreview ? (
                    <div className="relative w-40 h-40 rounded-2xl overflow-hidden border border-border">
                      <img 
                        src={imagePreview} 
                        alt="Profile preview" 
                        className="w-full h-full object-cover"
                      />
                      <button
                        onClick={removeImage}
                        className="absolute top-2 right-2 w-6 h-6 rounded-full bg-destructive text-white flex items-center justify-center hover:bg-destructive/90"
                        data-testid="remove-image-btn"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="w-40 h-40 rounded-2xl border-2 border-dashed border-border hover:border-primary/50 flex flex-col items-center justify-center cursor-pointer transition-colors"
                      data-testid="upload-image-area"
                    >
                      <Upload className="w-8 h-8 text-muted-foreground mb-2" />
                      <span className="text-sm text-muted-foreground">Upload Photo</span>
                      <span className="text-xs text-muted-foreground mt-1">For visual analysis</span>
                    </div>
                  )}
                  
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                    data-testid="image-input"
                  />
                </div>

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
                  <Label htmlFor="photos">Describe Your Other Photos (Optional)</Label>
                  <Textarea
                    id="photos"
                    placeholder="e.g., Main photo is at a beach, second is with friends at a bar, third is hiking..."
                    value={photosDescription}
                    onChange={(e) => setPhotosDescription(e.target.value)}
                    className="min-h-[80px] rounded-xl resize-none"
                    data-testid="photos-input"
                  />
                  <p className="text-xs text-muted-foreground">
                    Describing your other photos helps us give more complete feedback
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
                      {imageData ? "Analyzing Photo & Profile..." : "Analyzing..."}
                    </>
                  ) : (
                    <>
                      <Zap className="w-5 h-5 mr-2" />
                      {imageData ? "Get Full Profile Review" : "Get Profile Review"}
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

              {/* Image Analysis */}
              {result.image_analysis && (
                <Card className="rounded-3xl border-primary/30 bg-primary/5">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <ImageIcon className="w-5 h-5 text-primary" />
                      Photo Analysis
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-foreground whitespace-pre-wrap leading-relaxed">
                      {result.image_analysis}
                    </p>
                  </CardContent>
                </Card>
              )}

              {/* Review Content */}
              <Card className="rounded-3xl border-border/50 overflow-hidden">
                <CardContent className="p-6 space-y-6">
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
