"use client";

import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

export function VerifyEmailForm() {
  const searchParams = useSearchParams();
  const email = searchParams.get("email") || "";
  const tokenFromUrl = searchParams.get("token") || "";
  const callbackUrl = searchParams.get("callbackUrl") || "/login";
  const [token, setToken] = useState(tokenFromUrl);
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [resendStatus, setResendStatus] = useState<"idle" | "loading" | "sent" | "error">("idle");
  const [error, setError] = useState("");
  const [resendError, setResendError] = useState("");
  const [devCode, setDevCode] = useState("");

  async function verifyCode(code: string) {
    if (!email || !code) return;

    setStatus("loading");
    setError("");

    try {
      const res = await fetch("/api/auth/verify-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, token: code.trim() }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Verification failed");
      setStatus("success");
    } catch (err) {
      setStatus("error");
      setError(err instanceof Error ? err.message : "Something went wrong");
    }
  }

  const autoVerifyStarted = useRef(false);

  useEffect(() => {
    if (autoVerifyStarted.current || !tokenFromUrl || !email) return;
    autoVerifyStarted.current = true;
    void verifyCode(tokenFromUrl);
  }, [tokenFromUrl, email]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    await verifyCode(token);
  }

  async function handleResend() {
    if (!email) {
      setResendError("Enter your email address using the registration link.");
      setResendStatus("error");
      return;
    }

    setResendStatus("loading");
    setResendError("");

    try {
      const res = await fetch("/api/auth/resend-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Could not resend code");

      setResendStatus("sent");
      if (json.devVerificationCode) {
        setDevCode(json.devVerificationCode);
        setToken(json.devVerificationCode);
      }
    } catch (err) {
      setResendStatus("error");
      setResendError(err instanceof Error ? err.message : "Could not resend code");
    }
  }

  if (status === "success") {
    const loginHref = `/login?callbackUrl=${encodeURIComponent(callbackUrl)}${
      email ? `&email=${encodeURIComponent(email)}` : ""
    }`;
    return (
      <div className="text-center space-y-4">
        <p className="font-display text-xl font-bold text-explore-forest">Email verified!</p>
        <p className="text-sm text-explore-charcoal/70">Your account is active. You can now sign in.</p>
        <Button href={loginHref} variant="secondary">Sign In</Button>
      </div>
    );
  }

  if (status === "loading" && tokenFromUrl) {
    return (
      <div className="text-center space-y-3">
        <p className="text-sm text-explore-charcoal/70">Verifying your email…</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <p className="text-sm text-explore-charcoal/70">
        We sent a verification code to <strong>{email || "your email"}</strong>. Enter it below.
      </p>
      <Input
        name="token"
        label="Verification Code"
        required
        placeholder="Enter 12-character code from email"
        value={token}
        onChange={(e) => setToken(e.target.value.toUpperCase())}
      />
      {error && <p className="text-sm text-red-600">{error}</p>}
      {devCode && (
        <p className="rounded-lg border border-explore-teal/20 bg-explore-teal/5 px-3 py-2 text-sm text-explore-charcoal">
          Dev mode: verification code is <strong>{devCode}</strong>
        </p>
      )}
      <Button type="submit" size="lg" disabled={status === "loading"} className="w-full">
        {status === "loading" ? "Verifying..." : "Verify Email"}
      </Button>
      <div className="rounded-lg border border-explore-charcoal/10 bg-explore-sand/40 px-4 py-3 text-sm text-explore-charcoal/70">
        <p>Didn&apos;t receive the code? Check spam, or resend it.</p>
        <button
          type="button"
          onClick={handleResend}
          disabled={resendStatus === "loading"}
          className="mt-2 font-medium text-explore-teal hover:underline disabled:opacity-50"
        >
          {resendStatus === "loading" ? "Sending..." : "Resend verification code"}
        </button>
        {resendStatus === "sent" && (
          <p className="mt-2 text-explore-forest">If your email is registered, a new code has been sent.</p>
        )}
        {resendError && <p className="mt-2 text-red-600">{resendError}</p>}
      </div>
    </form>
  );
}
