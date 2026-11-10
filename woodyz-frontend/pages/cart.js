import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useCart } from '../context/CartContext';
import OrderSummary from '../components/ui/OrderSummary';
import { formatCurrency } from '../lib/currency';

export default function Cart() {
  const router = useRouter();
  const { cartItems, updateQuantity, removeFromCart, cartTotal, cartCount, isLoaded } = useCart();
  const commerceEnabled = process.env.NEXT_PUBLIC_COMMERCE_ENABLED === 'true';

  if (!isLoaded) {
    return null; // Avoid hydration mismatch on initial render
  }

  return (
    <>
      <Head>
        <title>Your Bag | WOODYZ</title>
      </Head>

      <section className="py-16 lg:py-24 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-12">
            <h1 className="font-display text-5xl font-black text-3d">Your Bag</h1>
            <span className="bg-white border-2 border-charcoal px-4 py-2 rounded-2xl font-black text-sm uppercase tracking-widest">
              {cartCount} Items
            </span>
          </div>

          {cartItems.length > 0 ? (
            <div className="space-y-8">
              <div className="bg-white border-4 border-charcoal rounded-[40px] overflow-hidden shadow-[8px_8px_0px_0px_#3A322B]">
                {cartItems.map((item) => (
                  <div key={item.id} className="flex flex-col sm:flex-row items-center gap-8 p-8 border-b-4 last:border-0 border-charcoal/5">
                    <div className="w-32 h-32 bg-cream rounded-3xl flex items-center justify-center flex-shrink-0 border-2 border-charcoal/10">
                      <iconify-icon icon="ph:cube-bold" class="text-5xl text-cedar/30"></iconify-icon>
                    </div>
                    
                    <div className="flex-grow text-center sm:text-left">
                      <h3 className="font-display text-2xl font-black mb-1">{item.name}</h3>
                      <p className="text-sm font-bold text-charcoal/50 mb-4">{formatCurrency(item.price)} each</p>
                      
                      <div className="flex items-center justify-center sm:justify-start gap-4">
                        <div className="flex items-center bg-cream border-2 border-charcoal rounded-xl px-2">
                          <button 
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            className="p-2 hover:text-cedar transition-colors"
                          >
                            <iconify-icon icon="ph:minus-bold"></iconify-icon>
                          </button>
                          <span className="w-8 text-center font-black">{item.quantity}</span>
                          <button 
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            className="p-2 hover:text-cedar transition-colors"
                          >
                            <iconify-icon icon="ph:plus-bold"></iconify-icon>
                          </button>
                        </div>
                        <button 
                          onClick={() => removeFromCart(item.id)}
                          className="text-xs font-black uppercase tracking-widest text-red-500 hover:underline"
                        >
                          Remove
                        </button>
                      </div>
                    </div>

                    <div className="text-right">
                      <p className="font-display text-2xl font-black text-cedar">
                        {formatCurrency(item.price * item.quantity)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Summary */}
              <div className="flex flex-col md:flex-row gap-8 items-start">
                <div className="flex-grow bg-white border-4 border-charcoal rounded-[32px] p-8">
                  <h4 className="font-display text-2xl font-black mb-6">Order Summary</h4>
                  <OrderSummary total={cartTotal} />
                </div>

                <div className="w-full md:w-80 space-y-4">
                  <button 
                    disabled={!commerceEnabled}
                    onClick={() => {
                      if (!commerceEnabled) {
                        return;
                      } else if (cartItems.length === 0) {
                        router.push('/products');
                      } else {
                        router.push('/checkout');
                      }
                    }}
                    className="block w-full text-center btn-pop bg-cedar text-white border-4 border-charcoal px-8 py-5 rounded-[24px] font-black text-lg uppercase tracking-widest no-underline disabled:opacity-50"
                  >
                    {commerceEnabled ? 'Checkout' : 'Ordering Paused'}
                  </button>
                  {!commerceEnabled && (
                    <p role="status" className="text-sm font-bold text-charcoal/60">
                      Online ordering is not available yet.
                    </p>
                  )}
                  <Link 
                    href="/products"
                    className="block text-center btn-pop bg-white text-charcoal border-4 border-charcoal px-8 py-5 rounded-[24px] font-black text-lg uppercase tracking-widest no-underline"
                  >
                    Continue Shopping
                  </Link>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-20 bg-white border-4 border-charcoal rounded-[48px] shadow-[12px_12px_0px_0px_#3A322B]">
              <div className="inline-flex items-center justify-center w-24 h-24 bg-cream border-4 border-charcoal rounded-[32px] mb-8">
                <iconify-icon icon="ph:shopping-bag-open-bold" class="text-5xl text-cedar"></iconify-icon>
              </div>
              <h2 className="font-display text-4xl font-black mb-4">Your bag is empty</h2>
              <p className="text-lg font-bold text-charcoal/50 mb-10 max-w-sm mx-auto">
                Looks like you haven&apos;t added any treasures to your collection yet.
              </p>
              <Link 
                href="/products"
                className="btn-pop bg-maple text-charcoal border-4 border-charcoal px-10 py-4 rounded-3xl font-black text-lg uppercase tracking-widest no-underline inline-block"
              >
                Start Shopping
              </Link>
            </div>
          )}
        </div>
      </section>
    </>
  );
}
