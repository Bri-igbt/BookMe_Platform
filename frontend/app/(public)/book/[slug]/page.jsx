'use client'

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
  createPublicBooking,
  getPublicBusiness,
  getPublicSlots,
  requestPublicBookingOtp,
  verifyPublicBookingOtp,
} from "@/app/api/public.js";
import {
  Clock,
  CalendarDays,
  User,
  Mail,
  Lock,
  BadgeCheck,
  Shield,
  Check,
} from "lucide-react";
import greenBanner from "@/app/assets/green.png";
import purpleBanner from "@/app/assets/purple.png";
import redBanner from "@/app/assets/red.png";
import whiteBanner from "@/app/assets/white.png";
import yellowBanner from "@/app/assets/yellow.png";
import C1 from "@/app/assets/icons/C1.png";
import C2 from "@/app/assets/icons/C2.png";
import C3 from "@/app/assets/icons/C3.png";
import C4 from "@/app/assets/icons/C4.png";
import C5 from "@/app/assets/icons/C5.png";
import C6 from "@/app/assets/icons/C6.png";
import C7 from "@/app/assets/icons/C7.png";
import C8 from "@/app/assets/icons/C8.png";
import A1 from "@/app/assets/avatars/A1.png";
import A2 from "@/app/assets/avatars/A2.png";
import A3 from "@/app/assets/avatars/A3.png";
import A4 from "@/app/assets/avatars/A4.png";
import A5 from "@/app/assets/avatars/A5.png";
import A6 from "@/app/assets/avatars/A6.png";
import A7 from "@/app/assets/avatars/A7.png";
import A8 from "@/app/assets/avatars/A8.png";
import A9 from "@/app/assets/avatars/A9.png";
import A10 from "@/app/assets/avatars/A10.png";
import A11 from "@/app/assets/avatars/A11.png";
import A12 from "@/app/assets/avatars/A12.png";
import A13 from "@/app/assets/avatars/A13.png";
import A15 from "@/app/assets/avatars/A15.png";
import A16 from "@/app/assets/avatars/A16.png";
import {
  getBrandThemeStyle,
  publicBookingPageStyles as s,
} from "@/app/assets/dummyStyles.jsx";

const OTP_COOLDOWN_SECONDS = 60;
const DEFAULT_TIME_ZONE = "Africa/Lagos";

const ICON_MAP = {
  "C1.png": C1,
  "C2.png": C2,
  "C3.png": C3,
  "C4.png": C4,
  "C5.png": C5,
  "C6.png": C6,
  "C7.png": C7,
  "C8.png": C8,
};

const AVATAR_MAP = {
  "A1.png": A1,
  "A2.png": A2,
  "A3.png": A3,
  "A4.png": A4,
  "A5.png": A5,
  "A6.png": A6,
  "A7.png": A7,
  "A8.png": A8,
  "A9.png": A9,
  "A10.png": A10,
  "A11.png": A11,
  "A12.png": A12,
  "A13.png": A13,
  "A15.png": A15,
  "A16.png": A16,
};

const themeBannerImages = {
  emerald: greenBanner,
  indigo: purpleBanner,
  rose: redBanner,
  amber: yellowBanner,
  slate: whiteBanner,
};


const formatMoney = (amount = 0) =>
  new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(amount) || 0);


const getTodayKey = (timeZone) => {
  const format = (zone) =>
    new Intl.DateTimeFormat("en-CA", {
      timeZone: zone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(new Date());

  try {
    return format(timeZone || DEFAULT_TIME_ZONE);
  } catch (error) {
    return format(DEFAULT_TIME_ZONE);
  }
};

const page = () => {
  const { slug } = useParams();
  const [business, setBusiness] = useState(null);
  const [notFound, setNotFound] = useState(false);
  const [services, setServices] = useState([]);
  const [slots, setSlots] = useState([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [slotsRefresh, setSlotsRefresh] = useState(0);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("info");
  const [calendarUrl, setCalendarUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpChecking, setOtpChecking] = useState(false);
  const [otpSentTo, setOtpSentTo] = useState("");
  const [otpVerified, setOtpVerified] = useState(false);
  const [otpCooldown, setOtpCooldown] = useState(0);
  const [todayKey, setTodayKey] = useState("");
  const [form, setForm] = useState({
    serviceId: "",
    date: "",
    customerName: "",
    customerEmail: "",
    customerAvatar: "A1.png",
    emailOtp: "",
    notes: "",
  });

  const showMessage = (text, type = "info") => {
    setMessage(text);
    setMessageType(type);
  };

  const selectedService = useMemo(
    () => services.find((service) => service._id === form.serviceId),
    [services, form.serviceId],
  );

  const displayName = business?.businessName || business?.name || "";
  const brandTheme = getBrandThemeStyle(business?.brandTheme);
  const accent = business?.brandAccent || brandTheme.accent;
  const brandStyleVars = {
    "--brand-accent": accent,
    "--brand-panel": brandTheme.panel,
  };
  const bannerImage = themeBannerImages[business?.brandTheme] || greenBanner;

  useEffect(() => {
    if (otpCooldown <= 0) return undefined;

    const timer = setTimeout(() => {
      setOtpCooldown((prev) => prev - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [otpCooldown]);

  useEffect(() => {
    if (!slug) return undefined;

    let isActive = true;

    const loadBusiness = async () => {
      try {
        const { data } = await getPublicBusiness(slug);
        if (!isActive) return;

        const key = getTodayKey(data.business?.timeZone);

        setBusiness(data.business);
        setServices(data.services || []);
        setTodayKey(key);
        setForm((prev) => ({
          ...prev,
          serviceId: data.services?.[0]?._id || "",
          date: prev.date || key,
        }));
      } catch (error) {
        if (!isActive) return;

        if (error.response?.status === 404) {
          setNotFound(true);
          return;
        }

        showMessage(
          error.response?.data?.message || "Could not load booking page",
        );
      }
    };

    loadBusiness();

    return () => {
      isActive = false;
    };
  }, [slug]);

  useEffect(() => {
    if (!form.serviceId || !form.date) return undefined;

    let isActive = true;

    const loadSlots = async () => {
      setSelectedSlot(null);
      setSlotsLoading(true);

      try {
        const { data } = await getPublicSlots(slug, {
          serviceId: form.serviceId,
          date: form.date,
        });
        if (isActive) setSlots(data.slots || []);
      } catch (error) {
        if (!isActive) return;
        setSlots([]);
        showMessage(error.response?.data?.message || "Could not load slots");
      } finally {
        if (isActive) setSlotsLoading(false);
      }
    };

    loadSlots();

    return () => {
      isActive = false;
    };
  }, [slug, form.serviceId, form.date, slotsRefresh]);

  const verifyOtpCode = async (email, code) => {
    setOtpChecking(true);

    try {
      await verifyPublicBookingOtp(slug, {
        customerEmail: email.trim(),
        emailOtp: code,
      });
      setOtpVerified(true);
      showMessage("Email verified successfully.", "success");
    } catch (error) {
      setOtpVerified(false);
      showMessage(error.response?.data?.message || "Invalid OTP");
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

      if (digitsOnly.length === 6 && form.customerEmail && !otpChecking) {
        verifyOtpCode(form.customerEmail, digitsOnly);
      }
      return;
    }

    if (name === "customerEmail") {
      setOtpVerified(false);
      setOtpSentTo("");
      setForm((prev) => ({ ...prev, customerEmail: value, emailOtp: "" }));
      return;
    }

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const sendBookingOtp = async () => {
    if (!form.customerEmail) {
      showMessage("Enter your email first");
      return;
    }

    setOtpLoading(true);
    setMessage("");

    try {
      await requestPublicBookingOtp(slug, form.customerEmail.trim());
      setOtpSentTo(form.customerEmail.trim().toLowerCase());
      setOtpCooldown(OTP_COOLDOWN_SECONDS);
      showMessage("Verification code sent to your email", "success");
    } catch (error) {
      showMessage(
        error.response?.data?.message || "Could not send verification code",
      );
    } finally {
      setOtpLoading(false);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (loading) return;

    if (!selectedSlot) {
      showMessage("Choose a time slot");
      return;
    }

    if (!otpVerified) {
      showMessage("Please verify your email with the code we sent you");
      return;
    }

    setLoading(true);
    setMessage("");
    setCalendarUrl("");

    try {
      const { data } = await createPublicBooking(slug, {
        ...form,
        customerName: form.customerName.trim(),
        customerEmail: form.customerEmail.trim(),
        startTime: selectedSlot.startTime,
        endTime: selectedSlot.endTime,
      });

      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
        return;
      }

      showMessage(
        data.customerCalendarUrl
          ? "Your booking is confirmed. You can add it to Google Calendar below."
          : "Your booking is confirmed",
        "success",
      );
      setCalendarUrl(data.customerCalendarUrl || "");
      setSelectedSlot(null);
      setOtpVerified(false);
      setOtpSentTo("");
      setForm((prev) => ({ ...prev, emailOtp: "", notes: "" }));
      setSlotsRefresh((count) => count + 1);
    } catch (error) {
      showMessage(error.response?.data?.message || "Could not create booking");
      if (error.response?.status === 409) {
        setSlotsRefresh((count) => count + 1);
      }
    } finally {
      setLoading(false);
    }
  };

  const renderIcon = (service, isActive, customColor) => {
    return (
      <div
        className={s.serviceIconBase}
        style={{ boxShadow: isActive ? `0 0 0 2px ${customColor}` : "none" }}
      >
        <Image
          src={ICON_MAP[service.icon] || C1}
          alt={service.name}
          className="w-full h-full object-cover"
        />
      </div>
    );
  };

  if (notFound) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 px-4 text-center">
        <h1 className="text-2xl font-bold text-slate-800">
          This booking page doesn't exist
        </h1>
        <p className="text-slate-500">
          Check the link you were given, or ask the business to send it again.
        </p>
        <Link href="/" className="font-semibold text-[#7D57F5] hover:underline">
          Go to BookMe
        </Link>
      </div>
    );
  }

  return (
    <div className={s.pageContainer} style={brandStyleVars}>
      <main className={s.mainGrid}>
        <section className={s.leftPanel}>
          <div className={s.bgImageContainer}>
            <Image
              src={bannerImage}
              alt=""
              className={s.bgImage}
              style={{
                WebkitMaskImage:
                  "linear-gradient(to bottom right, transparent, black 60%)",
                maskImage:
                  "linear-gradient(to bottom right, transparent, black 60%)",
              }}
            />
            <div className={s.bgImageOverlay}></div>
          </div>
          <div className={s.bgFadeOverlay}></div>

          <div className={s.leftContent}>
            <div className={s.businessInfoRow}>
              <div className={s.businessAvatar}>
                {(displayName || "B").slice(0, 1).toUpperCase()}
              </div>
              <p className={s.bookOnlineLabel}>Book online</p>
            </div>

            <h1 className={s.businessName}>{displayName || "Loading..."}</h1>
            {business?.businessDescription && (
              <p className={s.businessDesc}>{business.businessDescription}</p>
            )}
          </div>

          <div className={s.serviceList}>
            {services.map((service) => {
              const isActive = form.serviceId === service._id;

              return (
                <button
                  key={service._id}
                  type="button"
                  onClick={() =>
                    setForm((prev) => ({ ...prev, serviceId: service._id }))
                  }
                  aria-pressed={isActive}
                  className={
                    isActive ? s.serviceBtnActive : s.serviceBtnInactive
                  }
                >
                  {renderIcon(service, isActive, accent)}
                  <div className={s.serviceTextBlock}>
                    <span
                      className={
                        isActive ? s.serviceNameActive : s.serviceNameInactive
                      }
                    >
                      {service.name}
                    </span>
                    <p
                      className={
                        isActive
                          ? s.serviceDetailActive
                          : s.serviceDetailInactive
                      }
                    >
                      {service.duration} min · {formatMoney(service.price)}
                    </p>
                    {service.description && (
                      <p
                        className={
                          isActive ? s.serviceDescActive : s.serviceDescInactive
                        }
                      >
                        {service.description}
                      </p>
                    )}
                  </div>

                  <div
                    className={`${s.selectorIconBase} ${isActive ? "opacity-100" : "opacity-0"
                      }`}
                    style={{ backgroundColor: accent }}
                  >
                    <Check className="w-3.5 h-3.5 text-white" />
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        <section className={s.rightPanel}>
          <h2 className={s.bookingTitle}>Choose your appointment</h2>

          {selectedService ? (
            <p className={s.selectedServiceInfo}>
              <Clock className="h-4 w-4" style={{ color: accent }} />
              <span style={{ color: accent }}>{selectedService.name}</span>
              <span className="text-slate-300">·</span>
              {selectedService.duration} minutes
              <span className="text-slate-300">·</span>
              {formatMoney(selectedService.price)}
            </p>
          ) : (
            <p className={s.noServiceText}>Select a service to begin</p>
          )}

          <form onSubmit={handleSubmit} className={s.form}>
            <div>
              <label htmlFor="booking-date" className={s.inputLabel}>Date</label>
              <div className={s.inputWrapper}>
                <CalendarDays className={s.inputIcon} />
                <input
                  id="booking-date"
                  type="date"
                  name="date"
                  min={todayKey || undefined}
                  value={form.date}
                  onChange={handleChange}
                  required
                  className={s.dateInput}
                  style={{ "--tw-ring-color": accent }}
                  onFocus={(e) => {
                    e.target.style.borderColor = accent;
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = "#e2e8f0";
                  }}
                />
              </div>
            </div>

            <div className="pt-2">
              <p className={s.inputLabel}>Available times</p>
              <div className={s.timeSlotGrid}>
                {slots.map((slot) => {
                  const isSlotSelected =
                    selectedSlot?.startTime === slot.startTime;
                  return (
                    <button
                      key={`${slot.startTime}-${slot.endTime}`}
                      type="button"
                      onClick={() => setSelectedSlot(slot)}
                      aria-pressed={isSlotSelected}
                      className={`${s.slotBtnBase} ${isSlotSelected ? s.slotBtnSelected : s.slotBtnUnselected
                        }`}
                      style={
                        isSlotSelected ? { backgroundColor: accent } : undefined
                      }
                    >
                      {slot.startTime}
                      {isSlotSelected && <BadgeCheck className="h-4 w-4" />}
                    </button>
                  );
                })}
              </div>
              {slotsLoading && (
                <p className={s.noSlotsText}>Loading times...</p>
              )}
              {!slotsLoading && slots.length === 0 && (
                <p className={s.noSlotsText}>
                  No times available for this date.
                </p>
              )}
            </div>

            <div className={s.nameEmailGrid}>
              <div>
                <label htmlFor="booking-name" className={s.inputLabel}>Your name</label>
                <div className={s.inputWrapper}>
                  <User className={s.inputIcon} />
                  <input
                    id="booking-name"
                    name="customerName"
                    value={form.customerName}
                    onChange={handleChange}
                    placeholder="Enter your name"
                    autoComplete="name"
                    maxLength={100}
                    required
                    className={s.textInput}
                    onFocus={(e) => {
                      e.target.style.borderColor = accent;
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = "#e2e8f0";
                    }}
                  />
                </div>
              </div>
              <div>
                <label htmlFor="booking-email" className={s.inputLabel}>Email address</label>
                <div className={s.inputWrapper}>
                  <Mail className={s.inputIcon} />
                  <input
                    id="booking-email"
                    name="customerEmail"
                    type="email"
                    value={form.customerEmail}
                    onChange={handleChange}
                    placeholder="Enter your email"
                    autoComplete="email"
                    required
                    className={s.emailInput}
                    onFocus={(e) => {
                      e.target.style.borderColor = accent;
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = "#e2e8f0";
                    }}
                  />
                </div>
              </div>
            </div>

            <div className={s.otpBlock}>
              <label htmlFor="booking-otp" className={s.otpLabel} style={{ color: accent }}>
                Email verification code
              </label>
              <div className={s.otpRow}>
                <input
                  id="booking-otp"
                  name="emailOtp"
                  inputMode="numeric"
                  maxLength={6}
                  value={form.emailOtp}
                  onChange={handleChange}
                  className={s.otpInput}
                  placeholder="Enter 6-digit code"
                  autoComplete="one-time-code"
                  onFocus={(e) => {
                    e.target.style.borderColor = accent;
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = "#e2e8f0";
                  }}
                />
                {otpVerified ? (
                  <button
                    type="button"
                    disabled
                    className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-emerald-500 text-white text-sm font-semibold cursor-default"
                  >
                    <BadgeCheck className="w-4 h-4" />
                    Verified
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={sendBookingOtp}
                    disabled={
                      otpLoading || !form.customerEmail || otpCooldown > 0
                    }
                    className={s.otpButton}
                  >
                    {otpLoading
                      ? "Sending..."
                      : otpCooldown > 0
                        ? `Resend code (${otpCooldown}s)`
                        : otpSentTo === form.customerEmail.trim().toLowerCase()
                          ? "Resend code"
                          : "Send code"}
                  </button>
                )}
              </div>
            </div>

            <div className="pt-2">
              <label className={s.inputLabel}>Choose your avatar</label>
              <div className={s.avatarGrid}>
                {Object.keys(AVATAR_MAP).map((avatarName) => (
                  <button
                    key={avatarName}
                    type="button"
                    onClick={() =>
                      setForm((prev) => ({
                        ...prev,
                        customerAvatar: avatarName,
                      }))
                    }
                    aria-pressed={form.customerAvatar === avatarName}
                    className={`${s.avatarBtnBase} ${form.customerAvatar === avatarName
                      ? s.avatarBtnSelected
                      : s.avatarBtnUnselected
                      }`}
                    style={
                      form.customerAvatar === avatarName
                        ? { borderColor: accent, "--tw-ring-color": accent }
                        : undefined
                    }
                  >
                    <Image
                      src={AVATAR_MAP[avatarName]}
                      alt={`Avatar ${avatarName.replace(".png", "")}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-2">
              <label htmlFor="booking-notes" className={s.inputLabel}>
                Notes{" "}
                <span className="font-medium text-slate-400 ml-1">
                  (Optional)
                </span>
              </label>
              <textarea
                id="booking-notes"
                name="notes"
                rows={3}
                maxLength={1000}
                value={form.notes}
                onChange={handleChange}
                placeholder="Add any notes or special requests..."
                className={s.notesTextarea}
                onFocus={(e) => {
                  e.target.style.borderColor = accent;
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = "#e2e8f0";
                }}
              />
            </div>

            <div className="pt-4">
              <button
                type="submit"
                disabled={loading}
                className={s.submitButton}
                style={{ backgroundColor: accent }}
              >
                <Lock className="h-4.5 w-4.5" />
                {loading
                  ? "Preparing..."
                  : Number(selectedService?.price || 0) > 0
                    ? `Pay ${formatMoney(selectedService.price)} and Book Appointment`
                    : "Confirm booking"}
              </button>

              <p className={s.securePaymentText}>
                <Shield className="h-4 w-4 text-slate-400" />
                Secure payments powered by Stripe
              </p>
            </div>

            {message && (
              <div
                role={messageType === "success" ? "status" : "alert"}
                className={`${s.messageBase} ${messageType === "success"
                  ? s.messageSuccess
                  : s.messageInfo
                  }`}
              >
                {message}
              </div>
            )}

            {calendarUrl && (
              <a
                href={calendarUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={s.calendarLink}
                style={{ color: accent }}
              >
                Add to Google Calendar
              </a>
            )}
          </form>
        </section>
      </main>
    </div>
  );
};

export default page;