import https from "https";

const BREVO_TRANSACTIONAL_EMAIL_URL = "https://api.brevo.com/v3/smtp/email";

const DEFAULT_LOCALE = "en-NG";
const DEFAULT_CURRENCY = "ngn";
const DEFAULT_TIMEZONE = "Africa/Lagos";
const REQUEST_TIMEOUT_MS = 15000;

const parseEmailAddress = (value = "") => {
  const match = value.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i);
  return match?.[0] || "";
};

const stripEmailAddress = (value = "") => {
  return value
    .replace(/<[^>]+>/g, "")
    .replace(parseEmailAddress(value), "")
    .replace(/["']/g, "")
    .trim();
};

const getSender = () => {
  const from = process.env.EMAIL_FROM || "";
  const email = process.env.BREVO_SENDER_EMAIL || parseEmailAddress(from) || "";
  const name =
    process.env.BREVO_SENDER_NAME || stripEmailAddress(from) || "BookMe";

  return { email, name };
};

const getPlatformSender = (senderName) => {
  const sender = getSender();

  return {
    email: sender.email,
    name: senderName || sender.name,
  };
};

const getReplyTo = (replyTo) => {
  const email = parseEmailAddress(replyTo?.email || "");
  if (!email) return null;

  return {
    email,
    name: replyTo.name || email,
  };
};

const getBrevoErrorMessage = (statusCode, parsed) => {
  const message =
    parsed.message || `Brevo email failed with status ${statusCode}`;
  const lowerMessage = String(message).toLowerCase();

  if (
    lowerMessage.includes("ip") &&
    (lowerMessage.includes("unauthorized") ||
      lowerMessage.includes("not authorized"))
  ) {
    return [
      message,
      "Brevo rejected this server IP. For production, use one platform Brevo API key on the backend and either disable Brevo authorized IP restrictions or whitelist the production server outbound IP once.",
    ].join(" ");
  }

  return message;
};

export const getEmailConfigStatus = () => {
  const sender = getSender();
  const missing = [];

  if (!process.env.BREVO_API_KEY) missing.push("BREVO_API_KEY");
  if (!sender.email) missing.push("BREVO_SENDER_EMAIL or EMAIL_FROM");
  if (sender.email && parseEmailAddress(sender.email) !== sender.email) {
    missing.push("valid BREVO_SENDER_EMAIL");
  }

  return {
    provider: "brevo",
    configured: missing.length === 0,
    missing,
    from: sender.email,
    senderName: sender.name,
    mode: "platform",
    requiresPerUserAuthorization: false,
  };
};

// Amounts are stored in the smallest unit (kobo for NGN), so divide by 100.
const formatMoney = (amount = 0, currency = DEFAULT_CURRENCY) => {
  const code = String(currency || DEFAULT_CURRENCY).toUpperCase();
  try {
    return new Intl.NumberFormat(DEFAULT_LOCALE, {
      style: "currency",
      currency: code,
    }).format(amount / 100);
  } catch (e) {
    return `${code} ${(amount / 100).toFixed(2)}`;
  }
};

const getTimeZoneLabel = (timeZone) => {
  try {
    return (
      new Intl.DateTimeFormat(DEFAULT_LOCALE, {
        timeZone,
        timeZoneName: "short",
      })
        .formatToParts(new Date())
        .find((part) => part.type === "timeZoneName")?.value || ""
    );
  } catch (e) {
    return "";
  }
};

// booking.date is a plain calendar date (YYYY-MM-DD). Format it as-is in UTC
// so the server's own timezone can never shift it to the wrong day.
const formatDateTime = (booking, timeZone = DEFAULT_TIMEZONE) => {
  const [year, month, day] = String(booking.date).split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day, 12));
  const displayDate = new Intl.DateTimeFormat(DEFAULT_LOCALE, {
    dateStyle: "full",
    timeZone: "UTC",
  }).format(date);

  const label = getTimeZoneLabel(timeZone);
  return `${displayDate}, ${booking.startTime}-${booking.endTime}${
    label ? ` (${label})` : ""
  }`;
};

const escapeHtml = (value = "") => {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
};

const isHttpUrl = (value = "") => {
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch (e) {
    return false;
  }
};

const humanize = (value = "") => String(value).replace(/_/g, " ");

const buildSubject = (type, businessName, recipientType) => {
  if (recipientType === "provider") {
    if (type === "rescheduled") return `Booking rescheduled: ${businessName}`;
    if (type === "cancelled") return `Booking cancelled: ${businessName}`;
    if (type === "status") return `Booking status updated: ${businessName}`;
    return `New booking received: ${businessName}`;
  }

  if (type === "rescheduled")
    return `Your booking with ${businessName} was rescheduled`;
  if (type === "cancelled")
    return `Your booking with ${businessName} was cancelled`;
  if (type === "status") return `Your booking with ${businessName} was updated`;
  return `Your booking with ${businessName} is confirmed`;
};

const buildTitle = (type, recipientType) => {
  if (type === "rescheduled") return "Booking rescheduled";
  if (type === "cancelled") return "Booking cancelled";
  if (type === "status") return "Booking update";
  return recipientType === "provider" ? "New booking" : "Booking confirmation";
};

const buildIntro = ({ type, serviceName, recipientType }) => {
  if (recipientType === "provider") {
    if (type === "rescheduled")
      return `A ${serviceName} booking has been rescheduled.`;
    if (type === "cancelled")
      return `A ${serviceName} booking has been cancelled.`;
    if (type === "status")
      return `A ${serviceName} booking status was updated.`;
    return `You received a new ${serviceName} booking.`;
  }

  if (type === "rescheduled")
    return `Your ${serviceName} booking has been rescheduled.`;
  if (type === "cancelled")
    return `Your ${serviceName} booking has been cancelled.`;
  if (type === "status") return `Your ${serviceName} booking was updated.`;
  return `Your ${serviceName} booking is confirmed.`;
};

const buildCompanyEmailHtml = ({
  title,
  eyebrow = "BookMe",
  intro,
  rows,
  notes,
  calendarUrl,
  footer,
}) => {
  const detailRows = rows
    .filter(
      (row) => row.value !== undefined && row.value !== null && row.value !== ""
    )
    .map(
      (row) => `
      <tr>
        <td style="padding: 14px 0; color: #94a3b8; font-size: 13px; width: 36%; vertical-align: top;">${escapeHtml(
          row.label
        )}</td>
        <td style="padding: 14px 0; color: #1e293b; font-size: 14px; font-weight: 700;">${escapeHtml(
          row.value
        )}</td>
      </tr>
    `
    )
    .join("");

  const calendarButton =
    calendarUrl && isHttpUrl(calendarUrl)
      ? `<p style="margin:28px 0 0; text-align:center;"><a href="${escapeHtml(
          calendarUrl
        )}" style="display:inline-block; background-color:#7D57F5; background:linear-gradient(180deg, #9B7BFF 0%, #7D57F5 100%); color:#ffffff; text-decoration:none; padding:14px 28px; border-radius:14px; font-size:14px; font-weight:700; letter-spacing:0.3px;">Add to Google Calendar</a></p>`
      : "";

  const notesBlock = notes
    ? `<div style="margin:24px 0 0; padding:16px 18px; background:#F4F0FF; border:1px solid #EBE4FF; border-radius:14px; color:#475569; font-size:14px; line-height:1.6;"><strong style="color:#7D57F5;">Notes:</strong> ${escapeHtml(
        notes
      )}</div>`
    : "";

  return `
    <!doctype html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&display=swap" rel="stylesheet">
      </head>
      <body style="margin:0; padding:0; background:#f1f0f5; font-family:'Inter', Arial, Helvetica, sans-serif; color:#1e293b;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f1f0f5; padding:40px 16px;">
          <tr>
            <td align="center">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:600px; background:#ffffff; border-radius:24px; overflow:hidden; box-shadow: 0 4px 24px rgba(125,87,245,0.08);">
                <!-- Header with brand gradient -->
                <tr>
                  <td style="background-color:#9B7BFF; background: linear-gradient(180deg, #CBB8FF 0%, #9B7BFF 50%, #7D57F5 100%); padding:36px 36px 32px; text-align:center;">
                    <div style="font-size:11px; letter-spacing:2.5px; text-transform:uppercase; font-weight:800; color:rgba(255,255,255,0.8); margin-bottom:12px;">${escapeHtml(
                      eyebrow
                    )}</div>
                    <h1 style="margin:0; font-size:28px; line-height:1.25; color:#ffffff; font-weight:800;">${escapeHtml(
                      title
                    )}</h1>
                  </td>
                </tr>
                <!-- Body -->
                <tr>
                  <td style="padding:32px 36px 36px;">
                    <p style="margin:0 0 24px; font-size:15px; line-height:1.7; color:#475569;">${escapeHtml(
                      intro
                    )}</p>
                    <!-- Details table -->
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-top:2px solid #EBE4FF; border-bottom:2px solid #EBE4FF;">
                      ${detailRows}
                    </table>
                    ${notesBlock}
                    ${calendarButton}
                    <p style="margin:28px 0 0; color:#94a3b8; font-size:13px; line-height:1.6;">${escapeHtml(
                      footer
                    )}</p>
                  </td>
                </tr>
                <!-- Footer bar -->
                <tr>
                  <td style="padding:0 36px 28px; text-align:center;">
                    <div style="border-top:1px solid #f1f5f9; padding-top:20px;">
                      <span style="font-size:12px; font-weight:700; color:#CBB8FF; letter-spacing:1.5px; text-transform:uppercase;">Powered by BookMe</span>
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `;
};

const sendWithBrevo = async ({
  to,
  subject,
  text,
  htmlContent,
  senderName,
  replyTo,
}) => {
  const status = getEmailConfigStatus();
  if (!status.configured) {
    throw new Error(
      `BREVO email is not configured. Missing: ${status.missing.join(", ")}`
    );
  }

  const payload = {
    sender: getPlatformSender(senderName),
    to: [{ email: to }],
    subject,
    textContent: text,
    htmlContent,
  };

  const normalizedReplyTo = getReplyTo(replyTo);
  if (normalizedReplyTo) {
    payload.replyTo = normalizedReplyTo;
  }

  const postData = JSON.stringify(payload);

  return new Promise((resolve, reject) => {
    const req = https.request(
      BREVO_TRANSACTIONAL_EMAIL_URL,
      {
        method: "POST",
        headers: {
          Accept: "application/json",
          "api-key": process.env.BREVO_API_KEY,
          "Content-Type": "application/json",
          "Content-Length": Buffer.byteLength(postData),
        },
      },
      (res) => {
        let body = "";
        res.on("data", (chunk) => (body += chunk));
        res.on("end", () => {
          let parsed = {};
          try {
            parsed = JSON.parse(body);
          } catch (e) {}

          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve({
              sent: true,
              provider: "brevo",
              messageId: parsed.messageId,
            });
          } else {
            reject(new Error(getBrevoErrorMessage(res.statusCode, parsed)));
          }
        });
      }
    );

    req.setTimeout(REQUEST_TIMEOUT_MS, () => {
      req.destroy(new Error("Brevo request timed out"));
    });
    req.on("error", (e) => reject(e));
    req.write(postData);
    req.end();
  });
};

const buildBookingMessage = ({
  business,
  service,
  booking,
  type,
  recipientType,
}) => {
  const businessName = business.businessName || business.name || "BookMe";
  const serviceName = service.name || "appointment";
  // The User model field is `timeZone`; `timezone` is kept as a fallback.
  const timeZone = business.timeZone || business.timezone || DEFAULT_TIMEZONE;
  const appointmentTime = formatDateTime(booking, timeZone);
  const bookingStatus = humanize(booking.status);
  const paymentStatus = humanize(booking.paymentStatus || "not_required");
  const hasAmount = Number(booking.amount) > 0;
  const amount = hasAmount
    ? formatMoney(booking.amount, booking.currency || DEFAULT_CURRENCY)
    : "";
  const intro = buildIntro({ type, serviceName, recipientType });
  const subject = buildSubject(type, businessName, recipientType);
  const title = buildTitle(type, recipientType);

  const rows = [
    { label: "Business", value: businessName },
    { label: "Service", value: serviceName },
    { label: "Customer", value: booking.customerName },
    { label: "Customer email", value: booking.customerEmail },
    { label: "When", value: appointmentTime },
    { label: "Status", value: bookingStatus },
    { label: "Payment", value: paymentStatus },
    { label: "Amount", value: amount },
    { label: "Booking ID", value: String(booking._id || "") },
  ];

  const text = [
    intro,
    "",
    ...rows
      .filter((row) => row.value)
      .map((row) => `${row.label}: ${row.value}`),
    booking.notes ? `Notes: ${booking.notes}` : "",
    booking.customerCalendarUrl
      ? `Calendar link: ${booking.customerCalendarUrl}`
      : "",
    "",
    recipientType === "provider"
      ? "This notification was sent by BookMe."
      : `Thank you for booking with ${businessName}.`,
  ]
    .filter(Boolean)
    .join("\n");

  const htmlContent = buildCompanyEmailHtml({
    title,
    eyebrow: businessName,
    intro,
    rows,
    notes: booking.notes,
    calendarUrl:
      recipientType === "customer" && type !== "cancelled"
        ? booking.customerCalendarUrl
        : "",
    footer:
      recipientType === "provider"
        ? "This notification was sent by BookMe because a customer booked through your booking page."
        : `Thank you for booking with ${businessName}. Please keep this email for your records.`,
  });

  return { subject, text, htmlContent };
};

export const sendTransactionalEmail = sendWithBrevo;

export const sendBookingNotification = async ({
  business,
  service,
  booking,
  type = "confirmed",
}) => {
  const configStatus = getEmailConfigStatus();
  if (!configStatus.configured) {
    return {
      skipped: true,
      reason: `BREVO email is not configured. Missing: ${configStatus.missing.join(
        ", "
      )}`,
    };
  }

  const recipients = [
    { email: booking.customerEmail, type: "customer" },
    { email: business.email, type: "provider" },
  ].filter(
    (recipient, index, list) =>
      recipient.email &&
      list.findIndex(
        (candidate) =>
          String(candidate.email).toLowerCase() ===
          String(recipient.email).toLowerCase()
      ) === index
  );

  // Send independently so one failed email never blocks the other.
  const settled = await Promise.allSettled(
    recipients.map((recipient) => {
      const message = buildBookingMessage({
        business,
        service,
        booking,
        type,
        recipientType: recipient.type,
      });

      return sendWithBrevo({
        to: recipient.email,
        senderName: business.businessName || business.name || "BookMe",
        replyTo:
          recipient.type === "customer"
            ? {
                email: business.email,
                name: business.businessName || business.name || "Provider",
              }
            : {
                email: booking.customerEmail,
                name: booking.customerName || "Customer",
              },
        ...message,
      });
    })
  );

  const results = settled.map((outcome, index) => {
    const { email, type: recipientType } = recipients[index];
    return outcome.status === "fulfilled"
      ? { email, type: recipientType, ...outcome.value }
      : {
          email,
          type: recipientType,
          sent: false,
          error: outcome.reason?.message || "Unknown email error",
        };
  });

  return {
    sent: results.some((result) => result.sent),
    provider: "brevo",
    recipients: results,
  };
};

export const sendOtpNotification = async ({
  email,
  code,
  purpose,
  expiresInMinutes = 10,
}) => {
  const title =
    purpose === "registration"
      ? "Verify your BookMe account"
      : "Verify your booking email";
  const intro = `Use this verification code to continue. The code expires in ${expiresInMinutes} minutes.`;
  const htmlContent = buildCompanyEmailHtml({
    title,
    intro,
    rows: [
      { label: "Verification code", value: code },
      { label: "Expires in", value: `${expiresInMinutes} minutes` },
    ],
    footer: "If you did not request this code, you can ignore this email.",
  });

  return sendWithBrevo({
    to: email,
    subject: title,
    text: `${intro}\n\nVerification code: ${code}\nExpires in: ${expiresInMinutes} minutes`,
    htmlContent,
  });
};
