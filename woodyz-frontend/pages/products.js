import { useState, useMemo } from 'react';
import axios from 'axios';
import Link from 'next/link';
import Head from 'next/head';
import Seo from '../components/Seo';
import { resolveAssetUrl } from '../lib/api';

export default function Products({ products }) {
  const [selectedCategory, setSelectedCategory] = useState('All');
  
  const categories = useMemo(() => {
    const cats = ['All', ...new Set(products.map(p => p.category).filter(Boolean))];
    return cats;
  }, [products]);

  const filteredProducts = useMemo(() => {
    if (selectedCategory === 'All') return products;
    return products.filter(p => p.category === selectedCategory);
  }, [products, selectedCategory]);

  return (
    <>
      <Seo
        title="Wooden Toys & Products | WOODYZ"
        description="Browse the WOODYZ collection of wooden blocks, puzzles, pull toys, train sets, and other handcrafted products."
        path="/products"
      />
      <Head>
        <title>Shop All | WOODYZ</title>
        <meta name="description" content="Browse our complete collection of sustainable, handcrafted wooden toys — building sets, puzzles, pull toys, and more." />
      </Head>

      <section className="py-16 px-3 sm:px-6">
        <div className="max-w-7xl mx-auto">
          {/* Page Header */}
          <div className="text-center mb-16">
            <div className="flex items-center justify-center gap-4 mb-4 opacity-50">
              <iconify-icon icon="ph:storefront-bold"></iconify-icon>
              <span className="text-xs font-black uppercase tracking-[0.4em]">Our Full Collection</span>
              <iconify-icon icon="ph:storefront-bold"></iconify-icon>
            </div>
            <h1 className="font-display text-5xl md:text-7xl font-black text-3d mb-6">Product Catalog</h1>
            <p className="text-xl text-charcoal/60 font-medium max-w-2xl mx-auto mb-12">
              Every piece is handcrafted from sustainable wood, finished with non-toxic dyes, and designed to spark joy.
            </p>

            {/* Filter Chips */}
            <div className="flex flex-wrap justify-center gap-3">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest transition-all border-3 border-charcoal ${
                    selectedCategory === cat 
                      ? 'bg-cedar text-white shadow-[4px_4px_0px_0px_#3A322B] -translate-y-1' 
                      : 'bg-white text-charcoal hover:bg-cream'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Product Grid */}
          {filteredProducts && filteredProducts.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
              {filteredProducts.map((product) => (
                <Link
                  key={product.id}
                  href={`/products/${product.id}`}
                  className="group block no-underline text-charcoal"
                >
                  <div className="relative aspect-square bg-white rounded-[40px] border-4 border-charcoal mb-6 overflow-hidden p-2 sm:p-4 btn-pop">
                    <div className="w-full h-full bg-cream rounded-[28px] flex items-center justify-center overflow-hidden">
                      {product.imageUrl ? (
                        <img 
                          src={resolveAssetUrl(product.imageUrl)} 
                          alt={`WOODYZ ${product.name}`} 
                          className="w-full h-full object-cover transition-transform group-hover:scale-110"
                        />
                      ) : (
                        <iconify-icon icon="ph:cube-bold" class="text-6xl text-cedar/30"></iconify-icon>
                      )}
                    </div>
                  </div>
                  <div className="px-2">
                    <h3 className="font-display text-xl font-black mb-1 group-hover:text-cedar transition-colors">{product.name}</h3>
                    <p className="text-sm font-bold text-charcoal/50 mb-2 line-clamp-2">{product.description}</p>
                    <div className="flex items-center justify-between">
                      <p className="text-lg font-black text-cedar">${product.price.toFixed(2)}</p>
                      {product.category && (
                        <span className="text-[10px] font-black uppercase tracking-widest text-charcoal/30">{product.category}</span>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-20">
              <div className="inline-flex items-center justify-center w-24 h-24 bg-white border-4 border-charcoal rounded-[32px] mb-8 shadow-[8px_8px_0px_0px_#3A322B]">
                <iconify-icon icon="ph:package-bold" class="text-5xl text-cedar"></iconify-icon>
              </div>
              <h3 className="font-display text-3xl font-black mb-4">No Products Found</h3>
              <p className="text-lg font-bold text-charcoal/50 mb-8 max-w-md mx-auto">
                {selectedCategory !== 'All' 
                  ? `We don't have any treasures in "${selectedCategory}" right now.` 
                  : "Our artisans are busy crafting new treasures. Check back soon!"}
              </p>
              <button 
                onClick={() => setSelectedCategory('All')}
                className="btn-pop bg-maple text-charcoal border-2 border-charcoal px-10 py-4 rounded-3xl font-black text-lg inline-block"
              >
                Clear Filters
              </button>
            </div>
          )}
        </div>
      </section>
    </>
  );
}

export async function getServerSideProps() {
  // Use internal Docker hostname when running in container, fallback to localhost for dev
  const backendUrl = process.env.BACKEND_URL || 'http://localhost:8080';
  try {
    const response = await axios.get(`${backendUrl}/api/products`);
    return {
      props: {
        products: response.data || [],
      },
    };
  } catch (error) {
    console.error("Error fetching products in getServerSideProps:", error.message);
    return {
      props: {
        products: []
      }
    }
  }
}
