import Link from 'next/link';

const categoryStyles = [
  {
    bg: 'bg-[#E8F0E5]',
    hoverColor: 'group-hover:text-sage',
    image: 'https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?auto=format&fit=crop&q=80&w=600',
  },
  {
    bg: 'bg-[#F9F1E6]',
    hoverColor: 'group-hover:text-cedar',
    image: 'https://images.unsplash.com/photo-1545558014-8692077e9b5c?auto=format&fit=crop&q=80&w=600',
  },
  {
    bg: 'bg-[#F2EBFF]',
    hoverColor: 'group-hover:text-purple-600',
    image: 'https://images.unsplash.com/photo-1587654780291-39c9404d746b?auto=format&fit=crop&q=80&w=600',
  },
  {
    bg: 'bg-[#FFF4E5]',
    hoverColor: 'group-hover:text-orange',
    image: 'https://images.unsplash.com/photo-1596461404969-9ae70f2830c1?auto=format&fit=crop&q=80&w=600',
  },
];

const CategoryGrid = ({ categories = [] }) => {
  const categoryCards = categories.map((category, index) => ({
    id: `${category}-${index}`,
    name: category,
    ...categoryStyles[index % categoryStyles.length],
  }));

  return (
    <section id="categories" className="py-24 px-6">
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <div className="text-center mb-16">
          <div className="flex items-center justify-center gap-4 mb-4 opacity-50">
            <iconify-icon icon="ph:leaf-bold"></iconify-icon>
            <span className="text-xs font-black uppercase tracking-[0.4em]">Shop by Category</span>
            <iconify-icon icon="ph:leaf-bold" class="rotate-180"></iconify-icon>
          </div>
          <h2 className="font-display text-5xl md:text-6xl font-black text-3d">Explore Our Collections</h2>
        </div>

        {/* Grid */}
        {categoryCards.length ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {categoryCards.map((cat) => (
              <Link
                key={cat.id}
                href={`/products?category=${encodeURIComponent(cat.name)}`}
                id={`cat-${cat.id}-link`}
                className={`group block p-4 ${cat.bg} border-4 border-charcoal rounded-[40px] btn-pop overflow-hidden no-underline text-charcoal`}
              >
                <div className="aspect-square bg-white border-2 border-charcoal rounded-[32px] mb-6 overflow-hidden">
                  <img
                    src={cat.image}
                    alt={cat.name}
                    className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-500"
                  />
                </div>
                <div className="px-2 pb-2">
                  <h3 className={`font-display text-2xl font-black mb-1 transition-colors ${cat.hoverColor}`}>{cat.name}</h3>
                  <p className="text-sm font-bold opacity-60">Explore this category</p>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <p role="status" className="text-center font-bold text-charcoal/60">
            Product categories will appear here when the catalog is available.
          </p>
        )}
      </div>
    </section>
  );
};

export default CategoryGrid;
