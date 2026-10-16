'use client'

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  Building2,
  CalendarDays,
  Lock,
  Mail,
  Shield,
  User,
  Zap,
} from "lucide-react";
import {
  login,
  register,
  requestRegistrationOtp,
  verifyRegistrationOtp,
} from '@/app/api/auth.js';
import logo from '@/app/assets/logo.png';
import { authPageStyles as s } from "@/app/assets/dummyStyles.jsx";

const initialForm = {
  name: "",
  email: "",
  password: "",
  businessName: "",
  emailOtp: "",
};

const DEFAULT_REDIRECT = "/profile";

const OTP_COOLDOWN_SECONDS = 60;

const getSafeRedirect = (value) => {
  if (
    typeof value === "string" &&
    value.startsWith("/") &&
    !value.startsWith("//") &&
    !value.includes("\\")
  ) {
    return value;
  }

  return DEFAULT_REDIRECT;
};

const AuthForm = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpChecking, setOtpChecking] = useState(false);
  const [otpSentTo, setOtpSentTo] = useState("");
  const [otpVerified, setOtpVerified] = useState(false);
  const [message, setMessage] = useState("");
  const [otpCooldown, setOtpCooldown] = useState(0);

  const isRegister = mode === "register";
  const redirectTo = getSafeRedirect(searchParams.get("redirect"));

  useEffect(() => {
    if (otpCooldown <= 0) return undefined;

    const timer = setTimeout(() => {
      setOtpCooldown((prev) => prev - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [otpCooldown]);

  const verifyOtpCode = async (email, code) => {
    setOtpChecking(true);

    try {
      await verifyRegistrationOtp({
        email: email.trim(),
        emailOtp: code,
      });
      setOtpVerified(true);
      setMessage("Email verified successfully");
    } catch (error) {
      setOtpVerified(false);
      setMessage(error.response?.data?.message || "Invalid OTP");
    } finally {
      setOtpChecking(false);
    }
  };

  const handleChange = (event) => {
    const { name, value } = event.target;

    if (name === "emailOtp") {
      const digitsOnly = value.replace(/\D/g, "").slice(0, 6);
      setForm((prev) => ({ ...prev, emailOtp: digitsOnly }));
      if (otpVerified) setOtpVerified(false);

      if (digitsOnly.length === 6 && form.email && !otpChecking) {
        verifyOtpCode(form.email, digitsOnly);
      }

      return;
    }

    if (name === "email") {
      setOtpVerified(false);
      setOtpSentTo("");
      setForm((prev) => ({
        ...prev,
        email: value,
        emailOtp: "",
      }));

      return;
    }

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const sendOtp = async () => {
    if (!form.email) {
      setMessage("Enter your email first");
      return;
    }

    setOtpLoading(true);
    setMessage("");

    try {
      await requestRegistrationOtp(form.email.trim());
      setOtpSentTo(form.email.trim().toLowerCase());
      setOtpVerified(false);
      setOtpCooldown(OTP_COOLDOWN_SECONDS);
      setMessage("Verification code sent to your email");
    } catch (error) {
      setMessage(error.response?.data?.message || "Could not send code");
    } finally {
      setOtpLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;

    if (isRegister && !otpVerified) {
      setMessage("Please verify your email with the code we sent you");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const payload = isRegister
        ? { ...form, email: form.email.trim() }
        : { email: form.email.trim(), password: form.password };
      const { data } = await (isRegister ? register(payload) : login(payload));

      if (!data?.token) {
        setMessage("Authentication failed. No access token was returned.");
        return;
      }

      localStorage.setItem("token", data.token);
      router.replace(redirectTo);
    } catch (error) {
      setMessage(error.response?.data?.message || "Authentication Failed");
    } finally {
      setLoading(false);
    }
  };

  const switchMode = () => {
    setMode(isRegister ? "login" : "register");
    setMessage("");
    setOtpVerified(false);
    setOtpSentTo("");
    setOtpCooldown(0);
    setForm((prev) => ({ ...prev, emailOtp: "" }));
  };

  return (
    <div className={s.pageBg}>
      <div className={s.gridContainer}>
        {/* left branding */}
        <section className={s.brandSection}>
          <div className={s.logoRow}>
            <Image
              src={logo}
              alt="BookMe logo"
              className={s.logoImg}
              width={20}
              height={20}
            />

            <span className={s.brandName}>BookMe</span>
          </div>

          <h1>
            A calm booking desk for {" "}
            <span className={s.gradientText}>small businesses.</span>
          </h1>

          <p className={s.subtitle}>
            Create your business profile, add services, set availability
            and share one clean booking link.
          </p>

          <div className={s.featureGrid}>
            <div className={s.featureCard}>
              <div className={s.featureIconWrapPurple}>
                <CalendarDays className={s.featureIconPurple} />
              </div>

              <div>
                <p className={s.featureTitle}>
                  Easy Setup
                </p>
                <p className={s.featureDesc}>
                  Get started in minutes
                </p>
              </div>
            </div>

            <div className={s.featureCard}>
              <div className={s.featureIconWrapEmerald}>
                <Shield className={s.featureIconEmerald} />
              </div>

              <div>
                <p className={s.featureTitle}>
                  Secure
                </p>
                <p className={s.featureDesc}>
                  Stripe powered payments
                </p>
              </div>
            </div>

            <div className={s.featureCard}>
              <div className={s.featureIconWrapAmber}>
                <Zap className={s.featureIconAmber} />
              </div>

              <div>
                <p className={s.featureTitle}>
                  Fast
                </p>
                <p className={s.featureDesc}>
                  Instant booking links
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Right: auth form */}
        <section className={s.formCard}>
          <h2 className={s.formHeading}>
            {isRegister ? "Create account" : "Welcome back"}
          </h2>
          <p className={s.formSubtitle}>
            {isRegister
              ? "Set up your business in minutes"
              : "Log in to manage your bookings"}
          </p>

          <form onSubmit={handleSubmit} className={s.form}>
            {isRegister && (
              <>
                <div>
                  <label htmlFor="auth-name" className={s.inputLabel}>Name</label>
                  <div className={s.inputWrapper}>
                    <User className={s.inputIcon} />
                    <input
                      id="auth-name"
                      name="name"
                      autoComplete="name"
                      value={form.name}
                      onChange={handleChange}
                      placeholder="Your full name"
                      className={s.inputField}
                      required
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="auth-business" className={s.inputLabel}>Business Name</label>
                  <div className={s.inputWrapper}>
                    <Building2 className={s.inputIcon} />
                    <input
                      id="auth-business"
                      name="businessName"
                      autoComplete="organization"
                      value={form.businessName}
                      onChange={handleChange}
                      placeholder="Your business name"
                      className={s.inputField}
                    />
                  </div>
                </div>
              </>
            )}

            <div>
              <label htmlFor="auth-email" className={s.inputLabel}>Email</label>
              <div className={s.inputWrapper}>
                <Mail className={s.inputIcon} />
                <input
                  id="auth-email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="you@example.com"
                  className={s.inputField}
                  required
                />
              </div>
            </div>

            {isRegister && (
              <div className={s.otpContainer}>
                <label htmlFor="auth-otp" className={s.otpLabel}>Email verification code</label>
                <div className={s.otpGrid}>
                  <input
                    id="auth-otp"
                    name="emailOtp"
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    value={form.emailOtp}
                    onChange={handleChange}
                    className={s.otpField}
                    placeholder="Enter 6-digit code"
                    autoComplete="one-time-code"
                    pattern="[0-9]*"
                  />
                  {otpVerified ? (
                    <button
                      type="button"
                      disabled
                      className={s.otpVerifiedButton}
                    >
                      <BadgeCheck className={s.otpVerifiedIcon} />
                      Verified
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={sendOtp}
                      disabled={otpLoading || !form.email || otpCooldown > 0}
                      className={s.otpButton}
                    >
                      {otpLoading
                        ? "Sending..."
                        : otpCooldown > 0
                          ? `Resend code (${otpCooldown}s)`
                          : otpSentTo === form.email.trim().toLowerCase()
                            ? "Resend code"
                            : "Send code"}
                    </button>
                  )}
                </div>
              </div>
            )}

            <div>
              <label htmlFor="auth-password" className={s.inputLabel}>Password</label>
              <div className={s.inputWrapper}>
                <Lock className={s.inputIcon} />
                <input
                  id="auth-password"
                  name="password"
                  type="password"
                  autoComplete={isRegister ? "new-password" : "current-password"}
                  value={form.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  className={s.inputField}
                  minLength={isRegister ? 8 : undefined}
                  required
                />
              </div>
            </div>

            <button type="submit" disabled={loading} className={s.submitBtn}>
              {loading
                ? "Please wait..."
                : isRegister
                  ? "Create account"
                  : "Log in"}
              <ArrowRight className={s.submitIcon} />
            </button>

            {message && (
              <p className={s.message} aria-live="polite">
                {message}
              </p>
            )}
          </form>

          <button
            type="button"
            onClick={switchMode}
            className={s.toggleMode}
          >
            {isRegister
              ? "Already have an account? Log in"
              : "Need an account? Register"}
          </button>
        </section>

      </div>

      <div className={s.footerLinks}>
        <Link href='/privacy' className={s.footerLink}>Privacy Policy</Link>
        <Link href='/terms' className={s.footerLink}>Terms of Service</Link>
      </div>

    </div>
  )
}

const AuthPage = () => (
  <Suspense fallback={null}>
    <AuthForm />
  </Suspense>
);

export default AuthPage;