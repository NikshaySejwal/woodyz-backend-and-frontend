const AnnouncementBar = () => {
  const items = [
    { icon: 'ph:horse-bold', iconColor: 'text-maple', text: 'Wooden Toys' },
    { icon: 'ph:sparkle-fill', iconColor: 'text-sage', text: 'Made for Curious Play' },
    { icon: 'ph:house-line-bold', iconColor: 'text-orange', text: 'Explore WOODYZ' },
  ];

  // Double the items for infinite scroll effect
  const doubledItems = [...items, ...items];

  return (
    <div className="bg-charcoal text-white py-2 overflow-hidden border-b-2 border-charcoal relative z-50">
      <div className="safety-bar-animation flex gap-16 whitespace-nowrap">
        {doubledItems.map((item, index) => (
          <div key={index} className="flex items-center gap-2 px-4">
            <iconify-icon icon={item.icon} class={item.iconColor}></iconify-icon>
            <span className="text-[10px] font-black tracking-widest uppercase">{item.text}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AnnouncementBar;
