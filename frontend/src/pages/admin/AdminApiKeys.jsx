import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { API } from "../../App";
import { AdminLayout } from "../../components/layout/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Key, Save, Loader2, Eye, EyeOff, CheckCircle2, XCircle } from "lucide-react";
import { toast } from "sonner";
import axios from "axios";

export default function AdminApiKeys() {
  const [keys, setKeys] = useState({
    emergent_llm_key: "",
    stripe_api_key: "",
    has_emergent_key: false,
    has_stripe_key: false
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showEmergentKey, setShowEmergentKey] = useState(false);
  const [showStripeKey, setShowStripeKey] = useState(false);
  const [newKeys, setNewKeys] = useState({
    emergent_llm_key: "",
    stripe_api_key: ""
  });

  useEffect(() => {
    fetchKeys();
  }, []);

  const fetchKeys = async () => {
    try {
      const response = await axios.get(`${API}/admin/settings/api-keys`, {
        withCredentials: true
      });
      setKeys(response.data);
    } catch (error) {
      toast.error("Failed to load API keys");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const updateData = {};
      if (newKeys.emergent_llm_key) updateData.emergent_llm_key = newKeys.emergent_llm_key;
      if (newKeys.stripe_api_key) updateData.stripe_api_key = newKeys.stripe_api_key;

      if (Object.keys(updateData).length === 0) {
        toast.info("No changes to save");
        setSaving(false);
        return;
      }

      await axios.put(`${API}/admin/settings/api-keys`, updateData, {
        withCredentials: true
      });
      
      toast.success("API keys updated!");
      setNewKeys({ emergent_llm_key: "", stripe_api_key: "" });
      await fetchKeys();
    } catch (error) {
      toast.error("Failed to save API keys");
    } finally {
      setSaving(false);
    }
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

  return (
    <AdminLayout>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12" data-testid="admin-api-keys">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="font-heading text-3xl font-bold mb-2 flex items-center gap-3">
                <Key className="w-8 h-8 text-primary" />
                API Keys
              </h1>
              <p className="text-muted-foreground">Manage your service integrations</p>
            </div>
            <Button
              onClick={handleSave}
              disabled={saving}
              className="rounded-xl bg-gradient-to-r from-[#FF0055] to-[#7000FF] text-white"
              data-testid="save-keys-btn"
            >
              {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
              Save Changes
            </Button>
          </div>

          <div className="space-y-6">
            {/* Emergent LLM Key */}
            <Card className="rounded-3xl border-border/50" data-testid="emergent-key-card">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      Emergent LLM Key
                      {keys.has_emergent_key ? (
                        <CheckCircle2 className="w-5 h-5 text-green-500" />
                      ) : (
                        <XCircle className="w-5 h-5 text-destructive" />
                      )}
                    </CardTitle>
                    <CardDescription>Powers GPT-5.2 and GPT-4o for AI features</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {keys.has_emergent_key && (
                  <div className="p-3 rounded-xl bg-muted/50 font-mono text-sm">
                    Current: {keys.emergent_llm_key}
                  </div>
                )}
                <div className="space-y-2">
                  <Label>New Emergent LLM Key</Label>
                  <div className="relative">
                    <Input
                      type={showEmergentKey ? "text" : "password"}
                      value={newKeys.emergent_llm_key}
                      onChange={(e) => setNewKeys({ ...newKeys, emergent_llm_key: e.target.value })}
                      placeholder="sk-emergent-..."
                      className="rounded-xl pr-10"
                      data-testid="emergent-key-input"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8"
                      onClick={() => setShowEmergentKey(!showEmergentKey)}
                    >
                      {showEmergentKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Get your key from Emergent dashboard → Profile → Universal Key
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Stripe API Key */}
            <Card className="rounded-3xl border-border/50" data-testid="stripe-key-card">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      Stripe API Key
                      {keys.has_stripe_key ? (
                        <CheckCircle2 className="w-5 h-5 text-green-500" />
                      ) : (
                        <XCircle className="w-5 h-5 text-destructive" />
                      )}
                    </CardTitle>
                    <CardDescription>Powers subscription payments</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {keys.has_stripe_key && (
                  <div className="p-3 rounded-xl bg-muted/50 font-mono text-sm">
                    Current: {keys.stripe_api_key}
                  </div>
                )}
                <div className="space-y-2">
                  <Label>New Stripe Secret Key</Label>
                  <div className="relative">
                    <Input
                      type={showStripeKey ? "text" : "password"}
                      value={newKeys.stripe_api_key}
                      onChange={(e) => setNewKeys({ ...newKeys, stripe_api_key: e.target.value })}
                      placeholder="sk_live_... or sk_test_..."
                      className="rounded-xl pr-10"
                      data-testid="stripe-key-input"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8"
                      onClick={() => setShowStripeKey(!showStripeKey)}
                    >
                      {showStripeKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Get your key from Stripe dashboard → Developers → API keys
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Security Notice */}
            <Card className="rounded-3xl border-yellow-500/30 bg-yellow-500/5">
              <CardContent className="p-6">
                <h3 className="font-semibold mb-2 flex items-center gap-2">
                  <Key className="w-5 h-5 text-yellow-500" />
                  Security Notice
                </h3>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• API keys are encrypted before storage</li>
                  <li>• Keys are never exposed in full after saving</li>
                  <li>• Use test keys during development</li>
                  <li>• Rotate keys periodically for security</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </motion.div>
      </div>
    </AdminLayout>
  );
}
