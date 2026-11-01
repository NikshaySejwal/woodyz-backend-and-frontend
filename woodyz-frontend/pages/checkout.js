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
const demoPaymentsEnabled = process.env.NEXT_PUBLIC_DEMO_PAYMENTS === 'true';

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
  const [demoMethod, setDemoMethod] = useState('DEMO_QR');
  const [demoPayment, setDemoPayment] = useState(null);
  const [shipping, setShipping] = useState({ firstName: '', lastName: '', address: '', city: '', zip: '' });
  const router = useRouter();

  const updateShipping = (event) => {
    const { id, value } = event.target;
    const field = {
      'checkout-first-name': 'firstName',
      'checkout-last-name': 'lastName',
      'checkout-address': 'address',
      'checkout-city': 'city',
      'checkout-zip': 'zip',
    }[id];
    if (field) setShipping((current) => ({ ...current, [field]: value }));
  };

  const shippingComplete = Object.values(shipping).every((value) => value.trim().length > 0);
  const deliveryAddress = [
    `${shipping.firstName.trim()} ${shipping.lastName.trim()}`.trim(),
    shipping.address.trim(),
    `${shipping.city.trim()}, ${shipping.zip.trim()}`,
  ].filter(Boolean).join(', ');

  // Reuse the same Stripe request key when this cart is retried in the session.
  useEffect(() => {
    if (!demoPaymentsEnabled && cartTotal > 0 && user?.id) {
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

  useEffect(() => {
    setDemoPayment(null);
  }, [getCartFingerprint(cartItems)]);

  // If not loaded yet, don't run redirect logic
  if (!isLoaded) return null;

  const handleOrderCompletion = async (paymentIntentId) => {
    if (!shippingComplete) {
      alert('Please complete your shipping details before paying.');
      return;
    }

    setLoading(true);
    try {
      await api.post('/api/orders/', {
        paymentIntentId,
        deliveryAddress,
        items: cartItems.map((item) => ({ productId: item.id, quantity: item.quantity }))
      });
      const cartFingerprint = getCartFingerprint(cartItems);
      window.sessionStorage.removeItem(`woodyz-payment-intent:${user.id}:${cartFingerprint}`);
      alert(paymentIntentId.startsWith('demo_')
        ? 'Demo order recorded. No payment or email was sent.'
        : 'Payment Successful! An order confirmation email has been sent.');
      clearCart();
      router.push('/');
    } catch (error) {
      console.error(error);
      alert(paymentIntentId.startsWith('demo_')
        ? 'Demo order could not be recorded. Please try again.'
        : 'Payment successful, but failed to record order. Please contact support.');
    } finally {
      setLoading(false);
    }
  };

  const prepareDemoPayment = async () => {
    setLoading(true);
    try {
      const response = await api.post('/api/payments/demo-intent', {
        method: demoMethod,
        items: cartItems.map((item) => ({ productId: item.id, quantity: item.quantity })),
      });
      setDemoPayment(response.data);
    } catch (error) {
      console.error('Unable to prepare demo payment', error);
      alert('Unable to prepare demo checkout. Please try again.');
    } finally {
      setLoading(false);
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
                  <form className="space-y-6" onSubmit={(event) => event.preventDefault()}>
                    <div className="grid grid-cols-2 gap-6">
                      <FormField label="First Name" id="checkout-first-name" value={shipping.firstName} onChange={updateShipping} required />
                      <FormField label="Last Name" id="checkout-last-name" value={shipping.lastName} onChange={updateShipping} required />
                    </div>
                    <FormField label="Address" id="checkout-address" value={shipping.address} onChange={updateShipping} required />
                    <div className="grid grid-cols-2 gap-6">
                      <FormField label="City" id="checkout-city" value={shipping.city} onChange={updateShipping} required />
                      <FormField label="ZIP Code" id="checkout-zip" value={shipping.zip} onChange={updateShipping} required />
                    </div>
                    {!shippingComplete && <p className="text-sm font-bold text-charcoal/50">Complete every shipping field before confirming payment.</p>}
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
                  
                  {demoPaymentsEnabled ? (
                    <div className="space-y-5">
                      <p role="status" className="rounded-xl border-2 border-orange bg-orange/10 p-4 text-sm font-bold">
                        Local demo only. No real payment is processed and no confirmation email is sent.
                      </p>
                      <div role="group" aria-label="Demo payment method" className="grid gap-3 sm:grid-cols-2">
                        <button type="button" aria-pressed={demoMethod === 'DEMO_QR'} onClick={() => { setDemoMethod('DEMO_QR'); setDemoPayment(null); }} className={`rounded-xl border-2 border-charcoal px-4 py-3 text-sm font-black ${demoMethod === 'DEMO_QR' ? 'bg-sage' : 'bg-white'}`}>
                          QR payment (demo)
                        </button>
                        <button type="button" aria-pressed={demoMethod === 'DEMO_DELIVERY'} onClick={() => { setDemoMethod('DEMO_DELIVERY'); setDemoPayment(null); }} className={`rounded-xl border-2 border-charcoal px-4 py-3 text-sm font-black ${demoMethod === 'DEMO_DELIVERY' ? 'bg-sage' : 'bg-white'}`}>
                          Pay on delivery (demo)
                        </button>
                      </div>
                      {demoPayment?.method === 'DEMO_QR' && (
                        <div className="flex flex-col items-center gap-2 rounded-xl border-2 border-charcoal p-4">
                          <svg viewBox="0 0 21 21" role="img" aria-label="Decorative demo QR code; not scannable" className="h-36 w-36 border-4 border-white bg-white">
                            <rect width="21" height="21" fill="white" />
                            <path fill="black" d="M0 0h7v7H0zM1 1v5h5V1zM2 2h3v3H2zM14 0h7v7h-7zM15 1v5h5V1zM16 2h3v3h-3zM0 14h7v7H0zM1 15v5h5v-5zM2 16h3v3H2zM9 1h2v2H9zM8 5h2v2H8zM11 7h2v2h-2zM8 9h2v2H8zM12 10h2v2h-2zM9 13h2v2H9zM12 14h2v2h-2zM8 17h2v2H8zM14 18h2v2h-2zM17 9h2v2h-2zM18 12h2v2h-2zM15 5h2v2h-2zM19 15h2v2h-2z" />
                          </svg>
                          <span className="text-center text-xs font-bold">Decorative only — not scannable and not linked to a bank.</span>
                        </div>
                      )}
                      {demoPayment ? (
                        <button type="button" disabled={!shippingComplete || loading} onClick={() => handleOrderCompletion(demoPayment.paymentIntentId)} className="w-full btn-pop bg-cedar text-white border-4 border-charcoal py-4 rounded-xl font-black uppercase tracking-widest disabled:opacity-50">
                          {loading ? 'Recording demo order…' : 'Confirm demo order'}
                        </button>
                      ) : (
                        <button type="button" disabled={!shippingComplete || loading} onClick={prepareDemoPayment} className="w-full btn-pop bg-cedar text-white border-4 border-charcoal py-4 rounded-xl font-black uppercase tracking-widest disabled:opacity-50">
                          {loading ? 'Preparing…' : 'Prepare demo checkout'}
                        </button>
                      )}
                      {!shippingComplete && <p className="text-sm font-bold text-charcoal/50">Complete every shipping field before confirming your demo order.</p>}
                    </div>
                  ) : clientSecret ? (
                    <Elements stripe={stripePromise} options={{ clientSecret }}>
                      <CheckoutForm totalAmount={cartTotal} onPaymentSuccess={handleOrderCompletion} disabled={!shippingComplete} />
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
