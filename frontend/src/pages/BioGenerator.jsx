import { useState, useRef } from "react";
import { motion } from "framer-motion";
import { useAuth, API } from "../App";
import { PageLayout } from "../components/layout/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { Badge } from "../components/ui/badge";
import { User, Copy, RefreshCw, Loader2, CheckCircle2, X, Plus, Upload, Image as ImageIcon } from "lucide-react";
import { toast } from "sonner";
import axios from "axios";

const personalities = [
  { value: "adventurous", label: "Adventurous & Spontaneous" },
  { value: "intellectual", label: "Intellectual & Curious" },
  { value: "funny", label: "Funny & Witty" },
  { value: "chill", label: "Laid-back & Chill" },
  { value: "romantic", label: "Romantic & Sincere" },
  { value: "ambitious", label: "Ambitious & Driven" },
];

const lookingForOptions = [
  { value: "relationship", label: "Serious Relationship" },
  { value: "casual", label: "Something Casual" },
  { value: "friendship", label: "Friends First" },
  { value: "open", label: "Open to Anything" },
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

export default function BioGenerator() {
  const { user, refreshUser } = useAuth();
  const [interests, setInterests] = useState([]);
  const [interestInput, setInterestInput] = useState("");
  const [personality, setPersonality] = useState("funny");
  const [lookingFor, setLookingFor] = useState("open");
  const [age, setAge] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [copiedIndex, setCopiedIndex] = useState(null);
  const [imageData, setImageData] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const fileInputRef = useRef(null);

  const addInterest = () => {
    if (interestInput.trim() && interests.length < 10) {
      setInterests([...interests, interestInput.trim()]);
      setInterestInput("");
    }
  };

  const removeInterest = (index) => {
    setInterests(interests.filter((_, i) => i !== index));
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addInterest();
    }
  };

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
    if (interests.length === 0) {
      toast.error("Please add at least one interest");
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const response = await axios.post(
        `${API}/ai/bio-generator`,
        {
          interests,
          personality,
          looking_for: lookingFor,
          age: age ? parseInt(age) : null,
          image_data: imageData
        },
        { withCredentials: true }
      );
      setResult(response.data);
      await refreshUser();
      toast.success("Bio options generated!");
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

  const parseBios = (content) => {
    if (!content) return [];
    const bios = [];
    const lines = content.split('\n');
    let currentBio = '';
    
    for (const line of lines) {
      if (line.match(/^[1-3]\./)) {
        if (currentBio) bios.push(currentBio.trim());
        currentBio = line.replace(/^[1-3]\.?\s*/, '');
      } else if (line.trim()) {
        currentBio += ' ' + line.trim();
      }
    }
    if (currentBio) bios.push(currentBio.trim());
    
    return bios.filter(b => b.length > 20);
  };

  const creditsRemaining = user ? user.monthly_credits - user.credits_used : 0;

  return (
    <PageLayout>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12" data-testid="bio-generator-page">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {/* Header */}
          <motion.div variants={itemVariants} className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-[#00FFFF] to-[#22D3EE] mb-6">
              <User className="w-8 h-8 text-black" />
            </div>
            <h1 className="font-heading text-4xl font-bold mb-4">
              Bio <span className="gradient-text">Generator</span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-xl mx-auto">
              Create a bio that stands out and shows off your personality. Optionally upload a profile photo for AI analysis.
            </p>
          </motion.div>

          {/* Form Card */}
          <motion.div variants={itemVariants}>
            <Card className="rounded-3xl border-border/50 mb-8" data-testid="bio-form">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Create Your Bio</span>
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
                    Upload a photo for AI-powered feedback on your profile picture
                  </p>
                  
                  {imagePreview ? (
                    <div className="relative w-32 h-32 rounded-2xl overflow-hidden border border-border">
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
                      className="w-32 h-32 rounded-2xl border-2 border-dashed border-border hover:border-primary/50 flex flex-col items-center justify-center cursor-pointer transition-colors"
                      data-testid="upload-image-area"
                    >
                      <Upload className="w-6 h-6 text-muted-foreground mb-2" />
                      <span className="text-xs text-muted-foreground">Upload</span>
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

                {/* Interests */}
                <div className="space-y-2">
                  <Label>Your Interests & Hobbies</Label>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Add an interest (e.g., hiking, cooking, photography)"
                      value={interestInput}
                      onChange={(e) => setInterestInput(e.target.value)}
                      onKeyPress={handleKeyPress}
                      className="rounded-xl"
                      data-testid="interest-input"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={addInterest}
                      className="rounded-xl shrink-0"
                      data-testid="add-interest-btn"
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                  {interests.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-3">
                      {interests.map((interest, index) => (
                        <Badge
                          key={index}
                          variant="secondary"
                          className="rounded-full px-3 py-1 flex items-center gap-1"
                          data-testid={`interest-badge-${index}`}
                        >
                          {interest}
                          <button
                            onClick={() => removeInterest(index)}
                            className="ml-1 hover:text-destructive"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Add 3-5 interests for best results
                  </p>
                </div>

                <div className="grid sm:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label>Your Personality</Label>
                    <Select value={personality} onValueChange={setPersonality}>
                      <SelectTrigger className="rounded-xl" data-testid="personality-select">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {personalities.map((p) => (
                          <SelectItem key={p.value} value={p.value}>
                            {p.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Looking For</Label>
                    <Select value={lookingFor} onValueChange={setLookingFor}>
                      <SelectTrigger className="rounded-xl" data-testid="looking-for-select">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {lookingForOptions.map((l) => (
                          <SelectItem key={l.value} value={l.value}>
                            {l.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="age">Age (Optional)</Label>
                  <Input
                    id="age"
                    type="number"
                    placeholder="Your age"
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                    className="rounded-xl max-w-[150px]"
                    min="18"
                    max="100"
                    data-testid="age-input"
                  />
                </div>

                <Button
                  onClick={handleGenerate}
                  disabled={loading || creditsRemaining <= 0 || interests.length === 0}
                  className="w-full rounded-xl h-12 bg-gradient-to-r from-[#00FFFF] to-[#22D3EE] hover:opacity-90 text-black font-semibold"
                  data-testid="generate-btn"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      {imageData ? "Analyzing & Generating..." : "Generating..."}
                    </>
                  ) : (
                    <>
                      <User className="w-5 h-5 mr-2" />
                      {imageData ? "Generate Bio with Photo Analysis" : "Generate Bio Options"}
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
              {/* Image Analysis */}
              {result.image_analysis && (
                <Card className="rounded-3xl border-accent/30 bg-accent/5">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <ImageIcon className="w-5 h-5 text-accent" />
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

              <div className="flex items-center justify-between">
                <h2 className="font-heading text-xl font-semibold">Your Bio Options</h2>
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

              {(() => {
                const bios = parseBios(result.content);
                return bios.length > 0 ? (
                  <div className="space-y-3">
                    {bios.map((bio, index) => (
                      <Card 
                        key={index} 
                        className="rounded-2xl border-border/50 hover:border-accent/30 transition-colors"
                        data-testid={`bio-${index}`}
                      >
                        <CardContent className="p-4 flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <Badge variant="outline" className="rounded-full mb-2 text-xs">
                              Option {index + 1}
                            </Badge>
                            <p className="text-foreground leading-relaxed">{bio}</p>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => copyToClipboard(bio, index)}
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
                );
              })()}
            </motion.div>
          )}
        </motion.div>
      </div>
    </PageLayout>
  );
}
