import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Search, MapPin } from "lucide-react";
import { productsQuery } from "@/lib/queries";
import { CATEGORIES, CITIES, formatPrice, SLSH_PER_USD } from "@/lib/currency";
import { useStore } from "@/lib/store";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "HornMarketplace — Shop local in Somaliland" },
      { name: "description", content: "Browse retail and wholesale products from merchants in Hargeisa, Berbera, Burao and Tog Wajaale. Pay with Zaad, eDahab or Sahal." },
      { property: "og:title", content: "HornMarketplace — Shop local in Somaliland" },
      { property: "og:description", content: "Retail & wholesale from local merchants. Pay with mobile money." },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(productsQuery()),
  component: Catalog,
});

function Catalog() {
  const { data: products } = useSuspenseQuery(productsQuery());
  const { currency } = useStore();
  const [q, setQ] = useState("");
  const [category, setCategory] = useState("All");
  const [city, setCity] = useState("All");
  const [minPrice, setMinPrice] = useState("");

  const filtered = useMemo(() => {
    const min = Number(minPrice);
    const minUsd = min ? (currency === "USD" ? min : min / SLSH_PER_USD) : 0;
    return products.filter(
      (p) =>
        (!q || p.title.toLowerCase().includes(q.toLowerCase())) &&
        (category === "All" || p.category === category) &&
        (city === "All" || p.merchants?.location === city) &&
        Number(p.price_usd) >= minUsd,
    );
  }, [products, q, category, city, minPrice, currency]);

  const chip = (active: boolean) =>
    `shrink-0 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors ${active ? "border-primary bg-primary text-primary-foreground" : "bg-card text-foreground"}`;

  return (
    <div className="py-5">
      <h1 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">Shop local merchants</h1>
      <p className="mt-1 text-sm text-muted-foreground">1 USD = {SLSH_PER_USD.toLocaleString()} SLSh</p>

      <div className="mt-4 flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search products" className="h-11 bg-card pl-9" />
        </div>
        <Input
          value={minPrice}
          onChange={(e) => setMinPrice(e.target.value.replace(/\D/g, ""))}
          inputMode="numeric"
          placeholder={`Min ${currency === "USD" ? "$" : "SLSh"}`}
          className="h-11 w-28 bg-card"
          aria-label="Minimum price"
        />
      </div>

      <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
        {["All", ...CATEGORIES].map((c) => (
          <button key={c} className={chip(category === c)} onClick={() => setCategory(c)}>{c}</button>
        ))}
      </div>
      <div className="mt-2 flex gap-2 overflow-x-auto pb-1">
        {["All", ...CITIES].map((c) => (
          <button key={c} className={chip(city === c)} onClick={() => setCity(c)}>
            {c === "All" ? "All cities" : c}
          </button>
        ))}
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {filtered.map((p) => (
          <Link key={p.id} to="/product/$id" params={{ id: p.id }} className="group overflow-hidden rounded-xl border bg-card">
            <div className="aspect-square bg-muted">
              {p.photos[0] && <img src={p.photos[0]} alt={p.title} loading="lazy" decoding="async" className="h-full w-full object-cover" />}
            </div>
            <div className="p-3">
              <p className="line-clamp-2 text-sm font-semibold leading-snug">{p.title}</p>
              <p className="mt-1 font-display text-base font-bold">{formatPrice(Number(p.price_usd), currency)}</p>
              <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                <MapPin className="size-3" /> {p.merchants?.location}
              </p>
            </div>
          </Link>
        ))}
      </div>
      {filtered.length === 0 && <p className="py-16 text-center text-muted-foreground">No products match your filters.</p>}
    </div>
  );
}
