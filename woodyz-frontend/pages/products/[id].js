// pages/products/[id].js
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Head from 'next/head';
import { useCart } from '../../context/CartContext';
import ProductReviews from '../../components/ProductReviews';
import api from '../../lib/api';
import Seo, { siteUrl } from '../../components/Seo';
import { resolveAssetUrl } from '../../lib/api';

export default function ProductDetail() {
  const router = useRouter();
  const { id } = router.query;
  const [product, setProduct] = useState(null);
  const [reviewSummary, setReviewSummary] = useState({ averageRating: 0, reviews: [] });
  const [error, setError] = useState(null);
  const { addToCart } = useCart();

  useEffect(() => {
    if (id) {
      fetchProduct(id);
      fetchReviewSummary(id);
    }
  }, [id]);

  const fetchProduct = async (productId) => {
    try {
      const response = await api.get(`/api/products/${productId}`);
      setProduct(response.data);
    } catch (err) {
      setError("Failed to load product");
    }
  };

  const fetchReviewSummary = async (productId) => {
    try {
      const response = await api.get(`/api/reviews/product/${productId}/summary`);
      setReviewSummary(response.data);
    } catch (err) {
      console.error("Failed to fetch review summary", err);
    }
  };

  if (error) {
    return (
      <section className="py-24 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center justify-center w-24 h-24 bg-white border-4 border-charcoal rounded-[32px] mb-8 shadow-[8px_8px_0px_0px_#3A322B]">
            <iconify-icon icon="ph:warning-bold" class="text-5xl text-orange"></iconify-icon>
          </div>
          <h2 className="font-display text-4xl font-black mb-4">{error}</h2>
          <p className="text-lg font-bold text-charcoal/50 mb-8">The product you&apos;re looking for could not be loaded.</p>
          <Link href="/products" className="btn-pop bg-maple text-charcoal border-2 border-charcoal px-10 py-4 rounded-3xl font-black text-lg no-underline inline-block">
            Back to Catalog
          </Link>
        </div>
      </section>
    );
  }

  if (!product) {
    return (
      <section className="py-24 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-cream border-4 border-charcoal rounded-full mb-6 animate-pulse">
            <iconify-icon icon="ph:horse-bold" class="text-4xl text-cedar"></iconify-icon>
          </div>
          <p className="font-display text-2xl font-black text-charcoal/40">Loading...</p>
        </div>
      </section>
    );
  }

  return (
    <>
      <Seo
        title={`${product.name} | WOODYZ`}
        description={product.description}
        path={`/products/${product.id}`}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'Product',
            name: product.name,
            description: product.description,
            image: product.imageUrl ? [resolveAssetUrl(product.imageUrl)] : undefined,
            category: product.category || undefined,
            brand: { '@type': 'Brand', name: 'WOODYZ' },
            offers: {
              '@type': 'Offer',
              priceCurrency: 'USD',
              price: product.price,
              url: `${siteUrl}/products/${product.id}`,
            },
          }),
        }}
      />
      <Head>
        <title>{product.name} | WOODYZ</title>
      </Head>

      <section className="py-16 px-6">
        <div className="max-w-6xl mx-auto">
          {/* Breadcrumb */}
          <nav className="mb-10 flex items-center gap-2 text-sm font-bold" aria-label="Breadcrumb">
            <Link href="/" className="text-charcoal/40 hover:text-cedar no-underline transition-colors">Home</Link>
            <iconify-icon icon="ph:caret-right-bold" class="text-charcoal/30"></iconify-icon>
            <Link href="/products" className="text-charcoal/40 hover:text-cedar no-underline transition-colors">Shop</Link>
            <iconify-icon icon="ph:caret-right-bold" class="text-charcoal/30"></iconify-icon>
            <span className="text-charcoal">{product.name}</span>
          </nav>

          <div className="grid lg:grid-cols-2 gap-16 items-start">
            {/* Product Image */}
            <div className="relative">
              <div className="absolute -inset-3 bg-sage rounded-[56px] border-4 border-charcoal rotate-2 -z-10 shadow-[10px_10px_0px_0px_#3A322B]"></div>
              <div className="bg-white rounded-[48px] border-4 border-charcoal p-4 flex items-center justify-center aspect-square overflow-hidden">
                {product.imageUrl ? (
                  <img src={resolveAssetUrl(product.imageUrl)} alt={`WOODYZ ${product.name}`} className="w-full h-full object-cover rounded-[32px]" />
                ) : (
                  <iconify-icon icon="ph:cube-bold" class="text-[120px] text-cedar/20"></iconify-icon>
                )}
              </div>
            </div>

            {/* Product Details */}
            <div className="space-y-8">
              <div>
                <div className="inline-flex items-center gap-2 bg-white border-2 border-charcoal px-4 py-2 rounded-full sticker-badge mb-6">
                  <iconify-icon icon="ph:leaf-fill" class="text-sage text-lg"></iconify-icon>
                  <span className="text-[10px] font-black uppercase tracking-wider">{product.category || 'Sustainably Crafted'}</span>
                </div>
                <h1 className="font-display text-5xl font-black text-3d mb-4">{product.name}</h1>
                <p className="text-3xl font-black text-cedar">${product.price.toFixed(2)}</p>
              </div>

              <p className="text-lg font-medium text-charcoal/70 leading-relaxed">{product.description}</p>

              {/* Star Rating */}
              <div className="flex items-center gap-3">
                <div className="flex text-orange text-lg">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <iconify-icon key={s} icon={s <= Math.round(reviewSummary.averageRating) ? "ph:star-fill" : "ph:star-bold"}></iconify-icon>
                  ))}
                </div>
                <span className="text-sm font-black text-charcoal/50">({reviewSummary.reviews.length} reviews)</span>
              </div>

              {/* Trust Badges */}
              <div className="flex flex-wrap gap-3">
                <div className="flex items-center gap-2 bg-white border-2 border-charcoal px-4 py-2 rounded-2xl">
                  <iconify-icon icon="ph:shield-check-bold" class="text-sage"></iconify-icon>
                  <span className="text-[10px] font-black uppercase tracking-wider">Non-Toxic</span>
                </div>
                <div className="flex items-center gap-2 bg-white border-2 border-charcoal px-4 py-2 rounded-2xl">
                  <iconify-icon icon="ph:tree-evergreen-bold" class="text-sage"></iconify-icon>
                  <span className="text-[10px] font-black uppercase tracking-wider">FSC Wood</span>
                </div>
                <div className="flex items-center gap-2 bg-white border-2 border-charcoal px-4 py-2 rounded-2xl">
                  <iconify-icon icon="ph:baby-bold" class="text-orange"></iconify-icon>
                  <span className="text-[10px] font-black uppercase tracking-wider">Ages 3+</span>
                </div>
              </div>

              {/* Add to Cart */}
              <div className="flex flex-wrap gap-4 pt-4">
                <button 
                  onClick={() => addToCart(product)}
                  className="btn-pop bg-maple text-charcoal border-4 border-charcoal px-12 py-5 rounded-3xl font-black text-xl flex items-center gap-3"
                >
                  <iconify-icon icon="ph:shopping-bag-bold"></iconify-icon>
                  Add to Cart
                </button>
                <button className="btn-pop bg-white text-charcoal border-4 border-charcoal px-6 py-5 rounded-3xl" aria-label="Add to wishlist">
                  <iconify-icon icon="ph:heart-bold" class="text-xl"></iconify-icon>
                </button>
              </div>

              {/* Shipping Info */}
              <div className="bg-cream border-2 border-charcoal/10 rounded-[28px] p-6 space-y-3">
                <div className="flex items-center gap-3">
                  <iconify-icon icon="ph:truck-bold" class="text-xl text-cedar"></iconify-icon>
                  <span className="text-sm font-black">Free shipping on orders over $50</span>
                </div>
                <div className="flex items-center gap-3">
                  <iconify-icon icon="ph:arrow-counter-clockwise-bold" class="text-xl text-cedar"></iconify-icon>
                  <span className="text-sm font-black">30-day hassle-free returns</span>
                </div>
                <div className="flex items-center gap-3">
                  <iconify-icon icon="ph:gift-bold" class="text-xl text-cedar"></iconify-icon>
                  <span className="text-sm font-black">Gift wrapping available</span>
                </div>
              </div>
            </div>
          </div>

          {/* New Reviews Section */}
          <ProductReviews productId={product.id} />
        </div>
      </section>
    </>
  );
}
