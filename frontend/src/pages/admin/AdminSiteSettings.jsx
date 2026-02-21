import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { API } from "../../App";
import { AdminLayout } from "../../components/layout/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Textarea } from "../../components/ui/textarea";
import { Settings, Save, Loader2, Plus, Trash2, Lock } from "lucide-react";
import { toast } from "sonner";
import axios from "axios";

export default function AdminSiteSettings() {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [passwordData, setPasswordData] = useState({
    current_password: "",
    new_password: "",
    confirm_password: ""
  });
  const [changingPassword, setChangingPassword] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await axios.get(`${API}/admin/settings/site`, {
        withCredentials: true
      });
      setSettings(response.data);
    } catch (error) {
      toast.error("Failed to load settings");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await axios.put(`${API}/admin/settings/site`, settings, {
        withCredentials: true
      });
      toast.success("Site settings saved!");
    } catch (error) {
      toast.error("Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    
    if (passwordData.new_password !== passwordData.confirm_password) {
      toast.error("New passwords don't match");
      return;
    }
    
    if (passwordData.new_password.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }
    
    setChangingPassword(true);
    try {
      await axios.post(`${API}/admin/change-password`, {
        current_password: passwordData.current_password,
        new_password: passwordData.new_password
      }, { withCredentials: true });
      
      toast.success("Admin password changed successfully!");
      setPasswordData({ current_password: "", new_password: "", confirm_password: "" });
    } catch (error) {
      toast.error(error.response?.data?.detail || "Failed to change password");
    } finally {
      setChangingPassword(false);
    }
  };

  const updateFeature = (index, field, value) => {
    const newFeatures = [...settings.features];
    newFeatures[index] = { ...newFeatures[index], [field]: value };
    setSettings({ ...settings, features: newFeatures });
  };

  const addFeature = () => {
    setSettings({
      ...settings,
      features: [...settings.features, { icon: "Sparkles", title: "", description: "", color: "from-[#FF0055] to-[#7000FF]" }]
    });
  };

  const removeFeature = (index) => {
    setSettings({
      ...settings,
      features: settings.features.filter((_, i) => i !== index)
    });
  };

  const updateTestimonial = (index, field, value) => {
    const newTestimonials = [...settings.testimonials];
    newTestimonials[index] = { ...newTestimonials[index], [field]: value };
    setSettings({ ...settings, testimonials: newTestimonials });
  };

  const addTestimonial = () => {
    setSettings({
      ...settings,
      testimonials: [...settings.testimonials, { name: "", avatar: "", text: "", rating: "5" }]
    });
  };

  const removeTestimonial = (index) => {
    setSettings({
      ...settings,
      testimonials: settings.testimonials.filter((_, i) => i !== index)
    });
  };

  const updateStat = (index, field, value) => {
    const newStats = [...settings.stats];
    newStats[index] = { ...newStats[index], [field]: value };
    setSettings({ ...settings, stats: newStats });
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
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12" data-testid="admin-site-settings">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="font-heading text-3xl font-bold mb-2 flex items-center gap-3">
                <Settings className="w-8 h-8 text-primary" />
                Site Settings
              </h1>
              <p className="text-muted-foreground">Customize your website branding and content</p>
            </div>
            <Button
              onClick={handleSave}
              disabled={saving}
              className="rounded-xl bg-gradient-to-r from-[#FF0055] to-[#7000FF] text-white"
              data-testid="save-settings-btn"
            >
              {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
              Save Changes
            </Button>
          </div>

          <div className="space-y-8">
            {/* Branding Section */}
            <Card className="rounded-3xl border-border/50 border-primary/30">
              <CardHeader>
                <CardTitle>Branding</CardTitle>
                <CardDescription>Website name and identity</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Brand Name</Label>
                    <Input
                      value={settings.brand_name || ""}
                      onChange={(e) => setSettings({ ...settings, brand_name: e.target.value })}
                      placeholder="LOVE-AI"
                      className="rounded-xl"
                      data-testid="brand-name-input"
                    />
                    <p className="text-xs text-muted-foreground">Displayed in header and footer</p>
                  </div>
                  <div className="space-y-2">
                    <Label>Brand Tagline</Label>
                    <Input
                      value={settings.brand_tagline || ""}
                      onChange={(e) => setSettings({ ...settings, brand_tagline: e.target.value })}
                      placeholder="AI-Powered Dating Assistant"
                      className="rounded-xl"
                      data-testid="brand-tagline-input"
                    />
                  </div>
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Company Name</Label>
                    <Input
                      value={settings.company_name || ""}
                      onChange={(e) => setSettings({ ...settings, company_name: e.target.value })}
                      placeholder="LOVE-AI Inc."
                      className="rounded-xl"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Contact Email</Label>
                    <Input
                      type="email"
                      value={settings.contact_email || ""}
                      onChange={(e) => setSettings({ ...settings, contact_email: e.target.value })}
                      placeholder="support@love-ai.com"
                      className="rounded-xl"
                      data-testid="contact-email-input"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Admin Password Section */}
            <Card className="rounded-3xl border-border/50 border-yellow-500/30">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lock className="w-5 h-5 text-yellow-500" />
                  Change Admin Password
                </CardTitle>
                <CardDescription>Update your admin panel password</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleChangePassword} className="space-y-4">
                  <div className="space-y-2">
                    <Label>Current Password</Label>
                    <Input
                      type="password"
                      value={passwordData.current_password}
                      onChange={(e) => setPasswordData({ ...passwordData, current_password: e.target.value })}
                      placeholder="Enter current password"
                      className="rounded-xl"
                      data-testid="current-password-input"
                    />
                  </div>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>New Password</Label>
                      <Input
                        type="password"
                        value={passwordData.new_password}
                        onChange={(e) => setPasswordData({ ...passwordData, new_password: e.target.value })}
                        placeholder="Enter new password"
                        className="rounded-xl"
                        data-testid="new-password-input"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Confirm New Password</Label>
                      <Input
                        type="password"
                        value={passwordData.confirm_password}
                        onChange={(e) => setPasswordData({ ...passwordData, confirm_password: e.target.value })}
                        placeholder="Confirm new password"
                        className="rounded-xl"
                        data-testid="confirm-password-input"
                      />
                    </div>
                  </div>
                  <Button
                    type="submit"
                    disabled={changingPassword}
                    variant="outline"
                    className="rounded-xl"
                    data-testid="change-password-btn"
                  >
                    {changingPassword ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Lock className="w-4 h-4 mr-2" />}
                    Change Password
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Hero Section */}
            <Card className="rounded-3xl border-border/50">
              <CardHeader>
                <CardTitle>Hero Section</CardTitle>
                <CardDescription>Main headline and call-to-action</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Hero Title</Label>
                  <Input
                    value={settings.hero_title}
                    onChange={(e) => setSettings({ ...settings, hero_title: e.target.value })}
                    className="rounded-xl"
                    data-testid="hero-title-input"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Hero Subtitle</Label>
                  <Textarea
                    value={settings.hero_subtitle}
                    onChange={(e) => setSettings({ ...settings, hero_subtitle: e.target.value })}
                    className="rounded-xl"
                    data-testid="hero-subtitle-input"
                  />
                </div>
                <div className="space-y-2">
                  <Label>CTA Button Text</Label>
                  <Input
                    value={settings.hero_cta}
                    onChange={(e) => setSettings({ ...settings, hero_cta: e.target.value })}
                    className="rounded-xl"
                    data-testid="hero-cta-input"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Stats Section */}
            <Card className="rounded-3xl border-border/50">
              <CardHeader>
                <CardTitle>Stats Section</CardTitle>
                <CardDescription>Social proof numbers</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {settings.stats?.map((stat, index) => (
                  <div key={index} className="grid grid-cols-2 gap-4 p-4 rounded-xl bg-muted/50">
                    <div className="space-y-2">
                      <Label>Value</Label>
                      <Input
                        value={stat.value}
                        onChange={(e) => updateStat(index, "value", e.target.value)}
                        placeholder="10M+"
                        className="rounded-xl"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Label</Label>
                      <Input
                        value={stat.label}
                        onChange={(e) => updateStat(index, "label", e.target.value)}
                        placeholder="Messages Generated"
                        className="rounded-xl"
                      />
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Features Section */}
            <Card className="rounded-3xl border-border/50">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Features</CardTitle>
                  <CardDescription>Main product features</CardDescription>
                </div>
                <Button variant="outline" size="sm" onClick={addFeature} className="rounded-xl">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Feature
                </Button>
              </CardHeader>
              <CardContent className="space-y-4">
                {settings.features?.map((feature, index) => (
                  <div key={index} className="p-4 rounded-xl bg-muted/50 space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">Feature {index + 1}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFeature(index)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Title</Label>
                        <Input
                          value={feature.title}
                          onChange={(e) => updateFeature(index, "title", e.target.value)}
                          className="rounded-xl"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Icon (Lucide name)</Label>
                        <Input
                          value={feature.icon}
                          onChange={(e) => updateFeature(index, "icon", e.target.value)}
                          placeholder="Sparkles"
                          className="rounded-xl"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Description</Label>
                      <Textarea
                        value={feature.description}
                        onChange={(e) => updateFeature(index, "description", e.target.value)}
                        className="rounded-xl"
                      />
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Testimonials Section */}
            <Card className="rounded-3xl border-border/50">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Testimonials</CardTitle>
                  <CardDescription>Customer reviews</CardDescription>
                </div>
                <Button variant="outline" size="sm" onClick={addTestimonial} className="rounded-xl">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Testimonial
                </Button>
              </CardHeader>
              <CardContent className="space-y-4">
                {settings.testimonials?.map((testimonial, index) => (
                  <div key={index} className="p-4 rounded-xl bg-muted/50 space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">Testimonial {index + 1}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeTestimonial(index)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Name</Label>
                        <Input
                          value={testimonial.name}
                          onChange={(e) => updateTestimonial(index, "name", e.target.value)}
                          className="rounded-xl"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Avatar Initial</Label>
                        <Input
                          value={testimonial.avatar}
                          onChange={(e) => updateTestimonial(index, "avatar", e.target.value)}
                          maxLength={1}
                          className="rounded-xl"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Review Text</Label>
                      <Textarea
                        value={testimonial.text}
                        onChange={(e) => updateTestimonial(index, "text", e.target.value)}
                        className="rounded-xl"
                      />
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </motion.div>
      </div>
    </AdminLayout>
  );
}
