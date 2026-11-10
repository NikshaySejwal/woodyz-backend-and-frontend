import { useEffect, useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useAuthGuard } from '../hooks/useAuthGuard';
import LoadingScreen from '../components/ui/LoadingScreen';
import api from '../lib/api';
import { formatCurrency } from '../lib/currency';

export default function MyOrders() {
  const { user, isReady } = useAuthGuard();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isReady) fetchOrders();
  }, [isReady, user]);

  const fetchOrders = async () => {
    try {
      const res = await api.get(`/api/orders/user/${user.id}`);
      setOrders(res.data);
    } catch (err) {
      console.error("Failed to fetch orders", err);
    } finally {
      setLoading(false);
    }
  };

  if (!isReady || loading) return <LoadingScreen message="Consulting the Scrolls..." />;

  return (
    <>
      <Head>
        <title>My Orders | WOODYZ</title>
      </Head>

      <section className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <header className="mb-12">
            <h1 className="font-display text-6xl font-black text-3d mb-2">My Collection</h1>
            <p className="text-xl font-bold text-charcoal/40">A history of your handcrafted treasures.</p>
          </header>

          {orders.length === 0 ? (
            <div className="bg-white border-4 border-charcoal rounded-[48px] p-20 text-center shadow-[12px_12px_0px_0px_#3A322B]">
              <iconify-icon icon="ph:package-bold" class="text-9xl text-charcoal/10 mb-8"></iconify-icon>
              <h2 className="font-display text-3xl font-black mb-4 text-charcoal/40">No Treasures Yet!</h2>
              <Link href="/products" className="btn-pop bg-cedar text-white border-4 border-charcoal px-8 py-4 rounded-2xl font-black text-sm uppercase tracking-widest inline-block">
                Start Your Collection
              </Link>
            </div>
          ) : (
            <div className="grid gap-8">
              {orders.map((order) => (
                <div key={order.id} className="bg-white border-4 border-charcoal rounded-[40px] p-8 shadow-[10px_10px_0px_0px_#3A322B] hover:-translate-y-1 transition-transform group">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="flex items-center gap-6">
                      <div className="w-20 h-20 bg-cream rounded-3xl border-4 border-charcoal/10 flex items-center justify-center">
                        <iconify-icon icon="ph:gift-bold" class="text-4xl text-cedar/30"></iconify-icon>
                      </div>
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-charcoal/40 mb-1">Order #{order.id}</p>
                        <h3 className="text-2xl font-black mb-1">Placed on {new Date().toLocaleDateString()}</h3>
                        <p className="font-black text-cedar">{formatCurrency(order.totalAmount)}</p>
                      </div>
                    </div>

                    <div className="flex flex-col md:items-end gap-4">
                      <div className={`px-6 py-2 rounded-full border-3 border-charcoal font-black text-xs uppercase tracking-widest shadow-[4px_4px_0px_0px_#3A322B] ${
                        order.status === 'Paid' ? 'bg-sage text-white' : 
                        order.status === 'Shipped' ? 'bg-orange text-white' : 
                        order.status === 'CANCELLED' ? 'bg-charcoal/20 text-charcoal' : 'bg-maple text-charcoal'
                      }`}>
                        {order.status}
                      </div>
                      <div className="flex gap-4 items-center">
                        {order.status === 'Pending' && (
                          <button 
                            onClick={async () => {
                              if (confirm('Are you sure you want to cancel this order?')) {
                                try {
                                  await api.put(`/api/orders/${order.id}/status`, { status: 'CANCELLED' });
                                  fetchOrders();
                                } catch (e) {
                                  alert('Failed to cancel order');
                                }
                              }
                            }}
                            className="text-xs font-black uppercase tracking-widest text-red-500 hover:text-red-700 transition-colors"
                          >
                            Cancel
                          </button>
                        )}
                        <Link href={`/track/${order.id}`} className="text-xs font-black uppercase tracking-widest text-charcoal hover:text-cedar transition-colors flex items-center gap-2">
                          Track Journey
                          <iconify-icon icon="ph:arrow-right-bold"></iconify-icon>
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  );
}
