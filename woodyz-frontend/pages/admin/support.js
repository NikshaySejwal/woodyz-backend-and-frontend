import { useEffect, useState } from 'react';
import Head from 'next/head';
import AdminLayout from '../../components/admin/AdminLayout';
import LoadingScreen from '../../components/ui/LoadingScreen';
import api from '../../lib/api';
import { useAuthGuard } from '../../hooks/useAuthGuard';

export default function AdminSupport() {
  const { isReady: authReady } = useAuthGuard({ requiredRole: 'ADMIN', redirectTo: '/' });
  const [tickets, setTickets] = useState([]);
  const [fetching, setFetching] = useState(true);
  const [filter, setFilter] = useState('All');

  useEffect(() => {
    if (!authReady) return;
    fetchTickets();
  }, [authReady]);

  const fetchTickets = async () => {
    try {
      const response = await api.get('/api/support');
      setTickets(response.data);
    } catch (error) {
      console.error('Failed to fetch tickets', error);
    } finally {
      setFetching(false);
    }
  };

  const handleStatusUpdate = async (id, newStatus) => {
    try {
      await api.put(`/api/support/${id}/status`, newStatus, {
        headers: { 
          'Content-Type': 'text/plain'
        }
      });
      setTickets(tickets.map(t => t.id === id ? { ...t, status: newStatus } : t));
    } catch (error) {
      alert('Failed to update status');
    }
  };

  const filteredTickets = tickets.filter(t => filter === 'All' || t.status === filter);

  if (fetching) return <LoadingScreen message="Loading Help Desk..." />;

  return (
    <>
      <Head>
        <title>Support Management | WOODYZ Admin</title>
      </Head>

      <AdminLayout activeTab="support">
        <main>
          <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
            <div>
              <h1 className="font-display text-5xl font-black text-3d mb-2">Support Tickets</h1>
              <p className="text-lg font-bold text-charcoal/40">Help our explorers on their journey.</p>
            </div>
            <div className="flex bg-white border-4 border-charcoal rounded-2xl p-2 shadow-[4px_4px_0px_0px_#3A322B]">
              {['All', 'Open', 'Resolved'].map(s => (
                <button
                  key={s}
                  onClick={() => setFilter(s)}
                  className={`px-6 py-2 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${filter === s ? 'bg-cedar text-white' : 'text-charcoal/40 hover:text-charcoal'}`}
                >
                  {s}
                </button>
              ))}
            </div>
          </header>

          <div className="grid gap-8">
            {filteredTickets.length === 0 ? (
              <div className="text-center py-20 bg-white border-4 border-dashed border-charcoal/20 rounded-[40px]">
                <iconify-icon icon="ph:confetti-bold" class="text-6xl text-charcoal/10 mb-4"></iconify-icon>
                <p className="font-display text-2xl font-black text-charcoal/20">All quiet on the help front!</p>
              </div>
            ) : (
              filteredTickets.map((ticket) => (
                <div key={ticket.id} className="relative group">
                  <div className={`absolute -inset-1 bg-charcoal rounded-[36px] -rotate-1 opacity-0 group-hover:opacity-100 transition-opacity`}></div>
                  <div className="relative bg-white border-4 border-charcoal rounded-[32px] p-8 shadow-[6px_6px_0px_0px_#3A322B]">
                    <div className="flex flex-col md:flex-row justify-between gap-6">
                      <div className="flex-grow">
                        <div className="flex items-center gap-3 mb-4">
                          <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase border-2 ${ticket.status === 'Open' ? 'bg-orange/10 text-orange border-orange/20' : 'bg-sage/10 text-sage border-sage/20'}`}>
                            {ticket.status}
                          </span>
                          <span className="text-[10px] font-black uppercase tracking-widest text-charcoal/40">
                            Ticket #{ticket.id} • {new Date(ticket.createdAt).toLocaleString()}
                          </span>
                        </div>
                        <h3 className="font-display text-2xl font-black mb-3">{ticket.subject}</h3>
                        <p className="text-charcoal/70 font-bold leading-relaxed mb-6 italic">"{ticket.message}"</p>
                        <div className="flex items-center gap-3 text-xs font-black">
                          <div className="w-8 h-8 bg-maple rounded-lg border-2 border-charcoal flex items-center justify-center text-white">
                            {ticket.username ? ticket.username.charAt(0).toUpperCase() : '?'}
                          </div>
                          <span>{ticket.username || 'Anonymous'}</span>
                        </div>
                      </div>
                      <div className="flex flex-col justify-between items-end gap-4">
                        <div className="flex flex-col gap-2 w-full max-w-xs">
                          <form onSubmit={async (e) => {
                            e.preventDefault();
                            const msg = e.target.elements.reply.value;
                            try {
                              await api.post(`/api/support/${ticket.id}/message`, { message: msg });
                              alert('Reply recorded in-app; no email was sent.');
                              e.target.reset();
                            } catch (err) {
                              alert('Failed to send reply');
                            }
                          }} className="flex gap-2">
                            <input name="reply" placeholder="Send reply..." className="flex-1 px-3 py-2 border-2 border-charcoal rounded-xl text-xs font-bold" required />
                            <button type="submit" className="bg-charcoal text-white px-3 py-2 rounded-xl text-xs font-black uppercase"><iconify-icon icon="ph:paper-plane-right-fill"></iconify-icon></button>
                          </form>
                          <div className="flex gap-2 justify-end">
                            <button 
                              onClick={() => handleStatusUpdate(ticket.id, 'Open')}
                              className={`p-3 rounded-xl border-2 border-charcoal transition-all ${ticket.status === 'Open' ? 'bg-orange text-white' : 'bg-white text-charcoal/40 hover:border-orange hover:text-orange'}`}
                              title="Mark as Open"
                            >
                              <iconify-icon icon="ph:hourglass-bold" class="text-xl"></iconify-icon>
                            </button>
                            <button 
                              onClick={() => handleStatusUpdate(ticket.id, 'Resolved')}
                              className={`p-3 rounded-xl border-2 border-charcoal transition-all ${ticket.status === 'Resolved' ? 'bg-sage text-white' : 'bg-white text-charcoal/40 hover:border-sage hover:text-sage'}`}
                              title="Mark as Resolved"
                            >
                              <iconify-icon icon="ph:check-bold" class="text-xl"></iconify-icon>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </main>
      </AdminLayout>
    </>
  );
}
