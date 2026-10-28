import { createFileRoute, Link, notFound, useNavigate } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useState } from "react";
import { MapPin, MessageCircle, Minus, Plus, Store } from "lucide-react";
import { toast } from "sonner";
import { productQuery } from "@/lib/queries";
import { formatPrice } from "@/lib/currency";
import { useStore } from "@/lib/store";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/product/$id")({
  loader: async ({ context, params }) => {
    const p = await context.queryClient.ensureQueryData(productQuery(params.id));
    if (!p) throw notFound();
    return { title: p.title, description: p.description };
  },
  head: ({ loaderData }) => ({
    meta: [
      { title: loaderData ? `${loaderData.title} — HornMarketplace` : "Product — HornMarketplace" },
      { name: "description", content: loaderData?.description ?? "Product on HornMarketplace" },
      { property: "og:title", content: loaderData?.title ?? "Product" },
      { property: "og:description", content: loaderData?.description ?? "Product on HornMarketplace" },
    ],
  }),
  component: ProductPage,
});

function ProductPage() {
  const { id } = Route.useParams();
  const { data: p } = useSuspenseQuery(productQuery(id));
  const { currency, addToCart } = useStore();
  const [qty, setQty] = useState(1);
  const navigate = useNavigate();
  if (!p) return null;
  const m = p.merchants;
  const inStock = p.stock > 0;
  const waText = encodeURIComponent(`Hello ${m?.shop_name}, I'm interested in a bulk order of "${p.title}". What's your wholesale price?`);

  const add = (goToCart: boolean) => {
    addToCart({ productId: p.id, merchantId: p.merchant_id, title: p.title, priceUsd: Number(p.price_usd), photo: p.photos[0], quantity: qty, stock: p.stock });
    toast.success("Added to cart");
    if (goToCart) navigate({ to: "/cart" });
  };

  return (
    <div className="grid gap-6 py-5 md:grid-cols-2">
      <div className="aspect-square overflow-hidden rounded-xl border bg-muted">
        {p.photos[0] && <img src={p.photos[0]} alt={p.title} className="h-full w-full object-cover" />}
      </div>
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-info">{p.category}</p>
        <h1 className="mt-1 font-display text-2xl font-bold">{p.title}</h1>
        <p className="mt-2 font-display text-3xl font-bold">{formatPrice(Number(p.price_usd), currency)}</p>
        <p className="text-sm text-muted-foreground">{formatPrice(Number(p.price_usd), currency === "USD" ? "SLSH" : "USD")}</p>
        <p className={`mt-3 text-sm font-semibold ${inStock ? "text-success" : "text-destructive"}`}>
          {inStock ? `${p.stock} in stock` : "Out of stock"}
        </p>
        {p.description && <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{p.description}</p>}

        {inStock && (
          <div className="mt-5 flex items-center gap-3">
            <div className="flex items-center rounded-lg border bg-card">
              <Button variant="ghost" size="icon" onClick={() => setQty(Math.max(1, qty - 1))} aria-label="Less"><Minus /></Button>
              <span className="w-8 text-center font-semibold">{qty}</span>
              <Button variant="ghost" size="icon" onClick={() => setQty(Math.min(p.stock, qty + 1))} aria-label="More"><Plus /></Button>
            </div>
            <Button variant="outline" className="h-11 flex-1" onClick={() => add(false)}>Add to cart</Button>
          </div>
        )}
        <div className="mt-3 grid gap-2">
          {inStock && <Button variant="checkout" className="h-12 text-base" onClick={() => add(true)}>Buy now</Button>}
          {m && (
            <Button variant="whatsapp" className="h-12 text-base" asChild>
              <a href={`https://wa.me/${m.whatsapp}?text=${waText}`} target="_blank" rel="noreferrer">
                <MessageCircle /> Chat on WhatsApp (bulk)
              </a>
            </Button>
          )}
        </div>

        {m && (
          <div className="mt-6 rounded-xl border bg-card p-4">
            <p className="flex items-center gap-2 font-semibold"><Store className="size-4" /> {m.shop_name}</p>
            <p className="mt-1 flex items-center gap-2 text-sm text-muted-foreground"><MapPin className="size-4" /> {m.location}</p>
          </div>
        )}
        <Link to="/" className="mt-4 inline-block text-sm text-info">← Back to catalog</Link>
      </div>
    </div>
  );
}
