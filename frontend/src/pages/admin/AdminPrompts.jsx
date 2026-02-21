import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { API } from "../../App";
import { AdminLayout } from "../../components/layout/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Label } from "../../components/ui/label";
import { Textarea } from "../../components/ui/textarea";
import { MessageSquare, Save, Loader2, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import axios from "axios";

const defaultPrompts = {
  conversation_starters_prompt: `You are a charming dating coach specializing in helping people start engaging conversations on dating apps. 
Your responses should be:
- Witty and clever, not cheesy or cringe
- Personalized based on the context provided
- Respectful and not inappropriate
- Natural sounding, like something a real person would say

Generate 3-5 unique conversation starters based on the context. Format them as a numbered list.`,
  
  chat_reply_prompt: `You are an expert dating conversation coach. Your job is to suggest witty, engaging replies to continue a dating app conversation.
Your responses should:
- Match the energy and tone of the conversation
- Be engaging and lead to further conversation
- Show genuine interest without being desperate
- Be appropriate and respectful

Provide 3 different reply options with different approaches (playful, sincere, curious).`,
  
  bio_generator_prompt: `You are a dating profile expert who crafts compelling, authentic bios that attract matches.
Your bios should:
- Be concise (under 500 characters)
- Show personality, not just list traits
- Include a hook or conversation starter
- Be genuine and not try-hard
- Avoid clichés like "love to travel" or "fluent in sarcasm"

Generate 3 different bio options with different styles.`,
  
  profile_review_prompt: `You are a dating profile optimization expert. Your job is to review profiles and provide actionable feedback.
Your review should cover:
- Bio effectiveness (hook, personality, conversation starters)
- Red flags or turn-offs to remove
- Missing elements that could boost matches
- Platform-specific tips

Be constructive and specific with your feedback.`
};

export default function AdminPrompts() {
  const [prompts, setPrompts] = useState(defaultPrompts);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchPrompts();
  }, []);

  const fetchPrompts = async () => {
    try {
      const response = await axios.get(`${API}/admin/settings/prompts`, {
        withCredentials: true
      });
      setPrompts({ ...defaultPrompts, ...response.data });
    } catch (error) {
      toast.error("Failed to load prompts");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await axios.put(`${API}/admin/settings/prompts`, prompts, {
        withCredentials: true
      });
      toast.success("AI prompts saved!");
    } catch (error) {
      toast.error("Failed to save prompts");
    } finally {
      setSaving(false);
    }
  };

  const resetPrompt = (key) => {
    setPrompts({ ...prompts, [key]: defaultPrompts[key] });
    toast.info("Prompt reset to default");
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </AdminLayout>
    );
  }

  const promptConfigs = [
    {
      key: "conversation_starters_prompt",
      title: "Conversation Starters",
      description: "System prompt for generating pickup lines and openers"
    },
    {
      key: "chat_reply_prompt",
      title: "Chat Reply Suggestions",
      description: "System prompt for suggesting conversation replies"
    },
    {
      key: "bio_generator_prompt",
      title: "Bio Generator",
      description: "System prompt for creating dating profile bios"
    },
    {
      key: "profile_review_prompt",
      title: "Profile Review",
      description: "System prompt for reviewing and optimizing profiles"
    }
  ];

  return (
    <AdminLayout>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12" data-testid="admin-prompts">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="font-heading text-3xl font-bold mb-2 flex items-center gap-3">
                <MessageSquare className="w-8 h-8 text-primary" />
                AI Prompts
              </h1>
              <p className="text-muted-foreground">Customize AI behavior and responses</p>
            </div>
            <Button
              onClick={handleSave}
              disabled={saving}
              className="rounded-xl bg-gradient-to-r from-[#FF0055] to-[#7000FF] text-white"
              data-testid="save-prompts-btn"
            >
              {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
              Save Changes
            </Button>
          </div>

          <div className="space-y-6">
            {promptConfigs.map((config) => (
              <Card key={config.key} className="rounded-3xl border-border/50" data-testid={`prompt-${config.key}`}>
                <CardHeader className="flex flex-row items-start justify-between">
                  <div>
                    <CardTitle>{config.title}</CardTitle>
                    <CardDescription>{config.description}</CardDescription>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => resetPrompt(config.key)}
                    className="text-muted-foreground"
                  >
                    <RotateCcw className="w-4 h-4 mr-2" />
                    Reset
                  </Button>
                </CardHeader>
                <CardContent>
                  <Textarea
                    value={prompts[config.key]}
                    onChange={(e) => setPrompts({ ...prompts, [config.key]: e.target.value })}
                    className="min-h-[200px] rounded-xl font-mono text-sm"
                    placeholder="Enter system prompt..."
                  />
                </CardContent>
              </Card>
            ))}
          </div>

          <Card className="rounded-3xl border-border/50 mt-8 bg-muted/50">
            <CardContent className="p-6">
              <h3 className="font-semibold mb-2">Tips for Writing Effective Prompts</h3>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Be specific about the tone and style you want</li>
                <li>• Include examples of good and bad outputs</li>
                <li>• Specify the format (numbered list, paragraphs, etc.)</li>
                <li>• Set boundaries for appropriate content</li>
                <li>• Test changes with different inputs before saving</li>
              </ul>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </AdminLayout>
  );
}
