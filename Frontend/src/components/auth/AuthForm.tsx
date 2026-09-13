import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Mail, AlertCircle, RefreshCw } from "lucide-react";

import eventImage from "../../assets/event.png";

import Button from "../ui/Button";
import Input from "../ui/Input";
import { setAuthUser } from "../../utils/apiClient";



interface AuthFormProps {
  type: "login" | "signup";
}

interface FormData {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}

function AuthForm({ type }: AuthFormProps) {
  const isLogin = type === "login";
  const navigate = useNavigate();

  const [formData, setFormData] = useState<FormData>({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [emailNotVerified, setEmailNotVerified] = useState<string | null>(null);
  const [signupCompletedEmail, setSignupCompletedEmail] = useState<string | null>(null);
  const [resendingEmail, setResendingEmail] = useState(false);
  const [resendStatus, setResendStatus] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));

    setError("");
    setSuccess("");
    setEmailNotVerified(null);
    setResendStatus(null);
  };

  const handleResendVerification = async (targetEmail: string) => {
    if (!targetEmail) return;
    setResendingEmail(true);
    setResendStatus(null);
    setError("");

    try {
      const apiBase = import.meta.env.VITE_API_URL || "";
      const response = await fetch(`${apiBase}/api/auth/resend-verification`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: targetEmail.trim() }),
      });

      const data = await response.json().catch(() => ({}));

      if (response.ok && data.ok) {
        setResendStatus(data.message || "A new verification link has been sent to your email!");
      } else {
        setError(data.message || "Failed to resend verification email.");
      }
    } catch {
      setError("Unable to reach the server. Please try again.");
    } finally {
      setResendingEmail(false);
    }
  };

  const validateForm = (): boolean => {
    if (!isLogin && !formData.name.trim()) {
      setError("Please enter your full name.");
      return false;
    }

    if (!formData.email.trim()) {
      setError("Please enter your email.");
      return false;
    }

    if (!formData.password) {
      setError("Please enter your password.");
      return false;
    }

    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters.");
      return false;
    }

    if (!isLogin && !formData.confirmPassword) {
      setError("Please confirm your password.");
      return false;
    }

    if (!isLogin && formData.password !== formData.confirmPassword) {
      setError("Passwords do not match.");
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const isValid = validateForm();

    if (!isValid) {
      return;
    }

    setIsSubmitting(true);
    setError("");
    setSuccess("");
    setEmailNotVerified(null);
    setResendStatus(null);

    try {
      const apiBase = import.meta.env.VITE_API_URL || "";
      const endpoint = `${apiBase}${isLogin ? "/api/auth/login" : "/api/auth/register"}`;
      const payload = isLogin
        ? { email: formData.email, password: formData.password }
        : { name: formData.name, email: formData.email, password: formData.password };

      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        if (data.code === "EMAIL_NOT_VERIFIED") {
          setEmailNotVerified(data.email || formData.email);
          setError(data.message || "Please verify your email before logging in.");
          return;
        }

        const errorMsg =
          data.message ||
          (Array.isArray(data.errors) && data.errors[0]?.msg) ||
          "Something went wrong. Please try again.";
        throw new Error(errorMsg);
      }

      if (isLogin) {
        setAuthUser(data.user);
        setSuccess("Signed in successfully! Redirecting...");

        setTimeout(() => {
          navigate("/");
        }, 500);
      } else {
        setFormData({ name: "", email: "", password: "", confirmPassword: "" });
        if (data.requiresVerification) {
          setSignupCompletedEmail(data.email || formData.email);
        } else {
          setSuccess("Account created successfully! Redirecting to sign in...");
          setTimeout(() => {
            navigate("/login");
          }, 1200);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to reach the server.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen w-full bg-neutral-50">
     
      <div className="flex min-h-screen w-full items-center justify-center bg-neutral-50 px-6 py-10 sm:px-10 lg:w-1/2 lg:px-16">
        <div className="w-full max-w-[430px]">

          {/* Logo */}

          <div className="mb-12 flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-red-500 text-lg font-bold text-white">
              ✦
            </div>

            <span className="text-xl font-bold tracking-tight text-neutral-900">
              Event<span className="text-red-500">ly</span>
            </span>
          </div>

          {signupCompletedEmail ? (
            /* Signup Verification Screen */
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-50 text-red-500">
                <Mail className="h-7 w-7" />
              </div>
              <h1 className="text-2xl font-bold text-neutral-900">Check Your Email</h1>
              <p className="mt-2 text-sm leading-relaxed text-neutral-600">
                We've sent a verification link to <strong className="text-neutral-900">{signupCompletedEmail}</strong>. Please check your inbox and click the link to activate your account.
              </p>

              {resendStatus && (
                <div className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-left">
                  <p className="text-xs font-medium text-emerald-700">{resendStatus}</p>
                </div>
              )}

              {error && (
                <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-left">
                  <p className="text-xs text-red-600">{error}</p>
                </div>
              )}

              <div className="mt-8 flex flex-col gap-3">
                <Link to="/login">
                  <Button fullWidth>Proceed to Sign In</Button>
                </Link>

                <button
                  type="button"
                  disabled={resendingEmail}
                  onClick={() => handleResendVerification(signupCompletedEmail)}
                  className="flex items-center justify-center gap-1.5 text-xs font-medium text-neutral-500 transition hover:text-red-500 disabled:opacity-50"
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${resendingEmail ? "animate-spin" : ""}`} />
                  <span>{resendingEmail ? "Resending..." : "Didn't receive the email? Resend"}</span>
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Heading */}
              <div className="mb-8">
                <h1 className="text-3xl font-semibold tracking-wide text-neutral-950">
                  {isLogin ? "WELCOME BACK" : "CREATE ACCOUNT"}
                </h1>

                <p className="mt-2 text-sm leading-6 text-neutral-500">
                  {isLogin
                    ? "Welcome back! Please enter your details."
                    : "Create your account and start planning amazing events."}
                </p>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} noValidate>
                {!isLogin && (
                  <Input
                    id="name"
                    name="name"
                    label="Full Name"
                    type="text"
                    placeholder="Enter your full name"
                    value={formData.name}
                    onChange={handleChange}
                  />
                )}

                <Input
                  id="email"
                  name="email"
                  label="Email"
                  type="email"
                  placeholder="Enter your email"
                  value={formData.email}
                  onChange={handleChange}
                />

                <Input
                  id="password"
                  name="password"
                  label="Password"
                  type="password"
                  placeholder="Enter your password"
                  value={formData.password}
                  onChange={handleChange}
                />

                {!isLogin && (
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    label="Confirm Password"
                    type="password"
                    placeholder="Confirm your password"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                  />
                )}

                {/* Login options */}
                {isLogin && (
                  <div className="mb-5 flex items-center justify-between text-xs">
                    <label className="flex cursor-pointer items-center gap-2 text-neutral-700">
                      <input
                        type="checkbox"
                        className="h-3.5 w-3.5 cursor-pointer accent-red-500"
                      />
                      <span>Remember me</span>
                    </label>

                    <button
                      type="button"
                      className="text-neutral-700 transition hover:text-red-500"
                    >
                      Forgot password?
                    </button>
                  </div>
                )}

                {/* Email Verification Required Alert */}
                {emailNotVerified && (
                  <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 p-3.5 text-left">
                    <div className="flex items-start gap-2.5">
                      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
                      <div className="text-xs text-amber-800">
                        <p className="font-semibold text-amber-900">Email Verification Required</p>
                        <p className="mt-0.5">Please check your inbox to activate your account.</p>
                        <button
                          type="button"
                          disabled={resendingEmail}
                          onClick={() => handleResendVerification(emailNotVerified)}
                          className="mt-2 flex items-center gap-1 font-semibold text-amber-900 underline hover:text-amber-700 disabled:opacity-50"
                        >
                          <RefreshCw className={`h-3 w-3 ${resendingEmail ? "animate-spin" : ""}`} />
                          <span>{resendingEmail ? "Sending new link..." : "Resend verification link"}</span>
                        </button>
                        {resendStatus && (
                          <p className="mt-1.5 font-medium text-emerald-700">{resendStatus}</p>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Success */}
                {success && (
                  <div className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 px-3.5 py-2.5">
                    <p className="text-sm font-medium text-emerald-700">{success}</p>
                  </div>
                )}

                {/* Error */}
                {error && !emailNotVerified && (
                  <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5">
                    <p className="text-sm text-red-600">{error}</p>
                  </div>
                )}

                {/* Submit button */}
                <Button type="submit" fullWidth disabled={isSubmitting}>
                  {isSubmitting ? "Please wait..." : isLogin ? "Sign in" : "Create account"}
                </Button>
              </form>

              {/* Footer */}
              <div className="mt-6 text-center text-xs text-neutral-500">
                {isLogin ? (
                  <p>
                    Don't have an account?{" "}
                    <Link
                      to="/signup"
                      className="font-medium text-red-500 transition hover:text-red-600 hover:underline"
                    >
                      Sign up for free!
                    </Link>
                  </p>
                ) : (
                  <p>
                    Already have an account?{" "}
                    <Link
                      to="/login"
                      className="font-medium text-red-500 transition hover:text-red-600 hover:underline"
                    >
                      Sign in
                    </Link>
                  </p>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      <div className="relative hidden min-h-screen overflow-hidden bg-neutral-100 lg:block lg:w-1/2">
        <img
          src={eventImage}
          alt="Event planning"
          className="absolute inset-0 h-full w-full object-cover object-center"
        />
      </div>
    </div>
  );
}

export default AuthForm;
