import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { API } from "../App";
import { PageLayout } from "../components/layout/Layout";
import { Card, CardContent } from "../components/ui/card";
import axios from "axios";

export default function PrivacyPolicy() {
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
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12" data-testid="privacy-policy-page">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="font-heading text-4xl font-bold mb-8">Privacy Policy</h1>
          <p className="text-muted-foreground mb-8">Last updated: February 2025</p>
          
          <Card className="rounded-3xl border-border/50">
            <CardContent className="p-8 prose prose-sm dark:prose-invert max-w-none">
              <h2>1. Introduction</h2>
              <p>Welcome to {settings.brand_name} ("we," "our," or "us"). We are committed to protecting your personal information and your right to privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our AI-powered dating assistant service.</p>

              <h2>2. Information We Collect</h2>
              <h3>Personal Information</h3>
              <ul>
                <li>Account information (name, email address) via Google OAuth</li>
                <li>Profile pictures you upload for analysis</li>
                <li>Dating profile content you submit for review</li>
                <li>Conversation context you provide for AI suggestions</li>
                <li>Payment information (processed securely via Stripe)</li>
              </ul>
              
              <h3>Automatically Collected Information</h3>
              <ul>
                <li>Device and browser information</li>
                <li>Usage data and analytics</li>
                <li>Cookies and similar tracking technologies</li>
              </ul>

              <h2>3. How We Use Your Information</h2>
              <ul>
                <li>To provide AI-powered dating assistance services</li>
                <li>To process your subscription and payments</li>
                <li>To improve our AI models and service quality</li>
                <li>To communicate with you about your account</li>
                <li>To comply with legal obligations</li>
              </ul>

              <h2>4. AI Data Processing</h2>
              <p>Your inputs (conversation context, profile content, images) are processed by AI models (GPT-5.2 and GPT-4o) to generate suggestions. We do not use your personal data to train AI models. All AI processing is done in real-time and data is not retained after generating responses.</p>

              <h2>5. Data Sharing</h2>
              <p>We do not sell your personal information. We may share data with:</p>
              <ul>
                <li>AI service providers (OpenAI) for processing requests</li>
                <li>Payment processors (Stripe) for handling transactions</li>
                <li>Authentication providers (Google) for login services</li>
              </ul>

              <h2>6. Data Security</h2>
              <p>We implement industry-standard security measures to protect your data, including encryption, secure authentication, and regular security audits.</p>

              <h2>7. Your Rights</h2>
              <p>You have the right to:</p>
              <ul>
                <li>Access your personal data</li>
                <li>Request deletion of your account and data</li>
                <li>Opt out of marketing communications</li>
                <li>Export your data</li>
              </ul>

              <h2>8. Data Retention</h2>
              <p>We retain your account data for as long as your account is active. You may request deletion at any time by contacting us.</p>

              <h2>9. Children's Privacy</h2>
              <p>Our service is not intended for users under 18 years of age. We do not knowingly collect data from minors.</p>

              <h2>10. Changes to This Policy</h2>
              <p>We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new policy on this page.</p>

              <h2>11. Contact Us</h2>
              <p>If you have questions about this Privacy Policy, please contact us at: {settings.contact_email || "support@love-ai.com"}</p>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </PageLayout>
  );
}
