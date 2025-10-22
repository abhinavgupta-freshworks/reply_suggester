import { Sidebar } from '@/components/Sidebar';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { useAppContext } from '@/contexts/AppContext';
import { TrendingUp, MessageSquare, CheckCircle, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

const Reports = () => {
  const { state } = useAppContext();

  const kpis = [
    {
      label: 'AI Suggestions Generated',
      value: state.telemetry.events.filter(e => e.event === 'reply_suggester_generated').length,
      icon: TrendingUp,
      color: 'text-primary'
    },
    {
      label: 'Summaries Run',
      value: state.telemetry.events.filter(e => e.event === 'summarize_used').length,
      icon: MessageSquare,
      color: 'text-success'
    },
    {
      label: 'Replies Sent',
      value: state.telemetry.events.filter(e => e.event === 'reply_sent').length,
      icon: CheckCircle,
      color: 'text-primary'
    },
    {
      label: 'Verifier Runs',
      value: state.telemetry.events.filter(e => e.event === 'verifier_run').length,
      icon: AlertTriangle,
      color: 'text-warning'
    }
  ];

  const writeWithAIActions = state.telemetry.events
    .filter(e => e.event === 'write_with_ai_used')
    .reduce((acc, e) => {
      acc[e.action] = (acc[e.action] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar />
      <div className="flex-1 overflow-hidden">
        <ScrollArea className="h-full">
          <div className="p-6 max-w-7xl mx-auto space-y-6">
            <div>
              <h1 className="text-3xl font-bold mb-2">Impact Reports</h1>
              <p className="text-muted-foreground">Analytics and insights from AI features</p>
            </div>

            {/* KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {kpis.map((kpi) => {
                const Icon = kpi.icon;
                return (
                  <Card key={kpi.label} className="p-6">
                    <div className="flex items-center justify-between mb-2">
                      <Icon className={`h-5 w-5 ${kpi.color}`} />
                      <span className={`text-3xl font-bold ${kpi.color}`}>{kpi.value}</span>
                    </div>
                    <p className="text-sm text-muted-foreground">{kpi.label}</p>
                  </Card>
                );
              })}
            </div>

            {/* Write with AI Usage */}
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4">Write with AI Usage</h2>
              {Object.keys(writeWithAIActions).length > 0 ? (
                <div className="space-y-3">
                  {Object.entries(writeWithAIActions).map(([action, count]) => (
                    <div key={action} className="flex items-center justify-between">
                      <span className="text-sm capitalize">{action.replace(/_/g, ' ')}</span>
                      <div className="flex items-center gap-3">
                        <div className="w-48 h-2 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary rounded-full transition-all"
                            style={{
                              width: `${(count / Math.max(...Object.values(writeWithAIActions))) * 100}%`
                            }}
                          />
                        </div>
                        <span className="text-sm font-medium w-8 text-right">{count}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No data yet</p>
              )}
            </Card>

            {/* Recent Events */}
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4">Recent Activity</h2>
              <ScrollArea className="h-64">
                <div className="space-y-2">
                  {state.telemetry.events.slice(-20).reverse().map((event, i) => (
                    <div key={i} className="flex items-start gap-3 p-2 rounded-lg hover:bg-accent/50 transition-colors">
                      <div className="flex-1">
                        <p className="text-sm font-medium">{event.event.replace(/_/g, ' ')}</p>
                        <p className="text-xs text-muted-foreground">
                          {event.ticketId && `Ticket: ${event.ticketId} • `}
                          {new Date(event.ts).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </Card>

            {/* Insights */}
            <Card className="p-6 bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
              <h2 className="text-xl font-semibold mb-3">Insights</h2>
              <p className="text-sm text-muted-foreground mb-4">
                [Simulated Insight] All metrics shown are generated from demo telemetry. In production, these would reflect real usage patterns.
              </p>
              <Button variant="outline" onClick={() => toast.success('Reports refreshed')}>
                Refresh from State
              </Button>
            </Card>
          </div>
        </ScrollArea>
      </div>
    </div>
  );
};

export default Reports;
