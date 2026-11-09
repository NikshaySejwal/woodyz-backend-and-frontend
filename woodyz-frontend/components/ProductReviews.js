import React, { useState, useEffect } from 'react';
import api from '../lib/api';
import { useAuth } from '../context/AuthContext';
import StarRating from './ui/StarRating';

export default function ProductReviews({ productId }) {
  const { user } = useAuth();
  const [reviews, setReviews] = useState([]);
  const [averageRating, setAverageRating] = useState(0);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchReviews();
  }, [productId]);

  const fetchReviews = async () => {
    try {
      const res = await api.get(`/api/reviews/product/${productId}/summary`);
      setReviews(res.data.reviews);
      setAverageRating(res.data.averageRating);
    } catch (err) {
      console.error("Failed to fetch reviews", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post('/api/reviews/', { productId, rating, comment });
      setComment('');
      setRating(5);
      fetchReviews(); // Refresh list
    } catch (err) {
      alert("Failed to submit review. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mt-24">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
        <div>
          <h2 className="font-display text-5xl font-black text-3d mb-2">Treasure Talk</h2>
          <p className="text-lg font-bold text-charcoal/40">Hear what other explorers have to say.</p>
        </div>
        <div className="flex items-center gap-4 bg-white border-4 border-charcoal rounded-2xl px-6 py-4 shadow-[4px_4px_0px_0px_#3A322B]">
          <span className="text-3xl font-black text-cedar">
            {averageRating.toFixed(1)}
          </span>
          <StarRating rating={5} size="text-xl" />
          <span className="text-xs font-black uppercase tracking-widest text-charcoal/40 border-l-2 border-charcoal/10 pl-4">
            {reviews.length} Reviews
          </span>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-12">
        {/* Review Form */}
        <div className="lg:col-span-1">
          <div className="sticky top-8 relative">
            <div className="absolute -inset-2 bg-maple rounded-[40px] border-4 border-charcoal -rotate-1 -z-10 shadow-[8px_8px_0px_0px_#3A322B]"></div>
            <div className="bg-white border-4 border-charcoal rounded-[32px] p-8">
              <h3 className="font-display text-2xl font-black mb-6">Leave a Review</h3>
              
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-xs font-black uppercase tracking-widest mb-3 opacity-50">Your Rating</label>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setRating(s)}
                        className={`text-3xl transition-transform hover:scale-125 ${s <= rating ? 'text-orange' : 'text-charcoal/10'}`}
                      >
                        <iconify-icon icon={s <= rating ? "ph:star-fill" : "ph:star-bold"}></iconify-icon>
                      </button>
                    ))}
                  </div>
                </div>
                
                <div>
                  <label className="block text-xs font-black uppercase tracking-widest mb-2 opacity-50">Comment</label>
                  <textarea
                    required
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    className="w-full px-6 py-4 rounded-2xl border-3 border-charcoal bg-cream font-bold h-32"
                    placeholder="Tell us about the magic..."
                  />
                </div>

                <button
                  disabled={submitting}
                  className="w-full btn-pop bg-cedar text-white border-4 border-charcoal px-8 py-4 rounded-2xl font-black text-sm uppercase tracking-widest"
                >
                  {submitting ? 'Sending...' : 'Submit Review'}
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* Review List */}
        <div className="lg:col-span-2 space-y-8">
          {loading ? (
            <div className="animate-pulse space-y-8">
              {[1, 2].map(i => <div key={i} className="h-40 bg-charcoal/5 rounded-[32px]"></div>)}
            </div>
          ) : reviews.length === 0 ? (
            <div className="text-center py-20 bg-white border-4 border-dashed border-charcoal/20 rounded-[40px]">
              <iconify-icon icon="ph:chat-circle-dots-bold" class="text-6xl text-charcoal/10 mb-4"></iconify-icon>
              <p className="font-display text-2xl font-black text-charcoal/20">No reviews yet. Be the first!</p>
            </div>
          ) : (
            reviews.map((review) => (
              <div key={review.id} className="bg-white border-4 border-charcoal rounded-[32px] p-8 shadow-[6px_6px_0px_0px_#3A322B] hover:-translate-y-1 transition-transform">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-sage rounded-xl border-2 border-charcoal flex items-center justify-center font-black text-white">
                      {review.username?.charAt(0)?.toUpperCase() || '?'}
                    </div>
                    <div>
                      <h4 className="font-black text-sm">{review.username || 'Explorer'}</h4>
                      <p className="text-[10px] font-black uppercase tracking-widest text-charcoal/40">
                        {new Date(review.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <StarRating rating={review.rating} size="text-sm" />
                </div>
                <p className="font-bold text-charcoal/80 leading-relaxed italic">"{review.comment}"</p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
