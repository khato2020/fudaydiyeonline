import { createFileRoute, Link } from "@tanstack/react-router";
import { Minus, Plus } from "lucide-react";
import { useStore } from "@/lib/store";
import { formatPrice } from "@/lib/currency";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/cart")({
  head: () => ({
    meta: [
      { title: "Your cart — HornMarketplace" },
      { name: "description", content: "Review items before checkout." },
      { property: "og:title", content: "Your cart — HornMarketplace" },
      { property: "og:description", content: "Review items before checkout." },
    ],
  }),
  component: CartPage,
});

function CartPage() {
  const { cart, updateQty, currency } = useStore();
  const total = cart.reduce((s, i) => s + i.priceUsd * i.quantity, 0);

  if (cart.length === 0)
    return (
      <div className="py-20 text-center">
        <p className="text-muted-foreground">Your cart is empty.</p>
        <Button asChild className="mt-4"><Link to="/">Browse products</Link></Button>
      </div>
    );

  return (
    <div className="mx-auto max-w-xl py-5">
      <h1 className="font-display text-2xl font-bold">Cart</h1>
      <div className="mt-4 divide-y rounded-xl border bg-card">
        {cart.map((i) => (
          <div key={i.productId} className="flex items-center gap-3 p-3">
            <div className="size-16 shrink-0 overflow-hidden rounded-lg bg-muted">
              {i.photo && <img src={i.photo} alt="" loading="lazy" className="h-full w-full object-cover" />}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold">{i.title}</p>
              <p className="text-sm text-muted-foreground">{formatPrice(i.priceUsd, currency)}</p>
            </div>
            <div className="flex items-center rounded-lg border">
              <Button variant="ghost" size="icon" onClick={() => updateQty(i.productId, i.quantity - 1)} aria-label="Less"><Minus /></Button>
              <span className="w-6 text-center text-sm font-semibold">{i.quantity}</span>
              <Button variant="ghost" size="icon" onClick={() => updateQty(i.productId, i.quantity + 1)} aria-label="More"><Plus /></Button>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-4 flex items-center justify-between text-lg font-bold">
        <span>Total</span>
        <span className="font-display">{formatPrice(total, currency)}</span>
      </div>
      <Button variant="checkout" className="mt-4 h-12 w-full text-base" asChild>
        <Link to="/checkout">Proceed to checkout</Link>
      </Button>
    </div>
  );
}
