import { useRef, useEffect } from 'react';
import { useAppContext } from '@/contexts/AppContext';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { ScrollArea } from './ui/scroll-area';
import { ReplyEditor } from './ReplyEditor';

const sentimentEmoji: Record<string, string> = {
  happy: '😀',
  neutral: '😐',
  sad: '😞',
  angry: '😡',
};

export const ConversationPanel = () => {
  const { state, addMessage, addTelemetryEvent } = useAppContext();
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [state.activeTicket?.messages]);

  const handleSummarize = () => {
    if (!state.activeTicket) return;

    const lastCustomerMsg = state.activeTicket.messages
      .filter(m => m.from === 'customer')
      .slice(-1)[0];

    const summary = `[Simulated AI] Summary: Issue: ${state.activeTicket.subject}. Last customer message: '${lastCustomerMsg?.text || 'none'}'. Next step: Review KB ${state.activeTicket.kb_refs.join(',') || 'none'}.`;

    toast.info(summary);
    addTelemetryEvent({
      event: 'summarize_used',
      ticketId: state.activeTicket.id
    });
  };

  const handleSendReply = (text: string) => {
    if (!state.activeTicket) return;

    const message = {
      id: `m${Date.now()}`,
      from: 'agent' as const,
      text: text,
      ts: new Date().toISOString(),
      sentiment: 'neutral' as const,
      language: 'en'
    };

    addMessage(state.activeTicket.id, message);
    addTelemetryEvent({
      event: 'reply_sent',
      ticketId: state.activeTicket.id,
      textPreview: text.slice(0, 80),
      agentId: 'agent_1'
    });

    toast.success('Reply sent');
  };

  if (!state.activeTicket) {
    return (
      <Card className="flex h-full items-center justify-center p-8">
        <p className="text-muted-foreground">Select a ticket to view conversation</p>
      </Card>
    );
  }

  const lastCustomerMsg = state.activeTicket.messages
    .filter(m => m.from === 'customer')
    .slice(-1)[0];

  return (
    <Card className="flex h-full flex-col overflow-hidden p-0">
      {/* Header */}
      <div className="border-b border-border p-4 shrink-0">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-mono text-muted-foreground">{state.activeTicket.id}</span>
              <Badge variant="outline">{state.activeTicket.status}</Badge>
            </div>
            <h2 className="text-lg font-semibold">{state.activeTicket.subject}</h2>
            <p className="text-sm text-muted-foreground">{state.activeTicket.customer.name} • {state.activeTicket.customer.email}</p>
          </div>
          {state.admin_config.features.summarize && (
            <Button variant="outline" size="sm" onClick={handleSummarize}>
              <Sparkles className="h-4 w-4 mr-2" />
              Summarize
            </Button>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 min-h-0 overflow-y-auto p-4" ref={scrollRef}>
        <div className="space-y-4">
          {state.activeTicket.messages.map(message => (
            <div
              key={message.id}
              className={cn(
                "flex gap-3",
                message.from === 'agent' ? 'justify-end' : 'justify-start'
              )}
            >
              <div
                className={cn(
                  "max-w-[80%] rounded-lg p-3",
                  message.from === 'agent'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted'
                )}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-medium">
                    {message.from === 'agent' ? 'Agent' : state.activeTicket.customer.name}
                  </span>
                  {state.admin_config.features.sentiment && message.from === 'customer' && (
                    <span className="text-sm">{sentimentEmoji[message.sentiment]}</span>
                  )}
                </div>
                <p className="text-sm whitespace-pre-wrap">{message.text}</p>
                <span className="text-xs opacity-70 mt-1 block">
                  {new Date(message.ts).toLocaleTimeString()}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Reply Editor */}
      <ReplyEditor
        ticketId={state.activeTicket.id}
        customerName={state.activeTicket.customer.name}
        ticketSubject={state.activeTicket.subject}
        lastCustomerMessage={lastCustomerMsg?.text || ''}
        onSendReply={handleSendReply}
      />
    </Card>
  );
};
