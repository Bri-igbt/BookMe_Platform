'use client'

import { getMe, updateProfile } from "@/app/api/auth.js";
import { getGoogleConnectUrl } from "@/app/api/integrations.js";
import { Suspense, useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import {
  Copy,
  BadgeCheck,
  Users,
  Globe,
  Save,
  Wand2,
  CalendarDays,
  Shield,
  BellRing,
  Zap,
  Clock,
} from 'lucide-react';
import googleCalendarLogo from '@/app/assets/Google_Calendar-Logo.wine.png';
import stripeLogo from '@/app/assets/stripeicon.jpeg';
import gmailLogo from '@/app/assets/gmail.webp';
import p2Image from '@/app/assets/P2.png';
import greenBanner from '@/app/assets/green.png';
import purpleBanner from '@/app/assets/purple.png';
import redBanner from '@/app/assets/red.png';
import whiteBanner from '@/app/assets/white.png';
import yellowBanner from '@/app/assets/yellow.png';
import {
  brandThemeOptions,
  getBrandThemeStyle,
  profilePageStyles as s,
} from '@/app/assets/dummyStyles.jsx';

const DEFAULT_ACCENT = "#6C47FF";
const DEFAULT_TIME_ZONE = "Africa/Lagos";
const HEX_COLOR_REGEX = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;
const LONG_HEX_COLOR_REGEX = /^#[0-9a-fA-F]{6}$/;

const BASE_TIME_ZONES = [
  "Africa/Lagos",
  "Africa/Accra",
  "Africa/Nairobi",
  "Africa/Johannesburg",
  "Africa/Cairo",
  "Europe/London",
  "UTC",
  "America/New_York",
];

const getCalendarNotice = (value) => {
  if (value === "connected") {
    return { text: "Google Calendar connected successfully", type: "success" };
  }
  if (value === "denied") {
    return { text: "Google Calendar access was cancelled", type: "error" };
  }
  if (value === "missing-refresh-token") {
    return {
      text: "Google did not return a refresh token. Remove BookMe's access in your Google account settings, then try again.",
      type: "error",
    };
  }
  if (value) {
    return {
      text: "Google Calendar connection was not completed",
      type: "error",
    };
  }
  return { text: "", type: "error" };
};

const themeBannerImages = {
  emerald: greenBanner,
  indigo: purpleBanner,
  rose: redBanner,
  amber: yellowBanner,
  slate: whiteBanner,
};

const Profile = () => {
  const searchParams = useSearchParams();
  const calendarNotice = getCalendarNotice(searchParams.get('calendar'));
  const [form, setForm] = useState({
    businessName: "",
    businessDescription: "",
    timeZone: DEFAULT_TIME_ZONE,
    brandTheme: "emerald",
    brandAccent: DEFAULT_ACCENT,
  });
  const [user, setUser] = useState(null);
  const [origin, setOrigin] = useState("");
  const [loading, setLoading] = useState(false);
  const [connectingCalendar, setConnectingCalendar] = useState(false);
  const [message, setMessage] = useState(calendarNotice.text);
  const [messageType, setMessageType] = useState(calendarNotice.type);
  const [copyMessage, setCopyMessage] = useState("");

  const showMessage = (text, type = "error") => {
    setMessage(text);
    setMessageType(type);
  };

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  const publicLink = user?.slug && origin ? `${origin}/book/${user.slug}` : "";

  const displayBusinessName =
    form.businessName.trim() || user?.name || "Your business";
  const businessInitial = displayBusinessName.slice(0, 1).toUpperCase();

  const dynamicThemeUI = getBrandThemeStyle(form.brandTheme);
  const accentColor = HEX_COLOR_REGEX.test(form.brandAccent)
    ? form.brandAccent
    : dynamicThemeUI.accent;
  const brandStyleVars = {
    "--brand-accent": accentColor,
    "--brand-panel": dynamicThemeUI.panel,
  };
  const previewBannerImage = themeBannerImages[form.brandTheme] || greenBanner;

  const timeZoneOptions =
    !form.timeZone || BASE_TIME_ZONES.includes(form.timeZone)
      ? BASE_TIME_ZONES
      : [form.timeZone, ...BASE_TIME_ZONES];

  useEffect(() => {
    const loadUser = async () => {
      if (!localStorage.getItem("token")) {
        showMessage("Please log in before editing your profile");
        return;
      }

      try {
        const { data } = await getMe();
        const nextUser = data?.user;

        if (!nextUser) {
          showMessage("Could not load profile details");
          return;
        }

        setUser(nextUser);
        setForm({
          businessName: nextUser.businessName || "",
          businessDescription: nextUser.businessDescription || "",
          timeZone: nextUser.timeZone || DEFAULT_TIME_ZONE,
          brandTheme: nextUser.brandTheme || "emerald",
          brandAccent: nextUser.brandAccent || DEFAULT_ACCENT,
        });
      } catch (error) {
        showMessage(
          error.response?.data?.message || "Could not load profile details",
        );
      }
    };

    loadUser();
  }, []);

  const handleChange = (event) => {
    setForm((prev) => ({
      ...prev,
      [event.target.name]: event.target.value,
    }));
  };

  const handleAccentTextChange = (event) => {
    let value = event.target.value.trim();
    if (value && !value.startsWith("#")) value = `#${value}`;

    setForm((prev) => ({ ...prev, brandAccent: value.slice(0, 7) }));
  };

  const chooseTheme = (theme) => {
    setForm((prev) => ({
      ...prev,
      brandTheme: theme.id,
      brandAccent: theme.accent,
    }));
  };

  const copyPublicLink = async () => {
    if (!publicLink) return;

    try {
      await navigator.clipboard.writeText(publicLink);
      setCopyMessage("Copied!");
    } catch (error) {
      setCopyMessage("Could not copy");
    }

    window.setTimeout(() => setCopyMessage(""), 1800);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!localStorage.getItem("token")) {
      showMessage("Please log in before editing your profile");
      return;
    }

    if (!HEX_COLOR_REGEX.test(form.brandAccent)) {
      showMessage("Accent color must be a hex code like #6C47FF");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const { data } = await updateProfile({
        ...form,
        businessName: form.businessName.trim(),
        businessDescription: form.businessDescription.trim(),
      });
      setUser(data.user);
      showMessage("Profile updated successfully", "success");
    } catch (error) {
      showMessage(error.response?.data?.message || "Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  const connectGoogleCalendar = async () => {
    setConnectingCalendar(true);
    setMessage("");

    try {
      const { data } = await getGoogleConnectUrl();
      window.location.href = data.url;
    } catch (error) {
      showMessage(
        error.response?.data?.message ||
        "Could not start Google Calendar connection",
      );
      setConnectingCalendar(false);
    }
  };

  const getMessageBannerClass = () =>
    messageType === "success" ? s.messageBannerSuccess : s.messageBannerError;

  return (
    <div className={s.pageLayout}>
      <div className={s.leftColumn}>
        <div className={s.headerRow}>
          <div className={s.headerTextBlock}>
            <h3 className={s.profileLabel}>Profile</h3>
            <h1 className={s.mainHeading}>
              Shape your{" "}
              <span className={s.headingGradientPublic}>public</span>
              <br />
              <span className={s.headingGradientBooking}>
                booking{" "}
                <span className={s.headingGradientBookingInner}>
                  experience
                </span>
              </span>
            </h1>
            <p className={s.subHeading}>
              Personalize your booking page, connect your tools, and share
              your link with confidence.
            </p>
          </div>
          <div className={s.illustrationContainer}>
            <Image
              src={p2Image}
              alt="Profile illustration"
              className={s.illustrationImg}
            />
          </div>
        </div>

        <div className={s.linkCard}>
          <h4 className={s.linkCardTitle}>Public booking link</h4>
          <div className={s.linkRow}>
            <div className={s.linkBar}>
              <span className={s.linkText}>
                {publicLink || "Loading your link..."}
              </span>
              <button
                type="button"
                onClick={copyPublicLink}
                disabled={!publicLink}
                aria-label="Copy booking link"
                className={s.linkCopyButtonSmall}
              >
                <Copy className={s.iconSmall} />
              </button>
            </div>
            <button
              type="button"
              onClick={copyPublicLink}
              disabled={!publicLink}
              className={s.linkCopyButtonMain}
            >
              <Wand2 className={s.iconSmall} />
              {copyMessage || "Copy link"}
            </button>
          </div>
          {publicLink && (
            <div className={s.linkLiveIndicator}>
              <BadgeCheck className={s.iconSmall} />
              <span>Your link is live and ready to share!</span>
            </div>
          )}
        </div>

        <div className={s.integrationsGrid}>
          <div className={s.integrationCard}>
            <div className={s.integrationHeader}>
              <div className={s.integrationLogoBox}>
                <Image
                  src={stripeLogo}
                  alt="Stripe"
                  className={s.integrationLogoImg}
                />
              </div>
              <span className={s.integrationLabel}>Stripe</span>
            </div>
            {user?.stripeConfigured ? (
              <h4 className={s.integrationStatusConfigured}>
                Configured <BadgeCheck className={s.integrationCheckIcon} />
              </h4>
            ) : (
              <h4 className="text-base font-semibold text-slate-500">
                Not configured
              </h4>
            )}
            <p className={s.integrationDesc}>
              Collect payments securely via Stripe.
            </p>
            <div className={s.integrationInfoPill}>
              Platform payment gateway
            </div>
          </div>

          <div className={s.integrationCard}>
            <div className={s.integrationHeader}>
              <div className={s.integrationLogoBox}>
                <Image
                  src={googleCalendarLogo}
                  alt="Calendar"
                  className={s.integrationLogoImg}
                />
              </div>
              <span className={s.integrationLabel}>Calendar</span>
            </div>
            {user?.googleCalendarConnected ? (
              <h4 className={s.integrationStatusConnected}>
                Connected <BadgeCheck className={s.integrationCheckIcon} />
              </h4>
            ) : (
              <h4 className="text-base font-semibold text-slate-500">
                Not connected
              </h4>
            )}
            <p className={s.integrationDesc}>
              {user?.googleCalendarConnected
                ? "Bookings will sync automatically."
                : "Connect to sync bookings to your calendar."}
            </p>
            <button
              type="button"
              onClick={connectGoogleCalendar}
              disabled={connectingCalendar}
              className={s.integrationManageButton}
            >
              {connectingCalendar
                ? "Wait..."
                : user?.googleCalendarConnected
                  ? "Reconnect"
                  : "Connect"}
            </button>
          </div>

          <div className={s.integrationCard}>
            <div className={s.integrationHeader}>
              <div className={s.integrationLogoBox}>
                <Image
                  src={gmailLogo}
                  alt="Emails"
                  className={s.integrationLogoImg}
                />
              </div>
              <span className={s.integrationLabel}>Emails</span>
            </div>
            <h4 className={s.integrationStatusConfigured}>
              Configured <BadgeCheck className={s.integrationCheckIcon} />
            </h4>
            <p className={s.integrationDesc}>
              Customers receive email updates.
            </p>
            <div className={s.integrationInfoPill}>
              Automatic booking emails
            </div>
          </div>
        </div>
      </div>

      <div className={s.rightColumn}>
        <div className={s.formHeader}>
          <div className={s.formHeaderIcon}>
            <Users className={s.formHeaderUserIcon} />
          </div>
          <div>
            <h2 className={s.formTitle}>Business details</h2>
            <p className={s.formSubtitle}>Update your profile info</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className={s.form}>
          <div>
            <label htmlFor="profile-business-name" className={s.inputLabel}>
              Business Name
            </label>
            <div className={s.inputWrapper}>
              <input
                id="profile-business-name"
                name="businessName"
                value={form.businessName}
                onChange={handleChange}
                maxLength={100}
                placeholder="Your business name"
                autoComplete="organization"
                className={s.textInput}
              />
              <Globe className={s.inputIconRight} />
            </div>
            <p className="mt-1.5 text-xs text-slate-500">
              Changing your business name also changes your booking link.
            </p>
          </div>

          <div>
            <label htmlFor="profile-description" className={s.inputLabel}>
              Business Description
            </label>
            <textarea
              id="profile-description"
              name="businessDescription"
              value={form.businessDescription}
              onChange={handleChange}
              rows={3}
              maxLength={500}
              className={s.textareaInput}
            />
          </div>

          <div className={s.twoColGrid}>
            <div>
              <label htmlFor="profile-timezone" className={s.inputLabel}>
                Timezone
              </label>
              <div className={s.inputWrapper}>
                <Globe className={s.inputIconLeft} />
                <select
                  id="profile-timezone"
                  name="timeZone"
                  value={form.timeZone}
                  onChange={handleChange}
                  className={s.selectInput}
                >
                  {timeZoneOptions.map((zone) => (
                    <option key={zone} value={zone}>
                      {zone}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label htmlFor="profile-accent" className={s.inputLabel}>
                Accent color
              </label>
              <div className={s.colorInputRow}>
                <input
                  id="profile-accent"
                  name="brandAccent"
                  type="color"
                  value={
                    LONG_HEX_COLOR_REGEX.test(form.brandAccent)
                      ? form.brandAccent
                      : DEFAULT_ACCENT
                  }
                  onChange={handleChange}
                  className={s.colorPicker}
                />
                <input
                  type="text"
                  aria-label="Accent color hex code"
                  value={form.brandAccent.toUpperCase()}
                  onChange={handleAccentTextChange}
                  maxLength={7}
                  className={s.colorTextInput}
                />
              </div>
            </div>
          </div>

          <div>
            <label className={s.inputLabel}>Theme</label>
            <div className={s.themeSwatches}>
              {brandThemeOptions.map((theme) => {
                const isSelected = form.brandTheme === theme.id;
                return (
                  <button
                    key={theme.id}
                    type="button"
                    onClick={() => chooseTheme(theme)}
                    aria-pressed={isSelected}
                    className={
                      isSelected ? s.themeBtnActive : s.themeBtnInactive
                    }
                  >
                    <span className={`${s.themeSwatch} ${theme.swatch}`} />
                    {theme.label}
                  </button>
                );
              })}
            </div>
          </div>

          <button type="submit" disabled={loading} className={s.saveButton}>
            <Save className={s.saveButtonIcon} />
            {loading ? "Saving..." : "Save profile settings"}
          </button>
          {message && (
            <div
              role={messageType === "success" ? "status" : "alert"}
              className={`${s.messageBanner} ${getMessageBannerClass()}`}
            >
              <BadgeCheck className={s.messageBannerIcon} />
              {message}
            </div>
          )}
        </form>
      </div>

      <div className={s.bottomFullWidth} style={brandStyleVars}>
        <div className={s.previewContainer}>
          <div className={s.previewBanner}>
            <div className={s.previewBannerBg}>
              <Image
                src={previewBannerImage}
                alt="3D Illustration"
                className={s.previewBannerImg}
                style={{
                  WebkitMaskImage:
                    "linear-gradient(to right, transparent, black 80%)",
                  maskImage:
                    "linear-gradient(to right, transparent, black 80%)",
                }}
              />
              <div className={s.previewBannerOverlay} />
            </div>

            <div className={s.previewBannerContent}>
              <div className={s.previewAvatarRow}>
                <div className={s.previewAvatar}>{businessInitial}</div>
                <div>
                  <div className={s.previewLabel}>Public preview</div>
                  <h2 className={s.previewTitle}>{displayBusinessName}</h2>
                </div>
              </div>
              {form.businessDescription && (
                <p className={s.previewDesc}>{form.businessDescription}</p>
              )}
            </div>
          </div>

          <div className={s.previewFeatureCard}>
            <div className={s.featureItem}>
              <div className={s.featureIconBox}>
                <CalendarDays className={s.featureIcon} />
              </div>
              <div>
                <h5 className={s.featureTitle}>Easy Booking</h5>
                <p className={s.featureText}>
                  Book your session in just a few clicks.
                </p>
              </div>
            </div>
            <div className={s.featureItem}>
              <div className={s.featureIconBox}>
                <Shield className={s.featureIcon} />
              </div>
              <div>
                <h5 className={s.featureTitle}>Secure Payments</h5>
                <p className={s.featureText}>
                  Powered by Stripe for safe transactions.
                </p>
              </div>
            </div>
            <div className={s.featureItem}>
              <div className={s.featureIconBox}>
                <BellRing className={s.featureIcon} />
              </div>
              <div>
                <h5 className={s.featureTitle}>Instant Updates</h5>
                <p className={s.featureText}>
                  Get email & calendar reminders.
                </p>
              </div>
            </div>
            <div className={s.featureItem}>
              <div className={s.featureIconBox}>
                <Zap className={s.featureIcon} />
              </div>
              <div>
                <h5 className={s.featureTitle}>Hassle-free</h5>
                <p className={s.featureText}>
                  Manage bookings anytime, anywhere.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className={s.customerViewContainer}>
          <div className={s.customerViewLabel}>Customer view</div>

          <div className={`${s.customerViewCard} ${dynamicThemeUI.bg}`}>
            <div
              className={`${s.customerViewOverlay} ${dynamicThemeUI.gradient}`}
            />
            <div className={s.customerViewContent}>
              <div
                className={s.customerAvatar}
                style={{ backgroundColor: accentColor }}
              >
                {businessInitial}
              </div>
              <h3 className={s.customerName}>{displayBusinessName}</h3>

              <div className={s.customerMeta}>
                <span className={s.customerMetaItem}>
                  <Clock className={s.customerMetaIcon} /> 60 min
                </span>
                <span className={s.customerMetaItem}>
                  <span aria-hidden="true">₦</span> 5,000
                </span>
              </div>
              <div className={s.customerTimeslotSection}>
                <div className={s.timeslotLabel}>Select Time</div>
                <button
                  type="button"
                  className={s.timeslotActiveBtn}
                  style={{ backgroundColor: accentColor }}
                >
                  10:00 AM
                </button>
                <button type="button" className={s.timeslotInactiveBtn}>
                  11:30 AM
                </button>
              </div>
            </div>
          </div>

          <div className={s.customerViewHint}>
            <Wand2 className={s.hintIcon} />
            <span>
              Preview your public booking page.
              <br />
              Accent color applies to buttons.
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}


const page = () => (
  <Suspense fallback={null}>
    <Profile />
  </Suspense>
);

export default page