import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { API } from "../App";
import { PageLayout } from "../components/layout/Layout";
import { Card, CardContent } from "../components/ui/card";
import axios from "axios";

export default function AIDisclosure() {
  const [settings, setSettings] = useState({ brand_name: "LOVE-AI", company_name: "LOVE-AI Inc." });

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await axios.get(`${API}/settings/site`);
        setSettings(prev => ({ ...prev, ...response.data }));
      } catch (error) {}
    };
    fetchSettings();
  }, []);

  return (
    <PageLayout>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12" data-testid="ai-disclosure-page">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="font-heading text-4xl font-bold mb-8">Data Processing & AI Disclosure</h1>
          <p className="text-muted-foreground mb-8">Last updated: February 2025</p>
          
          <Card className="rounded-3xl border-border/50">
            <CardContent className="p-8 prose prose-sm dark:prose-invert max-w-none">
              <h2>1. AI Technology Overview</h2>
              <p>{settings.brand_name} uses advanced artificial intelligence to provide dating assistance. This disclosure explains how our AI works and how your data is processed.</p>

              <h2>2. AI Models Used</h2>
              <ul>
                <li><strong>GPT-5.2 (OpenAI):</strong> Used for generating conversation starters, chat replies, and profile bios</li>
                <li><strong>GPT-4o Vision (OpenAI):</strong> Used for analyzing profile photos when uploaded</li>
              </ul>

              <h2>3. How Your Data Is Processed</h2>
              
              <h3>Text Generation</h3>
              <p>When you request AI assistance:</p>
              <ol>
                <li>Your input (profile context, conversation details) is sent to our secure servers</li>
                <li>Our server processes your request using OpenAI's API</li>
                <li>The AI generates suggestions based on your input</li>
                <li>Suggestions are returned to you immediately</li>
                <li>Your input is NOT stored after the response is generated</li>
              </ol>

              <h3>Image Analysis</h3>
              <p>When you upload a photo:</p>
              <ol>
                <li>The image is temporarily processed on our secure servers</li>
                <li>The image is analyzed by GPT-4o Vision for feedback</li>
                <li>Analysis results are returned to you</li>
                <li>Images are NOT permanently stored or used for training</li>
              </ol>

              <h2>4. Data NOT Used for AI Training</h2>
              <p className="font-semibold text-primary">Important: Your personal data, conversations, and images are NOT used to train AI models.</p>
              <p>We use OpenAI's API services which have separate data processing agreements ensuring your data is not used for model training.</p>

              <h2>5. AI Limitations</h2>
              <p>You should understand that:</p>
              <ul>
                <li>AI suggestions are generated based on patterns and may not always be appropriate</li>
                <li>AI cannot guarantee dating success or relationship outcomes</li>
                <li>AI may occasionally generate incorrect or inappropriate content</li>
                <li>You are responsible for reviewing all suggestions before use</li>
                <li>AI does not have access to other dating platform users' information</li>
              </ul>

              <h2>6. Human Oversight</h2>
              <p>While our service is AI-powered:</p>
              <ul>
                <li>Our team monitors AI outputs for quality and safety</li>
                <li>We have content filters to prevent harmful content</li>
                <li>Users can report inappropriate AI responses</li>
                <li>We regularly review and improve our AI prompts</li>
              </ul>

              <h2>7. Your Rights Regarding AI Processing</h2>
              <ul>
                <li><strong>Opt-out:</strong> You can choose not to use AI features</li>
                <li><strong>Transparency:</strong> All AI-generated content is clearly labeled</li>
                <li><strong>Deletion:</strong> Request deletion of your account and associated data</li>
                <li><strong>Explanation:</strong> Request information about how AI processed your data</li>
              </ul>

              <h2>8. Third-Party AI Services</h2>
              <p>We use OpenAI's services. Their data processing is governed by:</p>
              <ul>
                <li>OpenAI's API Terms of Service</li>
                <li>OpenAI's Privacy Policy</li>
                <li>Our Data Processing Agreement with OpenAI</li>
              </ul>

              <h2>9. Security Measures</h2>
              <ul>
                <li>All data transmission is encrypted (HTTPS/TLS)</li>
                <li>API keys are securely stored and never exposed</li>
                <li>Access to AI services is authenticated and logged</li>
                <li>Regular security audits are conducted</li>
              </ul>

              <h2>10. Ethical AI Use</h2>
              <p>We are committed to ethical AI use:</p>
              <ul>
                <li>We do not use AI to deceive or manipulate</li>
                <li>AI suggestions respect dignity and consent</li>
                <li>We actively prevent misuse of AI features</li>
                <li>We comply with AI regulations and best practices</li>
              </ul>

              <h2>11. Updates to AI Systems</h2>
              <p>We may update our AI systems to improve quality. Significant changes will be communicated through this disclosure.</p>

              <h2>12. Contact Us</h2>
              <p>For questions about our AI systems or data processing, contact us at: {settings.contact_email || "support@love-ai.com"}</p>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </PageLayout>
  );
}
