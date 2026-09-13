import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { CheckCircle2, AlertCircle, Loader2, ArrowRight, RefreshCw } from "lucide-react";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";

const API_BASE = import.meta.env.VITE_API_URL || "";

type VerificationStatus = "verifying" | "success" | "error" | "no_token";

export default function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");

  const [status, setStatus] = useState<VerificationStatus>(() =>
    token ? "verifying" : "no_token"
  );
  const [message, setMessage] = useState(() =>
    token ? "" : "No verification token found. Please check your link or request a new one below."
  );
  const [resendEmail, setResendEmail] = useState("");
  const [resending, setResending] = useState(false);
  const [resendMessage, setResendMessage] = useState("");
  const [resendError, setResendError] = useState("");

  useEffect(() => {
    if (!token) {
      return;
    }

    let isMounted = true;

    async function doVerify() {
      try {
        const response = await fetch(`${API_BASE}/api/auth/verify-email?token=${encodeURIComponent(token!)}`, {
          method: "GET",
          headers: { "Content-Type": "application/json" }
        });

        const data = await response.json().catch(() => ({}));

        if (!isMounted) return;

        if (response.ok && data.ok) {
          setStatus("success");
          setMessage(data.message || "Your email has been verified successfully!");
        } else {
          setStatus("error");
          setMessage(data.message || "Invalid or expired verification link. Please request a new one.");
          if (data.email) {
            setResendEmail(data.email);
          }
        }
      } catch {
        if (!isMounted) return;
        setStatus("error");
        setMessage("Unable to reach the server. Please check your internet connection and try again.");
      }
    }

    doVerify();

    return () => {
      isMounted = false;
    };
  }, [token]);

  const handleResend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resendEmail.trim()) {
      setResendError("Please enter your email address.");
      return;
    }

    setResending(true);
    setResendError("");
    setResendMessage("");

    try {
      const response = await fetch(`${API_BASE}/api/auth/resend-verification`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: resendEmail.trim() })
      });

      const data = await response.json().catch(() => ({}));

      if (response.ok && data.ok) {
        setResendMessage(data.message || "A new verification link has been sent to your email.");
      } else {
        setResendError(data.message || "Failed to resend verification email. Please try again.");
      }
    } catch {
      setResendError("Unable to reach the server. Please try again later.");
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="flex min-h-screen w-full flex-col items-center justify-center bg-neutral-50 px-6 py-12">
      {/* Brand Header */}
      <div className="mb-8 flex items-center gap-2">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-500 text-xl font-bold text-white shadow-sm">
          ✦
        </div>
        <span className="text-2xl font-bold tracking-tight text-neutral-900">
          Event<span className="text-red-500">ly</span>
        </span>
      </div>

      {/* Main Card */}
      <div className="w-full max-w-md rounded-2xl border border-neutral-200/80 bg-white p-8 shadow-sm transition-all sm:p-10">
        {/* Loading State */}
        {status === "verifying" && (
          <div className="flex flex-col items-center text-center">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-50 text-red-500">
              <Loader2 className="h-7 w-7 animate-spin" />
            </div>
            <h1 className="text-xl font-semibold text-neutral-900">Verifying your email</h1>
            <p className="mt-2 text-sm text-neutral-500">
              Please wait a moment while we verify your credentials...
            </p>
          </div>
        )}

        {/* Success State */}
        {status === "success" && (
          <div className="flex flex-col items-center text-center">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
              <CheckCircle2 className="h-8 w-8" />
            </div>
            <h1 className="text-2xl font-bold text-neutral-900">Email Verified!</h1>
            <p className="mt-2.5 text-sm leading-relaxed text-neutral-600">
              {message}
            </p>
            <div className="mt-8 w-full">
              <Link to="/login">
                <Button fullWidth className="flex items-center justify-center gap-2">
                  <span>Sign in to Evently</span>
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        )}

        {/* Error or No Token State */}
        {(status === "error" || status === "no_token") && (
          <div className="flex flex-col items-center text-center">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-50 text-red-500">
              <AlertCircle className="h-8 w-8" />
            </div>
            <h1 className="text-2xl font-bold text-neutral-900">
              {status === "no_token" ? "Verification Link Missing" : "Verification Failed"}
            </h1>
            <p className="mt-2.5 text-sm leading-relaxed text-neutral-600">
              {message}
            </p>

            {/* Resend Form */}
            <div className="mt-6 w-full text-left">
              <div className="rounded-xl border border-neutral-200 bg-neutral-50/50 p-4">
                <h2 className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
                  Resend Verification Email
                </h2>
                <p className="mt-1 text-xs text-neutral-500">
                  Enter your email address and we'll send you a fresh link.
                </p>

                <form onSubmit={handleResend} className="mt-3.5 space-y-3">
                  <Input
                    id="resendEmail"
                    name="resendEmail"
                    label="Email Address"
                    type="email"
                    placeholder="Enter your email"
                    value={resendEmail}
                    onChange={(e) => {
                      setResendEmail(e.target.value);
                      setResendError("");
                      setResendMessage("");
                    }}
                  />

                  {resendMessage && (
                    <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3">
                      <p className="text-xs font-medium text-emerald-700">{resendMessage}</p>
                    </div>
                  )}

                  {resendError && (
                    <div className="rounded-lg border border-red-200 bg-red-50 p-3">
                      <p className="text-xs text-red-600">{resendError}</p>
                    </div>
                  )}

                  <Button type="submit" fullWidth disabled={resending} variant="secondary" className="flex items-center justify-center gap-2">
                    {resending ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Sending...</span>
                      </>
                    ) : (
                      <>
                        <RefreshCw className="h-4 w-4" />
                        <span>Send New Link</span>
                      </>
                    )}
                  </Button>
                </form>
              </div>
            </div>

            <div className="mt-6 text-center text-xs text-neutral-500">
              <Link to="/login" className="font-medium text-red-500 transition hover:text-red-600 hover:underline">
                Back to Sign in
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* Footer support note */}
      <p className="mt-8 text-center text-xs text-neutral-400">
        Need help? Contact support or try signing up again from the{" "}
        <Link to="/signup" className="text-neutral-600 hover:underline">
          signup page
        </Link>
        .
      </p>
    </div>
  );
}
