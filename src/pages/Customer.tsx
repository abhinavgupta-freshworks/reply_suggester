import { useState } from 'react';
import { Sidebar } from '@/components/Sidebar';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAppContext } from '@/contexts/AppContext';
import { cn } from '@/lib/utils';
import { Send, Plus } from 'lucide-react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const Customer = () => {
  const { state, addTicket, addMessage, addTelemetryEvent } = useAppContext();
  const [activeTicket, setActiveTicket] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [composeOpen, setComposeOpen] = useState(false);
  const [newTicket, setNewTicket] = useState({
    email: '',
    subject: '',
    message: ''
  });

  const customerTickets = state.tickets.filter(t =>
    ['asha@example.com', 'john@example.com', 'maria@example.com'].includes(t.customer.email)
  );

  const currentTicket = customerTickets.find(t => t.id === activeTicket);

  const handleSendMessage = () => {
    if (!message.trim() || !currentTicket) return;

    const newMessage = {
      id: `m${Date.now()}`,
      from: 'customer' as const,
      text: message,
      ts: new Date().toISOString(),
      sentiment: 'neutral' as const,
      language: 'en'
    };

    addMessage(currentTicket.id, newMessage);
    addTelemetryEvent({ event: 'customer_message_sent', ticketId: currentTicket.id });
    setMessage('');
    toast.success('Message sent');
  };

  const handleCompose = () => {
    if (!newTicket.email || !newTicket.subject || !newTicket.message) {
      toast.error('Please fill all fields');
      return;
    }

    const id = `T-${1000 + state.tickets.length + 1}`;
    const ticket = {
      id,
      subject: newTicket.subject,
      customer: {
        name: newTicket.email.split('@')[0],
        email: newTicket.email,
        language: 'en'
      },
      status: 'open' as const,
      assignedTo: '',
      messages: [{
        id: `m${Date.now()}`,
        from: 'customer' as const,
        text: newTicket.message,
        ts: new Date().toISOString(),
        sentiment: 'neutral' as const,
        language: 'en'
      }],
      kb_refs: [],
      created_at: new Date().toISOString()
    };

    addTicket(ticket);
    addTelemetryEvent({ event: 'customer_message_sent', ticketId: id });
    setNewTicket({ email: '', subject: '', message: '' });
    setComposeOpen(false);
    toast.success('Ticket created');
    setActiveTicket(id);
  };

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar />
      <div className="flex-1 grid grid-cols-[280px_1fr] gap-4 p-4 overflow-hidden">
        {/* Inbox List */}
        <Card className="flex h-full flex-col p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Inbox</h2>
            <Dialog open={composeOpen} onOpenChange={setComposeOpen}>
              <DialogTrigger asChild>
                <Button size="sm" variant="outline">
                  <Plus className="h-4 w-4" />
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Compose New Message</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 mt-4">
                  <div>
                    <Label htmlFor="email">Your Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={newTicket.email}
                      onChange={(e) => setNewTicket({ ...newTicket, email: e.target.value })}
                      placeholder="you@example.com"
                    />
                  </div>
                  <div>
                    <Label htmlFor="subject">Subject</Label>
                    <Input
                      id="subject"
                      value={newTicket.subject}
                      onChange={(e) => setNewTicket({ ...newTicket, subject: e.target.value })}
                      placeholder="Issue description"
                    />
                  </div>
                  <div>
                    <Label htmlFor="message">Message</Label>
                    <Textarea
                      id="message"
                      value={newTicket.message}
                      onChange={(e) => setNewTicket({ ...newTicket, message: e.target.value })}
                      placeholder="Describe your issue..."
                      rows={4}
                    />
                  </div>
                  <Button onClick={handleCompose} className="w-full">
                    Send Message
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <ScrollArea className="flex-1">
            <div className="space-y-2">
              {customerTickets.map(ticket => (
                <button
                  key={ticket.id}
                  onClick={() => setActiveTicket(ticket.id)}
                  className={cn(
                    "w-full rounded-lg border p-3 text-left transition-all hover:shadow-md",
                    activeTicket === ticket.id
                      ? "border-primary bg-accent"
                      : "border-border bg-card hover:border-primary/50"
                  )}
                >
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <span className="text-xs font-mono text-muted-foreground">{ticket.id}</span>
                    <Badge variant="outline">{ticket.status}</Badge>
                  </div>
                  <h3 className="font-medium text-sm mb-1 line-clamp-1">{ticket.subject}</h3>
                  <p className="text-xs text-muted-foreground">
                    {ticket.messages.length} message{ticket.messages.length !== 1 ? 's' : ''}
                  </p>
                </button>
              ))}
            </div>
          </ScrollArea>
        </Card>

        {/* Thread */}
        {currentTicket ? (
          <Card className="flex h-full flex-col p-0">
            <div className="border-b border-border p-4">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-lg font-semibold">{currentTicket.subject}</h2>
                  <p className="text-sm text-muted-foreground">{currentTicket.id}</p>
                </div>
                <Badge variant="outline">{currentTicket.status}</Badge>
              </div>
            </div>

            <ScrollArea className="flex-1 p-4">
              <div className="space-y-4">
                {currentTicket.messages.map(msg => (
                  <div
                    key={msg.id}
                    className={cn(
                      "flex gap-3",
                      msg.from === 'customer' ? 'justify-start' : 'justify-end'
                    )}
                  >
                    <div
                      className={cn(
                        "max-w-[80%] rounded-lg p-3",
                        msg.from === 'customer'
                          ? 'bg-muted'
                          : 'bg-primary text-primary-foreground'
                      )}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-medium">
                          {msg.from === 'customer' ? 'You' : 'Support Agent'}
                        </span>
                      </div>
                      <p className="text-sm whitespace-pre-wrap">{msg.text}</p>
                      <span className="text-xs opacity-70 mt-1 block">
                        {new Date(msg.ts).toLocaleTimeString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>

            <div className="border-t border-border p-4">
              <Textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Write your message..."
                className="mb-3 resize-none"
                rows={3}
              />
              <Button onClick={handleSendMessage} disabled={!message.trim()} className="w-full">
                <Send className="h-4 w-4 mr-2" />
                Send Message
              </Button>
            </div>
          </Card>
        ) : (
          <Card className="flex h-full items-center justify-center p-8">
            <p className="text-muted-foreground">Select a ticket to view thread</p>
          </Card>
        )}
      </div>
    </div>
  );
};

export default Customer;
