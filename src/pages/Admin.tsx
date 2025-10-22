import { useState } from 'react';
import { Sidebar } from '@/components/Sidebar';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAppContext } from '@/contexts/AppContext';
import { toast } from 'sonner';

const Admin = () => {
  const { state, updateAdminConfig, addTelemetryEvent } = useAppContext();
  const [brandVoice, setBrandVoice] = useState(state.admin_config.brand_voice);

  const toggleFeature = (key: string) => {
    const newFeatures = {
      ...state.admin_config.features,
      [key]: !state.admin_config.features[key as keyof typeof state.admin_config.features]
    };
    updateAdminConfig({ features: newFeatures });
    addTelemetryEvent({ event: 'admin_toggle', key: `features.${key}`, value: newFeatures[key as keyof typeof newFeatures] });
  };

  const toggleSource = (key: string) => {
    const newSources = {
      ...state.admin_config.reply_suggester_sources,
      [key]: !state.admin_config.reply_suggester_sources[key as keyof typeof state.admin_config.reply_suggester_sources]
    };
    updateAdminConfig({ reply_suggester_sources: newSources });
    addTelemetryEvent({ event: 'reply_suggester_source_changed', key, value: newSources[key as keyof typeof newSources] });
  };

  const saveBrandVoice = () => {
    updateAdminConfig({ brand_voice: brandVoice });
    addTelemetryEvent({ event: 'brand_voice_updated', adminId: 'admin_1' });
    toast.success('Brand voice settings saved');
  };

  const updateVerifierTiming = (timing: 'before_send' | 'after_send') => {
    updateAdminConfig({
      verifier_rules: {
        ...state.admin_config.verifier_rules,
        verifier_timing: timing
      }
    });
    addTelemetryEvent({ event: 'admin_setting_changed', key: 'verifier_rules.verifier_timing', value: timing });
  };

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar />
      <div className="flex-1 overflow-hidden">
        <ScrollArea className="h-full">
          <div className="p-6 max-w-5xl mx-auto space-y-6">
            <div>
              <h1 className="text-3xl font-bold mb-2">Admin Settings</h1>
              <p className="text-muted-foreground">Configure AI features and brand voice</p>
            </div>

            {/* Feature Toggles */}
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4">Feature Toggles</h2>
              <div className="space-y-4">
                {Object.entries(state.admin_config.features).map(([key, value]) => (
                  <div key={key} className="flex items-center justify-between">
                    <Label htmlFor={key} className="capitalize cursor-pointer">
                      {key.replace(/_/g, ' ')}
                    </Label>
                    <Switch
                      id={key}
                      checked={value}
                      onCheckedChange={() => toggleFeature(key)}
                    />
                  </div>
                ))}
              </div>
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => {
                  updateAdminConfig({
                    features: {
                      write_with_ai: true,
                      summarize: true,
                      sentiment: true,
                      live_translate: true,
                      reply_suggester: true,
                      reply_verifier: true
                    }
                  });
                  toast.success('Reset to defaults');
                }}
              >
                Reset to Default
              </Button>
            </Card>

            {/* Reply Suggester Settings */}
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4">Reply Suggester Settings</h2>
              <div className="space-y-4">
                {Object.entries(state.admin_config.reply_suggester_sources).map(([key, value]) => (
                  <div key={key} className="flex items-center space-x-2">
                    <Checkbox
                      id={`source-${key}`}
                      checked={value}
                      onCheckedChange={() => toggleSource(key)}
                    />
                    <Label htmlFor={`source-${key}`} className="capitalize cursor-pointer">
                      {key.replace(/_/g, ' ')}
                    </Label>
                  </div>
                ))}
              </div>
              <p className="text-sm text-muted-foreground mt-4">
                Disabled sources will be greyed out in the Agent's source filter.
              </p>
            </Card>

            {/* Brand Voice Configuration */}
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4">Module 1: Brand Voice Configuration</h2>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="company_name">Company Name</Label>
                  <Input
                    id="company_name"
                    value={brandVoice.company_name}
                    onChange={(e) => setBrandVoice({ ...brandVoice, company_name: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="industry">Industry</Label>
                  <Select
                    value={brandVoice.industry}
                    onValueChange={(v) => setBrandVoice({ ...brandVoice, industry: v })}
                  >
                    <SelectTrigger id="industry">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="SaaS">SaaS</SelectItem>
                      <SelectItem value="E-commerce">E-commerce</SelectItem>
                      <SelectItem value="Finance">Finance</SelectItem>
                      <SelectItem value="Healthcare">Healthcare</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="archetype">Primary Tone</Label>
                  <Select
                    value={brandVoice.archetype}
                    onValueChange={(v) => setBrandVoice({ ...brandVoice, archetype: v })}
                  >
                    <SelectTrigger id="archetype">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Friendly">Friendly</SelectItem>
                      <SelectItem value="Empathetic">Empathetic</SelectItem>
                      <SelectItem value="Formal">Formal</SelectItem>
                      <SelectItem value="Direct">Direct</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="sample_rules">Brand Communication Guidelines</Label>
                  <Textarea
                    id="sample_rules"
                    value={brandVoice.sample_rules}
                    onChange={(e) => setBrandVoice({ ...brandVoice, sample_rules: e.target.value })}
                    placeholder="e.g., We use a friendly, professional tone..."
                  />
                </div>
                <div>
                  <Label htmlFor="formality">Formality Level</Label>
                  <Select
                    value={brandVoice.formality}
                    onValueChange={(v) => setBrandVoice({ ...brandVoice, formality: v })}
                  >
                    <SelectTrigger id="formality">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Informal">Informal</SelectItem>
                      <SelectItem value="Neutral">Neutral</SelectItem>
                      <SelectItem value="Formal">Formal</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={saveBrandVoice}>Save Brand Voice</Button>
              </div>
            </Card>

            {/* Learning Sources */}
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4">Module 2: Learning Sources</h2>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="example_replies">Example Replies (Paste 3-5)</Label>
                  <Textarea
                    id="example_replies"
                    value={brandVoice.learning_example_replies}
                    onChange={(e) => setBrandVoice({ ...brandVoice, learning_example_replies: e.target.value })}
                    rows={4}
                  />
                </div>
                <div>
                  <Label htmlFor="learning_urls">Website & KB URLs (One per line)</Label>
                  <Textarea
                    id="learning_urls"
                    value={brandVoice.learning_urls}
                    onChange={(e) => setBrandVoice({ ...brandVoice, learning_urls: e.target.value })}
                    rows={3}
                  />
                </div>
                <div>
                  <Label htmlFor="custom_lexicon_text">Company Lexicon & Terminology</Label>
                  <Textarea
                    id="custom_lexicon_text"
                    value={brandVoice.custom_lexicon_text}
                    onChange={(e) => setBrandVoice({ ...brandVoice, custom_lexicon_text: e.target.value })}
                    rows={3}
                    placeholder="workspace (not account)&#10;team member (not user)"
                  />
                </div>
                <Button onClick={saveBrandVoice}>Save Learning Sources</Button>
              </div>
            </Card>

            {/* Response Archetypes */}
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4">Module 3: Response Archetypes</h2>
              <p className="text-sm text-muted-foreground mb-4">
                Define your response archetypes below. Use headings for each archetype.
              </p>
              <Textarea
                value={brandVoice.response_archetypes_text}
                onChange={(e) => setBrandVoice({ ...brandVoice, response_archetypes_text: e.target.value })}
                rows={10}
                className="font-mono text-xs"
              />
              <Button onClick={saveBrandVoice} className="mt-4">Save Archetypes</Button>
            </Card>

            {/* Reply Verifier Configuration */}
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4">Reply Verifier Configuration</h2>
              <div className="space-y-4">
                {Object.entries(state.admin_config.verifier_rules).slice(0, 5).map(([key, value]) => (
                  <div key={key} className="flex items-center space-x-2">
                    <Checkbox
                      id={`verifier-${key}`}
                      checked={value as boolean}
                      onCheckedChange={(checked) => {
                        updateAdminConfig({
                          verifier_rules: {
                            ...state.admin_config.verifier_rules,
                            [key]: checked
                          }
                        });
                      }}
                    />
                    <Label htmlFor={`verifier-${key}`} className="capitalize cursor-pointer">
                      {key.replace(/_/g, ' ')}
                    </Label>
                  </div>
                ))}
                <div className="mt-4">
                  <Label htmlFor="verifier_timing">Verifier Mode</Label>
                  <Select
                    value={state.admin_config.verifier_rules.verifier_timing}
                    onValueChange={(v: 'before_send' | 'after_send') => updateVerifierTiming(v)}
                  >
                    <SelectTrigger id="verifier_timing">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="before_send">Block Send (Run verifier before sending)</SelectItem>
                      <SelectItem value="after_send">Allow Send (Run verifier but send anyway)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </Card>
          </div>
        </ScrollArea>
      </div>
    </div>
  );
};

export default Admin;
