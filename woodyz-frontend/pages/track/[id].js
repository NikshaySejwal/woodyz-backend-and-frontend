import { useEffect, useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useAuthGuard } from '../../hooks/useAuthGuard';
import LoadingScreen from '../../components/ui/LoadingScreen';
import api from '../../lib/api';
import { formatCurrency } from '../../lib/currency';

export default function TrackOrder() {
  const router = useRouter();
  const { id } = router.query;
  const { isReady } = useAuthGuard();
  const [order, setOrder] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isReady && id) {
      fetchOrderDetails();
    }
  }, [id, isReady]);

  const fetchOrderDetails = async () => {
    try {
      const [orderRes, historyRes] = await Promise.all([
        api.get(`/api/orders/${id}`),
        api.get(`/api/orders/${id}/history`)
      ]);
      setOrder(orderRes.data);
      setHistory(historyRes.data);
    } catch (err) {
      console.error("Failed to fetch order details", err);
    } finally {
      setLoading(false);
    }
  };

  if (!isReady || loading) return <LoadingScreen message="Tracking the Compass..." />;
  if (!order) return <div className="min-h-screen flex items-center justify-center bg-cream font-display text-2xl font-black">Order Lost in the Woods!</div>;

  const steps = ["Paid", "Preparing", "Shipped", "Delivered"];
  const currentStepIndex = steps.indexOf(order.status);

  return (
    <>
      <Head>
        <title>Track Order #{id} | WOODYZ</title>
      </Head>

      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <Link href="/orders" className="inline-flex items-center gap-2 font-black text-xs uppercase tracking-widest text-charcoal/40 hover:text-cedar transition-colors mb-12">
            <iconify-icon icon="ph:arrow-left-bold"></iconify-icon>
            My Collection
          </Link>

          <header className="mb-16">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-cedar mb-2">Order Tracking</p>
                <h1 className="font-display text-6xl font-black text-3d mb-2">Order #{id}</h1>
                <p className="text-xl font-bold text-charcoal/40">Status: <span className="text-charcoal">{order.status}</span></p>
              </div>
              <div className="bg-white border-4 border-charcoal rounded-2xl px-6 py-4 shadow-[6px_6px_0px_0px_#3A322B]">
                <p className="text-[10px] font-black uppercase tracking-widest text-charcoal/40 mb-1">Total</p>
                <p className="text-2xl font-black text-cedar">{formatCurrency(order.totalAmount)}</p>
              </div>
            </div>
          </header>

          {/* Visual Progress Bar */}
          <div className="relative mb-24 px-12">
            <div className="absolute top-1/2 left-0 w-full h-2 bg-charcoal/10 -translate-y-1/2 -z-10 rounded-full"></div>
            <div 
              className="absolute top-1/2 left-0 h-2 bg-sage -translate-y-1/2 -z-10 rounded-full transition-all duration-1000"
              style={{ width: `${(Math.max(0, currentStepIndex) / (steps.length - 1)) * 100}%` }}
            ></div>
            
            <div className="flex justify-between items-center">
              {steps.map((step, index) => {
                const isCompleted = index <= currentStepIndex;
                const isCurrent = index === currentStepIndex;
                
                return (
                  <div key={step} className="flex flex-col items-center">
                    <div className={`w-12 h-12 rounded-full border-4 border-charcoal flex items-center justify-center transition-all duration-500 shadow-[4px_4px_0px_0px_#3A322B] ${
                      isCompleted ? 'bg-sage text-white' : 'bg-white text-charcoal/20'
                    } ${isCurrent ? 'scale-125 ring-8 ring-sage/20' : ''}`}>
                      <iconify-icon icon={
                        step === "Paid" ? "ph:credit-card-bold" :
                        step === "Preparing" ? "ph:hammer-bold" :
                        step === "Shipped" ? "ph:truck-bold" : "ph:house-line-bold"
                      } class="text-xl"></iconify-icon>
                    </div>
                    <span className={`absolute mt-16 text-[10px] font-black uppercase tracking-widest ${isCompleted ? 'text-charcoal' : 'text-charcoal/20'}`}>
                      {step}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Timeline */}
          <div className="relative">
            <div className="absolute -inset-2 bg-maple rounded-[48px] border-4 border-charcoal -rotate-1 -z-10 shadow-[10px_10px_0px_0px_#3A322B]"></div>
            <div className="bg-white border-4 border-charcoal rounded-[40px] p-10">
              <h3 className="font-display text-2xl font-black mb-10">Journey Timeline</h3>
              
              <div className="space-y-12">
                {history.slice().reverse().map((event, index) => (
                  <div key={event.id} className="relative pl-10 group">
                    {/* Vertical line connector */}
                    {index !== history.length - 1 && (
                      <div className="absolute top-8 left-[11px] w-1 h-12 bg-charcoal/10 rounded-full"></div>
                    )}
                    
                    <div className="absolute top-1 left-0 w-6 h-6 rounded-full border-3 border-charcoal bg-white flex items-center justify-center group-first:bg-sage group-first:border-sage transition-colors">
                      <div className="w-1.5 h-1.5 rounded-full bg-charcoal group-first:bg-white"></div>
                    </div>
                    
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-charcoal/40 mb-1">
                        {new Date(event.updatedAt).toLocaleString()}
                      </p>
                      <h4 className="text-xl font-black mb-1">{event.status}</h4>
                      <p className="font-bold text-charcoal/60">{event.message}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
