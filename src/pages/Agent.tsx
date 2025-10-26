import { useEffect } from 'react';
import { useAppContext } from '@/contexts/AppContext';
import { Sidebar } from '@/components/Sidebar';
import { TicketList } from '@/components/TicketList';
import { ConversationPanel } from '@/components/ConversationPanel';
import { ContextPanelSlider } from '@/components/ContextPanelSlider';
import { Button } from '@/components/ui/button';
import { ChevronLeft } from 'lucide-react';
import { cn } from '@/lib/utils';

const Agent = () => {
  const { state, setContextPanelVisible, setActiveTicket } = useAppContext();

  // Auto-select first ticket on mount if none selected
  useEffect(() => {
    if (!state.activeTicket && state.tickets.length > 0) {
      setActiveTicket(state.tickets[0]);
    }
  }, []);

  return (
    <div className="flex min-h-screen bg-background overflow-hidden">
      <Sidebar />
      <div className={cn(
        "flex-1 min-h-0 h-screen grid gap-4 p-4 overflow-hidden",
        state.contextPanelVisible ? "grid-cols-[280px_1fr_360px]" : "grid-cols-[280px_1fr]"
      )}>
        <div className="min-w-0">
          <TicketList />
        </div>
        <div className="relative min-w-0">
          <ConversationPanel />
        </div>
        {state.contextPanelVisible && (
          <div className="min-w-0">
            <ContextPanelSlider
              visible={state.contextPanelVisible}
              onToggle={() => setContextPanelVisible(!state.contextPanelVisible)}
            />
          </div>
        )}
      </div>
      
      {/* Expand button when context panel is hidden */}
      {!state.contextPanelVisible && (
        <Button
          variant="outline"
          size="icon"
          className="fixed top-1/2 right-4 -translate-y-1/2 h-10 w-10 z-50 shadow-lg"
          onClick={() => setContextPanelVisible(true)}
          title="Show Context Panel"
        >
          <ChevronLeft className="h-5 w-5" />
        </Button>
      )}
    </div>
  );
};

export default Agent;
