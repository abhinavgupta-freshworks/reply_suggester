import { useAppContext } from '@/contexts/AppContext';
import { cn } from '@/lib/utils';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Plus } from 'lucide-react';

const sentimentEmoji: Record<string, string> = {
  happy: '😀',
  neutral: '😐',
  sad: '😞',
  angry: '😡',
};

const statusColors: Record<string, string> = {
  open: 'bg-success/10 text-success border-success/20',
  pending: 'bg-warning/10 text-warning border-warning/20',
  closed: 'bg-muted text-muted-foreground border-border',
};

export const TicketList = () => {
  const { state, setActiveTicket, addTicket, addTelemetryEvent, setFilters } = useAppContext();

  const filteredTickets = state.tickets.filter(ticket => {
    if (state.filters.status !== 'all' && ticket.status !== state.filters.status) return false;
    if (state.filters.sentiment !== 'all') {
      const lastMsg = ticket.messages[ticket.messages.length - 1];
      if (lastMsg?.sentiment !== state.filters.sentiment) return false;
    }
    if (state.filters.assigned === 'mine' && ticket.assignedTo !== 'agent_1') return false;
    return true;
  });

  const handleSeedTicket = () => {
    const id = `T-${1000 + state.tickets.length + 1}`;
    const newTicket = {
      id,
      subject: `Demo seeded ticket ${id}`,
      customer: { name: 'Demo User', email: 'demo@example.com', language: 'en' },
      status: 'open' as const,
      assignedTo: '',
      messages: [{
        id: `m${Date.now()}`,
        from: 'customer' as const,
        text: 'This is a seeded demo message',
        ts: new Date().toISOString(),
        sentiment: 'neutral' as const,
        language: 'en'
      }],
      kb_refs: [],
      created_at: new Date().toISOString()
    };
    addTicket(newTicket);
    addTelemetryEvent({ event: 'seed_ticket', ticketId: id });
  };

  return (
    <Card className="flex h-full min-h-0 flex-col p-4">
      <div className="mb-4">
        <h2 className="text-lg font-semibold">Tickets</h2>
      </div>

      <div className="space-y-3 mb-4">
        <Select value={state.filters.status} onValueChange={(v) => setFilters({ status: v })}>
          <SelectTrigger>
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="open">Open</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="closed">Closed</SelectItem>
          </SelectContent>
        </Select>

        <Select value={state.filters.sentiment} onValueChange={(v) => setFilters({ sentiment: v })}>
          <SelectTrigger>
            <SelectValue placeholder="Sentiment" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Sentiment</SelectItem>
            <SelectItem value="happy">😀 Happy</SelectItem>
            <SelectItem value="neutral">😐 Neutral</SelectItem>
            <SelectItem value="sad">😞 Sad</SelectItem>
            <SelectItem value="angry">😡 Angry</SelectItem>
          </SelectContent>
        </Select>

        <Select value={state.filters.assigned} onValueChange={(v) => setFilters({ assigned: v })}>
          <SelectTrigger>
            <SelectValue placeholder="Assignment" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Tickets</SelectItem>
            <SelectItem value="mine">My Tickets</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex-1 min-h-0 space-y-2 overflow-y-auto">
        {filteredTickets.map(ticket => {
          const lastMsg = ticket.messages[ticket.messages.length - 1];
          const isActive = state.activeTicket?.id === ticket.id;
          return (
            <button
              key={ticket.id}
              onClick={() => setActiveTicket(ticket)}
              className={cn(
                "w-full rounded-lg border p-3 text-left transition-all hover:shadow-md",
                isActive ? "border-primary bg-accent" : "border-border bg-card hover:border-primary/50"
              )}
            >
              <div className="flex items-start justify-between gap-2 mb-1">
                <span className="text-xs font-mono text-muted-foreground">{ticket.id}</span>
                {lastMsg && (
                  <span className="text-sm">{sentimentEmoji[lastMsg.sentiment]}</span>
                )}
              </div>
              <h3 className="font-medium text-sm mb-1 line-clamp-1">{ticket.subject}</h3>
              <p className="text-xs text-muted-foreground mb-2">{ticket.customer.name}</p>
              <Badge variant="outline" className={cn("text-xs", statusColors[ticket.status])}>
                {ticket.status}
              </Badge>
            </button>
          );
        })}
      </div>

      <Button onClick={handleSeedTicket} variant="outline" className="mt-4 w-full" size="sm">
        <Plus className="h-4 w-4 mr-2" />
        New Ticket (seed)
      </Button>
    </Card>
  );
};
