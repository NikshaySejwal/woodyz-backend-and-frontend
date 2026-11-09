import { useEffect, useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useAuthGuard } from '../hooks/useAuthGuard';
import LoadingScreen from '../components/ui/LoadingScreen';
import api from '../lib/api';

export default function UserProfile() {
  const { user, isReady } = useAuthGuard();
  const [reviews, setReviews] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [fetching, setFetching] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({ phone: '', address: '' });

  useEffect(() => {
    if (user) {
      setEditForm({ phone: user.phone || '', address: user.address || '' });
    }
  }, [user]);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    try {
      await api.put('/api/user/profile', editForm);
      window.location.reload(); // Refresh to get updated user context
    } catch (error) {
      console.error('Failed to update profile', error);
      alert('Failed to update profile');
    }
  };

  useEffect(() => {
    if (isReady) fetchProfileData();
  }, [isReady, user]);

  const fetchProfileData = async () => {
    try {
      const [reviewsRes, ticketsRes] = await Promise.all([
        api.get('/api/reviews/user'),
        api.get('/api/support/user')
      ]);
      setReviews(reviewsRes.data);
      setTickets(ticketsRes.data);
    } catch (error) {
      console.error('Failed to fetch profile data', error);
    } finally {
      setFetching(false);
    }
  };

  if (!isReady || fetching) return <LoadingScreen message="Gathering your treasures..." />;

  return (
    <>
      <Head>
        <title>My Adventure Profile | WOODYZ</title>
      </Head>

      <section className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <header className="mb-16">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
              <div className="flex items-center gap-8">
                <div className="w-24 h-24 bg-maple rounded-[40px] border-4 border-charcoal flex items-center justify-center text-white text-4xl font-black shadow-[8px_8px_0px_0px_#3A322B]">
                  {user.username?.charAt(0)?.toUpperCase() || '?'}
                </div>
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.3em] text-cedar mb-2">Explorer Profile</p>
                  <h1 className="font-display text-6xl font-black text-3d mb-1">{user.username || 'Explorer'}</h1>
                  <p className="text-lg font-bold text-charcoal/40">{user.email}</p>
                </div>
              </div>
              <div className="flex gap-4">
                <Link href="/orders" className="btn-pop bg-white text-charcoal border-4 border-charcoal px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest no-underline flex items-center gap-2">
                  <iconify-icon icon="ph:shopping-bag-bold"></iconify-icon>
                  My Orders
                </Link>
                <button onClick={() => setIsEditing(true)} className="btn-pop bg-cream text-charcoal border-4 border-charcoal px-4 py-4 rounded-2xl font-black text-xs uppercase tracking-widest">
                  <iconify-icon icon="ph:pencil-simple-bold" class="text-xl"></iconify-icon>
                </button>
              </div>
            </div>
            
            {(user.address || user.phone) && (
              <div className="mt-8 flex flex-col md:flex-row gap-6">
                {user.phone && (
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-cream rounded-xl border-2 border-charcoal flex items-center justify-center">
                      <iconify-icon icon="ph:phone-bold" class="text-lg"></iconify-icon>
                    </div>
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-cedar">Phone</p>
                      <p className="font-bold">{user.phone}</p>
                    </div>
                  </div>
                )}
                {user.address && (
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-cream rounded-xl border-2 border-charcoal flex items-center justify-center">
                      <iconify-icon icon="ph:map-pin-bold" class="text-lg"></iconify-icon>
                    </div>
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-cedar">Address</p>
                      <p className="font-bold">{user.address}</p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </header>

          <div className="grid lg:grid-cols-2 gap-12">
            {/* My Reviews */}
            <div className="space-y-8">
              <div className="flex items-center justify-between">
                <h2 className="font-display text-3xl font-black">My Treasure Talk</h2>
                <span className="text-[10px] font-black uppercase tracking-widest text-charcoal/40">{reviews.length} Reviews</span>
              </div>
              
              <div className="space-y-6">
                {reviews.length === 0 ? (
                  <div className="bg-white border-4 border-dashed border-charcoal/10 rounded-[40px] p-12 text-center">
                    <iconify-icon icon="ph:chat-circle-dots-bold" class="text-5xl text-charcoal/10 mb-4"></iconify-icon>
                    <p className="font-bold text-charcoal/40">No magic shared yet!</p>
                  </div>
                ) : (
                  reviews.map(review => (
                    <div key={review.id} className="bg-white border-4 border-charcoal rounded-[32px] p-6 shadow-[6px_6px_0px_0px_#3A322B]">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <p className="text-[10px] font-black uppercase tracking-widest text-cedar mb-1">Product #{review.productId}</p>
                          <div className="flex text-orange">
                            {[...Array(review.rating)].map((_, i) => (
                              <iconify-icon key={i} icon="ph:star-fill"></iconify-icon>
                            ))}
                          </div>
                        </div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-charcoal/30">
                          {new Date(review.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <p className="font-bold text-charcoal/80 leading-relaxed italic">"{review.comment}"</p>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* My Support Tickets */}
            <div className="space-y-8">
              <div className="flex items-center justify-between">
                <h2 className="font-display text-3xl font-black">Help Requests</h2>
                <span className="text-[10px] font-black uppercase tracking-widest text-charcoal/40">{tickets.length} Tickets</span>
              </div>

              <div className="space-y-6">
                {tickets.length === 0 ? (
                  <div className="bg-white border-4 border-dashed border-charcoal/10 rounded-[40px] p-12 text-center">
                    <iconify-icon icon="ph:lifebuoy-bold" class="text-5xl text-charcoal/10 mb-4"></iconify-icon>
                    <p className="font-bold text-charcoal/40">Clear skies! No open issues.</p>
                  </div>
                ) : (
                  tickets.map(ticket => (
                    <div key={ticket.id} className="bg-white border-4 border-charcoal rounded-[32px] p-6 shadow-[6px_6px_0px_0px_#3A322B]">
                      <div className="flex justify-between items-start mb-4">
                        <h3 className="font-black text-sm uppercase tracking-widest">{ticket.subject}</h3>
                        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase border-2 ${ticket.status === 'Open' ? 'bg-orange/10 text-orange border-orange/20' : 'bg-sage/10 text-sage border-sage/20'}`}>
                          {ticket.status}
                        </span>
                      </div>
                      <p className="text-xs font-bold text-charcoal/60 mb-4 line-clamp-2">{ticket.message}</p>
                      <p className="text-[10px] font-black uppercase tracking-widest text-charcoal/30">
                        Submitted {new Date(ticket.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {isEditing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-charcoal/40 backdrop-blur-sm" onClick={() => setIsEditing(false)}></div>
          <div className="bg-cream rounded-[48px] border-4 border-charcoal p-8 w-full max-w-lg relative z-10 shadow-[12px_12px_0px_0px_#3A322B]">
            <div className="flex justify-between items-center mb-8">
              <h2 className="font-display text-3xl font-black">Edit Profile</h2>
              <button onClick={() => setIsEditing(false)} className="w-12 h-12 bg-white border-4 border-charcoal rounded-2xl flex items-center justify-center btn-pop">
                <iconify-icon icon="ph:x-bold" class="text-xl"></iconify-icon>
              </button>
            </div>
            
            <form onSubmit={handleUpdateProfile} className="space-y-6">
              <div>
                <label className="block text-xs font-black uppercase tracking-widest mb-2 opacity-50">Phone Number</label>
                <input 
                  type="text" 
                  value={editForm.phone}
                  onChange={(e) => setEditForm({...editForm, phone: e.target.value})}
                  className="w-full px-6 py-4 rounded-2xl border-3 border-charcoal bg-white font-bold"
                  placeholder="+1 (555) 000-0000"
                />
              </div>
              <div>
                <label className="block text-xs font-black uppercase tracking-widest mb-2 opacity-50">Delivery Address</label>
                <textarea 
                  value={editForm.address}
                  onChange={(e) => setEditForm({...editForm, address: e.target.value})}
                  className="w-full px-6 py-4 rounded-2xl border-3 border-charcoal bg-white font-bold h-32 resize-none"
                  placeholder="123 Adventure Lane&#10;Playville, TOY 12345"
                ></textarea>
              </div>
              <button type="submit" className="w-full btn-pop bg-orange text-white border-4 border-charcoal py-4 rounded-2xl font-black text-lg uppercase tracking-wider">
                Save Changes
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
