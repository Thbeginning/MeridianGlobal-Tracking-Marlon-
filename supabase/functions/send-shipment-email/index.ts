import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const BREVO_API_KEY = Deno.env.get("BREVO_API_KEY") ?? "";
const FROM_EMAIL    = Deno.env.get("FROM_EMAIL") ?? "no-reply@globalfreighttrace.com";
const FROM_NAME     = "GlobalFreight Trace";
const WEB_URL       = Deno.env.get("WEB_URL") ?? "https://globalfreighttrace.com";

// ── Status helpers ──────────────────────────────────────────────────────────
function getStatusInfo(status: string): { color: string; icon: string; bgColor: string } {
  switch (status) {
    case "Order Placed":      return { color: "#6366f1", bgColor: "#6366f1", icon: "📋" };
    case "In Transit":        return { color: "#f59e0b", bgColor: "#f59e0b", icon: "✈️" };
    case "Customs Cleared":   return { color: "#10b981", bgColor: "#10b981", icon: "🛃" };
    case "Out for Delivery":  return { color: "#3b82f6", bgColor: "#3b82f6", icon: "🚚" };
    case "Delivered":         return { color: "#22c55e", bgColor: "#22c55e", icon: "✅" };
    case "On Hold":           return { color: "#ef4444", bgColor: "#ef4444", icon: "⏸️" };
    default:                  return { color: "#f59e0b", bgColor: "#f59e0b", icon: "📦" };
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

// ── Email HTML — matches the design from the original screenshots ─────────
function buildEmailHtml(p: {
  tracking_number: string;
  status: string;
  status_reason: string;
  updated_at: string;
}): string {
  const { color, icon } = getStatusInfo(p.status);
  const dateStr  = formatDate(p.updated_at);
  const trackUrl = `${WEB_URL}/index.html?track=${encodeURIComponent(p.tracking_number)}`;
  const hasReason = p.status_reason && p.status_reason.trim() !== "";
  const reasonBg  = color + "18"; // very faint tinted background

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Shipment Update — ${escHtml(p.tracking_number)}</title>
</head>
<body style="margin:0;padding:0;background:#000000;font-family:Arial,Helvetica,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#000000;padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="520" cellpadding="0" cellspacing="0"
               style="max-width:520px;width:100%;background:#1a1a1a;border-radius:12px;overflow:hidden;">

          <!-- ── BLUE HEADER ─────────────────────────────── -->
          <tr>
            <td style="background:linear-gradient(135deg,#3b5bdb 0%,#5c4be8 100%);padding:28px 32px;text-align:center;">
              <h1 style="margin:0;color:#ffffff;font-size:22px;font-weight:700;letter-spacing:0.5px;">
                GlobalFreight Trace
              </h1>
            </td>
          </tr>

          <!-- ── STATUS BADGE + HEADING ──────────────────── -->
          <tr>
            <td style="background:#1a1a1a;padding:32px 40px 20px;text-align:center;">
              <span style="background:${color};color:#ffffff;padding:8px 28px;border-radius:50px;
                           font-size:16px;font-weight:700;display:inline-block;letter-spacing:0.5px;">
                ${escHtml(p.status)}
              </span>
              <h2 style="margin:20px 0 10px;color:#ffffff;font-size:26px;font-weight:700;">
                Shipment Update
              </h2>
              <p style="margin:0;color:#999999;font-size:14px;line-height:1.5;">
                We have an update on your shipment
                <strong style="color:#ffffff;">${escHtml(p.tracking_number)}</strong>.
              </p>
            </td>
          </tr>

          <!-- ── INFO TABLE ───────────────────────────────── -->
          <tr>
            <td style="padding:0 40px 24px;">
              <table width="100%" cellpadding="0" cellspacing="0"
                     style="background:#252525;border-radius:8px;overflow:hidden;border:1px solid #333;">
                <tr>
                  <td style="padding:16px 20px;border-bottom:1px solid #333333;
                             color:#ffffff;font-weight:600;font-size:14px;width:40%;">
                    Tracking Number:
                  </td>
                  <td style="padding:16px 20px;border-bottom:1px solid #333333;
                             color:#999999;font-size:14px;font-family:monospace;">
                    ${escHtml(p.tracking_number)}
                  </td>
                </tr>
                <tr>
                  <td style="padding:16px 20px;border-bottom:1px solid #333333;
                             color:#ffffff;font-weight:600;font-size:14px;">
                    Status:
                  </td>
                  <td style="padding:16px 20px;border-bottom:1px solid #333333;
                             color:${color};font-size:14px;font-weight:600;">
                    ${escHtml(p.status)}
                  </td>
                </tr>
                <tr>
                  <td style="padding:16px 20px;color:#ffffff;font-weight:600;font-size:14px;">
                    Timestamp:
                  </td>
                  <td style="padding:16px 20px;color:#999999;font-size:14px;">
                    ${dateStr}
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- ── REASON BOX (if present) ─────────────────── -->
          ${hasReason ? `
          <tr>
            <td style="padding:0 40px 20px;">
              <div style="background:${reasonBg};border-left:4px solid ${color};
                          border-radius:4px;padding:16px 20px;">
                <p style="margin:0 0 8px;color:${color};font-weight:700;font-size:15px;">
                  ${icon} Shipment ${escHtml(p.status)}
                </p>
                <p style="margin:0;color:#dddddd;font-size:14px;line-height:1.6;">
                  <strong style="color:#ffffff;">Reason:</strong> ${escHtml(p.status_reason)}
                </p>
              </div>
            </td>
          </tr>

          <!-- Contact Support button (shown only when there's a reason / issue) -->
          <tr>
            <td style="padding:0 40px 16px;text-align:center;">
              <a href="mailto:support@globalfreighttrace.com"
                 style="display:inline-block;background:#FF8C00;color:#ffffff;
                        text-decoration:none;padding:12px 32px;border-radius:8px;
                        font-size:14px;font-weight:700;letter-spacing:0.5px;">
                Contact Support to Resolve
              </a>
            </td>
          </tr>` : ''}

          <!-- ── VIEW TRACKING BUTTON ─────────────────────── -->
          <tr>
            <td style="padding:0 40px 32px;">
              <a href="${trackUrl}"
                 style="display:block;background:#7c3aed;color:#ffffff;text-align:center;
                        text-decoration:none;padding:15px 32px;border-radius:8px;
                        font-size:15px;font-weight:700;letter-spacing:0.5px;">
                View Live Tracking
              </a>
            </td>
          </tr>

          <!-- ── FOOTER ───────────────────────────────────── -->
          <tr>
            <td style="background:#111111;padding:24px 32px;text-align:center;
                       border-top:1px solid #222222;">
              <p style="margin:0 0 5px;font-size:12px;color:#555555;">
                Thank you for shipping with
                <strong style="color:#777777;">GlobalFreight Trace</strong>.
              </p>
              <p style="margin:0;font-size:12px;color:#444444;">
                We are committed to delivering your package safely and on time.
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

// ── Main handler ─────────────────────────────────────────────────────────────
Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
      },
    });
  }

  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
      status: 400,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
    });
  }

  const shipment = (body.record ?? body) as {
    tracking_number?: string;
    status?: string;
    status_reason?: string;
    client_email?: string;
    updated_at?: string;
  };

  if (!shipment.client_email) {
    return new Response(JSON.stringify({ error: "No client_email on shipment" }), {
      status: 400,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
    });
  }
  if (!shipment.tracking_number) {
    return new Response(JSON.stringify({ error: "No tracking_number on shipment" }), {
      status: 400,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
    });
  }
  if (!BREVO_API_KEY) {
    return new Response(JSON.stringify({ error: "BREVO_API_KEY not configured" }), {
      status: 500,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
    });
  }

  const html = buildEmailHtml({
    tracking_number: shipment.tracking_number ?? "",
    status:          shipment.status          ?? "Unknown",
    status_reason:   shipment.status_reason   ?? "",
    updated_at:      shipment.updated_at      ?? new Date().toISOString(),
  });

  const subject = `${shipment.icon ?? "📦"} Shipment ${shipment.tracking_number} — ${shipment.status}`;

  const brevoRes = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      "api-key":      BREVO_API_KEY,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      sender:      { name: FROM_NAME, email: FROM_EMAIL },
      to:          [{ email: shipment.client_email }],
      subject,
      htmlContent: html,
    }),
  });

  const brevoData = await brevoRes.json();

  if (!brevoRes.ok) {
    console.error(`Brevo error (${brevoRes.status}):`, JSON.stringify(brevoData));
    const errMsg = brevoData?.message || brevoData?.error || "Email send failed";
    return new Response(JSON.stringify({ error: errMsg, detail: brevoData }), {
      status: 502,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
    });
  }

  console.log(`✅ Email sent to ${shipment.client_email} for ${shipment.tracking_number}`);

  return new Response(JSON.stringify({ success: true, messageId: brevoData.messageId }), {
    status: 200,
    headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
  });
});
