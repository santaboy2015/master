import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { API } from "../../App";
import { AdminLayout } from "../../components/layout/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { DollarSign, Save, Loader2, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import axios from "axios";

export default function AdminPricing() {
  const [settings, setSettings] = useState({ plans: [] });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await axios.get(`${API}/admin/settings/pricing`, {
        withCredentials: true
      });
      setSettings(response.data);
    } catch (error) {
      toast.error("Failed to load pricing");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await axios.put(`${API}/admin/settings/pricing`, settings, {
        withCredentials: true
      });
      toast.success("Pricing saved!");
    } catch (error) {
      toast.error("Failed to save pricing");
    } finally {
      setSaving(false);
    }
  };

  const updatePlan = (index, field, value) => {
    const newPlans = [...settings.plans];
    newPlans[index] = { ...newPlans[index], [field]: value };
    setSettings({ ...settings, plans: newPlans });
  };

  const updatePlanFeature = (planIndex, featureIndex, value) => {
    const newPlans = [...settings.plans];
    const newFeatures = [...newPlans[planIndex].features];
    newFeatures[featureIndex] = value;
    newPlans[planIndex] = { ...newPlans[planIndex], features: newFeatures };
    setSettings({ ...settings, plans: newPlans });
  };

  const addPlanFeature = (planIndex) => {
    const newPlans = [...settings.plans];
    newPlans[planIndex].features.push("");
    setSettings({ ...settings, plans: newPlans });
  };

  const removePlanFeature = (planIndex, featureIndex) => {
    const newPlans = [...settings.plans];
    newPlans[planIndex].features = newPlans[planIndex].features.filter((_, i) => i !== featureIndex);
    setSettings({ ...settings, plans: newPlans });
  };

  const addPlan = () => {
    setSettings({
      ...settings,
      plans: [...settings.plans, {
        plan_id: `plan_${Date.now()}`,
        name: "New Plan",
        price: 0,
        credits_per_month: 10,
        features: ["Feature 1"]
      }]
    });
  };

  const removePlan = (index) => {
    setSettings({
      ...settings,
      plans: settings.plans.filter((_, i) => i !== index)
    });
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
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12" data-testid="admin-pricing">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="font-heading text-3xl font-bold mb-2 flex items-center gap-3">
                <DollarSign className="w-8 h-8 text-primary" />
                Pricing Plans
              </h1>
              <p className="text-muted-foreground">Configure subscription plans and pricing</p>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" onClick={addPlan} className="rounded-xl">
                <Plus className="w-4 h-4 mr-2" />
                Add Plan
              </Button>
              <Button
                onClick={handleSave}
                disabled={saving}
                className="rounded-xl bg-gradient-to-r from-[#FF0055] to-[#7000FF] text-white"
                data-testid="save-pricing-btn"
              >
                {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                Save Changes
              </Button>
            </div>
          </div>

          <div className="space-y-6">
            {settings.plans?.map((plan, planIndex) => (
              <Card key={planIndex} className="rounded-3xl border-border/50" data-testid={`plan-card-${planIndex}`}>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>{plan.name}</CardTitle>
                    <CardDescription>Plan ID: {plan.plan_id}</CardDescription>
                  </div>
                  {plan.plan_id !== "free" && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removePlan(planIndex)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="space-y-2">
                      <Label>Plan ID</Label>
                      <Input
                        value={plan.plan_id}
                        onChange={(e) => updatePlan(planIndex, "plan_id", e.target.value)}
                        className="rounded-xl"
                        disabled={plan.plan_id === "free"}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Name</Label>
                      <Input
                        value={plan.name}
                        onChange={(e) => updatePlan(planIndex, "name", e.target.value)}
                        className="rounded-xl"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Price ($)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={plan.price}
                        onChange={(e) => updatePlan(planIndex, "price", parseFloat(e.target.value) || 0)}
                        className="rounded-xl"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Credits/Month</Label>
                      <Input
                        type="number"
                        value={plan.credits_per_month}
                        onChange={(e) => updatePlan(planIndex, "credits_per_month", parseInt(e.target.value) || 0)}
                        className="rounded-xl"
                      />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label>Features</Label>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => addPlanFeature(planIndex)}
                        className="h-8"
                      >
                        <Plus className="w-4 h-4 mr-1" />
                        Add
                      </Button>
                    </div>
                    {plan.features?.map((feature, featureIndex) => (
                      <div key={featureIndex} className="flex items-center gap-2">
                        <Input
                          value={feature}
                          onChange={(e) => updatePlanFeature(planIndex, featureIndex, e.target.value)}
                          placeholder="Feature description"
                          className="rounded-xl"
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removePlanFeature(planIndex, featureIndex)}
                          className="shrink-0 text-muted-foreground hover:text-destructive"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </motion.div>
      </div>
    </AdminLayout>
  );
}
