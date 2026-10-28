import type { User } from "@supabase/supabase-js";

/** Fixed code for the local dev server only. Never accepted in a production build. */
export const DEV_OTP_CODE = "123456";

const TEST_PHONE = /^\+25263\d{7}$/;
const STORAGE_KEY = "hm_dev_otp_user";
export const DEV_OTP_EVENT = "hm-dev-otp";

export type DevOtpUser = {
  id: string;
  phone: string;
  fullName: string;
};

export function isLocalTestPhone(e164: string) {
  return TEST_PHONE.test(e164);
}

export function isSmsProviderError(message: string) {
  return /unsupported phone provider|phone provider|sms provider/i.test(message);
}

/** True only while `vite dev` is running, and only for +25263XXXXXXX. */
export function canUseDevOtp(e164: string) {
  return import.meta.env.DEV && isLocalTestPhone(e164);
}

export function toDevUser(dev: DevOtpUser): User {
  return {
    id: dev.id,
    phone: dev.phone,
    aud: "authenticated",
    role: "authenticated",
    app_metadata: { provider: "phone", dev_otp: true },
    user_metadata: { full_name: dev.fullName, dev_otp: true },
    created_at: new Date(0).toISOString(),
  } as User;
}

export function setDevOtpSession(input: { phone: string; fullName: string }) {
  const user: DevOtpUser = {
    id: "00000000-0000-4000-8000-000000000001",
    phone: input.phone,
    fullName: input.fullName,
  };
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(user));
  window.dispatchEvent(new Event(DEV_OTP_EVENT));
}

export function clearDevOtpSession() {
  sessionStorage.removeItem(STORAGE_KEY);
  window.dispatchEvent(new Event(DEV_OTP_EVENT));
}

export function readDevOtpSession(): DevOtpUser | null {
  if (!import.meta.env.DEV || typeof sessionStorage === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as DevOtpUser;
    if (!parsed?.phone || !isLocalTestPhone(parsed.phone) || !parsed.id) return null;
    return parsed;
  } catch {
    return null;
  }
}
