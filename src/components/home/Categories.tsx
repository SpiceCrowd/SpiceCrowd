const categories = [
  { title: "Whole Spices", icon: "🌰" },
  { title: "Spice Powders", icon: "🟡" },
  { title: "Blends & Masala", icon: "🌶️" },
  { title: "Herbs", icon: "🌿" },
  { title: "Seeds", icon: "🫘" },
  { title: "Dry Fruits", icon: "🥭" },
  { title: "Gift Packs", icon: "🎁" },
];

export default function Categories() {
  return (
    <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl">
        <h2 className="text-3xl font-extrabold tracking-[-0.04em] text-slate-900 sm:text-4xl">Shop by Category</h2>
      </div>

      <div className="mt-8 grid gap-5 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-7">
        {categories.map((category) => (
          <div key={category.title} className="flex flex-col items-center rounded-full bg-slate-100 p-4 text-center transition hover:-translate-y-0.5 hover:bg-slate-200">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-white text-3xl shadow-sm">{category.icon}</div>
            <h3 className="mt-3 text-sm font-semibold text-slate-800">{category.title}</h3>
          </div>
        ))}
      </div>
    </section>
  );
}
