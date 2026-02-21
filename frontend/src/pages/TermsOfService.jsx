import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { API } from "../App";
import { PageLayout } from "../components/layout/Layout";
import { Card, CardContent } from "../components/ui/card";
import axios from "axios";

export default function TermsOfService() {
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
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12" data-testid="terms-page">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="font-heading text-4xl font-bold mb-8">Terms of Service</h1>
          <p className="text-muted-foreground mb-8">Last updated: February 2025</p>
          
          <Card className="rounded-3xl border-border/50">
            <CardContent className="p-8 prose prose-sm dark:prose-invert max-w-none">
              <h2>1. Acceptance of Terms</h2>
              <p>By accessing or using {settings.brand_name}, you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our service.</p>

              <h2>2. Description of Service</h2>
              <p>{settings.brand_name} is an AI-powered dating assistant that provides:</p>
              <ul>
                <li>Conversation starter suggestions</li>
                <li>Chat reply recommendations</li>
                <li>Dating profile bio generation</li>
                <li>Profile optimization feedback</li>
                <li>Photo analysis for dating profiles</li>
              </ul>

              <h2>3. User Eligibility</h2>
              <p>You must be at least 18 years old to use this service. By using {settings.brand_name}, you represent that you are at least 18 years of age.</p>

              <h2>4. Account Registration</h2>
              <p>You must register using Google OAuth to access our services. You are responsible for maintaining the security of your account and all activities under your account.</p>

              <h2>5. Subscription and Payments</h2>
              <ul>
                <li>Free tier: 5 AI credits per month</li>
                <li>Paid subscriptions provide additional credits</li>
                <li>Payments are processed securely via Stripe</li>
                <li>Subscriptions auto-renew unless cancelled</li>
                <li>Credits do not roll over between billing periods</li>
              </ul>

              <h2>6. Acceptable Use</h2>
              <p>You agree NOT to:</p>
              <ul>
                <li>Use the service for any illegal purpose</li>
                <li>Generate harassing, threatening, or harmful content</li>
                <li>Impersonate others or misrepresent your identity</li>
                <li>Attempt to manipulate or abuse the AI system</li>
                <li>Share your account with others</li>
                <li>Use automated tools to access the service</li>
              </ul>

              <h2>7. AI-Generated Content</h2>
              <p>You understand that:</p>
              <ul>
                <li>All suggestions are AI-generated and may not always be appropriate</li>
                <li>You are responsible for reviewing and editing suggestions before use</li>
                <li>We do not guarantee results or success in dating</li>
                <li>AI suggestions should be used as guidance, not absolute advice</li>
              </ul>

              <h2>8. Intellectual Property</h2>
              <p>The service, including its AI models, design, and content, is owned by {settings.company_name}. You retain ownership of content you submit but grant us a license to process it for providing the service.</p>

              <h2>9. Limitation of Liability</h2>
              <p>{settings.brand_name} is provided "as is" without warranties. We are not liable for:</p>
              <ul>
                <li>Dating outcomes or relationship results</li>
                <li>Actions of other users on dating platforms</li>
                <li>Accuracy of AI-generated suggestions</li>
                <li>Service interruptions or data loss</li>
              </ul>

              <h2>10. Termination</h2>
              <p>We may terminate or suspend your account at any time for violations of these terms. You may cancel your subscription at any time through your account settings.</p>

              <h2>11. Changes to Terms</h2>
              <p>We may modify these terms at any time. Continued use of the service after changes constitutes acceptance of the new terms.</p>

              <h2>12. Governing Law</h2>
              <p>These terms are governed by applicable laws. Any disputes will be resolved through binding arbitration.</p>

              <h2>13. Contact</h2>
              <p>For questions about these Terms, contact us at: {settings.contact_email || "support@love-ai.com"}</p>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </PageLayout>
  );
}
