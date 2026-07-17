import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const RESEND_API_KEY = "re_izdhzxM6_KDUkvZpAdUCado5tSP9pPPwz";
const FROM_EMAIL    = "contact@meridiangrps.com";
const FROM_NAME     = "Meridian Global Transit";
const WEB_URL       = "https://meridiangrps.com";

// ── Status config ─────────────────────────────────────────────────────────────
function getStatusConfig(status: string): {
  color: string; bgColor: string; icon: string;
  headline: string; message: string; tip: string;
} {
  switch (status) {
    case "Order Placed":
      return {
        color: "#6366f1", bgColor: "rgba(99,102,241,0.12)", icon: "📋",
        headline: "Your Order Has Been Placed",
        message: "Great news — we have officially received your shipment and it is now registered in our system. Our team will begin processing it shortly.",
        tip: "💡 Tip: Save your tracking number to monitor every step of your journey in real-time.",
      };
    case "In Transit":
      return {
        color: "#f59e0b", bgColor: "rgba(245,158,11,0.12)", icon: "✈️",
        headline: "Your Shipment Is On Its Way",
        message: "Your package is actively moving through our logistics network. Our team is ensuring it reaches you as swiftly and safely as possible.",
        tip: "💡 You can track the live location of your shipment at any time using the button below.",
      };
    case "Customs Hold":
      return {
        color: "#ef4444", bgColor: "rgba(239,68,68,0.10)", icon: "🔒",
        headline: "Shipment Held at Customs",
        message: "Your shipment is currently being reviewed by customs authorities. This is a standard procedure for international shipments. Our specialists are actively working to resolve this as quickly as possible.",
        tip: "📞 Please contact our support team if you need assistance with customs documentation.",
      };
    case "Customs Cleared":
      return {
        color: "#10b981", bgColor: "rgba(16,185,129,0.12)", icon: "🛃",
        headline: "Customs Successfully Cleared",
        message: "Excellent news! Your shipment has passed all customs inspections and clearance procedures. It is now back in transit and on its way to its final destination.",
        tip: "🚀 Your shipment will now move at full speed toward delivery.",
      };
    case "Out for Delivery":
      return {
        color: "#3b82f6", bgColor: "rgba(59,130,246,0.12)", icon: "🚚",
        headline: "Out for Delivery — Arriving Today!",
        message: "Your shipment has left our facility and is now with our delivery team. Please ensure someone is available to receive the package at the delivery address.",
        tip: "📦 Please have a valid ID ready upon delivery. You may also contact us to arrange an alternate delivery time.",
      };
    case "Delivered":
      return {
        color: "#22c55e", bgColor: "rgba(34,197,94,0.12)", icon: "✅",
        headline: "Shipment Delivered Successfully!",
        message: "Your package has been delivered and signed for. We hope everything arrived in perfect condition. It has been a pleasure serving you!",
        tip: "⭐ We'd love to hear about your experience. Your feedback helps us deliver better every day.",
      };
    case "On Hold":
      return {
        color: "#f97316", bgColor: "rgba(249,115,22,0.12)", icon: "⏸️",
        headline: "Shipment Temporarily On Hold",
        message: "Your shipment has been temporarily placed on hold. This may be due to an address discrepancy, missing documentation, or a scheduled delay. Our team is reviewing the situation.",
        tip: "📞 Please contact our support team immediately so we can resolve this together.",
      };
    default:
      return {
        color: "#f59e0b", bgColor: "rgba(245,158,11,0.12)", icon: "📦",
        headline: "Shipment Status Updated",
        message: "There has been an update to the status of your shipment. Please check the details below or use the tracking button to see the latest information.",
        tip: "💡 You can always track your shipment in real-time on our website.",
      };
  }
}

function escHtml(s: string): string {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("en-US", {
      weekday: "long", year: "numeric", month: "long", day: "numeric",
      hour: "2-digit", minute: "2-digit", timeZoneName: "short",
    });
  } catch { return iso; }
}

// ── Build premium HTML email ───────────────────────────────────────────────────
function buildEmailHtml(p: {
  tracking_number: string;
  status: string;
  status_reason: string;
  updated_at: string;
}): string {
  const cfg      = getStatusConfig(p.status);
  const dateStr  = formatDate(p.updated_at);
  const trackUrl = `${WEB_URL}/index.html?track=${encodeURIComponent(p.tracking_number)}`;
  const hasReason = p.status_reason && p.status_reason.trim() !== "";

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>Shipment Update — ${escHtml(p.tracking_number)}</title>
</head>
<body style="margin:0;padding:0;background-color:#0a0f1e;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">

  <table width="100%" cellpadding="0" cellspacing="0" role="presentation"
         style="background:#0a0f1e;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" role="presentation"
               style="max-width:600px;width:100%;border-radius:20px;overflow:hidden;
                      box-shadow:0 24px 64px rgba(0,0,0,0.6);">

          <!-- ═══ HEADER ═══════════════════════════════════════════════ -->
          <tr>
            <td style="background:linear-gradient(135deg,#0c1a4b 0%,#162050 60%,#1a2960 100%);
                       padding:36px 40px;text-align:center;position:relative;">
              <!-- Orange accent line at top -->
              <div style="height:4px;background:linear-gradient(90deg,#FF6600,#FF8C00,#FF6600);
                          border-radius:2px;margin-bottom:28px;"></div>

              <!-- Logo area -->
              <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
                <tr>
                  <td align="center">
                    <div style="display:inline-block;background:linear-gradient(135deg,#FF6600,#FF8C00);
                                width:48px;height:48px;border-radius:12px;line-height:48px;
                                font-size:22px;text-align:center;margin-bottom:12px;">📦</div>
                    <h1 style="margin:0;color:#ffffff;font-size:24px;font-weight:800;
                               letter-spacing:-0.3px;line-height:1.2;">
                      MERIDIAN <span style="color:#FF8C00;">GLOBAL</span> TRANSIT
                    </h1>
                    <p style="margin:6px 0 0;color:rgba(255,255,255,0.5);font-size:12px;
                               font-weight:600;text-transform:uppercase;letter-spacing:0.12em;">
                      Global Logistics &amp; Freight Solutions
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- ═══ STATUS HERO BAND ══════════════════════════════════════ -->
          <tr>
            <td style="background:${cfg.bgColor};border-top:1px solid ${cfg.color}33;
                       border-bottom:1px solid ${cfg.color}22;padding:30px 40px;text-align:center;">
              <div style="font-size:44px;margin-bottom:12px;line-height:1;">${cfg.icon}</div>
              <div style="display:inline-block;background:${cfg.color};color:#ffffff;
                          padding:7px 24px;border-radius:30px;font-size:13px;font-weight:800;
                          text-transform:uppercase;letter-spacing:0.12em;margin-bottom:16px;">
                ${escHtml(p.status)}
              </div>
              <h2 style="margin:0;color:#ffffff;font-size:22px;font-weight:800;line-height:1.3;">
                ${escHtml(cfg.headline)}
              </h2>
            </td>
          </tr>

          <!-- ═══ MAIN BODY ════════════════════════════════════════════ -->
          <tr>
            <td style="background:#111827;padding:32px 40px;">

              <!-- Greeting paragraph -->
              <p style="margin:0 0 24px;color:rgba(255,255,255,0.75);font-size:15px;
                         line-height:1.75;">
                ${escHtml(cfg.message)}
              </p>

              <!-- Shipment details card -->
              <table width="100%" cellpadding="0" cellspacing="0" role="presentation"
                     style="background:#0d1630;border:1px solid rgba(255,255,255,0.08);
                            border-radius:12px;overflow:hidden;margin-bottom:24px;">
                <tr>
                  <td style="padding:0;">
                    <!-- Card header -->
                    <div style="background:linear-gradient(90deg,rgba(255,102,0,0.15),rgba(255,102,0,0.05));
                                padding:12px 20px;border-bottom:1px solid rgba(255,255,255,0.06);">
                      <span style="color:#FF8C00;font-size:11px;font-weight:800;
                                   text-transform:uppercase;letter-spacing:0.14em;">
                        📋 Shipment Details
                      </span>
                    </div>

                    <!-- Tracking Number row -->
                    <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
                      <tr>
                        <td style="padding:16px 20px;border-bottom:1px solid rgba(255,255,255,0.05);
                                   color:rgba(255,255,255,0.5);font-size:12px;font-weight:700;
                                   text-transform:uppercase;letter-spacing:0.08em;width:42%;">
                          Tracking Number
                        </td>
                        <td style="padding:16px 20px;border-bottom:1px solid rgba(255,255,255,0.05);
                                   color:#ffffff;font-size:14px;font-weight:800;
                                   font-family:'Courier New',monospace;letter-spacing:0.05em;">
                          ${escHtml(p.tracking_number)}
                        </td>
                      </tr>
                      <tr>
                        <td style="padding:16px 20px;border-bottom:1px solid rgba(255,255,255,0.05);
                                   color:rgba(255,255,255,0.5);font-size:12px;font-weight:700;
                                   text-transform:uppercase;letter-spacing:0.08em;">
                          Current Status
                        </td>
                        <td style="padding:16px 20px;border-bottom:1px solid rgba(255,255,255,0.05);">
                          <span style="background:${cfg.color}22;color:${cfg.color};
                                       padding:4px 12px;border-radius:20px;font-size:13px;
                                       font-weight:700;border:1px solid ${cfg.color}44;">
                            ${escHtml(p.status)}
                          </span>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding:16px 20px;
                                   color:rgba(255,255,255,0.5);font-size:12px;font-weight:700;
                                   text-transform:uppercase;letter-spacing:0.08em;">
                          Last Updated
                        </td>
                        <td style="padding:16px 20px;color:rgba(255,255,255,0.7);font-size:13px;">
                          ${escHtml(dateStr)}
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              ${hasReason ? `
              <!-- Status Reason box -->
              <table width="100%" cellpadding="0" cellspacing="0" role="presentation"
                     style="background:${cfg.bgColor};border:1px solid ${cfg.color}44;
                            border-radius:12px;overflow:hidden;margin-bottom:24px;">
                <tr>
                  <td style="padding:20px 24px;">
                    <p style="margin:0 0 8px;color:${cfg.color};font-size:13px;
                               font-weight:800;text-transform:uppercase;letter-spacing:0.1em;">
                      ${cfg.icon} Status Note from Our Team
                    </p>
                    <p style="margin:0;color:rgba(255,255,255,0.8);font-size:14px;line-height:1.7;">
                      ${escHtml(p.status_reason)}
                    </p>
                  </td>
                </tr>
              </table>` : ""}

              <!-- Tip box -->
              <table width="100%" cellpadding="0" cellspacing="0" role="presentation"
                     style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.06);
                            border-radius:10px;margin-bottom:28px;">
                <tr>
                  <td style="padding:16px 20px;color:rgba(255,255,255,0.5);
                              font-size:13px;line-height:1.6;">
                    ${escHtml(cfg.tip)}
                  </td>
                </tr>
              </table>

              <!-- CTA Button -->
              <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
                <tr>
                  <td align="center">
                    <a href="${trackUrl}"
                       style="display:inline-block;background:linear-gradient(135deg,#FF6600,#FF8C00);
                              color:#ffffff;text-decoration:none;padding:16px 40px;
                              border-radius:12px;font-size:15px;font-weight:800;
                              letter-spacing:0.03em;box-shadow:0 8px 24px rgba(255,102,0,0.35);">
                      🔍 &nbsp;Track My Shipment Live
                    </a>
                  </td>
                </tr>
              </table>

            </td>
          </tr>

          <!-- ═══ DIVIDER ═══════════════════════════════════════════════ -->
          <tr>
            <td style="background:#111827;padding:0 40px;">
              <div style="height:1px;background:linear-gradient(90deg,transparent,rgba(255,255,255,0.08),transparent);"></div>
            </td>
          </tr>

          <!-- ═══ CONTACT STRIP ═════════════════════════════════════════ -->
          <tr>
            <td style="background:#111827;padding:24px 40px;">
              <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
                <tr>
                  <td style="color:rgba(255,255,255,0.45);font-size:13px;line-height:1.6;">
                    <strong style="color:rgba(255,255,255,0.7);">Need help?</strong>
                    &nbsp;Our support team is available 24/7.<br>
                    📧 <a href="mailto:contact@meridiangrps.com"
                          style="color:#FF8C00;text-decoration:none;font-weight:600;">
                      contact@meridiangrps.com
                    </a>
                    &nbsp;&nbsp;|&nbsp;&nbsp;
                    🌐 <a href="${WEB_URL}"
                          style="color:#FF8C00;text-decoration:none;font-weight:600;">
                      meridiangrps.com
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- ═══ FOOTER ════════════════════════════════════════════════ -->
          <tr>
            <td style="background:#0a0f1e;padding:28px 40px;text-align:center;
                       border-top:1px solid rgba(255,255,255,0.05);">
              <p style="margin:0 0 8px;color:rgba(255,255,255,0.3);font-size:12px;line-height:1.6;">
                © 2025 Meridian Global Transit. All rights reserved.<br>
                1400 Logistics Blvd, Houston, TX 77032, United States
              </p>
              <p style="margin:8px 0 0;color:rgba(255,255,255,0.18);font-size:11px;">
                This email was sent because a shipment associated with your account was updated.<br>
                Please do not reply directly to this email.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>

</body>
</html>`;
}

// ── CORS headers ──────────────────────────────────────────────────────────────
const CORS_HEADERS = {
  "Access-Control-Allow-Origin":  "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, apikey, x-client-info",
  "Access-Control-Max-Age":       "86400",
};

// ── Main handler ──────────────────────────────────────────────────────────────
Deno.serve(async (req: Request) => {
  // CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: CORS_HEADERS });
  }

  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405, headers: CORS_HEADERS });
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
      status: 400,
      headers: { "Content-Type": "application/json", ...CORS_HEADERS },
    });
  }

  const shipment = (body.record ?? body) as {
    tracking_number?: string;
    status?: string;
    status_reason?: string;
    client_email?: string;
    updated_at?: string;
  };

  // Validation
  if (!shipment.client_email) {
    return new Response(JSON.stringify({ error: "No client_email provided" }), {
      status: 400, headers: { "Content-Type": "application/json", ...CORS_HEADERS },
    });
  }
  if (!shipment.tracking_number) {
    return new Response(JSON.stringify({ error: "No tracking_number provided" }), {
      status: 400, headers: { "Content-Type": "application/json", ...CORS_HEADERS },
    });
  }
  if (!RESEND_API_KEY) {
    return new Response(JSON.stringify({ error: "RESEND_API_KEY not configured" }), {
      status: 500, headers: { "Content-Type": "application/json", ...CORS_HEADERS },
    });
  }

  const cfg = getStatusConfig(shipment.status ?? "");

  const html = buildEmailHtml({
    tracking_number: shipment.tracking_number ?? "",
    status:          shipment.status          ?? "Unknown",
    status_reason:   shipment.status_reason   ?? "",
    updated_at:      shipment.updated_at      ?? new Date().toISOString(),
  });

  const subject = `${cfg.icon} ${cfg.headline} — ${shipment.tracking_number}`;
  const fromAddress = `${FROM_NAME} <${FROM_EMAIL}>`;

  const resendRes = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${RESEND_API_KEY}`,
      "Content-Type":  "application/json",
    },
    body: JSON.stringify({
      from:      fromAddress,
      to:        shipment.client_email,
      reply_to:  FROM_EMAIL,
      subject:   subject,
      html:      html,
    }),
  });

  const resendData = await resendRes.json();

  if (!resendRes.ok) {
    console.error(`[PLT] Resend error (${resendRes.status}):`, JSON.stringify(resendData));
    const errMsg = resendData?.message || resendData?.error || "Email send failed";
    return new Response(JSON.stringify({ error: errMsg, detail: resendData }), {
      status: 502,
      headers: { "Content-Type": "application/json", ...CORS_HEADERS },
    });
  }

  console.log(`[PLT] ✅ Email sent → ${shipment.client_email} | ${shipment.tracking_number} | ${shipment.status}`);

  return new Response(JSON.stringify({ success: true, messageId: resendData.id }), {
    status: 200,
    headers: { "Content-Type": "application/json", ...CORS_HEADERS },
  });
});
