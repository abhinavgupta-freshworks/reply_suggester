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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAppContext } from '@/contexts/AppContext';
import { toast } from 'sonner';
import { Sparkles, TestTube, ArrowRight, X, Pencil } from 'lucide-react';

const Admin = () => {
  const { state, updateAdminConfig, addTelemetryEvent } = useAppContext();
  const [brandVoice, setBrandVoice] = useState(state.admin_config.brand_voice);
  const [previewText, setPreviewText] = useState('');
  const [ticketNumber, setTicketNumber] = useState('T-1001');
  const [editingDoIndex, setEditingDoIndex] = useState<number | null>(null);
  const [editingDontIndex, setEditingDontIndex] = useState<number | null>(null);

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

  const applyBrandTone = (text: string): string => {
    let output = text;
    
    // Apply formality
    if (brandVoice.formality === 'Formal') {
      output = output.replace(/can't/g, 'cannot').replace(/I'm/g, 'I am').replace(/won't/g, 'will not');
    } else if (brandVoice.formality === 'Informal') {
      output = output.replace(/cannot/g, "can't").replace(/I am/g, "I'm").replace(/will not/g, "won't");
    }
    
    // Apply archetype tone
    const name = 'there';
    if (brandVoice.archetype === 'Friendly') {
      output = `Hi ${name}! 😊 ` + output;
    } else if (brandVoice.archetype === 'Empathetic') {
      output = `I truly understand your concern. ` + output;
    } else if (brandVoice.archetype === 'Formal') {
      output = `Dear Customer, ` + output;
    } else if (brandVoice.archetype === 'Direct') {
      output = output.replace(/I understand /g, '').replace(/please /g, '');
    }
    
    // Apply custom lexicon
    if (brandVoice.custom_lexicon_text) {
      const lexicon = brandVoice.custom_lexicon_text.split('\n');
      lexicon.forEach(rule => {
        const match = rule.match(/(.+?)\s*\(not\s+(.+?)\)/i);
        if (match) {
          const [, preferred, avoid] = match;
          const regex = new RegExp(avoid.trim(), 'gi');
          output = output.replace(regex, preferred.trim());
        }
      });
    }
    
    // Add company name if configured
    if (brandVoice.company_name) {
      output = output.replace(/\[Company\]/g, brandVoice.company_name);
    }
    
    return `[Simulated Brand Tone Applied] ${output}`;
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

            {/* Brand Voice Configuration - Combined */}
            <Card className="p-6">
              <div className="mb-6">
                <h2 className="text-2xl font-semibold mb-2">Brand Voice Configuration</h2>
                <p className="text-muted-foreground">
                  Configure your company's communication style and tone
                </p>
              </div>

              <Tabs defaultValue="basics" className="w-full">
                <TabsList className="grid w-full grid-cols-4 mb-6">
                  <TabsTrigger value="basics">Basics</TabsTrigger>
                  <TabsTrigger value="archetypes">Response Patterns</TabsTrigger>
                  <TabsTrigger value="learning">Learning Sources</TabsTrigger>
                  <TabsTrigger value="mystyle">My Style</TabsTrigger>
                </TabsList>

                <TabsContent value="basics" className="space-y-4">
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
                  <div className="space-y-4">
                    <div>
                      <h3 className="font-semibold mb-3">Brand Voice & Reply Guidelines</h3>
                      
                      <div className="space-y-4">
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <Label className="text-base">Dos</Label>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setBrandVoice({
                                  ...brandVoice,
                                  guidelines_dos: [...brandVoice.guidelines_dos, 'New guideline...']
                                });
                              }}
                            >
                              + Add a Do
                            </Button>
                          </div>
                          <div className="space-y-2">
                            {brandVoice.guidelines_dos.map((item, idx) => (
                              <div key={idx} className="flex items-center gap-2 p-2 border rounded-md bg-background">
                                {editingDoIndex === idx ? (
                                  <Input
                                    value={item}
                                    onChange={(e) => {
                                      const newDos = [...brandVoice.guidelines_dos];
                                      newDos[idx] = e.target.value;
                                      setBrandVoice({ ...brandVoice, guidelines_dos: newDos });
                                    }}
                                    onBlur={() => setEditingDoIndex(null)}
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') setEditingDoIndex(null);
                                    }}
                                    autoFocus
                                    className="flex-1"
                                  />
                                ) : (
                                  <span className="flex-1 text-sm">{item}</span>
                                )}
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8"
                                  onClick={() => setEditingDoIndex(idx)}
                                >
                                  <Pencil className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8"
                                  onClick={() => {
                                    const newDos = brandVoice.guidelines_dos.filter((_, i) => i !== idx);
                                    setBrandVoice({ ...brandVoice, guidelines_dos: newDos });
                                  }}
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="h-px bg-border" />

                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <Label className="text-base">Don'ts</Label>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setBrandVoice({
                                  ...brandVoice,
                                  guidelines_donts: [...brandVoice.guidelines_donts, 'New guideline...']
                                });
                              }}
                            >
                              + Add a Don't
                            </Button>
                          </div>
                          <div className="space-y-2">
                            {brandVoice.guidelines_donts.map((item, idx) => (
                              <div key={idx} className="flex items-center gap-2 p-2 border rounded-md bg-background">
                                {editingDontIndex === idx ? (
                                  <Input
                                    value={item}
                                    onChange={(e) => {
                                      const newDonts = [...brandVoice.guidelines_donts];
                                      newDonts[idx] = e.target.value;
                                      setBrandVoice({ ...brandVoice, guidelines_donts: newDonts });
                                    }}
                                    onBlur={() => setEditingDontIndex(null)}
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') setEditingDontIndex(null);
                                    }}
                                    autoFocus
                                    className="flex-1"
                                  />
                                ) : (
                                  <span className="flex-1 text-sm">{item}</span>
                                )}
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8"
                                  onClick={() => setEditingDontIndex(idx)}
                                >
                                  <Pencil className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8"
                                  onClick={() => {
                                    const newDonts = brandVoice.guidelines_donts.filter((_, i) => i !== idx);
                                    setBrandVoice({ ...brandVoice, guidelines_donts: newDonts });
                                  }}
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
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
                </TabsContent>

                <TabsContent value="archetypes" className="space-y-4">
                  <p className="text-sm text-muted-foreground mb-4">
                    Define response patterns for different situations. Include a definition for each situation so the AI can determine when to apply each pattern, followed by the structure and a detailed example.
                  </p>
                  <Textarea
                    value={brandVoice.response_archetypes_text}
                    onChange={(e) => setBrandVoice({ ...brandVoice, response_archetypes_text: e.target.value })}
                    rows={16}
                    className="font-mono text-xs"
                    placeholder="## Apology&#10;Definition: Use when the company made an error or service failed&#10;&#10;Structure:&#10;1. Acknowledge the issue&#10;2. Express empathy&#10;3. Provide solution&#10;&#10;Example: Full example following the structure..."
                  />
                </TabsContent>

                <TabsContent value="learning" className="space-y-4">
                  <div>
                    <Label htmlFor="example_replies">Example Replies (Paste 3-5)</Label>
                    <Textarea
                      id="example_replies"
                      value={brandVoice.learning_example_replies}
                      onChange={(e) => setBrandVoice({ ...brandVoice, learning_example_replies: e.target.value })}
                      rows={4}
                      placeholder="Paste example replies that represent your brand voice..."
                    />
                  </div>
                  <div>
                    <Label htmlFor="learning_ticket_ids">Tickets (Ticket IDs to learn from)</Label>
                    <Textarea
                      id="learning_ticket_ids"
                      value={brandVoice.learning_ticket_ids}
                      onChange={(e) => setBrandVoice({ ...brandVoice, learning_ticket_ids: e.target.value })}
                      rows={2}
                      placeholder="#1001, #1002, #1003"
                    />
                    <p className="text-xs text-muted-foreground mt-2">
                      AI will automatically learn from agent replies in these tickets
                    </p>
                  </div>
                  <div>
                    <Label htmlFor="learning_urls">Website & KB URLs (One per line)</Label>
                    <Textarea
                      id="learning_urls"
                      value={brandVoice.learning_urls}
                      onChange={(e) => setBrandVoice({ ...brandVoice, learning_urls: e.target.value })}
                      rows={3}
                      placeholder="https://example.com/kb"
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
                    <p className="text-xs text-muted-foreground mt-2">
                      Format: "preferred term (not avoided term)" - one per line
                    </p>
                  </div>
                </TabsContent>

                <TabsContent value="mystyle" className="space-y-4">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <h3 className="font-semibold">Auto-learn from Tickets</h3>
                        <p className="text-sm text-muted-foreground">
                          Automatically learn writing style from agent ticket responses
                        </p>
                      </div>
                      <Switch
                        checked={brandVoice.auto_learn_enabled}
                        onCheckedChange={(checked) => 
                          setBrandVoice({ ...brandVoice, auto_learn_enabled: checked })
                        }
                      />
                    </div>

                    {brandVoice.auto_learn_enabled && (
                      <div>
                        <Label htmlFor="selected_agent">Select Agent to Learn From</Label>
                        <Select
                          value={brandVoice.selected_agent_id}
                          onValueChange={(v) => setBrandVoice({ ...brandVoice, selected_agent_id: v })}
                        >
                          <SelectTrigger id="selected_agent">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {state.agents.map(agent => (
                              <SelectItem key={agent.id} value={agent.id}>
                                {agent.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <p className="text-xs text-muted-foreground mt-2">
                          The AI will learn from this agent's ticket responses to understand their writing style
                        </p>
                        
                        <div className="mt-4 p-4 bg-muted/50 rounded-lg">
                          <h4 className="text-sm font-medium mb-2">Learning Preview</h4>
                          <p className="text-xs text-muted-foreground mb-3">
                            Based on {state.agents.find(a => a.id === brandVoice.selected_agent_id)?.name}'s recent responses:
                          </p>
                          <div className="space-y-2">
                            {state.tickets
                              .flatMap(t => t.messages.filter(m => m.from === 'agent'))
                              .slice(-3)
                              .map((msg, idx) => (
                                <div key={idx} className="text-xs p-2 bg-background rounded border">
                                  {msg.text}
                                </div>
                              ))
                            }
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div className="space-y-4">
                    <Label className="text-base font-medium">Test Your Style</Label>
                    <p className="text-sm text-muted-foreground">
                      Test how your brand voice configuration transforms inputs
                    </p>
                    <div>
                      <Label htmlFor="style_test_input" className="text-sm">Input</Label>
                      <Textarea
                        id="style_test_input"
                        value={brandVoice.style_test_input}
                        onChange={(e) => setBrandVoice({ ...brandVoice, style_test_input: e.target.value })}
                        placeholder="Enter a message to see how it would be reworded..."
                        rows={4}
                        className="mt-2"
                      />
                    </div>
                    <Button
                      onClick={() => {
                        // Simulate AI processing with brand voice
                        setBrandVoice({
                          ...brandVoice,
                          style_test_output: applyBrandTone(brandVoice.style_test_input)
                        });
                      }}
                      className="w-full"
                    >
                      Generate Output
                    </Button>
                    <div>
                      <Label htmlFor="style_test_output" className="text-sm">Output</Label>
                      <Textarea
                        id="style_test_output"
                        value={brandVoice.style_test_output}
                        readOnly
                        placeholder="Output will appear here..."
                        rows={4}
                        className="mt-2 bg-muted/50"
                      />
                    </div>
                  </div>
                </TabsContent>
              </Tabs>

              <div className="mt-6">
                <Button onClick={saveBrandVoice} size="lg">
                  <Sparkles className="h-4 w-4 mr-2" />
                  Save Brand Voice Settings
                </Button>
              </div>
            </Card>

            {/* Test Brand Tone */}
            <Card className="p-6">
              <div className="mb-6">
                <h2 className="text-2xl font-semibold mb-2 flex items-center gap-2">
                  <TestTube className="h-6 w-6" />
                  Test Brand Tone
                </h2>
                <p className="text-muted-foreground">
                  Preview how your brand tone settings will transform text
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="preview_text">Input</Label>
                  <Textarea
                    id="preview_text"
                    value={previewText}
                    onChange={(e) => setPreviewText(e.target.value)}
                    rows={3}
                    placeholder="Type or paste text to see how it will be transformed..."
                    className="mt-2"
                  />
                </div>

                <Button
                  onClick={() => {
                    // Trigger the brand tone transformation
                    setPreviewText(previewText);
                  }}
                  className="w-full"
                >
                  Generate Response
                </Button>

                <div>
                  <Label>Output</Label>
                  <div className="mt-2 p-4 rounded-lg bg-muted/50 border min-h-[100px]">
                    <p className="text-sm whitespace-pre-wrap">
                      {previewText ? applyBrandTone(previewText) : 'Output will appear here...'}
                    </p>
                  </div>
                </div>
              </div>
            </Card>

            {/* Ticket Comparison */}
            <Card className="p-6">
              <div className="mb-6">
                <h2 className="text-2xl font-semibold mb-2">Ticket Comparison</h2>
                <p className="text-muted-foreground">
                  Compare actual agent replies with brand tone suggestions
                </p>
              </div>

              <div className="space-y-4">
                <div className="flex gap-4">
                  <div className="flex-1">
                    <Label htmlFor="ticket_number">Ticket Number</Label>
                    <Input
                      id="ticket_number"
                      value={ticketNumber}
                      onChange={(e) => setTicketNumber(e.target.value)}
                      placeholder="e.g., T-1001"
                    />
                  </div>
                  <div className="flex items-end">
                    <Button onClick={() => {
                      const ticket = state.tickets.find(t => t.id === ticketNumber);
                      if (!ticket) {
                        toast.error('Ticket not found');
                      } else {
                        toast.success('Comparison loaded');
                      }
                    }}>
                      Load Comparison
                    </Button>
                  </div>
                </div>

                {(() => {
                  const ticket = state.tickets.find(t => t.id === ticketNumber);
                  const agentMessage = ticket?.messages.find(m => m.from === 'agent');
                  
                  if (!ticket) {
                    return (
                      <div className="p-8 text-center text-muted-foreground border rounded-lg">
                        Enter a ticket number to view comparison
                      </div>
                    );
                  }

                  if (!agentMessage) {
                    return (
                      <div className="p-8 text-center text-muted-foreground border rounded-lg">
                        No agent replies found in this ticket
                      </div>
                    );
                  }

                  return (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-base font-semibold">Original Agent Reply</Label>
                        <div className="mt-2 p-4 rounded-lg bg-muted/30 border min-h-[150px]">
                          <p className="text-sm whitespace-pre-wrap">{agentMessage.text}</p>
                        </div>
                        <p className="text-xs text-muted-foreground mt-2">
                          From {ticket.customer.name} • {new Date(agentMessage.ts).toLocaleString()}
                        </p>
                      </div>

                      <div>
                        <Label className="text-base font-semibold">With Brand Tone Applied</Label>
                        <div className="mt-2 p-4 rounded-lg bg-primary/5 border border-primary/20 min-h-[150px]">
                          <p className="text-sm whitespace-pre-wrap">
                            {applyBrandTone(agentMessage.text)}
                          </p>
                        </div>
                        <p className="text-xs text-muted-foreground mt-2">
                          Using: {brandVoice.archetype} tone • {brandVoice.formality} formality
                        </p>
                      </div>
                    </div>
                  );
                })()}
              </div>
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
