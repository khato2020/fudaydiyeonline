import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { canUseDevOtp, DEV_OTP_CODE, isSmsProviderError, setDevOtpSession } from "@/lib/dev-otp";
import { maskPhone, toE164 } from "@/lib/phone";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";

const safe = (r?: string) => (r && r.startsWith("/") && !r.startsWith("//") ? r : "/");

export const Route = createFileRoute("/auth")({
  validateSearch: (s: Record<string, unknown>) => ({ redirect: typeof s["redirect"] === "string" ? s["redirect"] : undefined }),
  head: () => ({
    meta: [
      { title: "Sign in — HornMarketplace" },
      { name: "description", content: "Sign in with your phone number. We'll send a one-time code." },
      { property: "og:title", content: "Sign in — HornMarketplace" },
      { property: "og:description", content: "Sign in with your phone number. We'll send a one-time code." },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const { redirect } = Route.useSearch();
  const navigate = useNavigate();
  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [e164, setE164] = useState("");
  const [otp, setOtp] = useState("");
  const [busy, setBusy] = useState(false);
  const [mock, setMock] = useState(false);

  const sendCode = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const normalized = toE164(phone);
    if (!normalized) {
      toast.error("Enter a valid Somaliland number, e.g. +252 63 …");
      return;
    }
    setBusy(true);
    const { error } = await supabase.auth.signInWithOtp({
      phone: normalized,
      options: {
        channel: "sms",
        shouldCreateUser: true,
        data: name.trim() ? { full_name: name.trim() } : {},
      },
    });
    setBusy(false);
    if (error) {
      if (canUseDevOtp(normalized) && isSmsProviderError(error.message)) {
        setE164(normalized);
        setMock(true);
        setOtp("");
        setStep("otp");
        toast.message(`SMS is not configured. Local test code: ${DEV_OTP_CODE}`);
        return;
      }
      toast.error(error.message);
      return;
    }
    setMock(false);
    setE164(normalized);
    setOtp("");
    setStep("otp");
    toast.success("We sent a 6-digit code by SMS.");
  };

  const verifyCode = async (token: string) => {
    if (token.length !== 6 || busy) return;
    if (mock) {
      if (token !== DEV_OTP_CODE) {
        toast.error(`Local test code is ${DEV_OTP_CODE}`);
        return;
      }
      setDevOtpSession({ phone: e164, fullName: name.trim() });
      navigate({ to: safe(redirect) });
      return;
    }
    setBusy(true);
    const { data, error } = await supabase.auth.verifyOtp({ phone: e164, token, type: "sms" });
    if (error) {
      setBusy(false);
      toast.error(error.message);
      return;
    }
    const userId = data.user?.id;
    if (userId && (name.trim() || e164)) {
      await supabase.from("profiles").upsert({
        id: userId,
        full_name: name.trim() || null,
        phone: e164,
      });
    }
    setBusy(false);
    navigate({ to: safe(redirect) });
  };

  const google = async () => {
    if (redirect) sessionStorage.setItem("hm_after_login", safe(redirect));
    const r = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin });
    if (r.error) {
      toast.error("Google sign-in failed");
      return;
    }
    if (r.redirected) return;
    navigate({ to: safe(redirect) });
  };

  return (
    <div className="mx-auto max-w-sm py-10">
      <h1 className="font-display text-2xl font-bold">{step === "phone" ? "Sign in with your phone" : "Enter the code"}</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        {step === "phone"
          ? "We'll text you a one-time code. No password needed."
          : mock
            ? `Local test mode for ${maskPhone(e164)}. Use code ${DEV_OTP_CODE}.`
            : `Code sent to ${maskPhone(e164)}`}
      </p>

      {step === "phone" ? (
        <form onSubmit={sendCode} className="mt-6 grid gap-3">
          <div className="grid gap-1.5">
            <Label htmlFor="full-name">Full name</Label>
            <Input id="full-name" autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Optional" />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="phone">Phone number</Label>
            <Input
              id="phone"
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              required
              placeholder="+252 63 …"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              aria-label="Phone number"
            />
          </div>
          <Button type="submit" className="h-11" disabled={busy}>{busy ? "Sending…" : "Send code"}</Button>
        </form>
      ) : (
        <form
          className="mt-6 grid gap-4"
          onSubmit={(e) => {
            e.preventDefault();
            void verifyCode(otp);
          }}
        >
          <div className="grid gap-1.5">
            <Label htmlFor="otp">6-digit code</Label>
            <InputOTP
              id="otp"
              maxLength={6}
              value={otp}
              onChange={(value) => {
                const next = value.replace(/\D/g, "");
                setOtp(next);
                if (next.length === 6) void verifyCode(next);
              }}
              disabled={busy}
              autoFocus
            >
              <InputOTPGroup>
                {Array.from({ length: 6 }, (_, i) => (
                  <InputOTPSlot key={i} index={i} className="h-11 w-11 text-base" />
                ))}
              </InputOTPGroup>
            </InputOTP>
          </div>
          <Button type="submit" className="h-11" disabled={busy || otp.length !== 6}>
            {busy ? "Verifying…" : "Verify and sign in"}
          </Button>
          <div className="flex justify-between text-sm">
            <button type="button" className="text-info" disabled={busy} onClick={() => sendCode()}>
              Resend code
            </button>
            <button
              type="button"
              className="text-muted-foreground"
              disabled={busy}
              onClick={() => {
                setStep("phone");
                setMock(false);
                setOtp("");
              }}
            >
              Change number
            </button>
          </div>
        </form>
      )}

      {step === "phone" && (
        <Button variant="outline" className="mt-3 h-11 w-full" onClick={google}>
          Continue with Google
        </Button>
      )}
    </div>
  );
}
