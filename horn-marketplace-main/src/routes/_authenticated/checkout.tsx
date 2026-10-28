import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Crosshair, Loader2, CheckCircle2, Smartphone } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useStore } from "@/lib/store";
import { CITIES, formatPrice, PAYMENT_METHODS } from "@/lib/currency";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

export const Route = createFileRoute("/_authenticated/checkout")({
  head: () => ({
    meta: [
      { title: "Checkout — HornMarketplace" },
      { name: "description", content: "Choose delivery and pay with Zaad, eDahab or Sahal." },
      { property: "og:title", content: "Checkout — HornMarketplace" },
      { property: "og:description", content: "Choose delivery and pay with mobile money." },
    ],
  }),
  component: Checkout,
});

type Stage = "idle" | "prompt" | "processing" | "done";

function Checkout() {
  const { cart, currency, clearCart } = useStore();
  const { user } = Route.useRouteContext();
  const navigate = useNavigate();
  const [city, setCity] = useState<string>(CITIES[0]);
  const [landmark, setLandmark] = useState("");
  const [gps, setGps] = useState<{ lat: number; lng: number } | null>(null);
  const [locating, setLocating] = useState(false);
  const [method, setMethod] = useState<string>(PAYMENT_METHODS[0]);
  const [phone, setPhone] = useState("");
  const [pin, setPin] = useState("");
  const [stage, setStage] = useState<Stage>("idle");
  const total = cart.reduce((s, i) => s + i.priceUsd * i.quantity, 0);

  if (cart.length === 0 && stage !== "done")
    return <div className="py-20 text-center text-muted-foreground">Cart is empty. <Link to="/" className="text-info">Shop now</Link></div>;

  const locate = () => {
    if (!navigator.geolocation) { toast.error("GPS not available on this device"); return; }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => { setGps({ lat: pos.coords.latitude, lng: pos.coords.longitude }); setLocating(false); },
      () => { toast.error("Couldn't get your location. Add a landmark instead."); setLocating(false); },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  };

  const start = () => {
    if (!gps && landmark.trim().length < 3) { toast.error("Set a GPS pin or describe a landmark"); return; }
    if (phone.replace(/\D/g, "").length < 7) { toast.error("Enter your mobile money number"); return; }
    setPin("");
    setStage("prompt");
  };

  const pay = async () => {
    if (pin.length !== 4) { toast.error("Enter your 4-digit PIN"); return; }
    setStage("processing");
    await new Promise((r) => setTimeout(r, 1800));
    const { data: addr, error: aErr } = await supabase
      .from("addresses")
      .insert({ user_id: user.id, city, landmark, lat: (gps?.lat ?? null), lng: (gps?.lng ?? null) })
      .select("id").single();
    if (aErr) { setStage("idle"); { toast.error(aErr.message); return; } }
    const byMerchant = new Map<string, typeof cart>();
    cart.forEach((i) => byMerchant.set(i.merchantId, [...(byMerchant.get(i.merchantId) ?? []), i]));
    for (const [merchantId, items] of byMerchant) {
      const { data: order, error } = await supabase.from("orders").insert({
        buyer_id: user.id, merchant_id: merchantId, address_id: addr.id,
        delivery_city: city, delivery_landmark: landmark, delivery_lat: (gps?.lat ?? null), delivery_lng: (gps?.lng ?? null),
        buyer_phone: phone, payment_method: method,
        total_usd: items.reduce((s, i) => s + i.priceUsd * i.quantity, 0),
      }).select("id").single();
      if (error) { setStage("idle"); { toast.error(error.message); return; } }
      const { error: iErr } = await supabase.from("order_items").insert(
        items.map((i) => ({ order_id: order.id, product_id: i.productId, title: i.title, quantity: i.quantity, unit_price_usd: i.priceUsd })),
      );
      if (iErr) { setStage("idle"); { toast.error(iErr.message); return; } }
    }
    clearCart();
    setStage("done");
  };

  return (
    <div className="mx-auto max-w-xl py-5">
      <h1 className="font-display text-2xl font-bold">Checkout</h1>

      <section className="mt-5 rounded-xl border bg-card p-4">
        <h2 className="font-semibold">Delivery location</h2>
        <div className="mt-3 flex flex-wrap gap-2">
          {CITIES.map((c) => (
            <button key={c} onClick={() => setCity(c)} className={`rounded-full border px-3 py-1.5 text-sm font-medium ${city === c ? "border-primary bg-primary text-primary-foreground" : ""}`}>{c}</button>
          ))}
        </div>
        <Button variant="info" className="mt-3 w-full" onClick={locate} disabled={locating}>
          {locating ? <Loader2 className="animate-spin" /> : <Crosshair />} {gps ? "Update GPS pin" : "Use my GPS location"}
        </Button>
        {gps && (
          <a className="mt-2 block text-xs text-info" href={`https://maps.google.com/?q=${gps.lat},${gps.lng}`} target="_blank" rel="noreferrer">
            📍 Pin set: {gps.lat.toFixed(5)}, {gps.lng.toFixed(5)} — view on map
          </a>
        )}
        <div className="mt-3 grid gap-1.5">
          <Label>Landmark / address note</Label>
          <Textarea value={landmark} onChange={(e) => setLandmark(e.target.value)} placeholder="e.g. Near Maansoor Hotel, blue gate opposite the mosque" />
        </div>
      </section>

      <section className="mt-4 rounded-xl border bg-card p-4">
        <h2 className="font-semibold">Pay with mobile money</h2>
        <div className="mt-3 grid grid-cols-3 gap-2">
          {PAYMENT_METHODS.map((m) => (
            <button key={m} onClick={() => setMethod(m)} className={`rounded-lg border-2 py-3 text-sm font-bold ${method === m ? "border-success bg-success/10" : "border-border"}`}>{m}</button>
          ))}
        </div>
        <div className="mt-3 grid gap-1.5">
          <Label>{method} number</Label>
          <Input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="063 xxx xxxx" />
        </div>
      </section>

      <div className="mt-4 flex items-center justify-between text-lg font-bold">
        <span>Total</span><span className="font-display">{formatPrice(total, currency)}</span>
      </div>
      <Button variant="checkout" className="mt-3 h-12 w-full text-base" onClick={start}>Pay {formatPrice(total, currency)}</Button>
      <p className="mt-2 text-center text-xs text-muted-foreground">Demo mode: payment is simulated, no money is charged.</p>

      <Dialog open={stage !== "idle"} onOpenChange={(o) => { if (!o && stage === "prompt") setStage("idle"); }}>
        <DialogContent className="max-w-xs">
          {stage === "prompt" && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2"><Smartphone className="size-5" /> {method}</DialogTitle>
                <DialogDescription>
                  Confirm payment of {formatPrice(total, "USD")} ({formatPrice(total, "SLSH")}) to HornMarketplace from {phone}.
                </DialogDescription>
              </DialogHeader>
              <Input autoFocus type="password" inputMode="numeric" maxLength={4} value={pin} onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))} placeholder="Enter PIN" className="h-12 text-center text-xl tracking-[0.5em]" />
              <Button variant="checkout" className="h-11" onClick={pay}>Confirm</Button>
            </>
          )}
          {stage === "processing" && (
            <div className="grid place-items-center gap-3 py-6">
              <Loader2 className="size-10 animate-spin text-success" />
              <p className="text-sm">Processing {method} payment…</p>
            </div>
          )}
          {stage === "done" && (
            <div className="grid place-items-center gap-3 py-4 text-center">
              <CheckCircle2 className="size-12 text-success" />
              <DialogTitle>Payment received</DialogTitle>
              <p className="text-sm text-muted-foreground">Your order was sent to the merchant.</p>
              <Button className="w-full" onClick={() => navigate({ to: "/orders" })}>View my orders</Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
