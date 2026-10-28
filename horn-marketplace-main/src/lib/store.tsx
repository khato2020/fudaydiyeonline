import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { DEV_OTP_EVENT, readDevOtpSession, toDevUser } from "@/lib/dev-otp";
import type { Currency } from "./currency";

export type CartItem = {
  productId: string;
  merchantId: string;
  title: string;
  priceUsd: number;
  photo?: string | undefined;
  quantity: number;
  stock: number;
};

type Store = {
  currency: Currency;
  setCurrency: (c: Currency) => void;
  cart: CartItem[];
  addToCart: (item: CartItem) => void;
  updateQty: (productId: string, qty: number) => void;
  clearCart: () => void;
  user: User | null;
};

const Ctx = createContext<Store | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [currency, setCurrencyState] = useState<Currency>("USD");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [authUser, setAuthUser] = useState<User | null>(null);
  const [devUser, setDevUser] = useState<User | null>(null);

  useEffect(() => {
    const c = localStorage.getItem("hm_currency") as Currency | null;
    if (c) setCurrencyState(c);
    try {
      setCart(JSON.parse(localStorage.getItem("hm_cart") || "[]"));
    } catch {}
    const applyDev = () => {
      const dev = readDevOtpSession();
      setDevUser(dev ? toDevUser(dev) : null);
    };
    applyDev();
    supabase.auth.getUser().then(({ data }) => setAuthUser(data.user));
    const { data } = supabase.auth.onAuthStateChange((_e, session) => setAuthUser(session?.user ?? null));
    window.addEventListener(DEV_OTP_EVENT, applyDev);
    return () => {
      data.subscription.unsubscribe();
      window.removeEventListener(DEV_OTP_EVENT, applyDev);
    };
  }, []);

  const persist = (next: CartItem[]) => {
    setCart(next);
    localStorage.setItem("hm_cart", JSON.stringify(next));
  };

  const value: Store = {
    currency,
    setCurrency: (c) => {
      setCurrencyState(c);
      localStorage.setItem("hm_currency", c);
    },
    cart,
    addToCart: (item) => {
      const existing = cart.find((i) => i.productId === item.productId);
      if (existing) {
        persist(cart.map((i) => (i.productId === item.productId ? { ...i, quantity: Math.min(i.quantity + item.quantity, i.stock) } : i)));
      } else persist([...cart, item]);
    },
    updateQty: (id, qty) =>
      persist(qty <= 0 ? cart.filter((i) => i.productId !== id) : cart.map((i) => (i.productId === id ? { ...i, quantity: Math.min(qty, i.stock) } : i))),
    clearCart: () => persist([]),
    user: authUser ?? devUser,
  };
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useStore() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useStore outside provider");
  return v;
}
