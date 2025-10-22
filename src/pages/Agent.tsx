import { Sidebar } from '@/components/Sidebar';
import { TicketList } from '@/components/TicketList';
import { ConversationPanel } from '@/components/ConversationPanel';
import { ContextPanel } from '@/components/ContextPanel';

const Agent = () => {
  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar />
      <div className="flex-1 grid grid-cols-[280px_1fr_360px] gap-4 p-4 overflow-hidden">
        <TicketList />
        <ConversationPanel />
        <ContextPanel />
      </div>
    </div>
  );
};

export default Agent;
