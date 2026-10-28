import { Link, useNavigate } from "@tanstack/react-router";
import { ShoppingCart, Store, User as UserIcon, LogOut } from "lucide-react";
import { useStore } from "@/lib/store";
import { supabase } from "@/integrations/supabase/client";
import { clearDevOtpSession } from "@/lib/dev-otp";
import { Button } from "@/components/ui/button";

export function SiteHeader() {
  const { currency, setCurrency, cart, user } = useStore();
  const navigate = useNavigate();
  const count = cart.reduce((s, i) => s + i.quantity, 0);

  return (
    <header className="sticky top-0 z-30 border-b bg-background/95 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-6xl items-center gap-2 px-4">
        <Link to="/" className="font-display text-lg font-bold tracking-tight whitespace-nowrap">
          FUDAYDIYE <span className="text-info">ONLINE</span>
        </Link>
        <div className="ml-auto flex items-center gap-1">
          <div className="flex rounded-full border bg-card p-0.5 text-xs font-semibold" role="group" aria-label="Currency">
            {(["USD", "SLSH"] as const).map((c) => (
              <button
                key={c}
                onClick={() => setCurrency(c)}
                className={`rounded-full px-2.5 py-1 transition-colors ${currency === c ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}
              >
                {c === "USD" ? "$ USD" : "SLSh"}
              </button>
            ))}
          </div>
          <Button variant="ghost" size="icon" asChild aria-label="Merchant portal">
            <Link to="/merchant"><Store /></Link>
          </Button>
          {user ? (
            <>
              <Button variant="ghost" size="icon" asChild aria-label="My orders">
                <Link to="/orders"><UserIcon /></Link>
              </Button>
              <Button
                variant="ghost"
                size="icon"
                aria-label="Sign out"
                onClick={async () => {
                  clearDevOtpSession();
                  await supabase.auth.signOut();
                  navigate({ to: "/", replace: true });
                }}
              >
                <LogOut />
              </Button>
            </>
          ) : (
            <Button variant="ghost" size="sm" asChild>
              <Link to="/auth" search={{ redirect: undefined }}>Sign in</Link>
            </Button>
          )}
          <Button variant="ghost" size="icon" asChild aria-label="Cart" className="relative">
            <Link to="/cart">
              <ShoppingCart />
              {count > 0 && (
                <span className="absolute -right-0.5 -top-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-success px-1 text-[10px] font-bold text-success-foreground">
                  {count}
                </span>
              )}
            </Link>
          </Button>
        </div>
      </div>
    </header>
  );
}
