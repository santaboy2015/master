import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { API } from "../App";
import { PageLayout } from "../components/layout/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import { Mail, MessageCircle, Clock, Loader2, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import axios from "axios";

export default function Contact() {
  const [settings, setSettings] = useState({ 
    brand_name: "LOVE-AI", 
    company_name: "LOVE-AI Inc.",
    contact_email: "support@love-ai.com"
  });
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: ""
  });
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await axios.get(`${API}/settings/site`);
        setSettings(prev => ({ ...prev, ...response.data }));
      } catch (error) {}
    };
    fetchSettings();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.message) {
      toast.error("Please fill in all required fields");
      return;
    }

    setLoading(true);
    // Simulate form submission (in production, connect to email service)
    await new Promise(resolve => setTimeout(resolve, 1500));
    setSubmitted(true);
    setLoading(false);
    toast.success("Message sent! We'll get back to you soon.");
  };

  return (
    <PageLayout>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12" data-testid="contact-page">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="text-center mb-12">
            <h1 className="font-heading text-4xl font-bold mb-4">
              Contact <span className="gradient-text">Support</span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-xl mx-auto">
              Have a question or need help? We're here for you.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 mb-12">
            <Card className="rounded-3xl border-border/50 text-center">
              <CardContent className="p-6">
                <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <Mail className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-semibold mb-2">Email Us</h3>
                <p className="text-sm text-muted-foreground">{settings.contact_email || "support@love-ai.com"}</p>
              </CardContent>
            </Card>

            <Card className="rounded-3xl border-border/50 text-center">
              <CardContent className="p-6">
                <div className="w-12 h-12 rounded-2xl bg-secondary/10 flex items-center justify-center mx-auto mb-4">
                  <MessageCircle className="w-6 h-6 text-secondary" />
                </div>
                <h3 className="font-semibold mb-2">Live Chat</h3>
                <p className="text-sm text-muted-foreground">Coming Soon</p>
              </CardContent>
            </Card>

            <Card className="rounded-3xl border-border/50 text-center">
              <CardContent className="p-6">
                <div className="w-12 h-12 rounded-2xl bg-accent/10 flex items-center justify-center mx-auto mb-4">
                  <Clock className="w-6 h-6 text-accent" />
                </div>
                <h3 className="font-semibold mb-2">Response Time</h3>
                <p className="text-sm text-muted-foreground">Within 24-48 hours</p>
              </CardContent>
            </Card>
          </div>

          <Card className="rounded-3xl border-border/50">
            <CardHeader>
              <CardTitle>Send us a Message</CardTitle>
            </CardHeader>
            <CardContent>
              {submitted ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-4">
                    <CheckCircle2 className="w-8 h-8 text-green-500" />
                  </div>
                  <h3 className="font-heading text-2xl font-bold mb-2">Message Sent!</h3>
                  <p className="text-muted-foreground mb-6">We'll get back to you within 24-48 hours.</p>
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setSubmitted(false);
                      setFormData({ name: "", email: "", subject: "", message: "" });
                    }}
                    className="rounded-xl"
                  >
                    Send Another Message
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid sm:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="name">Name *</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="Your name"
                        className="rounded-xl"
                        data-testid="contact-name"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email *</Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder="your@email.com"
                        className="rounded-xl"
                        data-testid="contact-email"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="subject">Subject</Label>
                    <Input
                      id="subject"
                      value={formData.subject}
                      onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                      placeholder="How can we help?"
                      className="rounded-xl"
                      data-testid="contact-subject"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="message">Message *</Label>
                    <Textarea
                      id="message"
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      placeholder="Tell us more about your question or issue..."
                      className="min-h-[150px] rounded-xl resize-none"
                      data-testid="contact-message"
                    />
                  </div>

                  <Button
                    type="submit"
                    disabled={loading}
                    className="w-full rounded-xl h-12 bg-gradient-to-r from-[#FF0055] to-[#7000FF] hover:opacity-90 text-white"
                    data-testid="contact-submit"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <Mail className="w-5 h-5 mr-2" />
                        Send Message
                      </>
                    )}
                  </Button>
                </form>
              )}
            </CardContent>
          </Card>

          <div className="mt-12 text-center">
            <h3 className="font-heading text-xl font-bold mb-4">Frequently Asked Questions</h3>
            <div className="grid sm:grid-cols-2 gap-4 text-left">
              <Card className="rounded-2xl border-border/50">
                <CardContent className="p-4">
                  <h4 className="font-semibold mb-2">How do I cancel my subscription?</h4>
                  <p className="text-sm text-muted-foreground">You can cancel anytime from your dashboard. Your access continues until the end of your billing period.</p>
                </CardContent>
              </Card>
              <Card className="rounded-2xl border-border/50">
                <CardContent className="p-4">
                  <h4 className="font-semibold mb-2">How do I get a refund?</h4>
                  <p className="text-sm text-muted-foreground">Refunds are available within 7 days of purchase if you've used fewer than 10 credits. Email us to request.</p>
                </CardContent>
              </Card>
              <Card className="rounded-2xl border-border/50">
                <CardContent className="p-4">
                  <h4 className="font-semibold mb-2">Is my data safe?</h4>
                  <p className="text-sm text-muted-foreground">Yes! We don't store your conversations or images. See our Privacy Policy for details.</p>
                </CardContent>
              </Card>
              <Card className="rounded-2xl border-border/50">
                <CardContent className="p-4">
                  <h4 className="font-semibold mb-2">Do credits roll over?</h4>
                  <p className="text-sm text-muted-foreground">No, unused credits expire at the end of each billing period and don't carry over.</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </motion.div>
      </div>
    </PageLayout>
  );
}
