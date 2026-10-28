import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useStore } from "@/lib/store";
import { formatPrice } from "@/lib/currency";
import { STATUS_LABEL, STATUSES } from "@/lib/order-status";

export const Route = createFileRoute("/_authenticated/orders")({
  head: () => ({
    meta: [
      { title: "My orders — HornMarketplace" },
      { name: "description", content: "Track your orders." },
      { property: "og:title", content: "My orders — HornMarketplace" },
      { property: "og:description", content: "Track your orders." },
    ],
  }),
  component: Orders,
});

function Orders() {
  const { user } = Route.useRouteContext();
  const { currency } = useStore();
  const { data, isLoading } = useQuery({
    queryKey: ["my-orders", user.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders").select("*, merchants(shop_name), order_items(title, quantity)")
        .eq("buyer_id", user.id).order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  return (
    <div className="mx-auto max-w-xl py-5">
      <h1 className="font-display text-2xl font-bold">My orders</h1>
      {isLoading && <p className="mt-4 text-muted-foreground">Loading…</p>}
      {data?.length === 0 && <p className="mt-4 text-muted-foreground">No orders yet.</p>}
      <div className="mt-4 grid gap-3">
        {data?.map((o) => {
          const step = STATUSES.indexOf(o.status);
          return (
            <div key={o.id} className="rounded-xl border bg-card p-4">
              <div className="flex justify-between">
                <p className="font-semibold">{o.merchants?.shop_name}</p>
                <p className="font-display font-bold">{formatPrice(Number(o.total_usd), currency)}</p>
              </div>
              <p className="text-xs text-muted-foreground">{new Date(o.created_at).toLocaleString()} · {o.payment_method}</p>
              <p className="mt-1 text-sm">{o.order_items.map((i) => `${i.quantity}× ${i.title}`).join(", ")}</p>
              <div className="mt-3 grid grid-cols-4 gap-1">
                {STATUSES.map((s, i) => (
                  <div key={s}>
                    <div className={`h-1.5 rounded-full ${i <= step ? "bg-success" : "bg-muted"}`} />
                    <p className={`mt-1 text-[10px] ${i === step ? "font-bold" : "text-muted-foreground"}`}>{STATUS_LABEL[s]}</p>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
