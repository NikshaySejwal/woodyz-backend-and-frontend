import Link from 'next/link';
import { useCart } from '../context/CartContext';
import { formatCurrency } from '../lib/currency';
import { resolveAssetUrl } from '../lib/api';

const Bestsellers = ({ products = [], catalogError }) => {
  const { addToCart } = useCart();

  return (
    <section className="py-24 bg-charcoal text-white relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 relative z-10">
        <div className="flex flex-col md:flex-row items-center justify-between gap-12 mb-20">
          <div className="max-w-xl text-center md:text-left">
            <h2 className="font-display text-6xl font-black tracking-tighter mb-6">Explore WOODYZ Toys</h2>
            <p className="text-xl text-white/70 font-medium mb-8">
              Browse the products currently available in our catalog.
            </p>
            <Link href="/products" className="px-8 py-3 bg-white text-charcoal rounded-full font-black text-sm uppercase btn-pop no-underline inline-block">
              Shop All Products
            </Link>
          </div>
        </div>

        {products.length ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {products.slice(0, 4).map((product) => (
              <div key={product.id} className="group product-card-hover">
                <Link href={`/products/${product.id}`} className="block text-white no-underline">
                  <div className="relative aspect-square bg-cream rounded-[40px] border-4 border-charcoal mb-6 overflow-hidden p-8">
                    {product.imageUrl ? (
                      <img
                        src={resolveAssetUrl(product.imageUrl)}
                        alt={product.name}
                        className="w-full h-full object-contain transform group-hover:scale-110 transition-transform duration-500 mix-blend-multiply"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-charcoal/40">
                        Image unavailable
                      </div>
                    )}
                  </div>
                  <h3 className="text-lg font-black mb-1">{product.name}</h3>
                  <p className="text-lg font-black text-maple">{formatCurrency(product.price)}</p>
                </Link>
                <button
                  type="button"
                  onClick={() => addToCart(product)}
                  className="mt-4 w-full bg-cedar text-white border-2 border-white/30 py-3 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-cedar/90 transition-colors"
                >
                  Add to Cart
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p role="status" className="text-center text-lg font-bold text-white/70">
            {catalogError
              ? 'The catalog is temporarily unavailable. Please try again later.'
              : 'There are no products in the catalog yet.'}
          </p>
        )}
      </div>

      <div className="absolute bottom-0 left-0 w-full overflow-hidden leading-none z-0">
        <svg className="relative block w-[200%] h-32 text-cream fill-current" viewBox="0 0 1200 120" preserveAspectRatio="none">
          <path d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V120H0V95.8C57.85,111.45,163.63,115.35,321.39,56.44Z"></path>
        </svg>
      </div>
    </section>
  );
};

export default Bestsellers;
