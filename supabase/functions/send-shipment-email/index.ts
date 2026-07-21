import "jsr:@supabase/functions-js/edge-runtime.d.ts";

// ── Config — key comes ONLY from Supabase secret, never hardcoded ──────────────
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY") ?? "";
const FROM_EMAIL     = "contact@meridiangrps.com";
const FROM_NAME      = "Meridian Global Transit";
const WEB_URL        = "https://meridiangrps.com";

// ── Status config ──────────────────────────────────────────────────────────────
function getStatusConfig(status: string): {
  color: string; bgColor: string; icon: string;
  headline: string; message: string; tip: string;
  gradStart: string; gradEnd: string; badge: string;
} {
  switch (status) {
    case "Order Placed":
      return {
        color: "#6366f1", bgColor: "rgba(99,102,241,0.12)", icon: "📋",
        gradStart: "#4f46e5", gradEnd: "#7c3aed", badge: "ORDER CONFIRMED",
        headline: "Your Order Has Been Confirmed",
        message: "We have successfully received your shipment request and our team is preparing it for dispatch. You will receive further updates as your shipment progresses through our network.",
        tip: "💡 Tip: Save your tracking number to monitor every step of your journey in real-time.",
      };
    case "In Transit":
      return {
        color: "#f59e0b", bgColor: "rgba(245,158,11,0.12)", icon: "✈️",
        gradStart: "#FF8C00", gradEnd: "#ea580c", badge: "IN TRANSIT",
        headline: "Your Shipment Is On Its Way",
        message: "Great news! Your shipment is actively moving through our logistics network. Our team is monitoring its progress to ensure it reaches you safely and on time.",
        tip: "💡 You can track the live location of your shipment at any time using the button below.",
      };
    case "Customs Hold":
      return {
        color: "#ef4444", bgColor: "rgba(239,68,68,0.10)", icon: "🔒",
        gradStart: "#dc2626", gradEnd: "#991b1b", badge: "CUSTOMS HOLD",
        headline: "Your Shipment Requires Attention",
        message: "Your shipment is currently being reviewed by customs authorities. This is a standard procedure for international shipments. Our specialists are actively working to resolve this as quickly as possible.",
        tip: "📞 Please contact our support team if you need assistance with customs documentation.",
      };
    case "Customs Cleared":
      return {
        color: "#10b981", bgColor: "rgba(16,185,129,0.12)", icon: "🛃",
        gradStart: "#059669", gradEnd: "#047857", badge: "CUSTOMS CLEARED",
        headline: "Customs Clearance Successful",
        message: "Excellent news! Your shipment has successfully passed all customs inspections and is now continuing its journey to the final destination.",
        tip: "🚀 Your shipment will now move at full speed toward delivery.",
      };
    case "Out for Delivery":
      return {
        color: "#3b82f6", bgColor: "rgba(59,130,246,0.12)", icon: "🚚",
        gradStart: "#d97706", gradEnd: "#b45309", badge: "OUT FOR DELIVERY",
        headline: "Your Package Arrives Today",
        message: "Your shipment has left our facility and is now with our delivery team. Please ensure someone is available to receive the package at the delivery address.",
        tip: "📦 Please have a valid ID ready upon delivery. You may also contact us to arrange an alternate delivery time.",
      };
    case "Delivered":
      return {
        color: "#22c55e", bgColor: "rgba(34,197,94,0.12)", icon: "🎉",
        gradStart: "#16a34a", gradEnd: "#15803d", badge: "DELIVERED",
        headline: "Your Shipment Has Been Delivered",
        message: "Your package has been delivered and signed for. Thank you for choosing Meridian Global Transit for your logistics needs. We look forward to serving you again!",
        tip: "⭐ We'd love to hear about your experience. Your feedback helps us deliver better every day.",
      };
    case "On Hold":
      return {
        color: "#f97316", bgColor: "rgba(249,115,22,0.12)", icon: "⏸️",
        gradStart: "#b45309", gradEnd: "#92400e", badge: "ON HOLD",
        headline: "Your Shipment Is Currently On Hold",
        message: "Your shipment has been temporarily placed on hold. This may be due to an address discrepancy, missing documentation, or a scheduled delay. Our team is reviewing the situation.",
        tip: "📞 Please contact our support team immediately so we can resolve this together.",
      };
    default:
      return {
        color: "#f59e0b", bgColor: "rgba(245,158,11,0.12)", icon: "📦",
        gradStart: "#4f46e5", gradEnd: "#7c3aed", badge: "STATUS UPDATE",
        headline: "Your Shipment Status Has Been Updated",
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
  const trackUrl = `${WEB_URL}/track.html?track=${encodeURIComponent(p.tracking_number)}`;
  const hasReason = p.status_reason && p.status_reason.trim() !== "";
  const year = new Date().getFullYear();

  // Pseudo-barcode SVG
  function genBarcode(text: string): string {
    const chars = text.split("");
    const seed = chars.reduce((a, c, i) => a + c.charCodeAt(0) * (i + 7), 0);
    let bars = "";
    const barCount = 60;
    let x = 0;
    for (let i = 0; i < barCount; i++) {
      const w = ((seed * (i + 3) * 31337) % 3) + 1;
      const isBar = (seed + i) % 2 === 0;
      if (isBar) bars += `<rect x="${x}" y="0" width="${w}" height="50" fill="#111827"/>`;
      x += w;
    }
    return `<svg xmlns="http://www.w3.org/2000/svg" width="280" height="50" viewBox="0 0 ${x} 50" preserveAspectRatio="none">${bars}</svg>`;
  }
  const barcodeHtml = genBarcode(p.tracking_number);

  return `<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>Shipment Update — ${escHtml(p.tracking_number)}</title>
</head>
<body style="margin:0;padding:0;background-color:#eef2f7;font-family:'Segoe UI',Roboto,Helvetica,Arial,sans-serif;-webkit-font-smoothing:antialiased;">

<!-- Preheader (hidden preview text) -->
<div style="display:none;max-height:0;overflow:hidden;mso-hide:all;">${escHtml(cfg.headline)} — Tracking #${escHtml(p.tracking_number)} · Meridian Global Transit</div>

<table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#eef2f7;min-height:100vh;">
<tr><td align="center" style="padding:40px 16px;">

  <table width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%;">

    <!-- ── LOGO BAR ── -->
    <tr>
      <td style="background:#050A30;border-radius:16px 16px 0 0;padding:24px 40px;">
        <table width="100%" cellpadding="0" cellspacing="0" border="0"><tr>
          <td style="text-align:left;vertical-align:middle;">
            <span style="color:#ffffff;font-size:20px;font-weight:900;letter-spacing:-0.5px;">MERIDIAN <span style="color:#FF8C00;">GLOBAL</span> TRANSIT</span><br>
            <span style="color:rgba(255,255,255,0.4);font-size:10px;letter-spacing:2px;text-transform:uppercase;">Global Logistics Excellence</span>
          </td>
          <td style="text-align:right;vertical-align:middle;">
            <span style="background:rgba(255,140,0,0.12);color:#FF8C00;font-size:10px;font-weight:700;padding:6px 14px;border-radius:20px;letter-spacing:0.8px;border:1px solid rgba(255,140,0,0.25);">SHIPMENT NOTIFICATION</span>
          </td>
        </tr></table>
      </td>
    </tr>

    <!-- ── GRADIENT HERO BANNER ── -->
    <tr>
      <td style="background:linear-gradient(135deg,${cfg.gradStart} 0%,${cfg.gradEnd} 100%);padding:48px 40px;text-align:center;">
        <div style="font-size:56px;line-height:1;margin-bottom:18px;filter:drop-shadow(0 4px 8px rgba(0,0,0,0.2));">${cfg.icon}</div>
        <div style="display:inline-block;background:rgba(255,255,255,0.2);color:#ffffff;font-size:10px;font-weight:800;letter-spacing:2.5px;padding:6px 18px;border-radius:20px;margin-bottom:18px;border:1px solid rgba(255,255,255,0.3);">${escHtml(cfg.badge)}</div>
        <h1 style="margin:0 0 14px;color:#ffffff;font-size:28px;font-weight:800;line-height:1.3;letter-spacing:-0.5px;text-shadow:0 2px 8px rgba(0,0,0,0.15);">${escHtml(cfg.headline)}</h1>
        <p style="margin:0 auto;color:rgba(255,255,255,0.9);font-size:15px;line-height:1.7;max-width:460px;">${escHtml(cfg.message)}</p>
      </td>
    </tr>

    <!-- ── TRACKING CARD ── -->
    <tr>
      <td style="background:#ffffff;padding:0 40px;">
        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="border:1px solid #e5e7eb;border-radius:14px;margin:32px 0 16px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.06);">
          <tr>
            <td colspan="2" style="background:linear-gradient(90deg,#050A30,#071240);padding:14px 22px;">
              <span style="color:rgba(255,255,255,0.7);font-size:11px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;">📦 Shipment Details</span>
            </td>
          </tr>
          <tr>
            <td style="padding:16px 22px;border-bottom:1px solid #f1f5f9;width:38%;background:#fafafa;">
              <span style="color:#9ca3af;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:1px;">Tracking Number</span>
            </td>
            <td style="padding:16px 22px;border-bottom:1px solid #f1f5f9;">
              <span style="color:#050A30;font-size:16px;font-weight:800;font-family:'Courier New',monospace;letter-spacing:1px;">${escHtml(p.tracking_number)}</span>
            </td>
          </tr>
          <tr>
            <td style="padding:16px 22px;border-bottom:1px solid #f1f5f9;background:#fafafa;">
              <span style="color:#9ca3af;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:1px;">Current Status</span>
            </td>
            <td style="padding:16px 22px;border-bottom:1px solid #f1f5f9;">
              <span style="display:inline-block;background:${cfg.color}15;color:${cfg.color};font-size:12px;font-weight:800;padding:6px 16px;border-radius:20px;border:1.5px solid ${cfg.color}40;letter-spacing:0.5px;">${escHtml(p.status)}</span>
            </td>
          </tr>
          <tr>
            <td style="padding:16px 22px;background:#fafafa;">
              <span style="color:#9ca3af;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:1px;">Last Updated</span>
            </td>
            <td style="padding:16px 22px;">
              <span style="color:#374151;font-size:13px;font-weight:500;">${escHtml(dateStr)}</span>
            </td>
          </tr>
        </table>
      </td>
    </tr>

    <!-- ── BARCODE SECTION ── -->
    <tr>
      <td style="background:#ffffff;padding:0 40px 28px;">
        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f8fafc;border:1px solid #e5e7eb;border-radius:12px;overflow:hidden;">
          <tr>
            <td style="padding:18px 24px;text-align:center;">
              <p style="margin:0 0 12px;color:#9ca3af;font-size:10px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;">Shipment Barcode</p>
              ${barcodeHtml}
              <p style="margin:10px 0 0;color:#6b7280;font-size:11px;font-family:'Courier New',monospace;letter-spacing:2px;font-weight:600;">${escHtml(p.tracking_number)}</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>

    ${hasReason ? `
    <!-- ── STATUS NOTE ── -->
    <tr>
      <td style="background:#ffffff;padding:0 40px 20px;">
        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${cfg.color}08;border:1px solid ${cfg.color}30;border-left:4px solid ${cfg.color};border-radius:10px;">
          <tr>
            <td style="padding:20px 22px;">
              <p style="margin:0 0 8px;color:${cfg.color};font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:1.2px;">📌 Note from Our Team</p>
              <p style="margin:0;color:#374151;font-size:14px;line-height:1.7;">${escHtml(p.status_reason)}</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>` : ""}

    <!-- ── TIP BOX ── -->
    <tr>
      <td style="background:#ffffff;padding:0 40px 20px;">
        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#fffbeb;border:1px solid #fde68a;border-radius:10px;">
          <tr>
            <td style="padding:14px 20px;color:#92400e;font-size:13px;line-height:1.6;">
              ${escHtml(cfg.tip)}
            </td>
          </tr>
        </table>
      </td>
    </tr>

    <!-- ── CTA BUTTON ── -->
    <tr>
      <td style="background:#ffffff;padding:8px 40px 40px;text-align:center;">
        <a href="${trackUrl}" style="display:inline-block;background:linear-gradient(135deg,#FF8C00 0%,#e67e00 100%);color:#ffffff;text-decoration:none;padding:18px 48px;border-radius:12px;font-size:16px;font-weight:800;letter-spacing:0.5px;box-shadow:0 6px 20px rgba(255,140,0,0.4);border:none;">📍 Track My Shipment Live</a>
        <p style="margin:14px 0 0;color:#9ca3af;font-size:12px;">Or visit: <a href="${trackUrl}" style="color:#FF8C00;text-decoration:none;font-weight:600;">${trackUrl}</a></p>
      </td>
    </tr>

    <!-- ── DIVIDER ── -->
    <tr>
      <td style="background:#ffffff;padding:0 40px;">
        <hr style="border:none;border-top:1px solid #e5e7eb;margin:0;">
      </td>
    </tr>

    <!-- ── SUPPORT ROW ── -->
    <tr>
      <td style="background:#ffffff;padding:28px 40px;">
        <table width="100%" cellpadding="0" cellspacing="0" border="0"><tr>
          <td style="width:50%;padding-right:16px;">
            <p style="margin:0 0 6px;color:#374151;font-size:13px;font-weight:700;">📧 Customer Support</p>
            <a href="mailto:contact@meridiangrps.com" style="color:#FF8C00;font-size:13px;text-decoration:none;font-weight:600;">contact@meridiangrps.com</a>
          </td>
          <td style="width:50%;padding-left:16px;border-left:1px solid #e5e7eb;">
            <p style="margin:0 0 6px;color:#374151;font-size:13px;font-weight:700;">🌐 Track Online</p>
            <a href="${WEB_URL}" style="color:#FF8C00;font-size:13px;text-decoration:none;font-weight:600;">meridiangrps.com</a>
          </td>
        </tr></table>
      </td>
    </tr>

    <!-- ── FOOTER ── -->
    <tr>
      <td style="background:#050A30;border-radius:0 0 16px 16px;padding:32px 40px;text-align:center;">
        <p style="margin:0 0 6px;color:#ffffff;font-size:16px;font-weight:900;letter-spacing:-0.3px;">MERIDIAN <span style="color:#FF8C00;">GLOBAL</span> TRANSIT</p>
        <p style="margin:0 0 14px;color:rgba(255,255,255,0.35);font-size:11px;letter-spacing:1px;text-transform:uppercase;">Global Logistics Excellence</p>
        <p style="margin:0 0 12px;color:rgba(255,255,255,0.4);font-size:12px;line-height:1.6;">1400 Logistics Blvd, Houston, TX 77032, United States</p>
        <p style="margin:0;color:rgba(255,255,255,0.25);font-size:11px;">© ${year} Meridian Global Transit. All rights reserved. · <a href="${WEB_URL}" style="color:rgba(255,255,255,0.4);text-decoration:none;">meridiangrps.com</a></p>
        <p style="margin:12px 0 0;color:rgba(255,255,255,0.18);font-size:10px;line-height:1.6;">You received this email because you have a shipment registered with Meridian Global Transit.<br>Please do not reply to this automated message — contact us at contact@meridiangrps.com</p>
      </td>
    </tr>

  </table>
</td></tr>
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
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: CORS_HEADERS });
  }

  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405, headers: CORS_HEADERS });
  }

  // Guard: API key must be configured as a Supabase secret
  if (!RESEND_API_KEY) {
    console.error("[MGT] RESEND_API_KEY secret is not set in Supabase.");
    return new Response(
      JSON.stringify({ error: "Email service not configured. Contact the administrator." }),
      { status: 500, headers: { "Content-Type": "application/json", ...CORS_HEADERS } }
    );
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

  const html = buildEmailHtml({
    tracking_number: shipment.tracking_number ?? "",
    status:          shipment.status          ?? "Unknown",
    status_reason:   shipment.status_reason   ?? "",
    updated_at:      shipment.updated_at      ?? new Date().toISOString(),
  });

  const cfg = getStatusConfig(shipment.status ?? "");
  const subjectMap: Record<string, string> = {
    "Order Placed":     `Your Shipment Has Been Confirmed — ${shipment.tracking_number}`,
    "In Transit":       `Your Shipment Is On Its Way — ${shipment.tracking_number}`,
    "Customs Hold":     `Action Required: Shipment on Customs Hold — ${shipment.tracking_number}`,
    "Customs Cleared":  `Great News! Customs Cleared — ${shipment.tracking_number}`,
    "Out for Delivery": `Out for Delivery Today — ${shipment.tracking_number}`,
    "Delivered":        `Delivered! Your Shipment Has Arrived — ${shipment.tracking_number}`,
    "On Hold":          `Shipment On Hold — ${shipment.tracking_number}`,
  };
  const subject = subjectMap[shipment.status ?? ""] || `Shipment Update: ${shipment.status} — ${shipment.tracking_number}`;

  // ── Send via Resend API ────────────────────────────────────────────────────
  const resendRes = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${RESEND_API_KEY}`,
      "Content-Type":  "application/json",
    },
    body: JSON.stringify({
      from:    `${FROM_NAME} <${FROM_EMAIL}>`,
      to:      [shipment.client_email],
      subject: subject,
      html:    html,
    }),
  });

  const resendData = await resendRes.json().catch(() => ({}));

  if (!resendRes.ok) {
    console.error(`[MGT] Resend error (${resendRes.status}):`, JSON.stringify(resendData));
    const errMsg = (resendData as Record<string,string>)?.message || (resendData as Record<string,string>)?.error || "Email send failed";
    return new Response(JSON.stringify({ error: errMsg, detail: resendData }), {
      status: 502,
      headers: { "Content-Type": "application/json", ...CORS_HEADERS },
    });
  }

  console.log(`[MGT] ✅ Email sent via Resend → ${shipment.client_email} | ${shipment.tracking_number} | ${shipment.status}`);

  return new Response(
    JSON.stringify({ success: true, id: (resendData as Record<string,string>).id }),
    { status: 200, headers: { "Content-Type": "application/json", ...CORS_HEADERS } }
  );
});
