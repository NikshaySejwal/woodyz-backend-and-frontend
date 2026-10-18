import { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import CheckoutForm from '../components/CheckoutForm';
import OrderSummary from '../components/ui/OrderSummary';
import FormField from '../components/ui/FormField';
import api from '../lib/api';

const stripePromise = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
  ? loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY)
  : null;

const getCartFingerprint = (items) => JSON.stringify(
  items
    .map((item) => ({ productId: item.id, quantity: item.quantity, price: item.price }))
    .sort((left, right) => left.productId - right.productId)
);

export default function Checkout() {
  const { cartItems, cartTotal, clearCart, isLoaded } = useCart();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [clientSecret, setClientSecret] = useState("");
  const router = useRouter();

  // Reuse the same Stripe request key when this cart is retried in the session.
  useEffect(() => {
    if (cartTotal > 0 && user?.id) {
      let active = true;
      setClientSecret("");
      const cartFingerprint = getCartFingerprint(cartItems);
      const storageKey = `woodyz-payment-intent:${user.id}:${cartFingerprint}`;
      let requestKey = window.sessionStorage.getItem(storageKey);
      if (!requestKey) {
        requestKey = window.crypto.randomUUID();
        window.sessionStorage.setItem(storageKey, requestKey);
      }
      api.post('/api/payments/create-payment-intent', {
        items: cartItems.map((item) => ({ productId: item.id, quantity: item.quantity }))
      }, { headers: { 'Idempotency-Key': requestKey } })
      .then((res) => {
        if (active) setClientSecret(res.data.clientSecret);
      })
      .catch((err) => {
        if (active) console.error("Error fetching payment intent", err);
      });

      return () => { active = false; };
    }
  }, [cartItems, cartTotal, user?.id]);

  // If not loaded yet, don't run redirect logic
  if (!isLoaded) return null;

  const handleOrderCompletion = async (paymentIntentId) => {
    try {
      await api.post('/api/orders/', {
        paymentIntentId,
        items: cartItems.map((item) => ({ productId: item.id, quantity: item.quantity }))
      });
      const cartFingerprint = getCartFingerprint(cartItems);
      window.sessionStorage.removeItem(`woodyz-payment-intent:${user.id}:${cartFingerprint}`);
      alert('Payment Successful! An order confirmation email has been sent.');
      clearCart();
      router.push('/');
    } catch (error) {
      console.error(error);
      alert('Payment successful, but failed to record order. Please contact support.');
    }
  };

  if (cartItems.length === 0) {
    if (typeof window !== 'undefined') {
      router.push('/products');
    }
    return null;
  }

  return (
    <>
      <Head>
        <title>Checkout | WOODYZ</title>
      </Head>

      <section className="py-16 px-6">
        <div className="max-w-6xl mx-auto">
          <h1 className="font-display text-5xl font-black text-3d mb-12">Checkout</h1>

          <div className="grid lg:grid-cols-2 gap-16">
            {/* Form */}
            <div className="space-y-12">
              <div className="relative">
                <div className="absolute -inset-2 bg-sage rounded-[40px] border-4 border-charcoal rotate-1 -z-10 shadow-[8px_8px_0px_0px_#3A322B]"></div>
                <div className="bg-white border-4 border-charcoal rounded-[32px] p-8">
                  <h2 className="font-display text-2xl font-black mb-8 flex items-center gap-3">
                    <iconify-icon icon="ph:truck-bold" class="text-cedar"></iconify-icon>
                    Shipping Details
                  </h2>
                  <form className="space-y-6">
                    <div className="grid grid-cols-2 gap-6">
                      <FormField label="First Name" id="checkout-first-name" required />
                      <FormField label="Last Name" id="checkout-last-name" required />
                    </div>
                    <FormField label="Address" id="checkout-address" required />
                    <div className="grid grid-cols-2 gap-6">
                      <FormField label="City" id="checkout-city" required />
                      <FormField label="ZIP Code" id="checkout-zip" required />
                    </div>
                  </form>
                </div>
              </div>

              <div className="relative">
                <div className="absolute -inset-2 bg-maple rounded-[40px] border-4 border-charcoal -rotate-1 -z-10 shadow-[8px_8px_0px_0px_#3A322B]"></div>
                <div className="bg-white border-4 border-charcoal rounded-[32px] p-8">
                  <h2 className="font-display text-2xl font-black mb-8 flex items-center gap-3">
                    <iconify-icon icon="ph:credit-card-bold" class="text-cedar"></iconify-icon>
                    Payment Details
                  </h2>
                  
                  {clientSecret ? (
                    <Elements stripe={stripePromise} options={{ clientSecret }}>
                      <CheckoutForm totalAmount={cartTotal} onPaymentSuccess={handleOrderCompletion} />
                    </Elements>
                  ) : (
                    <div className="animate-pulse flex flex-col items-center py-8">
                      <iconify-icon icon="ph:spinner-gap-bold" class="text-4xl animate-spin text-cedar mb-2"></iconify-icon>
                      <p className="font-bold text-charcoal/40 text-xs uppercase tracking-widest">Securing Payment Gateway...</p>
                    </div>
                  )}

                </div>
              </div>

              <div className="text-center">
                <p className="text-sm font-bold text-charcoal/40 flex items-center justify-center gap-2">
                  <iconify-icon icon="ph:lock-key-bold"></iconify-icon>
                  Secure SSL Encrypted Checkout
                </p>
              </div>
            </div>

            {/* Sidebar Summary */}
            <div className="space-y-8">
              <div className="bg-white border-4 border-charcoal rounded-[40px] p-10 shadow-[10px_10px_0px_0px_#3A322B]">
                <h2 className="font-display text-2xl font-black mb-8">Order Review</h2>
                <div className="space-y-6 mb-8 max-h-96 overflow-y-auto pr-4">
                  {cartItems.map((item) => (
                    <div key={item.id} className="flex gap-4">
                      <div className="w-16 h-16 bg-cream rounded-xl border-2 border-charcoal/10 flex-shrink-0 flex items-center justify-center">
                        <iconify-icon icon="ph:cube-bold" class="text-2xl text-cedar/30"></iconify-icon>
                      </div>
                      <div className="flex-grow">
                        <h4 className="font-black text-sm">{item.name}</h4>
                        <p className="text-xs font-bold text-charcoal/50">Qty: {item.quantity}</p>
                      </div>
                      <span className="font-black text-sm">${(item.price * item.quantity).toFixed(2)}</span>
                    </div>
                  ))}
                </div>
                
                <div className="pt-6 border-t-4 border-charcoal">
                  <OrderSummary total={cartTotal} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
