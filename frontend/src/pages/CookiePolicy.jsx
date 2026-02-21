import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { API } from "../App";
import { PageLayout } from "../components/layout/Layout";
import { Card, CardContent } from "../components/ui/card";
import axios from "axios";

export default function CookiePolicy() {
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
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12" data-testid="cookie-policy-page">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="font-heading text-4xl font-bold mb-8">Cookie Policy</h1>
          <p className="text-muted-foreground mb-8">Last updated: February 2025</p>
          
          <Card className="rounded-3xl border-border/50">
            <CardContent className="p-8 prose prose-sm dark:prose-invert max-w-none">
              <h2>1. What Are Cookies?</h2>
              <p>Cookies are small text files stored on your device when you visit a website. They help websites remember your preferences and improve your experience.</p>

              <h2>2. How We Use Cookies</h2>
              <p>{settings.brand_name} uses cookies for the following purposes:</p>

              <h3>Essential Cookies</h3>
              <ul>
                <li><strong>Authentication:</strong> To keep you logged in securely</li>
                <li><strong>Session Management:</strong> To maintain your session state</li>
                <li><strong>Security:</strong> To protect against fraud and unauthorized access</li>
              </ul>

              <h3>Functional Cookies</h3>
              <ul>
                <li><strong>Theme Preferences:</strong> To remember your dark/light mode choice</li>
                <li><strong>Language Settings:</strong> To remember your language preference</li>
              </ul>

              <h3>Analytics Cookies</h3>
              <ul>
                <li><strong>Usage Analytics:</strong> To understand how you use our service</li>
                <li><strong>Performance Monitoring:</strong> To identify and fix issues</li>
              </ul>

              <h2>3. Third-Party Cookies</h2>
              <p>We may use third-party services that set cookies:</p>
              <ul>
                <li><strong>Google (Authentication):</strong> For secure login via Google OAuth</li>
                <li><strong>Stripe (Payments):</strong> For secure payment processing</li>
              </ul>

              <h2>4. Managing Cookies</h2>
              <p>You can control cookies through your browser settings:</p>
              <ul>
                <li><strong>Chrome:</strong> Settings → Privacy and security → Cookies</li>
                <li><strong>Firefox:</strong> Options → Privacy & Security → Cookies</li>
                <li><strong>Safari:</strong> Preferences → Privacy → Cookies</li>
                <li><strong>Edge:</strong> Settings → Cookies and site permissions</li>
              </ul>

              <h2>5. Disabling Cookies</h2>
              <p>Note that disabling essential cookies may:</p>
              <ul>
                <li>Prevent you from logging in</li>
                <li>Affect service functionality</li>
                <li>Reset your preferences each visit</li>
              </ul>

              <h2>6. Cookie Retention</h2>
              <table>
                <thead>
                  <tr>
                    <th>Cookie Type</th>
                    <th>Duration</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Session cookies</td>
                    <td>Until browser is closed</td>
                  </tr>
                  <tr>
                    <td>Authentication</td>
                    <td>7 days</td>
                  </tr>
                  <tr>
                    <td>Preferences</td>
                    <td>1 year</td>
                  </tr>
                </tbody>
              </table>

              <h2>7. Updates to This Policy</h2>
              <p>We may update this Cookie Policy from time to time. Changes will be posted on this page with an updated date.</p>

              <h2>8. Contact Us</h2>
              <p>If you have questions about our use of cookies, contact us at: {settings.contact_email || "support@love-ai.com"}</p>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </PageLayout>
  );
}
