import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { API } from "../App";
import { PageLayout } from "../components/layout/Layout";
import { Card, CardContent } from "../components/ui/card";
import axios from "axios";

export default function RefundPolicy() {
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
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12" data-testid="refund-policy-page">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="font-heading text-4xl font-bold mb-8">Refund Policy</h1>
          <p className="text-muted-foreground mb-8">Last updated: February 2025</p>
          
          <Card className="rounded-3xl border-border/50">
            <CardContent className="p-8 prose prose-sm dark:prose-invert max-w-none">
              <h2>1. Overview</h2>
              <p>At {settings.brand_name}, we want you to be satisfied with your purchase. This policy outlines our refund terms for subscription services.</p>

              <h2>2. Free Trial</h2>
              <p>We offer 5 free AI credits to all new users. We encourage you to try our service before upgrading to a paid plan.</p>

              <h2>3. Subscription Refunds</h2>
              <h3>Within 7 Days of Purchase</h3>
              <p>If you are not satisfied with your subscription, you may request a full refund within 7 days of your initial purchase, provided you have used fewer than 10 credits.</p>

              <h3>After 7 Days</h3>
              <p>After the 7-day period, subscriptions are non-refundable. However, you may cancel your subscription at any time to prevent future charges.</p>

              <h2>4. How to Request a Refund</h2>
              <ol>
                <li>Email us at {settings.contact_email || "support@love-ai.com"}</li>
                <li>Include your account email and reason for refund</li>
                <li>We will process your request within 5-7 business days</li>
              </ol>

              <h2>5. Refund Processing</h2>
              <ul>
                <li>Refunds are processed through the original payment method (Stripe)</li>
                <li>It may take 5-10 business days for the refund to appear in your account</li>
                <li>Upon refund, your subscription will be cancelled and credits revoked</li>
              </ul>

              <h2>6. Non-Refundable Items</h2>
              <ul>
                <li>Used AI credits cannot be refunded</li>
                <li>Partial month refunds are not available</li>
                <li>Subscriptions cancelled after the refund period</li>
              </ul>

              <h2>7. Subscription Cancellation</h2>
              <p>You may cancel your subscription at any time:</p>
              <ul>
                <li>Your access continues until the end of your billing period</li>
                <li>No refunds for partial months</li>
                <li>Unused credits expire at the end of the billing period</li>
              </ul>

              <h2>8. Disputes</h2>
              <p>If you have a billing dispute, please contact us before initiating a chargeback. We are committed to resolving issues fairly and promptly.</p>

              <h2>9. Changes to This Policy</h2>
              <p>We reserve the right to modify this refund policy at any time. Changes will be posted on this page.</p>

              <h2>10. Contact Us</h2>
              <p>For refund requests or questions, contact us at: {settings.contact_email || "support@love-ai.com"}</p>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </PageLayout>
  );
}
