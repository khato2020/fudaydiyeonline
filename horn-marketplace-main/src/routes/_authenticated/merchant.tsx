import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Loader2, MapPin, Phone } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { CATEGORIES, CITIES, slshToUsd, usdToSlsh } from "@/lib/currency";
import { nextStatus, STATUS_LABEL, STATUSES, type OrderStatus } from "@/lib/order-status";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const Route = createFileRoute("/_authenticated/merchant")({
  head: () => ({
    meta: [
      { title: "Merchant portal — HornMarketplace" },
      { name: "description", content: "List products and manage your order queue." },
      { property: "og:title", content: "Merchant portal — HornMarketplace" },
      { property: "og:description", content: "List products and manage your order queue." },
    ],
  }),
  component: MerchantPortal,
});

function MerchantPortal() {
  const { user } = Route.useRouteContext();
  const { data: merchant, isLoading } = useQuery({
    queryKey: ["my-merchant", user.id],
    queryFn: async () => {
      const { data, error } = await supabase.from("merchants").select("*").eq("owner_id", user.id).maybeSingle();
      if (error) throw error;
      return data;
    },
  });
  if (isLoading) return <p className="py-10 text-muted-foreground">Loading…</p>;
  if (!merchant) return <CreateShop userId={user.id} />;

  return (
    <div className="py-5">
      <h1 className="font-display text-2xl font-bold">{merchant.shop_name}</h1>
      <p className="text-sm text-muted-foreground">{merchant.location}</p>
      <Tabs defaultValue="orders" className="mt-4">
        <TabsList className="grid w-full grid-cols-2 sm:w-80">
          <TabsTrigger value="orders">Orders</TabsTrigger>
          <TabsTrigger value="products">Products</TabsTrigger>
        </TabsList>
        <TabsContent value="orders"><OrderQueue merchantId={merchant.id} /></TabsContent>
        <TabsContent value="products"><Products merchantId={merchant.id} userId={user.id} /></TabsContent>
      </Tabs>
    </div>
  );
}

function CreateShop({ userId }: { userId: string }) {
  const qc = useQueryClient();
  const [name, setName] = useState("");
  const [wa, setWa] = useState("");
  const [loc, setLoc] = useState<string>(CITIES[0]);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.from("merchants").insert({ owner_id: userId, shop_name: name, whatsapp: wa.replace(/\D/g, ""), location: loc });
    if (error) { toast.error(error.message); return; }
    qc.invalidateQueries({ queryKey: ["my-merchant"] });
  };
  return (
    <form onSubmit={submit} className="mx-auto grid max-w-sm gap-3 py-10">
      <h1 className="font-display text-2xl font-bold">Open your shop</h1>
      <div className="grid gap-1.5"><Label>Shop name</Label><Input required value={name} onChange={(e) => setName(e.target.value)} /></div>
      <div className="grid gap-1.5"><Label>WhatsApp number (with country code)</Label><Input required type="tel" placeholder="25263..." value={wa} onChange={(e) => setWa(e.target.value)} /></div>
      <div className="grid gap-1.5"><Label>City</Label>
        <select className="h-9 rounded-md border bg-card px-3 text-sm" value={loc} onChange={(e) => setLoc(e.target.value)}>
          {CITIES.map((c) => <option key={c}>{c}</option>)}
        </select>
      </div>
      <Button type="submit" className="h-11">Create shop</Button>
    </form>
  );
}

function OrderQueue({ merchantId }: { merchantId: string }) {
  const qc = useQueryClient();
  const [filter, setFilter] = useState<OrderStatus>("new");
  const { data } = useQuery({
    queryKey: ["merchant-orders", merchantId],
    queryFn: async () => {
      const { data, error } = await supabase.from("orders").select("*, order_items(title, quantity)").eq("merchant_id", merchantId).order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
  const advance = async (id: string, s: OrderStatus) => {
    const n = nextStatus(s);
    if (!n) return;
    const { error } = await supabase.from("orders").update({ status: n }).eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success(`Marked ${STATUS_LABEL[n]}`);
    qc.invalidateQueries({ queryKey: ["merchant-orders"] });
  };
  const list = data?.filter((o) => o.status === filter) ?? [];
  return (
    <div className="mt-3">
      <div className="flex gap-2 overflow-x-auto pb-1">
        {STATUSES.map((s) => (
          <button key={s} onClick={() => setFilter(s)} className={`shrink-0 rounded-full border px-3 py-1.5 text-sm font-medium ${filter === s ? "border-primary bg-primary text-primary-foreground" : "bg-card"}`}>
            {STATUS_LABEL[s]} ({data?.filter((o) => o.status === s).length ?? 0})
          </button>
        ))}
      </div>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        {list.map((o) => {
          const n = nextStatus(o.status);
          return (
            <div key={o.id} className="rounded-xl border bg-card p-4">
              <div className="flex justify-between text-sm">
                <span className="font-semibold">#{o.id.slice(0, 6)}</span>
                <span className="font-display font-bold">${Number(o.total_usd).toFixed(2)}</span>
              </div>
              <p className="mt-1 text-sm">{o.order_items.map((i) => `${i.quantity}× ${i.title}`).join(", ")}</p>
              <p className="mt-2 flex items-center gap-1 text-xs text-muted-foreground"><MapPin className="size-3" />{o.delivery_city}{o.delivery_landmark ? ` — ${o.delivery_landmark}` : ""}</p>
              {o.delivery_lat && (
                <a className="text-xs text-info" target="_blank" rel="noreferrer" href={`https://maps.google.com/?q=${o.delivery_lat},${o.delivery_lng}`}>Open GPS pin</a>
              )}
              <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground"><Phone className="size-3" />{o.buyer_phone} · paid via {o.payment_method}</p>
              {n && <Button variant="checkout" size="sm" className="mt-3 w-full" onClick={() => advance(o.id, o.status)}>Mark {STATUS_LABEL[n]}</Button>}
            </div>
          );
        })}
      </div>
      {list.length === 0 && <p className="py-10 text-center text-sm text-muted-foreground">No orders here.</p>}
    </div>
  );
}

function Products({ merchantId, userId }: { merchantId: string; userId: string }) {
  const qc = useQueryClient();
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [usd, setUsd] = useState("");
  const [slsh, setSlsh] = useState("");
  const [stock, setStock] = useState("");
  const [category, setCategory] = useState<string>(CATEGORIES[0]);
  const [files, setFiles] = useState<File[]>([]);
  const [busy, setBusy] = useState(false);

  const { data } = useQuery({
    queryKey: ["merchant-products", merchantId],
    queryFn: async () => {
      const { data, error } = await supabase.from("products").select("*").eq("merchant_id", merchantId).order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const photos: string[] = [];
    for (const f of files.slice(0, 4)) {
      const path = `${userId}/${Date.now()}-${f.name.replace(/[^\w.]/g, "_")}`;
      const { error } = await supabase.storage.from("product-images").upload(path, f);
      if (error) { setBusy(false); { toast.error(error.message); return; } }
      const { data: s } = await supabase.storage.from("product-images").createSignedUrl(path, 60 * 60 * 24 * 365 * 10);
      if (s) photos.push(s.signedUrl);
    }
    const { error } = await supabase.from("products").insert({
      merchant_id: merchantId, title, description: desc, category,
      price_usd: Number(usd), price_slsh: Number(slsh), stock: Number(stock), photos,
    });
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Product listed");
    setTitle(""); setDesc(""); setUsd(""); setSlsh(""); setStock(""); setFiles([]);
    qc.invalidateQueries({ queryKey: ["merchant-products"] });
    qc.invalidateQueries({ queryKey: ["products"] });
  };

  return (
    <div className="mt-3 grid gap-6 md:grid-cols-2">
      <form onSubmit={submit} className="grid h-fit gap-3 rounded-xl border bg-card p-4">
        <h2 className="font-semibold">Add product</h2>
        <div className="grid gap-1.5"><Label>Title</Label><Input required value={title} onChange={(e) => setTitle(e.target.value)} /></div>
        <div className="grid gap-1.5"><Label>Description</Label><Textarea value={desc} onChange={(e) => setDesc(e.target.value)} /></div>
        <div className="grid grid-cols-2 gap-2">
          <div className="grid gap-1.5"><Label>Price (USD)</Label>
            <Input required inputMode="decimal" value={usd} onChange={(e) => { const v = e.target.value.replace(/[^\d.]/g, ""); setUsd(v); setSlsh(v ? String(usdToSlsh(Number(v))) : ""); }} />
          </div>
          <div className="grid gap-1.5"><Label>Price (SLSh)</Label>
            <Input required inputMode="numeric" value={slsh} onChange={(e) => { const v = e.target.value.replace(/\D/g, ""); setSlsh(v); setUsd(v ? String(slshToUsd(Number(v))) : ""); }} />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div className="grid gap-1.5"><Label>Stock</Label><Input required inputMode="numeric" value={stock} onChange={(e) => setStock(e.target.value.replace(/\D/g, ""))} /></div>
          <div className="grid gap-1.5"><Label>Category</Label>
            <select className="h-9 rounded-md border bg-card px-3 text-sm" value={category} onChange={(e) => setCategory(e.target.value)}>
              {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
            </select>
          </div>
        </div>
        <div className="grid gap-1.5"><Label>Photos (up to 4)</Label>
          <Input type="file" accept="image/*" multiple onChange={(e) => setFiles(Array.from(e.target.files ?? []))} />
        </div>
        <Button type="submit" variant="checkout" className="h-11" disabled={busy}>{busy && <Loader2 className="animate-spin" />} List product</Button>
      </form>
      <div className="grid h-fit gap-2">
        {data?.map((p) => (
          <div key={p.id} className="flex items-center gap-3 rounded-xl border bg-card p-2">
            <div className="size-14 shrink-0 overflow-hidden rounded-lg bg-muted">{p.photos[0] && <img src={p.photos[0]} alt="" loading="lazy" className="h-full w-full object-cover" />}</div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold">{p.title}</p>
              <p className="text-xs text-muted-foreground">${Number(p.price_usd).toFixed(2)} · {Number(p.price_slsh).toLocaleString()} SLSh · {p.stock} in stock</p>
            </div>
          </div>
        ))}
        {data?.length === 0 && <p className="text-sm text-muted-foreground">No products yet.</p>}
      </div>
    </div>
  );
}
