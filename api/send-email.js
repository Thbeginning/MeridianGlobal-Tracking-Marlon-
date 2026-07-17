export default async function handler(req, res) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { to, subject, html, client_email, tracking_number, status, htmlBody } = req.body;

    // Support both calling conventions
    const recipient  = to || client_email;
    const emailSubject = subject || `Shipment Update: ${tracking_number} — ${status}`;
    const emailHtml  = html || htmlBody;

    if (!recipient || !emailHtml) {
      return res.status(400).json({ error: 'Missing required fields: to/client_email and html/htmlBody' });
    }

    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": "Bearer re_KTdPrP9S_A7wjH61oP1Ns1GnjehtsqGNA",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        from: "Meridian Global Transit <contact@meridiangrps.com>",
        to: Array.isArray(recipient) ? recipient : [recipient],
        subject: emailSubject,
        html: emailHtml
      })
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('[MGT] Resend Error:', data);
      return res.status(response.status).json({ error: data.message || 'Failed to send email', details: data });
    }

    console.log('[MGT] Email sent successfully:', data.id);
    return res.status(200).json({ success: true, id: data.id });

  } catch (error) {
    console.error('[MGT] Server Error:', error);
    return res.status(500).json({ error: 'Internal Server Error', message: error.message });
  }
}
