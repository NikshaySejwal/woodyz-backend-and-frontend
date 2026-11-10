import Link from 'next/link';

const TrustSection = () => (
  <section id="story" className="py-24 bg-cream">
    <div className="max-w-4xl mx-auto px-6 text-center">
      <div className="inline-flex items-center justify-center w-20 h-20 bg-white border-4 border-charcoal rounded-[28px] mb-8 shadow-[6px_6px_0px_0px_#3A322B]">
        <iconify-icon icon="ph:info-bold" class="text-4xl text-cedar"></iconify-icon>
      </div>
      <h2 className="font-display text-4xl md:text-5xl font-black text-3d mb-6">
        Questions before you order?
      </h2>
      <p className="text-lg font-bold text-charcoal/60 max-w-2xl mx-auto mb-8">
        Product specifications and order policies are still being finalized. Please contact WOODYZ to confirm details before placing an order.
      </p>
      <a
        href="mailto:hello@woodyz.in"
        className="btn-pop inline-flex bg-white text-charcoal border-2 border-charcoal px-8 py-4 rounded-3xl font-black no-underline"
      >
        Contact WOODYZ
      </a>
      <div className="mt-6">
        <Link href="/manufacturing" className="font-black text-cedar underline">
          Looking for custom manufacturing?
        </Link>
      </div>
    </div>
  </section>
);

export default TrustSection;
