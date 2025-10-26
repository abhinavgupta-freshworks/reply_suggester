import { Sidebar } from '@/components/Sidebar';
import { TicketList } from '@/components/TicketList';
import { ConversationPanel } from '@/components/ConversationPanel';
import { ContextPanel } from '@/components/ContextPanel';

const Agent = () => {
  return (
    <div className="flex min-h-screen bg-background overflow-y-auto">
      <Sidebar />
      <div className="flex-1 min-h-0 h-screen grid grid-cols-[280px_1fr_360px] gap-4 p-4 overflow-hidden">
        <TicketList />
        <ConversationPanel />
        <ContextPanel />
      </div>
    </div>
  );
};

export default Agent;
